'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CheckoutPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const jobId = params.id;

  const [jobData, setJobData] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // State สำหรับจัดการอัปโหลดสลิป
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/auth/login');
      setCurrentUser(session.user);

      const { data } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();
      
      if (data) setJobData(data);
      setLoading(false);
    };
    fetchJob();
  }, [jobId, router, supabase]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSlipFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!slipFile) return alert('กรุณาแนบรูปสลิปก่อนกดยืนยันค่ะ');
    setUploading(true);

    try {
      // 1. อัปโหลดรูปลง Bucket 'slips-pending'
      const fileExt = slipFile.name.split('.').pop();
      const fileName = `${jobId}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('slips-pending')
        .upload(fileName, slipFile);

      if (uploadError) throw uploadError;

      // 2. บันทึกข้อมูลลงตาราง slip_uploads (เพื่อไปโผล่ในหน้า Admin Dashboard)
      const { error: dbError } = await supabase
        .from('slip_uploads')
        .insert({
          job_id: jobId,
          uploader_id: currentUser.id,
          storage_path: fileName,
          file_size: slipFile.size,
          status: 'pending'
        });

      if (dbError) throw dbError;

      // 3. เปลี่ยนสถานะงานเพื่อแจ้งว่ากำลังรอตรวจสลิป
      const { error: jobError } = await supabase
        .from('jobs')
        .update({ status: 'verifying_slip' })
        .eq('id', jobId);

      if (jobError) throw jobError;

      alert('ส่งสลิปเรียบร้อย! 🎉 รอแอดมินตรวจสอบสักครู่นะคะ');
      router.push(`/chat/${jobId}`); // ส่งลูกค้าไปรอที่ห้องแชท

    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F4F6F8]">⏳ กำลังเตรียมหน้าชำระเงิน...</div>;

  return (
    <div className="min-h-screen bg-[#F4F6F8] p-6 flex flex-col font-sans items-center pb-20">
      
      {/* Header */}
      <div className="w-full max-w-md text-center mt-6 mb-8 animate-in fade-in slide-in-from-top-4">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">ชำระเงิน 💸</h1>
        <p className="text-sm text-gray-500 font-bold mt-2">โอนเงินเข้ากองกลาง (Escrow) เพื่อล็อกคิวช่าง</p>
      </div>

      <div className="w-full max-w-md space-y-4 animate-in fade-in slide-in-from-bottom-4">
        
        {/* กล่องสรุปยอด */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-orange-50 rounded-bl-[4rem] -z-0"></div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">ยอดที่ต้องชำระ</p>
          <p className="text-4xl font-black text-[#EE4D2D] relative z-10">{(jobData?.budget || 0).toLocaleString('th-TH')} บาท</p>
          <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 relative z-10">
            <p className="text-sm font-bold text-gray-700 line-clamp-1">งาน: {jobData?.title}</p>
          </div>
        </div>

        {/* กล่องสแกน QR Code (Mockup) */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center">
          <div className="w-48 h-48 bg-gray-50 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-gray-200 mb-4 p-4">
            <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center opacity-50">
               <span className="text-4xl">📱</span>
            </div>
          </div>
          <p className="text-sm font-black text-gray-800">บจก. จงเจริญ แพลตฟอร์ม</p>
          <p className="text-xs font-bold text-gray-500 mt-1">ธนาคารกสิกรไทย : 123-4-56789-0</p>
        </div>

        {/* กล่องอัปโหลดสลิป */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <p className="text-sm font-black text-gray-800 mb-3 text-center">แนบหลักฐานการโอนเงิน</p>
          
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-emerald-300 rounded-2xl cursor-pointer bg-emerald-50 hover:bg-emerald-100 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
              <span className="text-3xl mb-2 opacity-70">📸</span>
              <p className="text-xs font-bold text-emerald-700 truncate w-full">
                {slipFile ? slipFile.name : 'คลิกเพื่อเลือกรูปสลิป'}
              </p>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>

          <button 
            onClick={handleUpload}
            disabled={uploading || !slipFile}
            className="w-full mt-4 bg-emerald-500 text-white py-4 rounded-2xl font-black text-sm shadow-md active:scale-95 transition-transform disabled:opacity-50 disabled:bg-gray-300"
          >
            {uploading ? 'กำลังอัปโหลดสลิป...' : '✅ ยืนยันการชำระเงิน'}
          </button>
        </div>
        
        <button 
          onClick={() => router.back()} 
          className="w-full py-4 text-gray-400 font-bold text-xs hover:text-gray-600 transition-colors"
        >
          ยกเลิกและกลับไปหน้าก่อนหน้า
        </button>

      </div>
    </div>
  );
}

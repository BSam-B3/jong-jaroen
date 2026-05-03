'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CheckoutPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const jobId = params.id;

  const [jobData, setJobData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, worker:profiles!worker_id(full_name)')
        .eq('id', jobId)
        .single();
      
      if (!error && data) setJobData(data);
      setLoading(false);
    };
    fetchJob();
  }, [jobId, supabase]);

  const handleUploadSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slipFile) return alert('กรุณาแนบรูปสลิปโอนเงินค่ะ');
    
    setIsSubmitting(true);
    // 💡 ตรงนี้เดี๋ยวเราจะใส่ Logic อัปโหลดรูปขึ้น Storage และอัปเดตสถานะที่ C แนะนำมาค่ะ
    // ตอนนี้จำลองความสำเร็จไปก่อน
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  if (loading) return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-bold text-gray-400">กำลังโหลดข้อมูล...</div>;
  if (!jobData) return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-bold text-gray-400">ไม่พบข้อมูลงานค่ะ</div>;

  // จำลองยอดเงิน (รวมค่าธรรมเนียมแพลตฟอร์ม)
  const totalAmount = jobData.budget || 0; 

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-24 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen relative shadow-xl">
        
        {/* 🌟 Header */}
        <div className="bg-gradient-to-b from-gray-900 to-gray-800 px-6 pt-12 pb-6 rounded-b-[2rem] shadow-md relative z-20">
          <button onClick={() => router.back()} className="text-white text-2xl mb-4">←</button>
          <h1 className="text-2xl font-black text-white tracking-tight">ชำระเงินเข้า Escrow</h1>
          {/* เดี๋ยวเอาคำพูด Meta AI มาใส่ตรงนี้ */}
          <p className="text-[11px] font-bold text-emerald-400 mt-1 flex items-center gap-1">
            <span>🔒</span> โอนเงินเข้าแพลตฟอร์ม ปลอดภัย 100%
          </p>
        </div>

        {!isSuccess ? (
          <div className="px-6 mt-6 space-y-6">
            
            {/* สรุปยอด */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-center">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">ยอดที่ต้องชำระ</p>
              <p className="text-4xl font-black text-[#EE4D2D] mt-1 tracking-tight">฿{totalAmount.toLocaleString('th-TH')}</p>
              <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto my-3"></div>
              <p className="text-sm font-bold text-gray-700">{jobData.title}</p>
              <p className="text-[10px] text-gray-400 mt-1">จ้างช่าง: {jobData.worker?.full_name}</p>
            </div>

            {/* QR Code (ตัวอย่าง) */}
            <div className="bg-white border-2 border-emerald-100 rounded-2xl p-6 text-center shadow-sm">
              <div className="w-40 h-40 bg-gray-100 mx-auto rounded-xl flex items-center justify-center mb-4 border border-gray-200">
                <span className="text-gray-400 text-xs font-bold">[ รูป QR Code จงเจริญ ]</span>
              </div>
              <p className="font-black text-gray-800">ธนาคารกสิกรไทย</p>
              <p className="text-sm font-bold text-gray-500">บจก. จงเจริญ แพลตฟอร์ม</p>
              <p className="text-lg font-black text-emerald-600 mt-1">012-3-45678-9</p>
            </div>

            {/* ฟอร์มอัปโหลดสลิป */}
            <form onSubmit={handleUploadSlip} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="font-black text-gray-800 mb-3 text-sm">แนบหลักฐานการโอนเงิน</h3>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setSlipFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-orange-50 file:text-[#EE4D2D] hover:file:bg-orange-100 transition-colors mb-4"
              />
              {/* เดี๋ยวเอาคำพูด Meta AI มาใส่ตรงนี้ */}
              <p className="text-[10px] text-gray-400 font-medium mb-4 leading-relaxed">
                เงินของคุณจะถูกพักไว้กับระบบ ช่างจะไม่ได้รับเงินจนกว่างานจะส่งมอบและคุณกดยืนยันแล้วเท่านั้น
              </p>
              <button 
                type="submit" 
                disabled={!slipFile || isSubmitting}
                className="w-full bg-[#EE4D2D] text-white py-4 rounded-xl text-sm font-black shadow-md disabled:opacity-50 active:scale-95 transition-transform flex justify-center items-center gap-2"
              >
                {isSubmitting ? 'กำลังส่งข้อมูล...' : 'ส่งสลิปโอนเงิน 🚀'}
              </button>
            </form>

          </div>
        ) : (
          /* หน้าต่าง Success (รอคำพูด Meta AI) */
          <div className="px-6 py-20 text-center animate-fade-in-up">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner">
              ✅
            </div>
            <h2 className="text-2xl font-black text-gray-800 mb-2">ได้รับสลิปแล้ว!</h2>
            <p className="text-sm text-gray-500 font-bold mb-8 leading-relaxed">
              เงินของคุณถูกเก็บรักษาอย่างปลอดภัยใน Escrow<br/>
              รอแอดมินตรวจสอบความถูกต้องสักครู่นะคะ
            </p>
            <button 
              onClick={() => router.push('/my-jobs')}
              className="bg-gray-900 text-white px-8 py-3.5 rounded-xl text-sm font-black shadow-md active:scale-95 transition-transform"
            >
              กลับไปหน้างานของฉัน
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

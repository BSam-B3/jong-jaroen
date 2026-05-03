'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function GigCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [job, setJob] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }
      setUser(session.user);

      // ดึงข้อมูลงานและช่างที่ถูกเลือก
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          worker:profiles!worker_id (full_name, avatar_url)
        `)
        .eq('id', params.id as string)
        .single();
      
      if (!error && data) setJob(data);
      setLoading(false);
    };
    fetchJobData();
  }, [params.id, router, supabase]);

  const handleSlipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSlipFile(file);
      setSlipPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slipFile) return alert('กรุณาแนบสลิปโอนเงินก่อนยืนยันค่ะ');
    setSubmitting(true);

    try {
      // 1. อัปโหลดรูปสลิปขึ้น Storage
      const fileExt = slipFile.name.split('.').pop();
      const fileName = `gig_${user.id}_${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-slips')
        .upload(fileName, slipFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('payment-slips')
        .getPublicUrl(uploadData.path);

      // 2. เรียกใช้ RPC เพื่อบันทึกสลิปและเปลี่ยนสถานะ
      const { error: updateError } = await supabase.rpc('submit_job_slip', {
        p_job_id: job.id,
        p_slip_url: publicUrl
      });

      if (updateError) throw updateError;

      alert('ส่งสลิปเรียบร้อย! รอแอดมินตรวจสอบสักครู่นะคะ 🚀');
      router.push('/my-jobs'); // กลับไปหน้างานของฉัน

    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-400">กำลังเตรียมบิลสั่งซื้อ...</div>;
  if (!job) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-800">ไม่พบข้อมูลงานนี้ค่ะ</div>;

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-24">
      <div className="w-full max-w-2xl bg-white min-h-screen shadow-xl relative flex flex-col">
        
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-40 flex items-center gap-3">
          <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-500 rounded-full hover:bg-gray-100 font-bold transition-colors">←</button>
          <h1 className="text-lg font-black text-gray-900">ชำระเงินพักไว้ (Escrow)</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          
          {/* ข้อมูลงานและช่าง */}
          <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{job.job_type || 'ทั่วไป'}</span>
            </div>
            <h2 className="text-base font-black text-gray-800 leading-tight">{job.title}</h2>
            <div className="flex items-center gap-2 pt-3 border-t border-gray-50 mt-1">
              <div className="w-6 h-6 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center text-[10px]">👷</div>
              <p className="text-xs font-bold text-gray-500">ช่าง/ไรเดอร์: <span className="text-gray-800 font-black">{job.worker?.full_name || 'ผู้รับงาน'}</span></p>
            </div>
          </div>

          {/* บัญชีกองกลาง */}
          <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">โอนเงินเข้ากองกลาง</h3>
            
            <div className="bg-blue-50 p-5 rounded-2xl mb-4 border border-blue-100 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black text-blue-900 mb-1">🏦 บัญชีแพลตฟอร์ม "จงเจริญ"</p>
                <p className="text-lg font-black text-blue-700 font-mono tracking-widest">123-4-56789-0</p>
              </div>
              <div className="text-3xl">📱</div>
            </div>

            <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
              <p className="text-[10px] font-bold text-orange-800 leading-relaxed">
                <span className="font-black text-orange-600">🔒 ปลอดภัย 100%:</span> เงินจำนวนนี้จะถูกเก็บไว้ที่ระบบส่วนกลาง และจะโอนให้ช่างก็ต่อเมื่อคุณกดยืนยันว่า <span className="font-black">"ได้รับงานเรียบร้อยแล้ว"</span> เท่านั้น
              </p>
            </div>
          </div>

          {/* อัปโหลดสลิป */}
          <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">หลักฐานการโอนเงิน</h3>
            
            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 cursor-pointer hover:bg-orange-50 transition-colors">
              {slipPreview ? (
                <img src={slipPreview} alt="Slip" className="max-h-48 rounded-xl shadow-sm" />
              ) : (
                <>
                  <span className="text-4xl mb-3">📸</span>
                  <span className="text-xs font-bold text-gray-500">แตะเพื่อแนบสลิปโอนเงิน</span>
                  <span className="text-[10px] text-gray-400 mt-1">(ไฟล์ JPG, PNG)</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleSlipChange} />
            </label>
          </div>

          {/* ยอดเงิน & ปุ่มยืนยัน (เกาะขอบล่าง) */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-gray-100 sm:max-w-2xl sm:mx-auto z-50">
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">ยอดที่ต้องชำระ</span>
              <span className="text-2xl font-black text-[#EE4D2D]">{job.budget ? job.budget.toLocaleString('th-TH') : '0'} บาท</span>
            </div>
            <button 
              type="submit" 
              disabled={submitting}
              className="w-full py-4 bg-gradient-to-r from-[#EE4D2D] to-[#FF7337] text-white rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg shadow-orange-200 disabled:opacity-50 flex justify-center items-center"
            >
              {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'ยืนยันส่งสลิป 🚀'}
            </button>
          </div>
          
          <div className="h-24"></div> {/* ดันเนื้อหาไม่ให้โดนปุ่มบัง */}
        </form>
      </div>
    </div>
  );
}

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
    if (!slipFile) return alert('กรุณาแนบรูปสลิปโอนเงินด้วยจ้า');
    
    setIsSubmitting(true);
    // 💡 เดี๋ยวเราจะมาเขียนเชื่อมต่อ Storage และ RPC อัปเดตสถานะที่ C แนะนำตรงนี้ค่ะ
    // ตอนนี้จำลองความสำเร็จให้เห็น UI ของ Meta AI ก่อน
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 2000);
  };

  if (loading) return <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center"><div className="w-10 h-10 border-4 border-[#EE4D2D] border-t-transparent rounded-full animate-spin"></div></div>;
  if (!jobData) return <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center font-bold text-gray-400">ไม่พบข้อมูลงานค่ะ</div>;

  const totalAmount = jobData.budget || 0; 

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans pb-24 flex justify-center">
      <div className="w-full max-w-md bg-[#F4F6F8] min-h-screen relative shadow-xl flex flex-col">
        
        {/* 🌟 1. หัวข้อและคำอธิบายสั้นๆ (Meta AI) */}
        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] px-6 pt-12 pb-8 rounded-b-[2.5rem] shadow-md relative z-20">
          <button onClick={() => router.back()} className="text-white text-2xl mb-4 active:scale-95 transition-transform">←</button>
          <h1 className="text-2xl font-black text-white tracking-tight leading-tight">ล็อกคิวช่าง<br/>จ่ายผ่านจงเจริญ</h1>
          <p className="text-[11px] font-medium text-white/90 mt-2 leading-relaxed">
            โอนเข้าบัญชีกลางของจงเจริญก่อนนะ ไม่ต้องโอนให้ช่างตรงๆ<br/>
            <span className="font-bold text-white">เงินจะพักไว้ที่เราให้อุ่นใจ ช่างได้เงินก็ต่อเมื่อลูกค้าบอกว่างานผ่านแล้วเท่านั้น</span>
          </p>
        </div>

        {!isSuccess ? (
          <div className="px-5 mt-6 space-y-4">
            
            {/* 🌟 การ์ดความปลอดภัย (Meta AI) */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 shadow-sm flex gap-3 items-start">
              <div className="text-2xl">🔒</div>
              <div>
                <p className="font-black text-emerald-800 text-sm">พักเงินไว้ให้ 100%</p>
                <p className="text-[10px] text-emerald-600/80 font-bold mt-0.5">กันช่างเบี้ยว กันลูกค้าโดนเท เราดูแลให้ทั้งคู่</p>
              </div>
            </div>

            {/* กล่องยอดชำระและบัญชี */}
            <div className="bg-white rounded-[2rem] p-6 text-center shadow-sm border border-gray-100">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">ยอดที่ต้องชำระ</p>
              <p className="text-4xl font-black text-[#EE4D2D] mt-1 tracking-tight">฿{totalAmount.toLocaleString('th-TH')}</p>
              <div className="w-16 h-1 bg-gray-100 rounded-full mx-auto my-4"></div>
              
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="font-black text-gray-800">ธนาคารกสิกรไทย</p>
                <p className="text-xs font-bold text-gray-500">บจก. จงเจริญ แพลตฟอร์ม</p>
                <p className="text-xl font-black text-[#EE4D2D] mt-1 tracking-wider">012-3-45678-9</p>
              </div>
            </div>

            {/* 🌟 2. ข้อความเตือนใจใต้กล่องอัปโหลดสลิป (Meta AI) */}
            <form onSubmit={handleUploadSlip} className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm">
              <h3 className="font-black text-gray-800 mb-2 text-sm text-center">แนบสลิปตรงนี้เลย</h3>
              
              <div className="relative mb-4">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setSlipFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-orange-50 file:text-[#EE4D2D] hover:file:bg-orange-100 transition-colors bg-gray-50 rounded-xl outline-none"
                />
              </div>

              <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-100 mb-5">
                <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                  <span className="font-black text-[#EE4D2D]">ย้ำอีกที</span> เงินนี้จงเจริญพักไว้ให้ก่อน ช่างยังไม่ได้ตังค์นะ จนกว่างานเสร็จแล้วลูกค้ากด "รับงาน"<br/>
                  ถ้างานมีปัญหา กด "แจ้งปัญหา" เงินไม่หายแน่นอน
                </p>
              </div>

              <button 
                type="submit" 
                disabled={!slipFile || isSubmitting}
                className="w-full bg-[#EE4D2D] text-white py-4 rounded-2xl text-sm font-black shadow-lg disabled:opacity-50 active:scale-95 transition-transform"
              >
                {isSubmitting ? 'กำลังส่งข้อมูล...' : 'แจ้งโอนเงิน 🚀'}
              </button>
            </form>

          </div>
        ) : (
          /* 🌟 3. ข้อความตอนอัปโหลดสลิปเสร็จแล้ว (Success State) */
          <div className="px-6 py-16 text-center flex flex-col items-center justify-center flex-1 animate-fade-in-up">
            <div className="text-7xl mb-4 animate-bounce">✅</div>
            <h2 className="text-2xl font-black text-gray-800 mb-3">ได้รับสลิปแล้วจ้า สบายใจได้</h2>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-8 w-full max-w-sm">
              <p className="text-[11px] text-gray-500 font-bold leading-relaxed">
                แอดมินกำลังเช็คสลิปให้นาทีนี้เลย ไม่เกิน 5 นาที<br/>
                เช็คผ่านปุ๊บ เราจะแจ้งช่างให้เริ่มงานทันที<br/>
                <span className="text-emerald-600 font-black text-xs">ลูกค้านั่งชิลรอช่างทักไปได้เลย</span>
              </p>
            </div>
            
            <div className="w-full space-y-3 max-w-sm">
              <button onClick={() => router.push('/my-jobs')} className="w-full bg-emerald-500 text-white px-6 py-4 rounded-2xl text-sm font-black shadow-lg active:scale-95 transition-transform">
                ดูสถานะงาน →
              </button>
              <button onClick={() => router.push('/')} className="w-full bg-gray-100 text-gray-600 px-6 py-4 rounded-2xl text-sm font-black active:scale-95 transition-transform">
                ไปหน้าหลัก →
              </button>
            </div>
            
            <p className="text-[10px] text-gray-400 font-bold mt-6">
              มีปัญหาสลิปไม่ผ่าน? ทักแอดมินในแชทได้ 24 ชม.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

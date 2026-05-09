'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// 🌟 ปรับให้รับ params โดยตรงตามโครงสร้าง [id]
export default function CheckoutPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const jobId = params.id; // ดึง ID จาก URL Path
  const supabase = useMemo(() => createClient(), []);

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    async function fetchJob() {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*, employer:profiles!employer_id(full_name), worker:profiles!worker_id(full_name)')
          .eq('id', jobId)
          .single();
        
        if (error) throw error;
        setJob(data);
      } catch (err) {
        console.error("Error fetching job:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [jobId, supabase]);

  const handlePayment = async () => {
    setIsPaying(true);
    try {
      // อัปเดตสถานะเป็น in_progress เมื่อชำระเงิน (จำลอง)
      const { error } = await supabase
        .from('jobs')
        .update({ 
          status: 'in_progress', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', jobId);

      if (error) throw error;

      alert('ชำระเงินสำเร็จ! ระบบพักเงินไว้ให้เรียบร้อยแล้วค่ะ');
      router.push(`/chat/${jobId}`);
    } catch (err: any) {
      alert('การชำระเงินผิดพลาด: ' + err.message);
    } finally {
      setIsPaying(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F6F8]">
      <div className="w-10 h-10 border-4 border-[#0047FF] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-black text-gray-500">กำลังโหลดข้อมูลการชำระเงิน...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans pb-24">
      <div className="bg-white p-4 sticky top-0 z-10 shadow-sm flex items-center gap-4">
        <button onClick={() => router.back()} className="text-2xl text-gray-400">←</button>
        <h1 className="font-black text-lg text-gray-800">สรุปการชำระเงิน</h1>
      </div>

      <main className="p-4 max-w-md mx-auto space-y-4">
        {/* รายละเอียดงาน */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">งานที่คุณจ้าง</p>
          <h2 className="font-black text-gray-800 text-lg mb-4">{job?.title}</h2>
          
          <div className="space-y-3 border-t border-dashed border-gray-200 pt-4">
            <div className="flex justify-between text-sm font-bold">
              <span className="text-gray-500">ค่าบริการช่าง</span>
              <span className="text-gray-800">฿{job?.budget?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-bold">
              <span className="text-gray-500">ค่าธรรมเนียมระบบ</span>
              <span className="text-emerald-500">FREE</span>
            </div>
            <div className="flex justify-between text-xl pt-4 border-t border-gray-100">
              <span className="font-black text-gray-800">ยอดสุทธิ</span>
              <span className="font-black text-[#0047FF]">฿{job?.budget?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* วิธีชำระเงิน */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">วิธีชำระเงิน</p>
          <div className="flex items-center gap-4 p-4 border-2 border-[#0047FF] rounded-2xl bg-blue-50/50">
            <div className="w-10 h-10 bg-[#0047FF] rounded-full flex items-center justify-center text-white font-black text-xs">QR</div>
            <div>
              <p className="text-sm font-black text-gray-800">Thai QR / PromptPay</p>
              <p className="text-[10px] font-bold text-gray-500">เงินเข้าสู่ระบบพักเงินจงเจริญทันที</p>
            </div>
          </div>
        </div>

        <div className="p-4 text-center">
          <p className="text-[10px] text-gray-400 font-bold leading-relaxed">
            🛡️ เงินของคุณจะถูกพักไว้ในระบบ "จงเจริญ"<br/>
            ช่างจะได้รับเงินเมื่อคุณกดยืนยันการรับงานในหน้าแชทเท่านั้น
          </p>
        </div>
      </main>

      {/* ปุ่มจ่ายเงิน */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-100 flex justify-center">
        <button 
          onClick={handlePayment}
          disabled={isPaying}
          className="w-full max-w-md bg-[#0047FF] text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50 transition-all"
        >
          {isPaying ? 'กำลังประมวลผล...' : `ชำระเงิน ฿${job?.budget?.toLocaleString()}`}
        </button>
      </div>
    </div>
  );
}

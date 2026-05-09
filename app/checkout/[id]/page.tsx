'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('job_id');
  const supabase = useMemo(() => createClient(), []);

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    async function fetchJob() {
      const { data } = await supabase
        .from('jobs')
        .select('*, employer:profiles!employer_id(full_name), worker:profiles!worker_id(full_name)')
        .eq('id', jobId)
        .single();
      setJob(data);
      setLoading(false);
    }
    fetchJob();
  }, [jobId, supabase]);

  const handlePayment = async () => {
    setIsPaying(true);
    try {
      // 1. จำลองการชำระเงิน (ในระบบจริงต้องต่อ Gateway เช่น Stripe/Opn)
      // 2. อัปเดตสถานะงานเป็น 'in_progress'
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'in_progress', updated_at: new Date().toISOString() })
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

  if (loading) return <div className="p-10 text-center font-black">กำลังโหลดข้อมูลการชำระเงิน...</div>;

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans">
      <div className="bg-white p-4 sticky top-0 z-10 shadow-sm flex items-center gap-4">
        <button onClick={() => router.back()} className="text-2xl">←</button>
        <h1 className="font-black text-lg">ชำระเงิน</h1>
      </div>

      <main className="p-4 max-w-md mx-auto space-y-4">
        {/* สรุปรายละเอียดงาน */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">รายละเอียดงาน</p>
          <h2 className="font-black text-gray-800 text-lg mb-4">{job?.title}</h2>
          
          <div className="space-y-3 border-t border-dashed border-gray-200 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">ค่าบริการช่าง ({job?.worker?.full_name})</span>
              <span className="font-bold text-gray-800">฿{job?.budget?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">ค่าธรรมเนียมระบบ</span>
              <span className="font-bold text-emerald-500">ฟรี</span>
            </div>
            <div className="flex justify-between text-xl pt-4 border-t border-gray-100">
              <span className="font-black text-gray-800">ยอดชำระสุทธิ</span>
              <span className="font-black text-[#EE4D2D]">฿{job?.budget?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* วิธีชำระเงิน (Mockup) */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">เลือกวิธีชำระเงิน</p>
          <div className="flex items-center gap-4 p-4 border-2 border-[#EE4D2D] rounded-2xl bg-orange-50">
            <div className="w-10 h-10 bg-[#EE4D2D] rounded-full flex items-center justify-center text-white font-black">QR</div>
            <div>
              <p className="text-sm font-black text-gray-800">Thai QR Payment</p>
              <p className="text-[10px] text-gray-500">พร้อมเพย์ทุกธนาคาร</p>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-gray-400 text-center px-4">
          ⚠️ เงินของคุณจะถูกเก็บไว้ที่ระบบ "จงเจริญ" และจะโอนให้ช่างเมื่อคุณกดยืนยันการรับงานเท่านั้น
        </p>
      </main>

      {/* ปุ่มกดจ่ายเงิน Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
        <button 
          onClick={handlePayment}
          disabled={isPaying}
          className="w-full max-w-md mx-auto block bg-[#EE4D2D] text-white py-4 rounded-2xl font-black text-lg shadow-lg active:scale-95 disabled:opacity-50 transition-all"
        >
          {isPaying ? 'กำลังประมวลผล...' : `ชำระเงิน ฿${job?.budget?.toLocaleString()}`}
        </button>
      </div>
    </div>
  );
}

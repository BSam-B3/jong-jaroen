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

  useEffect(() => {
    const fetchJob = async () => {
      const { data } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();
      
      if (data) setJobData(data);
      setLoading(false);
    };
    fetchJob();
  }, [jobId, supabase]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">กำลังโหลด...</div>;

  return (
    <div className="min-h-screen bg-[#F4F6F8] p-6 flex flex-col items-center">
      <h1 className="text-2xl font-black text-gray-800 mt-10">ล็อกคิวช่าง จ่ายผ่านจงเจริญ</h1>
      <p className="text-gray-500 mt-2">หน้านี้กำลังปรับปรุงระบบชำระเงินเข้า Escrow...</p>
      <button 
        onClick={() => router.back()} 
        className="mt-6 bg-[#EE4D2D] text-white px-6 py-2 rounded-xl font-bold"
      >
        กลับไปหน้าก่อนหน้า
      </button>
    </div>
  );
}

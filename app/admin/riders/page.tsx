'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function AdminRidersPage() {
  const supabase = createClient();
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRiders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_rider', true)
      .order('rider_status', { ascending: false });
    if (data) setRiders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRiders();
  }, []);

  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    if (!confirm('ยืนยันการทำรายการ?')) return;
    await supabase.from('profiles').update({ rider_status: newStatus }).eq('id', userId);
    fetchRiders();
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] p-4 font-sans">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-[#EE4D2D] font-black text-xs mb-4 inline-block">← กลับหน้าหลัก</Link>
        <h1 className="text-2xl font-black mb-6">จัดการคนขับ ({riders.length})</h1>
        
        <div className="space-y-4">
          {loading ? <p>Loading...</p> : riders.map((rider) => (
            <div key={rider.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <p className="text-sm font-black">{rider.full_name || 'ไม่ระบุชื่อ'}</p>
                <p className="text-[10px] text-gray-400 font-bold">{rider.vehicle_registration} | {rider.vehicle_type}</p>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full mt-2 inline-block ${rider.rider_status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                  {rider.rider_status === 'approved' ? 'อนุมัติแล้ว' : 'รอตรวจสอบ'}
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleUpdateStatus(rider.id, 'approved')} className="bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-black">อนุมัติ</button>
                <button onClick={() => handleUpdateStatus(rider.id, 'rejected')} className="bg-red-50 text-red-500 px-4 py-2 rounded-xl text-xs font-black">ปฏิเสธ</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

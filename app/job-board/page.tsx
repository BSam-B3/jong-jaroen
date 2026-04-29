'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import BottomNav from '@/app/components/BottomNav';
import Link from 'next/link';

export default function JobBoardPage() {
  const supabase = createClient();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // 1. ดึงข้อมูล User ปัจจุบัน
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
      }
      fetchOpenJobs();
    };
    init();

    // 2. ระบบ Real-time: เวลามีคนโพสต์งานใหม่ ให้เด้งขึ้นบอร์ดทันที
    const channel = supabase.channel('public-jobs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs', filter: "status=eq.open" }, () => {
        fetchOpenJobs();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  // ฟังก์ชันดึงข้อมูลงานที่ยังไม่มีคนรับ (status = open)
  const fetchOpenJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('jobs')
      .select('*, employer:profiles!jobs_employer_id_fkey(full_name)')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (!error && data) setJobs(data);
    setLoading(false);
  };

  // ฟังก์ชันสำหรับ "กดรับงาน"
  const handleAcceptJob = async (jobId: string) => {
    if (!currentUser) return alert('กรุณาเข้าสู่ระบบก่อนรับงานค่ะ');
    if (!confirm('ยืนยันรับงานนี้ใช่ไหมคะ?')) return;

    // อัปเดตสถานะงานเป็น in_progress และใส่ชื่อคนรับงาน
    const { error } = await supabase
      .from('jobs')
      .update({ status: 'in_progress', worker_id: currentUser.id })
      .eq('id', jobId)
      .eq('status', 'open'); // ป้องกันคนกดรับงานพร้อมกัน

    if (error) {
      alert('ขออภัยค่ะ งานนี้ถูกผู้อื่นรับไปแล้ว หรือเกิดข้อผิดพลาด 🙏');
      fetchOpenJobs();
    } else {
      alert('รับงานสำเร็จ! 🚀 กรุณาไปที่หน้า "งานของฉัน" เพื่อดูรายละเอียดค่ะ');
      fetchOpenJobs();
    }
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'car': return '🚗';
      case 'pickup': return '🛻';
      case 'saleng': return '🛺';
      default: return '🛵';
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-24">
      <div className="w-full max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-2xl border-x border-gray-100">
        
        {/* Header */}
        <header className="px-6 pt-10 pb-6 bg-gradient-to-b from-[#0082FA] to-[#006bd6] text-white shadow-md rounded-b-[2.5rem] relative z-20">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-black tracking-tight">บอร์ดงานรวม 📋</h1>
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-[10px] font-bold">LIVE</span>
            </div>
          </div>
          <p className="text-xs text-blue-100 font-bold">เลือกรับงานที่ใช่ ทำรายได้ตามใจคุณ</p>
        </header>

        {/* Job Feed */}
        <main className="p-4 space-y-4 mt-2 overflow-y-auto">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2].map(i => <div key={i} className="h-40 bg-white rounded-[1.5rem]" />)}
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-10 text-center border border-gray-100 shadow-sm mt-4">
              <div className="text-6xl mb-4 opacity-80">☕</div>
              <p className="font-black text-gray-800 text-sm">ยังไม่มีงานใหม่ในขณะนี้</p>
              <p className="text-xs text-gray-400 font-bold mt-1">พักผ่อนจิบกาแฟรอสักครู่นะคะ</p>
            </div>
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl border border-blue-100 shadow-sm">
                      {getVehicleIcon(job.vehicle_type)}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-900 leading-tight">{job.title}</h3>
                      <p className="text-[10px] text-gray-400 font-bold mt-1">
                        ผู้จ้าง: {job.employer?.full_name || 'ลูกค้าทั่วไป'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-[#0082FA]">฿{job.budget}</div>
                    <div className="text-[10px] text-gray-500 font-bold bg-gray-50 px-2 py-0.5 rounded-md mt-1 inline-block">
                      {job.distance_km} กม.
                    </div>
                  </div>
                </div>

                {/* สถานที่รับ-ส่ง */}
                <div className="bg-[#F8FAFC] p-3 rounded-xl border border-gray-100 space-y-2 mb-4">
                  <div className="flex items-start gap-2 text-[11px] font-bold text-gray-600">
                    <span className="text-green-500 mt-0.5">📍</span>
                    <span className="line-clamp-1">{job.pickup_location}</span>
                  </div>
                  {job.dropoff_location && (
                    <div className="flex items-start gap-2 text-[11px] font-bold text-gray-600">
                      <span className="text-red-500 mt-0.5">🚩</span>
                      <span className="line-clamp-1">{job.dropoff_location}</span>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => handleAcceptJob(job.id)}
                  className="w-full bg-[#0082FA] text-white py-3.5 rounded-[1rem] text-sm font-black active:scale-95 transition-transform shadow-md"
                >
                  รับงานนี้ ⚡
                </button>
              </div>
            ))
          )}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}

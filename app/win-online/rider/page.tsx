'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import BottomNav from '@/app/components/BottomNav';
import Link from 'next/link';

export default function WinOnlineRiderBoard() {
  const supabase = createClient();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [riderProfile, setRiderProfile] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
        
        // 1. เช็คโปรไฟล์ไรเดอร์
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_rider, rider_status, vehicle_type')
          .eq('id', session.user.id)
          .single();
          
        setRiderProfile(profile);

        if (profile?.rider_status === 'approved') {
          fetchWinOnlineJobs(profile.vehicle_type);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    init();

    // 2. Real-time เฉพาะงาน Win Online (ride, buy, deliver)
    const channel = supabase.channel('win-online-jobs')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'jobs', 
        filter: "status=eq.open" 
      }, () => {
        if (riderProfile?.rider_status === 'approved') {
          fetchWinOnlineJobs(riderProfile.vehicle_type);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, riderProfile?.rider_status, riderProfile?.vehicle_type]);

  // ฟังก์ชันดึงเฉพาะงานด่วน และกรองตามประเภทรถ
  const fetchWinOnlineJobs = async (vehicleType: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('jobs')
      .select('*, employer:profiles!jobs_employer_id_fkey(full_name)')
      .eq('status', 'open')
      .in('job_type', ['ride', 'buy', 'deliver']) // 👈 ดึงแค่งานหมวดวินออนไลน์
      .eq('vehicle_type', vehicleType) // 👈 กรองให้ตรงกับรถที่ลงทะเบียนไว้
      .order('created_at', { ascending: false });

    if (!error && data) setJobs(data);
    setLoading(false);
  };

  const handleAcceptJob = async (jobId: string) => {
    if (!currentUser) return;
    if (!confirm('ยืนยันรับงานนี้ใช่ไหมคะ?')) return;

    const { error } = await supabase
      .from('jobs')
      .update({ status: 'in_progress', worker_id: currentUser.id })
      .eq('id', jobId)
      .eq('status', 'open'); 

    if (error) {
      alert('ขออภัยค่ะ งานนี้ถูกรับไปแล้ว 🙏');
    } else {
      alert('รับงานสำเร็จ! 🚀 เปิดระบบนำทางได้ที่ "งานของฉัน"');
    }
    if (riderProfile?.vehicle_type) fetchWinOnlineJobs(riderProfile.vehicle_type);
  };

  // 🛑 หน้าจอกีดกันถ้าไม่ใช่ไรเดอร์
  if (!loading && riderProfile?.rider_status !== 'approved') {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-24">
        <div className="w-full max-w-3xl bg-[#F4F6F8] min-h-screen flex flex-col justify-center items-center p-6 border-x border-gray-100 shadow-2xl">
          <div className="bg-white rounded-[2rem] p-10 text-center shadow-lg w-full max-w-md">
            <div className="text-7xl mb-6">🛵</div>
            {riderProfile?.rider_status === 'pending' ? (
              <>
                <h2 className="text-xl font-black text-gray-800 mb-2">รอตรวจสอบเอกสาร</h2>
                <p className="text-sm text-gray-500 font-bold mb-6">แอดมินกำลังตรวจป้ายทะเบียนของคุณค่ะ</p>
                <Link href="/profile" className="inline-block bg-gray-100 text-gray-600 px-8 py-4 rounded-full font-black text-sm">กลับหน้าโปรไฟล์</Link>
              </>
            ) : (
              <>
                <h2 className="text-xl font-black text-gray-800 mb-2">สำหรับพี่วิน / คนขับ</h2>
                <p className="text-sm text-gray-500 font-bold mb-6">ลงทะเบียนรถของคุณเพื่อเริ่มรับงานในพื้นที่ค่ะ</p>
                <Link href="/provider/register" className="inline-block w-full bg-[#EE4D2D] text-white px-8 py-4 rounded-full font-black text-sm shadow-md active:scale-95 transition-transform">
                  ลงทะเบียนรถเลย 🚀
                </Link>
              </>
            )}
          </div>
          <BottomNav />
        </div>
      </div>
    );
  }

  // ✅ บอร์ดงานเฉพาะวินออนไลน์ (UI จะดูซิ่งๆ เข้ากับธีม)
  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-24">
      <div className="w-full max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-2xl border-x border-gray-100">
        
        <header className="px-6 pt-10 pb-6 bg-[#EE4D2D] text-white shadow-md rounded-b-[2.5rem] relative z-20">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-black tracking-tight">เรดาร์หาลูกค้า 📡</h1>
            <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-[10px] font-bold">กำลังค้นหา</span>
            </div>
          </div>
          <p className="text-xs text-orange-100 font-bold">รอรับงาน {riderProfile?.vehicle_type === 'motorcycle' ? 'มอเตอร์ไซค์' : 'รถยนต์'} ในพื้นที่ของคุณ</p>
        </header>

        <main className="p-4 space-y-4 mt-2 overflow-y-auto">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2].map(i => <div key={i} className="h-40 bg-white rounded-[1.5rem]" />)}
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-10 text-center border border-gray-100 shadow-sm mt-4">
              <div className="text-6xl mb-4 opacity-80">🗺️</div>
              <p className="font-black text-gray-800 text-sm">ยังไม่มีลูกค้าเรียกตอนนี้</p>
              <p className="text-xs text-gray-400 font-bold mt-1">จอดพักร่มๆ ดื่มน้ำรอก่อนนะคะ</p>
            </div>
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-50 border-l-4 border-l-[#EE4D2D]">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 leading-tight">
                      {job.job_type === 'ride' ? '🛵 รับส่งผู้โดยสาร' : job.job_type === 'buy' ? '🛍️ ฝากซื้อของ' : '📦 ส่งพัสดุ'}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold mt-1">ลูกค้า: {job.employer?.full_name || 'ไม่ระบุ'}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-[#EE4D2D]">{job.budget} บาท</div>
                    <div className="text-[10px] text-gray-500 font-bold bg-gray-50 px-2 py-0.5 rounded-md mt-1 inline-block">{job.distance_km} กม.</div>
                  </div>
                </div>

                <div className="bg-[#F8FAFC] p-3 rounded-xl border border-gray-100 space-y-2 mb-4">
                  <div className="flex items-start gap-2 text-[11px] font-bold text-gray-600">
                    <span className="text-blue-500 mt-0.5">🔵</span>
                    <span className="line-clamp-1">รับ: {job.pickup_location}</span>
                  </div>
                  {job.dropoff_location && (
                    <div className="flex items-start gap-2 text-[11px] font-bold text-gray-600">
                      <span className="text-orange-500 mt-0.5">📍</span>
                      <span className="line-clamp-1">ส่ง: {job.dropoff_location}</span>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => handleAcceptJob(job.id)}
                  className="w-full bg-gradient-to-r from-[#EE4D2D] to-[#FF7337] text-white py-3.5 rounded-[1rem] text-sm font-black active:scale-95 transition-transform shadow-md"
                >
                  ปาดรับงานนี้ ⚡
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

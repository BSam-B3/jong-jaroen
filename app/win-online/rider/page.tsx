'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function RiderDashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null); // 🌟 เพิ่ม State เก็บโปรไฟล์
  const [loading, setLoading] = useState(true);
  
  // Rider States
  const [isOnline, setIsOnline] = useState(false);
  const [isAutoAccept, setIsAutoAccept] = useState(false);
  
  // Data States
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [activeJob, setActiveJob] = useState<any>(null);
  const [todaysEarnings, setTodaysEarnings] = useState(0);
  const [todaysTrips, setTodaysTrips] = useState(0);

  // 🌟 ตรวจสอบสิทธิ์และดึงข้อมูลเริ่มต้น
  useEffect(() => {
    const initRider = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth/login');
        return;
      }
      
      // ดึงโปรไฟล์ (เพิ่ม full_name และ avatar_url)
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_kyc_verified, full_name, avatar_url')
        .eq('id', session.user.id)
        .single();

      if (!profile?.is_kyc_verified) {
        alert('คุณยังไม่ผ่านการอนุมัติเอกสารคนขับค่ะ');
        router.push('/profile');
        return;
      }

      setProfileData(profile);
      setCurrentUser(session.user);
      fetchRiderData(session.user.id);
    };
    initRider();
  }, [router, supabase]);

  const fetchRiderData = useCallback(async (userId: string) => {
    const { data: currentJob } = await supabase
      .from('jobs')
      .select('*, employer:profiles!employer_id(full_name, phone)')
      .eq('worker_id', userId)
      .eq('status', 'in_progress')
      .maybeSingle();
    
    setActiveJob(currentJob);

    if (!currentJob) {
      const { data: openJobs } = await supabase
        .from('jobs')
        .select('*, employer:profiles!employer_id(full_name)')
        .in('job_type', ['ride', 'buy', 'deliver'])
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      
      if (openJobs) setAvailableJobs(openJobs);
    }

    const today = new Date().toISOString().split('T')[0];
    const { data: completedJobs } = await supabase
      .from('jobs')
      .select('budget')
      .eq('worker_id', userId)
      .eq('status', 'completed')
      .gte('created_at', `${today}T00:00:00Z`);

    if (completedJobs) {
      setTodaysTrips(completedJobs.length);
      setTodaysEarnings(completedJobs.reduce((sum, job) => sum + (job.budget || 0), 0));
    }
    
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!currentUser) return;
    const channel = supabase.channel('rider-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
        fetchRiderData(currentUser.id);
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser, fetchRiderData, supabase]);

  const handleAcceptJob = async (jobId: string) => {
    if (!isOnline) { alert('กรุณาเปิดออนไลน์ก่อนรับงานค่ะ'); return; }
    if (activeJob) { alert('คุณมีงานที่กำลังดำเนินการอยู่ค่ะ'); return; }
    
    const { error } = await supabase
      .from('jobs')
      .update({ status: 'in_progress', worker_id: currentUser.id })
      .eq('id', jobId)
      .eq('status', 'open');

    if (error) {
      alert('ขออภัยค่ะ งานนี้ถูกรับไปแล้ว 🥲');
    } else {
      fetchRiderData(currentUser.id);
    }
  };

  const handleCompleteJob = async (jobId: string) => {
    if (!confirm('ยืนยันว่าส่งลูกค้าถึงที่หมายและเก็บเงินเรียบร้อยแล้วใช่ไหมคะ?')) return;
    
    const { error } = await supabase
      .from('jobs')
      .update({ status: 'completed' })
      .eq('id', jobId);

    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } else {
      alert('🎉 ปิดจ๊อบสำเร็จ! ลุยงานต่อไปกันเลยค่ะ');
      fetchRiderData(currentUser.id);
    }
  };

  const openNavigation = (location: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location)}`;
    window.open(url, '_blank');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center font-sans">
      <div className="w-12 h-12 border-4 border-[#EE4D2D] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center font-sans pb-24 md:pb-10">
      <div className="w-full lg:max-w-4xl xl:max-w-5xl bg-[#F4F6F8] min-h-screen relative flex flex-col md:shadow-2xl overflow-x-hidden md:border-x border-gray-200">
        
        {/* 🟠 Header Section (เปลี่ยนเป็นสีส้มแอปจงเจริญ) */}
        <header className="bg-gradient-to-br from-[#EE4D2D] via-[#FF6243] to-[#FF8A65] px-6 pt-12 pb-8 rounded-b-[2.5rem] md:rounded-b-[3.5rem] text-white shadow-xl relative z-20">
          <div className="flex justify-between items-start max-w-2xl mx-auto mb-8">
            
            {/* 🌟 ย้ายปุ่มกลับและข้อมูลโปรไฟล์มาฝั่งซ้าย */}
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/profile')} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 active:scale-95 transition-all backdrop-blur-md shrink-0">
                ←
              </button>
              <div className="flex items-center gap-3 bg-black/10 pr-4 pl-1 py-1 rounded-full backdrop-blur-sm border border-white/10">
                 <div className="w-8 h-8 rounded-full overflow-hidden bg-white flex items-center justify-center text-sm shadow-sm shrink-0">
                   {profileData?.avatar_url ? (
                     <img src={profileData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                   ) : '👤'}
                 </div>
                 <div className="flex flex-col">
                   <span className="text-[9px] font-black text-white/80 uppercase tracking-widest leading-none">คนขับ</span>
                   <span className="text-xs font-black text-white line-clamp-1 leading-tight">{profileData?.full_name || 'พี่วินจงเจริญ'}</span>
                 </div>
              </div>
            </div>
            
            {/* Online Toggle (ปรับ UI ให้อ่านง่ายบนพื้นส้ม) */}
            <div className="flex flex-col items-end">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={isOnline} onChange={(e) => setIsOnline(e.target.checked)} />
                <div className="w-14 h-8 bg-black/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-200 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#00C300] shadow-inner backdrop-blur-sm border border-white/20"></div>
              </label>
              <div className={`mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-black backdrop-blur-md shadow-sm border ${isOnline ? 'bg-white text-[#00C300] border-white' : 'bg-black/30 text-white/80 border-transparent'}`}>
                {isOnline ? '🟢 รับงานอยู่' : '⚫ ออฟไลน์'}
              </div>
            </div>

          </div>

          <div className="max-w-2xl mx-auto">
            <p className="text-[10px] text-white/80 font-black uppercase tracking-widest mb-1">รายได้วันนี้</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white/90 drop-shadow-sm">฿</span>
              <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter drop-shadow-md">
                {todaysEarnings.toLocaleString('th-TH')}
              </h1>
            </div>
            <div className="flex gap-4 mt-5">
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2.5 rounded-2xl flex items-center gap-2.5 border border-white/10 shadow-sm flex-1">
                <span className="text-xl bg-white/20 p-1.5 rounded-xl">🎯</span>
                <div>
                  <p className="text-[9px] text-white/80 font-bold uppercase">รอบวิ่งวันนี้</p>
                  <p className="text-sm font-black text-white">{todaysTrips} รอบ</p>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2.5 rounded-2xl flex items-center gap-2.5 border border-white/10 shadow-sm flex-1">
                <span className="text-xl bg-white/20 p-1.5 rounded-xl">⭐</span>
                <div>
                  <p className="text-[9px] text-white/80 font-bold uppercase">คะแนนดาว</p>
                  <p className="text-sm font-black text-white">5.0</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-5 md:px-10 mt-2 relative z-30 w-full max-w-2xl mx-auto space-y-6">
          
          {/* ⚡ Auto-Accept Settings */}
          {isOnline && !activeJob && (
            <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-colors ${isAutoAccept ? 'bg-orange-100 text-[#EE4D2D]' : 'bg-gray-100 text-gray-400'}`}>
                  ⚡
                </div>
                <div>
                  <h3 className="font-black text-gray-800 text-sm">รับงานอัตโนมัติ</h3>
                  <p className="text-[10px] text-gray-500 font-bold">รัศมี 3 กม. (แนะนำ)</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={isAutoAccept} onChange={(e) => setIsAutoAccept(e.target.checked)} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#EE4D2D]"></div>
              </label>
            </div>
          )}

          {/* 🛑 ถ้าออฟไลน์ */}
          {!isOnline && !activeJob && (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-60 grayscale">
              <div className="text-6xl mb-4">😴</div>
              <h3 className="text-lg font-black text-gray-800">คุณกำลังออฟไลน์</h3>
              <p className="text-xs text-gray-500 font-bold mt-1">เปิดสวิตช์ด้านบนเพื่อเริ่มค้นหางานรอบตัวคุณ</p>
            </div>
          )}

          {/* 📍 ถ้ามีงานที่กำลังทำ (Active Job) */}
          {activeJob && (
            <div className="bg-white rounded-[2rem] shadow-xl border-2 border-[#0047FF] overflow-hidden animate-fade-in relative">
              <div className="bg-[#0047FF] text-white px-5 py-3 flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  งานกำลังดำเนินการ
                </span>
                <span className="text-sm font-black text-[#00C300] bg-white px-3 py-0.5 rounded-full shadow-sm">
                  ฿{activeJob.budget}
                </span>
              </div>
              
              <div className="p-6 space-y-5">
                <h2 className="text-xl font-black text-gray-800">{activeJob.title}</h2>
                
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-3.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-400 before:to-gray-200 pl-8 md:pl-0">
                  <div className="relative flex items-start md:justify-center">
                    <div className="absolute left-[-2.3rem] md:left-1/2 md:-ml-4 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 border-4 border-white shadow">📍</div>
                    <div className="md:w-1/2 md:pr-10 md:text-right w-full">
                      <p className="text-[10px] font-black text-blue-500 uppercase">จุดรับ (รับผู้โดยสาร)</p>
                      <p className="text-sm font-bold text-gray-800 mt-0.5">{activeJob.pickup_location}</p>
                      <button onClick={() => openNavigation(activeJob.pickup_location)} className="mt-2 text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg active:scale-95 transition-all">นำทางไปจุดรับ ↗</button>
                    </div>
                  </div>
                  
                  {activeJob.dropoff_location && (
                    <div className="relative flex items-start md:justify-center mt-6">
                      <div className="absolute left-[-2.3rem] md:left-1/2 md:-ml-4 flex items-center justify-center w-8 h-8 rounded-full bg-red-100 border-4 border-white shadow">🚩</div>
                      <div className="md:w-1/2 md:pl-10 md:ml-auto w-full mt-2 md:mt-0">
                        <p className="text-[10px] font-black text-red-500 uppercase">จุดส่ง (ปลายทาง)</p>
                        <p className="text-sm font-bold text-gray-800 mt-0.5">{activeJob.dropoff_location}</p>
                        <button onClick={() => openNavigation(activeJob.dropoff_location)} className="mt-2 text-[10px] font-black bg-red-50 text-red-600 px-3 py-1.5 rounded-lg active:scale-95 transition-all">นำทางไปจุดส่ง ↗</button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-xl">👤</div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold">ผู้เรียกใช้บริการ</p>
                      <p className="text-sm font-black text-gray-800">{activeJob.employer?.full_name || 'ลูกค้าทั่วไป'}</p>
                    </div>
                  </div>
                  <button onClick={() => router.push(`/chat/${activeJob.id}`)} className="w-10 h-10 bg-[#0047FF] text-white rounded-full flex items-center justify-center text-lg shadow-md active:scale-95">💬</button>
                </div>

                <button onClick={() => handleCompleteJob(activeJob.id)} className="w-full bg-[#00C300] hover:bg-green-600 text-white font-black py-4 rounded-2xl text-base shadow-lg shadow-green-200 active:scale-95 transition-all">
                  ✅ เก็บเงินและจบงาน
                </button>
              </div>
            </div>
          )}

          {/* 📡 กระดานเรดาร์งาน (Job Radar) */}
          {isOnline && !activeJob && (
            <div>
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-base font-black text-gray-800">📡 งานที่กำลังเรียก...</h2>
                <span className="text-[10px] font-bold text-gray-400">อัปเดตแบบเรียลไทม์</span>
              </div>

              {availableJobs.length === 0 ? (
                <div className="bg-white rounded-[2rem] p-10 text-center border border-gray-100 shadow-sm flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full border-4 border-orange-50 border-t-[#EE4D2D] animate-spin mb-4"></div>
                  <p className="font-black text-gray-800 text-sm">กำลังค้นหางานรอบตัวคุณ...</p>
                  <p className="text-[11px] text-gray-400 font-bold mt-1">รอสักครู่ ระบบจะแจ้งเตือนเมื่องานเข้า</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableJobs.map((job) => (
                    <div key={job.id} className="bg-white rounded-3xl p-5 shadow-md border border-gray-100 flex flex-col gap-4 animate-fade-in group hover:border-[#EE4D2D] transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-orange-50 text-[#EE4D2D] rounded-xl flex items-center justify-center text-2xl font-black">
                            {job.job_type === 'buy' ? '🛒' : job.job_type === 'deliver' ? '📦' : '🛵'}
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-gray-900">{job.title || 'เรียกงานด่วน'}</h3>
                            <p className="text-[10px] font-bold text-gray-400 mt-0.5">ระยะทางรวม {job.distance_km || '?'} กม.</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-[#00C300]">฿{job.budget}</p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-[11px] font-bold text-gray-600 space-y-1">
                        <div className="flex gap-2"><span className="text-blue-500 shrink-0">📍</span><span className="line-clamp-1">{job.pickup_location}</span></div>
                        {job.dropoff_location && <div className="flex gap-2"><span className="text-red-500 shrink-0">🚩</span><span className="line-clamp-1">{job.dropoff_location}</span></div>}
                      </div>

                      <button onClick={() => handleAcceptJob(job.id)} className="w-full bg-[#EE4D2D] hover:bg-[#D43D1D] text-white font-black py-3 rounded-xl text-sm shadow-md active:scale-95 transition-all">
                        รับงานนี้ ⚡
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

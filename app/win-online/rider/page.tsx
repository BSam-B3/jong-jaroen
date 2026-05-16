'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const VEHICLES_UI = [
  { key: 'motorcycle', label: 'มอไซค์', icon: '🛵' },
  { key: 'saleng', label: 'ซาเล้ง', icon: '🛺' },
  { key: 'car', label: 'รถเก๋ง', icon: '🚗' },
  { key: 'suv', label: 'ครอบครัว', icon: '🚙' },
  { key: 'van', label: 'รถตู้', icon: '🚐' },
  { key: 'pickup', label: 'กระบะ', icon: '🛻' }
];

// 🌟 Helper สำหรับคุมธีมสีตามประเภทงาน
const GET_JOB_STYLE = (type: string) => {
  switch (type) {
    case 'buy': // งานฝากซื้อ (Marketplace)
      return {
        bg: 'bg-pink-50',
        border: 'border-pink-100',
        accent: 'bg-pink-500',
        text: 'text-pink-600',
        icon: '🛒',
        label: 'ฝากซื้อของ'
      };
    case 'ride': // งานวินออนไลน์
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-100',
        accent: 'bg-blue-600',
        text: 'text-blue-600',
        icon: '🛵',
        label: 'วินออนไลน์'
      };
    default: // ส่งของทั่วไป
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-100',
        accent: 'bg-orange-500',
        text: 'text-orange-600',
        icon: '📦',
        label: 'ส่งของ'
      };
  }
};

export default function RiderDashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null); 
  const [loading, setLoading] = useState(true);
  
  const [isOnline, setIsOnline] = useState(false);
  const [isAutoAccept, setIsAutoAccept] = useState(false);
  const [riderVehicle, setRiderVehicle] = useState<string>('motorcycle'); 
  
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [activeJob, setActiveJob] = useState<any>(null);
  const [todaysEarnings, setTodaysEarnings] = useState(0);
  const [todaysTrips, setTodaysTrips] = useState(0);
  
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [historyJobs, setHistoryJobs] = useState<any[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getTimeElapsed = (dateString: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 60000);
    if (diff < 1) return 'เพิ่งเรียกเมื่อกี้';
    if (diff < 60) return `${diff} นาทีที่แล้ว`;
    return `${Math.floor(diff / 60)} ชม. ที่แล้ว`;
  };

  const getVehicleLabel = (type: string) => {
    const v = VEHICLES_UI.find(x => x.key === type);
    return v ? `${v.icon} ${v.label}` : '🛵 มอไซค์';
  };

  useEffect(() => {
    const initRider = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth/login');
        return;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_kyc_verified, full_name, avatar_url, vehicle_type')
        .eq('id', session.user.id)
        .single();

      if (!profile?.is_kyc_verified) {
        alert('คุณยังไม่ผ่านการอนุมัติเอกสารคนขับค่ะ');
        router.push('/profile');
        return;
      }

      setProfileData(profile);
      setCurrentUser(session.user);
      const vType = profile?.vehicle_type || 'motorcycle';
      setRiderVehicle(vType);
      fetchRiderData(session.user.id, vType);
    };
    initRider();
  }, [router, supabase]);

  const fetchRiderData = useCallback(async (userId: string, vType: string = riderVehicle) => {
    const { data: walletData } = await supabase
      .from('wallets')
      .select('balance_satang')
      .eq('owner_id', userId)
      .eq('kind', 'user')
      .maybeSingle();
      
    if (walletData) {
      setCreditBalance(walletData.balance_satang / 100);
    }

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
        .eq('vehicle_type', vType) 
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      
      if (openJobs) setAvailableJobs(openJobs);
    }

    const today = new Date().toISOString().split('T')[0];
    const { data: completedJobs } = await supabase
      .from('jobs')
      .select('*, employer:profiles!employer_id(full_name)')
      .eq('worker_id', userId)
      .eq('status', 'completed')
      .gte('created_at', `${today}T00:00:00Z`)
      .order('updated_at', { ascending: false });

    if (completedJobs) {
      setHistoryJobs(completedJobs);
      setTodaysTrips(completedJobs.length);
      setTodaysEarnings(completedJobs.reduce((sum, job) => sum + (job.budget || 0), 0));
    }
    setLoading(false);
  }, [supabase, riderVehicle]);

  useEffect(() => {
    if (!currentUser) return;
    const channel = supabase.channel('rider-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
        fetchRiderData(currentUser.id, riderVehicle);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUser, fetchRiderData, riderVehicle, supabase]);

  const handleToggleOnline = (checked: boolean) => {
    if (checked && creditBalance < 20) {
      alert(`⚠️ ไม่สามารถออนไลน์ได้!\n\nเครดิต JJWallet ของคุณเหลือเพียง ${creditBalance} บาท (ขั้นต่ำ 20 บาท)\n\nกรุณาเติมเครดิตเข้าสู่ระบบก่อนเริ่มรับงานค่ะ`);
      setIsOnline(false);
      return;
    }
    setIsOnline(checked);
  };

  const handleAcceptJob = async (jobId: string) => {
    if (!isOnline) { alert('กรุณาเปิดออนไลน์ก่อนรับงานค่ะ'); return; }
    if (activeJob) { alert('คุณมีงานที่กำลังดำเนินการอยู่ค่ะ'); return; }
    if (creditBalance < 20) {
      alert('เครดิตไม่เพียงพอ กรุณาเติมเครดิตก่อนรับงานค่ะ');
      setIsOnline(false);
      return;
    }

    const { error } = await supabase
      .from('jobs')
      .update({ status: 'in_progress', worker_id: currentUser.id })
      .eq('id', jobId)
      .eq('status', 'open');

    if (error) {
      alert('ขออภัยค่ะ งานนี้ถูกรับไปแล้ว 🥲');
    } else {
      alert('🎉 รับงานสำเร็จ! กำลังไปที่หน้ารายละเอียดงานค่ะ');
      router.push(`/win-online/rider/jobs/${jobId}`);
    }
  };

  const handleCompleteJob = async (jobId: string) => {
    if (!confirm('ยืนยันว่าลูกค้าโอนเงินให้เรียบร้อยแล้วใช่ไหมคะ?\n\nเมื่อยืนยัน ระบบจะหักเครดิตของคุณ 10% จากราคาพื้นฐานอัตโนมัติค่ะ')) return;
    const { error } = await supabase.rpc('complete_ride_job', { p_job_id: jobId });
    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } else {
      alert('🎉 ปิดจ๊อบสำเร็จ! ได้รับเงินเรียบร้อยค่ะ');
      fetchRiderData(currentUser.id, riderVehicle);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    const reason = prompt('ระบุเหตุผลที่ยกเลิกงาน:');
    if (reason === null) return;
    const { error } = await supabase.from('jobs').update({ status: 'open', worker_id: null }).eq('id', jobId);
    if (!error) {
      alert('คืนงานลงกระดานเรียบร้อยค่ะ');
      fetchRiderData(currentUser.id, riderVehicle);
    }
  };

  const openNavigation = (location: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
    window.open(url, '_blank');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center font-sans">
      <div className="w-12 h-12 border-4 border-[#EE4D2D] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center font-sans pb-24 md:pb-10 relative">
      <div className="w-full lg:max-w-4xl xl:max-w-5xl bg-[#F4F6F8] min-h-screen relative flex flex-col md:shadow-2xl overflow-x-hidden md:border-x border-gray-200">
        
        <header className="bg-gradient-to-br from-[#EE4D2D] via-[#FF6243] to-[#FF8A65] px-6 pt-12 pb-8 rounded-b-[2.5rem] md:rounded-b-[3.5rem] text-white shadow-xl relative z-20">
          <div className="flex justify-between items-start max-w-2xl mx-auto mb-6">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/profile')} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 active:scale-95 transition-all backdrop-blur-md">←</button>
              <div className="flex items-center gap-3 bg-black/10 pr-4 pl-1 py-1 rounded-full backdrop-blur-sm border border-white/10">
                 <div className="w-8 h-8 rounded-full overflow-hidden bg-white flex items-center justify-center">{profileData?.avatar_url ? <img src={profileData.avatar_url} className="w-full h-full object-cover" /> : '👤'}</div>
                 <div className="flex flex-col">
                   <span className="text-[9px] font-black text-white/80 uppercase leading-none">RIDER</span>
                   <span className="text-xs font-black text-white line-clamp-1">{profileData?.full_name}</span>
                 </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a href="tel:191" className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white shadow-lg">SOS</a>
              <div className="flex flex-col items-end">
                <input type="checkbox" className="sr-only peer" checked={isOnline} id="online-toggle" onChange={(e) => handleToggleOnline(e.target.checked)} />
                <label htmlFor="online-toggle" className="w-14 h-8 bg-black/20 rounded-full cursor-pointer relative after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:after:translate-x-full peer-checked:bg-[#00C300]"></label>
              </div>
            </div>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <p className="text-[10px] text-white/80 font-black uppercase tracking-widest mb-1">เงินสดที่รับวันนี้</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-white/90">฿</span>
                  <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">{todaysEarnings.toLocaleString('th-TH')}</h1>
                </div>
              </div>
              <div className="border-l border-white/20 pl-4">
                <p className="text-[10px] text-white/80 font-black uppercase tracking-widest mb-1">เครดิต (JJWallet)</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-white/90">฿</span>
                  <h1 className={`text-4xl md:text-5xl font-black tracking-tighter ${creditBalance < 20 ? 'text-red-300' : 'text-[#00C300]'}`}>
                    {creditBalance.toLocaleString('th-TH')}
                  </h1>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">{VEHICLES_UI.find(x => x.key === riderVehicle)?.icon}</div>
                <div><p className="text-[10px] text-white/80 font-bold uppercase tracking-widest">รถที่ลงทะเบียน</p><p className="text-sm font-black text-white">{VEHICLES_UI.find(x => x.key === riderVehicle)?.label}</p></div>
              </div>
              <span className="bg-[#00C300]/20 text-[#00C300] border border-[#00C300]/40 px-2.5 py-1 rounded-lg text-[9px] font-black">✔ ยืนยันแล้ว</span>
            </div>

            <div className="flex gap-4 mt-5">
              <button onClick={() => setIsHistoryModalOpen(true)} className="bg-white/20 backdrop-blur-sm px-4 py-2.5 rounded-2xl flex-1 text-left border border-white/10">
                <p className="text-[9px] text-white/80 font-bold">รอบวิ่งวันนี้ <span className="bg-white/30 px-1 rounded text-[8px]">ดูประวัติ ›</span></p>
                <p className="text-sm font-black text-white">{todaysTrips} รอบ</p>
              </button>
              <button onClick={() => router.push('/wallet')} className="bg-gradient-to-r from-orange-400 to-[#EE4D2D] shadow-lg active:scale-95 transition-transform px-4 py-2.5 rounded-2xl flex-1 border border-white/10 flex items-center justify-between">
                <div><p className="text-[9px] text-white/80 font-bold">จัดการกระเป๋าเงิน</p><p className="text-sm font-black text-white">เติมเครดิต 💳</p></div>
                <span className="text-xl">›</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-5 md:px-10 mt-2 relative z-30 w-full max-w-2xl mx-auto space-y-6">
          {isOnline && !activeJob && (
            <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${isAutoAccept ? 'bg-orange-100 text-[#EE4D2D]' : 'bg-gray-100 text-gray-400'}`}>⚡</div>
                <div><h3 className="font-black text-gray-800 text-sm">รับงานอัตโนมัติ</h3><p className="text-[10px] text-gray-500 font-bold">รัศมี 3 กม.</p></div>
              </div>
              <input type="checkbox" className="sr-only peer" id="auto-accept" checked={isAutoAccept} onChange={(e) => setIsAutoAccept(e.target.checked)} />
              <label htmlFor="auto-accept" className="w-11 h-6 bg-gray-200 rounded-full cursor-pointer relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:bg-[#EE4D2D]"></label>
            </div>
          )}

          {activeJob && (
            <div className={`bg-white rounded-[2rem] shadow-xl border-2 overflow-hidden animate-fade-in ${GET_JOB_STYLE(activeJob.job_type).border}`}>
              <div className={`${GET_JOB_STYLE(activeJob.job_type).accent} text-white px-5 py-3 flex justify-between items-center`}>
                <span className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2"><span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>งาน{GET_JOB_STYLE(activeJob.job_type).label}ที่กำลังทำ</span>
                <span className="text-sm font-black text-[#00C300] bg-white px-3 py-0.5 rounded-full shadow-sm">฿{activeJob.budget}</span>
              </div>
              <div className="p-6 space-y-5">
                <h2 className="text-xl font-black text-gray-800">{activeJob.title}</h2>
                <div className="space-y-4 pl-8 border-l-2 border-dashed border-gray-200 relative">
                  <div className="relative"><span className="absolute left-[-2.3rem] top-0 w-8 h-8 rounded-full bg-blue-100 border-4 border-white flex items-center justify-center">📍</span><p className="text-[10px] font-black text-blue-500">จุดรับ</p><p className="text-sm font-bold text-gray-800">{activeJob.pickup_location}</p><button onClick={() => openNavigation(activeJob.pickup_location)} className="mt-2 text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg shadow-sm">นำทางไปจุดรับ ↗</button></div>
                  <div className="relative pt-4"><span className="absolute left-[-2.3rem] top-4 w-8 h-8 rounded-full bg-red-100 border-4 border-white flex items-center justify-center">🚩</span><p className="text-[10px] font-black text-red-500">จุดส่ง</p><p className="text-sm font-bold text-gray-800">{activeJob.dropoff_location}</p><button onClick={() => openNavigation(activeJob.dropoff_location)} className="mt-2 text-[10px] font-black bg-red-50 text-red-600 px-3 py-1.5 rounded-lg shadow-sm">นำทางไปจุดส่ง ↗</button></div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-xl">👤</div><div><p className="text-[10px] text-gray-400 font-bold">ลูกค้า</p><p className="text-sm font-black text-gray-800">{activeJob.employer?.full_name}</p></div></div>
                  <div className="flex gap-2">{activeJob.employer?.phone && <a href={`tel:${activeJob.employer.phone}`} className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">📞</a>}<button onClick={() => router.push(`/chat/${activeJob.id}`)} className="w-10 h-10 bg-[#0047FF] text-white rounded-full flex items-center justify-center shadow-md">💬</button></div>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <button onClick={() => router.push(`/win-online/rider/jobs/${activeJob.id}`)} className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 mb-2">📦 ดูรายละเอียดและอัปเดตงาน</button>
                  <button onClick={() => handleCompleteJob(activeJob.id)} className="w-full bg-[#00C300] text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all">✅ ได้รับเงินแล้ว (จบงาน)</button>
                  <button onClick={() => handleCancelJob(activeJob.id)} className="w-full text-red-500 font-bold py-3 text-xs">ยกเลิกงานนี้</button>
                </div>
              </div>
            </div>
          )}

          {isOnline && !activeJob && (
            <div>
              <div className="flex justify-between mb-4 px-1"><h2 className="text-base font-black text-gray-800">📡 งานที่กำลังเรียก...</h2><span className="text-[10px] font-bold text-gray-400 animate-pulse">LIVE</span></div>
              {availableJobs.length === 0 ? (
                <div className="bg-gradient-to-b from-gray-50 to-white rounded-[2rem] p-10 text-center border border-gray-100 flex flex-col items-center shadow-inner">
                  <div className="text-5xl font-black text-gray-800 mb-2 tabular-nums tracking-tight">
                    {currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                  <p className="font-black text-[#EE4D2D] text-sm">กำลังค้นหางานรอบตัวคุณ...</p>
                  <p className="text-[11px] text-gray-400 font-bold mt-1">ประเภทรถ: {getVehicleLabel(riderVehicle)}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableJobs.map((job) => {
                    const style = GET_JOB_STYLE(job.job_type);
                    return (
                      <div key={job.id} className={`${style.bg} rounded-3xl p-5 shadow-md border ${style.border} flex flex-col gap-4 animate-fade-in relative overflow-hidden`}>
                        <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-[10px] font-black text-white shadow-sm ${style.accent}`}>{style.label}</div>
                        <div className="flex justify-between items-start mt-2">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 bg-white text-gray-800 rounded-2xl flex items-center justify-center text-3xl font-black shadow-sm border border-gray-100">{style.icon}</div>
                            <div>
                              <h3 className="text-sm font-black text-gray-900">{job.title}</h3>
                              <div className="flex gap-2 mt-1">
                                <span className="text-[9px] bg-white text-gray-500 px-2 py-0.5 rounded-md font-black border border-gray-100">{getVehicleLabel(job.vehicle_type)}</span>
                                <span className="text-[9px] bg-white text-gray-400 px-2 py-0.5 rounded-md font-bold border border-gray-100">⏱️ {getTimeElapsed(job.created_at)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right"><p className={`text-xl font-black ${style.text}`}>฿{job.budget}</p><p className="text-[9px] font-bold text-gray-400">~{job.distance_km} กม.</p></div>
                        </div>
                        <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 text-xs font-bold text-gray-600 space-y-2">
                          <div className="flex gap-3 items-center"><span className="w-2 h-2 rounded-full bg-blue-500"></span><span className="line-clamp-1 opacity-70">รับ: {job.pickup_location}</span></div>
                          <div className="flex gap-3 items-center pt-2 border-t border-gray-100"><span className="w-2 h-2 rounded-full bg-red-500"></span><span className="line-clamp-1">ส่ง: {job.dropoff_location}</span></div>
                        </div>
                        <button onClick={() => handleAcceptJob(job.id)} className={`w-full ${style.accent} text-white font-black py-4 rounded-2xl text-base shadow-lg hover:brightness-110 active:scale-95 transition-all`}>รับงาน{style.label} ⚡</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
        {/* ... ส่วนประวัติงาน (คงเดิม) ... */}
      </div>
      <button onClick={() => router.push('/win-online')} className="fixed bottom-24 right-4 bg-gray-900 text-white px-5 py-3 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.3)] z-50 font-black flex items-center gap-2 hover:scale-105 active:scale-95 transition-all border-2 border-gray-700">👤 สลับไปแอปลูกค้า</button>
    </div>
  );
}

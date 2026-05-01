'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Mode = 'hired' | 'received';
type Status = 'open' | 'in_progress' | 'completed' | 'cancelled';

const STATUS_META: Record<Status, { label: string; icon: string; bg: string; text: string; ring: string }> = {
  open: { label: 'รอคนรับงาน', icon: '🟡', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
  in_progress: { label: 'กำลังดำเนินการ', icon: '🛵', bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200' },
  completed: { label: 'เสร็จสิ้น', icon: '✅', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  cancelled: { label: 'ยกเลิกแล้ว', icon: '❌', bg: 'bg-gray-100', text: 'text-gray-600', ring: 'ring-gray-200' },
};

// ฟังก์ชันแปลงวันที่ให้เป็นภาษาไทย
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', { 
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  });
};

export default function MyJobsPage() {
  const supabase = createClient();
  const [mode, setMode] = useState<Mode>('hired');
  const [userId, setUserId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyJobs = useCallback(async (uid: string) => {
    setLoading(true);
    // 🌟 ดึงข้อมูลงานพร้อม Join ชื่อจริง (full_name) จากตาราง profiles
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        employer:profiles!employer_id (id, full_name),
        worker:profiles!worker_id (id, full_name)
      `)
      .or(`employer_id.eq.${uid},worker_id.eq.${uid}`)
      .order('created_at', { ascending: false });

    if (!error && data) setJobs(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        fetchMyJobs(session.user.id);
      } else {
        setLoading(false);
      }
    });
  }, [fetchMyJobs, supabase.auth]);

  const isHired = mode === 'hired';
  const displayJobs = isHired ? jobs.filter(j => j.employer_id === userId) : jobs.filter(j => j.worker_id === userId);

  // สลับธีมสีของการ์ดตาม Mode
  const accent = isHired
    ? { text: 'text-[#EE4D2D]', border: 'border-orange-100', grad: 'from-[#EE4D2D] to-[#FF7337]', bgLight: 'bg-orange-50' }
    : { text: 'text-[#0082FA]', border: 'border-blue-100', grad: 'from-[#0082FA] to-[#00A3FF]', bgLight: 'bg-blue-50' };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-24">
      <div className="w-full max-w-2xl flex flex-col relative">
        
        {/* 🟠 Header ส้มจงเจริญ (มาตรฐานเดียวกับหน้า Profile) */}
        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-[2.5rem] p-6 pt-10 pb-8 shadow-md relative z-20 m-3 mt-4 flex flex-col">
          <Link href="/profile" className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm shadow-inner border border-white/30 text-white text-xl active:scale-95 transition-transform shrink-0 mb-4">
            ←
          </Link>
          <h1 className="text-3xl font-black text-white tracking-tight">งานของฉัน</h1>
          <p className="text-[11px] font-bold text-white/80 mt-1 tracking-wide">
            จัดการรายการงานที่คุณจ้าง และ งานที่คุณรับผิดชอบ
          </p>
        </div>

        {/* 🔘 ปุ่มสลับแท็บ (Tabs) */}
        <div className="px-5 pt-2 relative z-10 -mt-2">
          <div className="relative bg-white rounded-2xl p-1.5 flex shadow-sm border border-gray-100">
            <span className={`absolute top-1.5 bottom-1.5 w-[calc(50%-0.375rem)] rounded-xl bg-gradient-to-r ${accent.grad} shadow-md transition-all duration-300 ${isHired ? 'left-1.5' : 'left-[calc(50%+0rem)]'}`} />
            <button onClick={() => setMode('hired')} className={`relative z-10 flex-1 py-3 text-sm font-black transition-colors ${isHired ? 'text-white' : 'text-gray-500 hover:text-gray-700'}`}>
              💼 งานที่ฉันจ้าง
            </button>
            <button onClick={() => setMode('received')} className={`relative z-10 flex-1 py-3 text-sm font-black transition-colors ${!isHired ? 'text-white' : 'text-gray-500 hover:text-gray-700'}`}>
              🛵 งานที่ฉันรับ
            </button>
          </div>
        </div>

        {/* 📋 รายการงาน (Jobs List) */}
        <main className="px-5 mt-6 flex-1 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
               <div className="w-10 h-10 border-4 border-[#EE4D2D] border-t-transparent rounded-full animate-spin"></div>
               <p className="font-bold text-gray-400 animate-pulse text-sm">กำลังโหลดข้อมูลงาน...</p>
            </div>
          ) : displayJobs.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-12 text-center border border-gray-100 shadow-sm mt-4">
              <div className="text-6xl mb-4 opacity-50">📭</div>
              <p className="font-black text-gray-800 text-lg">ยังไม่มีรายการงาน</p>
              <p className="text-xs text-gray-400 mt-2 font-medium">ลองค้นหางานใหม่หรือสร้างรายการจ้างงานดูสิคะ</p>
            </div>
          ) : (
            displayJobs.map((job) => {
              const s = STATUS_META[job.status as Status] || STATUS_META.open;
              const partner = isHired ? job.worker : job.employer;
              const partnerDisplay = partner?.full_name ? `${partner.full_name} (#${partner.id.slice(-4)})` : 'รอยืนยันผู้รับงาน';

              return (
                <article key={job.id} className={`bg-white rounded-[2rem] p-5 shadow-sm border-2 ${accent.border} relative overflow-hidden`}>
                  {/* แถบสีตกแต่งด้านซ้าย */}
                  <div className={`absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b ${accent.grad}`} />

                  {/* ป้ายสถานะ & ประเภทงาน */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">
                      {job.job_type || 'ทั่วไป'}
                    </span>
                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-full ${s.bg} ${s.text} border ${s.ring} flex items-center gap-1`}>
                      {s.icon} {s.label}
                    </span>
                  </div>

                  {/* หัวข้องาน & วันที่ */}
                  <h3 className="font-black text-gray-800 text-base leading-tight">{job.title || 'บริการด่วน'}</h3>
                  <p className="text-[10px] text-gray-400 font-bold mt-1 mb-3">
                    ⏰ {job.created_at ? formatDate(job.created_at) : 'ไม่ระบุเวลา'}
                  </p>

                  {/* 📍 ข้อมูลเส้นทาง (โชว์ถ้ามีข้อมูล) */}
                  {(job.pickup_location || job.dropoff_location) && (
                    <div className="bg-gray-50 rounded-2xl p-3 mb-4 space-y-2 border border-gray-100">
                      {job.pickup_location && (
                        <div className="flex gap-2 items-start">
                          <span className="text-[12px] mt-0.5">🟢</span>
                          <div className="flex-1">
                            <p className="text-[9px] font-black text-gray-400 uppercase">จุดรับ (Pickup)</p>
                            <p className="text-[11px] font-bold text-gray-700 line-clamp-2">{job.pickup_location}</p>
                          </div>
                        </div>
                      )}
                      {job.dropoff_location && (
                        <div className="flex gap-2 items-start">
                          <span className="text-[12px] mt-0.5">📍</span>
                          <div className="flex-1">
                            <p className="text-[9px] font-black text-gray-400 uppercase">จุดส่ง (Drop-off)</p>
                            <p className="text-[11px] font-bold text-gray-700 line-clamp-2">{job.dropoff_location}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase">
                    {isHired ? 'ผู้รับงาน: ' : 'ผู้จ้าง: '}
                    <span className="text-gray-700">{partnerDisplay}</span>
                  </p>
                  
                  {/* ราคา & แอคชัน */}
                  <div className="flex justify-between items-end pt-4 border-t border-gray-100 mt-3">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">ค่าบริการ</p>
                      <p className={`font-black text-2xl ${accent.text} tracking-tight`}>
                        {job.budget ? `${job.budget.toLocaleString()} ฿` : 'ประเมินราคา'}
                      </p>
                    </div>
                    
                    {/* ปุ่ม Action ต่างๆ */}
                    <div className="flex gap-2">
                      {job.status === 'in_progress' && (
                        <Link href={`/chat/${job.id}`} className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2.5 rounded-xl text-[11px] font-black shadow-md active:scale-95 transition-transform flex items-center gap-1">
                          💬 แชท
                        </Link>
                      )}
                      {job.status === 'open' && isHired && (
                        <button className="bg-red-50 text-red-600 px-4 py-2.5 rounded-xl text-[11px] font-black border border-red-100 active:scale-95 transition-transform">
                          ยกเลิกงาน
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </main>
      </div>
    </div>
  );
}

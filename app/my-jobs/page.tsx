'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

type Mode = 'hired' | 'received';
type Status = 'open' | 'in_progress' | 'completed' | 'cancelled';

const STATUS_META: Record<
  Status,
  { label: string; icon: string; bg: string; text: string; ring: string }
> = {
  open: {
    label: 'รอคนรับงาน',
    icon: '🟡',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    ring: 'ring-amber-200',
  },
  in_progress: {
    label: 'กำลังดำเนินการ',
    icon: '🛵',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    ring: 'ring-blue-200',
  },
  completed: {
    label: 'เสร็จสิ้น',
    icon: '✅',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    ring: 'ring-emerald-200',
  },
  cancelled: {
    label: 'ยกเลิกแล้ว',
    icon: '❌',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    ring: 'ring-gray-200',
  },
};

const getCategoryMeta = (type: string) => {
  switch (type) {
    case 'ride': return '🛵 เรียกรถ';
    case 'buy': return '🛒 ฝากซื้อ';
    case 'deliver': return '📦 ส่งของ';
    default: return '📍 งานด่วน';
  }
};

export default function MyJobsPage() {
  const supabase = createClient();
  const [mode, setMode] = useState<Mode>('hired');
  const [userId, setUserId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 1. ดึงข้อมูลงานทั้งหมดของ User ---
  const fetchMyJobs = useCallback(async (uid: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        employer:profiles!employer_id (first_name, full_name, phone_number, phone, avatar_url),
        worker:profiles!worker_id (first_name, full_name, phone_number, phone, avatar_url)
      `)
      .or(`employer_id.eq.${uid},worker_id.eq.${uid}`)
      .order('created_at', { ascending: false });

    if (data) setJobs(data);
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

  // --- 2. ฟังก์ชันอัปเดตสถานะงาน (ยกเลิก / จบงาน) ---
  const handleUpdateStatus = async (jobId: string, newStatus: Status) => {
    if (!confirm(`ยืนยันการเปลี่ยนสถานะเป็น ${newStatus === 'completed' ? 'เสร็จสิ้น' : 'ยกเลิกงาน'} ใช่หรือไม่?`)) return;
    
    const { error } = await supabase
      .from('jobs')
      .update({ status: newStatus })
      .eq('id', jobId);
      
    if (!error && userId) {
      alert('อัปเดตสถานะเรียบร้อยค่ะ ✅');
      fetchMyJobs(userId);
    } else {
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่ค่ะ');
    }
  };

  // --- 3. แยกข้อมูลงานตามแท็บ ---
  const hiredJobs = jobs.filter((j) => j.employer_id === userId);
  const receivedJobs = jobs.filter((j) => j.worker_id === userId);
  
  const isHired = mode === 'hired';
  const displayJobs = isHired ? hiredJobs : receivedJobs;

  const accent = isHired
    ? {
        bg: 'bg-[#EE4D2D]', text: 'text-[#EE4D2D]', soft: 'bg-orange-50', border: 'border-orange-100', grad: 'from-[#EE4D2D] to-[#FF7337]',
      }
    : {
        bg: 'bg-[#0082FA]', text: 'text-[#0082FA]', soft: 'bg-blue-50', border: 'border-blue-100', grad: 'from-[#0082FA] to-[#00A3FF]',
      };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans">
      <div className="w-full sm:max-w-2xl md:max-w-3xl min-h-screen flex flex-col pb-20">
        
        {/* Header */}
        <header className="px-5 pt-12 pb-6 bg-white border-b border-gray-100 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/win-online" className="text-[#EE4D2D] font-black text-xs mb-1 inline-block">← กลับหน้าหลัก</Link>
              <h1 className="text-gray-900 text-3xl font-black tracking-tight italic">
                MY <span className="text-[#EE4D2D] not-italic">JOBS</span>
              </h1>
            </div>
            <Link
              href="/notifications"
              className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-xl shadow-sm border border-gray-100 active:scale-95 transition"
            >
              🔔
            </Link>
          </div>
        </header>

        {/* Tab Toggle */}
        <div className="px-5 pt-6">
          <div className="relative bg-white rounded-2xl p-1.5 flex shadow-sm border border-gray-100">
            <span
              className={`absolute top-1.5 bottom-1.5 w-[calc(50%-0.375rem)] rounded-xl bg-gradient-to-r ${accent.grad} shadow-md transition-all duration-300 ease-out ${isHired ? 'left-1.5' : 'left-[calc(50%+0rem)]'}`}
              aria-hidden
            />
            <button onClick={() => setMode('hired')} className={`relative z-10 flex-1 py-3 rounded-xl text-sm font-black transition-colors ${isHired ? 'text-white' : 'text-gray-500'}`}>
              💼 งานที่ฉันจ้าง
            </button>
            <button onClick={() => setMode('received')} className={`relative z-10 flex-1 py-3 rounded-xl text-sm font-black transition-colors ${!isHired ? 'text-white' : 'text-gray-500'}`}>
              🛵 งานที่ฉันรับ
            </button>
          </div>
        </div>

        {/* Job List */}
        <main className="px-5 mt-6 flex-1 space-y-4">
          {loading ? (
            <div className="text-center py-10 font-bold text-gray-400">กำลังโหลดข้อมูล... ⏳</div>
          ) : displayJobs.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-12 text-center border border-gray-100 shadow-sm">
              <div className="text-6xl mb-4">📭</div>
              <p className="font-black text-gray-700 text-base">ยังไม่มีงานในหมวดนี้</p>
              <p className="text-xs text-gray-400 font-bold mt-2">ประวัติการจ้างงานหรือรับงานของคุณจะแสดงที่นี่</p>
            </div>
          ) : (
            displayJobs.map((job) => {
              const s = STATUS_META[job.status as Status] || STATUS_META.open;
              const isHiredMode = mode === 'hired';
              const counterpartyName = isHiredMode 
                ? (job.worker?.full_name || job.worker?.first_name || 'กำลังค้นหาไรเดอร์...') 
                : (job.employer?.full_name || job.employer?.first_name || 'ลูกค้า');

              return (
                <article key={job.id} className={`bg-white rounded-[2rem] p-5 shadow-sm border ${accent.border}`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-full ${accent.soft} ${accent.text} uppercase tracking-wider`}>
                      {getCategoryMeta(job.job_type)}
                    </span>
                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-full ${s.bg} ${s.text} border ${s.ring}`}>
                      <span className="mr-1">{s.icon}</span>{s.label}
                    </span>
                  </div>

                  <h3 className="font-black text-gray-900 text-base leading-snug mb-3">
                    {job.title || `บริการ ${getCategoryMeta(job.job_type)}`}
                  </h3>

                  <div className="flex items-center gap-3 mb-4 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-lg border border-gray-100 shadow-sm overflow-hidden">
                      {isHiredMode && job.worker?.avatar_url ? (
                         <img src={job.worker.avatar_url} className="w-full h-full object-cover" alt="avatar" />
                      ) : (isHiredMode ? '🛵' : '👤')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-gray-800 truncate">
                        {isHiredMode ? 'ไรเดอร์: ' : 'ลูกค้า: '}{counterpartyName}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                        {new Date(job.created_at).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>

                  {/* 🌟 แสดงป้ายทะเบียนเฉพาะเวลาไรเดอร์รับงานแล้ว */}
                  {isHiredMode && job.status === 'in_progress' && (
                    <div className="mb-4 flex items-center gap-2">
                       <span className="text-[10px] font-black bg-yellow-300 text-gray-900 px-3 py-1 rounded-md tracking-widest border border-yellow-400 shadow-sm">
                         ป้ายทะเบียน: ติดต่อสอบถามในแชท
                       </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">ค่าบริการสุทธิ</p>
                      <p className={`font-black text-xl ${accent.text}`}>
                        {(job.budget || 0).toLocaleString('th-TH')} บาท
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      {/* ปุ่มสำหรับ ฝั่งลูกค้า (Hired) */}
                      {isHiredMode && job.status === 'open' && (
                        <button onClick={() => handleUpdateStatus(job.id, 'cancelled')} className="bg-gray-100 text-gray-500 px-5 py-3 rounded-2xl text-[11px] font-black hover:bg-red-50 hover:text-red-600 transition-colors">
                          ยกเลิกคำขอ
                        </button>
                      )}
                      {isHiredMode && job.status === 'in_progress' && (
                        <button className="bg-blue-50 text-blue-600 border border-blue-100 px-5 py-3 rounded-2xl text-[11px] font-black hover:bg-blue-100 transition-colors">
                          💬 คุยกับไรเดอร์
                        </button>
                      )}

                      {/* ปุ่มสำหรับ ฝั่งไรเดอร์ (Received) */}
                      {!isHiredMode && job.status === 'in_progress' && (
                        <button onClick={() => handleUpdateStatus(job.id, 'completed')} className="bg-emerald-500 text-white shadow-md px-6 py-3 rounded-2xl text-[11px] font-black hover:bg-emerald-600 transition-transform active:scale-95">
                          ✅ จบงานเรียบร้อย
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

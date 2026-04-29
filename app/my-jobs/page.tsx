'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Mode = 'hired' | 'received';
type Status = 'open' | 'in_progress' | 'completed' | 'cancelled';

const STATUS_META: Record<
  Status,
  { label: string; icon: string; bg: string; text: string; ring: string }
> = {
  open: { label: 'รอคนรับงาน', icon: '🟡', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
  in_progress: { label: 'กำลังดำเนินการ', icon: '🛵', bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200' },
  completed: { label: 'เสร็จสิ้น', icon: '✅', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  cancelled: { label: 'ยกเลิกแล้ว', icon: '❌', bg: 'bg-gray-100', text: 'text-gray-600', ring: 'ring-gray-200' },
};

export default function MyJobsPage() {
  const supabase = createClient();
  const [mode, setMode] = useState<Mode>('hired');
  const [userId, setUserId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Review System
  const [reviewJob, setReviewJob] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const fetchMyJobs = useCallback(async (uid: string) => {
    setLoading(true);
    // 🌟 แก้ไขจุดที่พัง: ลบ full_name และ avatar_url ออก เหลือแค่ first_name กับ phone
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        employer:profiles!employer_id (first_name, phone),
        worker:profiles!worker_id (first_name, phone)
      `)
      .or(`employer_id.eq.${uid},worker_id.eq.${uid}`)
      .order('created_at', { ascending: false });

    if (error) console.error('Fetch Error:', error.message);
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

  const handleUpdateStatus = async (jobId: string, newStatus: Status) => {
    if (!confirm(`ยืนยันการเปลี่ยนสถานะเป็น ${newStatus === 'completed' ? 'เสร็จสิ้น' : 'ยกเลิกงาน'}?`)) return;
    const { error } = await supabase.from('jobs').update({ status: newStatus }).eq('id', jobId);
    if (!error && userId) fetchMyJobs(userId);
  };

  const isHired = mode === 'hired';
  const displayJobs = isHired ? jobs.filter(j => j.employer_id === userId) : jobs.filter(j => j.worker_id === userId);

  const accent = isHired
    ? { text: 'text-[#EE4D2D]', border: 'border-orange-100', grad: 'from-[#EE4D2D] to-[#FF7337]' }
    : { text: 'text-[#0082FA]', border: 'border-blue-100', grad: 'from-[#0082FA] to-[#00A3FF]' };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-10">
      <div className="w-full max-w-3xl flex flex-col">
        <header className="px-5 pt-12 pb-6 bg-white border-b border-gray-100 sticky top-0 z-20">
          <Link href="/win-online" className="text-[#EE4D2D] font-black text-xs mb-1 inline-block">← กลับหน้าหลัก</Link>
          <h1 className="text-gray-900 text-3xl font-black italic">MY <span className="text-[#EE4D2D] not-italic">JOBS</span></h1>
        </header>

        <div className="px-5 pt-6">
          <div className="relative bg-white rounded-2xl p-1.5 flex shadow-sm border border-gray-100">
            <span className={`absolute top-1.5 bottom-1.5 w-[calc(50%-0.375rem)] rounded-xl bg-gradient-to-r ${accent.grad} shadow-md transition-all duration-300 ${isHired ? 'left-1.5' : 'left-[calc(50%+0rem)]'}`} />
            <button onClick={() => setMode('hired')} className={`relative z-10 flex-1 py-3 text-sm font-black transition-colors ${isHired ? 'text-white' : 'text-gray-500'}`}>💼 งานที่ฉันจ้าง</button>
            <button onClick={() => setMode('received')} className={`relative z-10 flex-1 py-3 text-sm font-black transition-colors ${!isHired ? 'text-white' : 'text-gray-500'}`}>🛵 งานที่ฉันรับ</button>
          </div>
        </div>

        <main className="px-5 mt-6 flex-1 space-y-4">
          {loading ? (
            <div className="text-center py-10 font-bold text-gray-400 animate-pulse">กำลังดึงข้อมูลงาน...</div>
          ) : displayJobs.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-12 text-center border border-gray-100">
              <div className="text-6xl mb-4">📭</div>
              <p className="font-black text-gray-700">ยังไม่มีงานในรายการนี้</p>
            </div>
          ) : (
            displayJobs.map((job) => {
              const s = STATUS_META[job.status as Status] || STATUS_META.open;
              return (
                <article key={job.id} className={`bg-white rounded-[2rem] p-5 shadow-sm border ${accent.border}`}>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-gray-50 px-3 py-1.5 rounded-full">{job.job_type || 'บริการ'}</span>
                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-full ${s.bg} ${s.text} border ${s.ring}`}>{s.icon} {s.label}</span>
                  </div>
                  <h3 className="font-black text-gray-900 text-base mb-3 leading-snug">{job.title || 'บริการรับ-ส่งด่วน'}</h3>
                  <div className="flex justify-between items-end pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">ค่าบริการ</p>
                      <p className={`font-black text-xl ${accent.text}`}>{job.budget?.toLocaleString()} บาท</p>
                    </div>
                    <div className="flex gap-2">
                      {/* ปุ่มยกเลิกสำหรับงานที่เพิ่งเปิด */}
                      {isHired && job.status === 'open' && (
                        <button onClick={() => handleUpdateStatus(job.id, 'cancelled')} className="bg-gray-100 text-gray-500 px-4 py-2 rounded-xl text-[11px] font-black">ยกเลิก</button>
                      )}
                      
                      {/* 🌟 ปุ่มแชท สำหรับงานที่กำลังดำเนินการ */}
                      {job.status === 'in_progress' && (
                        <Link href={`/chat/${job.id}`} className="bg-blue-50 text-blue-600 px-5 py-2 rounded-xl text-[11px] font-black border border-blue-100 flex items-center justify-center shadow-sm active:scale-95 transition-transform">
                          💬 แชท
                        </Link>
                      )}

                      {/* ปุ่มให้คะแนนสำหรับคนจ้าง เมื่องานเสร็จ */}
                      {isHired && job.status === 'completed' && (
                        <button onClick={() => setReviewJob(job)} className="bg-orange-50 text-[#EE4D2D] px-4 py-2 rounded-xl text-[11px] font-black border border-orange-100">⭐ ให้คะแนน</button>
                      )}
                      
                      {/* ปุ่มจบงานสำหรับคนรับงาน */}
                      {!isHired && job.status === 'in_progress' && (
                        <button onClick={() => handleUpdateStatus(job.id, 'completed')} className="bg-emerald-500 text-white px-5 py-2 rounded-xl text-[11px] font-black shadow-md active:scale-95 transition-transform">✅ จบงาน</button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </main>
        
        {/* Review Modal */}
        {reviewJob && (
          <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-5 backdrop-blur-sm">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative">
              <button onClick={() => setReviewJob(null)} className="absolute top-6 right-6 text-gray-300 hover:text-gray-500 text-xl font-bold">✕</button>
              <h3 className="text-center font-black text-xl mb-6">ให้คะแนนความประทับใจ ⭐</h3>
              <div className="flex justify-center gap-2 mb-6">
                {[1,2,3,4,5].map(s => (
                  <button key={s} onClick={() => setRating(s)} className={`text-4xl ${rating >= s ? 'text-yellow-400' : 'text-gray-100'}`}>★</button>
                ))}
              </div>
              <textarea 
                className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold border border-gray-100 outline-none focus:border-[#EE4D2D] h-24 mb-6" 
                placeholder="บอกความรู้สึกของคุณ..." 
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
              <button onClick={() => { alert('ขอบคุณค่ะ! ⭐'); setReviewJob(null); }} className="w-full bg-[#EE4D2D] text-white font-black py-4 rounded-2xl shadow-lg">ยืนยัน 🚀</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

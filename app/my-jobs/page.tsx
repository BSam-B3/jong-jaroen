'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Mode = 'hired' | 'received';
// 🌟 เพิ่มสถานะ 'delivered' เข้าไป
type Status = 'open' | 'in_progress' | 'delivered' | 'completed' | 'cancelled';

const STATUS_META: Record<Status, { label: string; icon: string; bg: string; text: string; ring: string }> = {
  open: { label: 'รอคนรับงาน', icon: '🟡', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
  in_progress: { label: 'กำลังดำเนินการ', icon: '🛵', bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200' },
  delivered: { label: 'ส่งมอบแล้ว', icon: '📦', bg: 'bg-purple-50', text: 'text-purple-700', ring: 'ring-purple-200' },
  completed: { label: 'เสร็จสิ้น', icon: '✅', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  cancelled: { label: 'ยกเลิกแล้ว', icon: '❌', bg: 'bg-gray-100', text: 'text-gray-600', ring: 'ring-gray-200' },
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', { 
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  });
};

export default function MyJobsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<Mode>('hired');
  const [userId, setUserId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchMyJobs = useCallback(async (uid: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        employer:profiles!employer_id (id, full_name, avatar_url),
        worker:profiles!worker_id (id, full_name, avatar_url),
        proposals:job_proposals (
          *,
          worker:profiles!worker_id (id, full_name, avatar_url)
        )
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

  const handleAcceptProposal = async (job: any, proposal: any) => {
    if (!confirm(`ยืนยันการจ้างงาน ${proposal.worker?.full_name} ใช่ไหมคะ?`)) return;
    setActionLoading(proposal.id);

    try {
      const { error } = await supabase.rpc('accept_proposal', {
        p_job_id: job.id,
        p_proposal_id: proposal.id,
        p_worker_id: proposal.worker_id
      });

      if (error) throw error;

      alert('จ้างงานสำเร็จ! 🎉 พาท่านไปยังห้องแชทค่ะ');
      router.push(`/chat/${job.id}`);
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการจ้างงานค่ะ: ' + err.message);
    }
    setActionLoading(null);
    if (userId) fetchMyJobs(userId);
  };

  const isHired = mode === 'hired';
  const displayJobs = isHired ? jobs.filter(j => j.employer_id === userId) : jobs.filter(j => j.worker_id === userId);
  const accent = isHired
    ? { text: 'text-[#EE4D2D]', border: 'border-orange-100', grad: 'from-[#EE4D2D] to-[#FF7337]' }
    : { text: 'text-[#0082FA]', border: 'border-blue-100', grad: 'from-[#0082FA] to-[#00A3FF]' };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-24">
      <div className="w-full max-w-2xl flex flex-col relative">
        
        {/* Header */}
        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-[2.5rem] p-6 pt-10 pb-8 shadow-md relative z-20 m-3 mt-4 flex flex-col">
          <Link href="/profile" className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 text-white text-xl mb-4 active:scale-95 transition-transform">←</Link>
          <h1 className="text-3xl font-black text-white tracking-tight">งานของฉัน</h1>
          <p className="text-[11px] font-bold text-white/80 mt-1">จัดการรายการจ้างงานและงานที่รับผิดชอบ</p>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-2 z-10 -mt-2">
          <div className="relative bg-white rounded-2xl p-1.5 flex shadow-sm border border-gray-100">
            <span className={`absolute top-1.5 bottom-1.5 w-[calc(50%-0.375rem)] rounded-xl bg-gradient-to-r ${accent.grad} shadow-md transition-all duration-300 ${isHired ? 'left-1.5' : 'left-[calc(50%+0rem)]'}`} />
            <button onClick={() => setMode('hired')} className={`relative z-10 flex-1 py-3 text-sm font-black transition-colors ${isHired ? 'text-white' : 'text-gray-500'}`}>💼 งานที่ฉันจ้าง</button>
            <button onClick={() => setMode('received')} className={`relative z-10 flex-1 py-3 text-sm font-black transition-colors ${!isHired ? 'text-white' : 'text-gray-500'}`}>🛵 งานที่ฉันรับ</button>
          </div>
        </div>

        <main className="px-5 mt-6 space-y-4">
          {loading ? (
            <div className="text-center py-10 font-bold text-gray-400">กำลังโหลดข้อมูล...</div>
          ) : displayJobs.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-12 text-center border border-gray-100 shadow-sm mt-4">
              <div className="text-6xl mb-4">📭</div>
              <p className="font-black text-gray-800 text-lg">ยังไม่มีรายการงาน</p>
            </div>
          ) : (
            displayJobs.map((job) => {
              const s = STATUS_META[job.status as Status] || STATUS_META.open;
              const proposals = job.proposals?.filter((p: any) => p.status === 'pending') || [];

              // 🌟 คำนวณความคืบหน้าของ Status Tracker
              let progressIndex = 0;
              if (job.status === 'in_progress') progressIndex = 2;
              if (job.status === 'delivered') progressIndex = 3;
              if (job.status === 'completed') progressIndex = 4;
              if (job.status === 'cancelled') progressIndex = -1;

              const steps = ['รับงาน', 'พักเงิน', 'กำลังทำ', 'ส่งมอบ', 'จบงาน'];

              return (
                <article key={job.id} className={`bg-white rounded-[2rem] p-5 shadow-sm border-2 ${accent.border} relative overflow-hidden`}>
                  <div className={`absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b ${accent.grad}`} />

                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black uppercase bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">{job.job_type || 'ทั่วไป'}</span>
                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-full ${s.bg} ${s.text} border ${s.ring}`}>{s.icon} {s.label}</span>
                  </div>

                  <h3 className="font-black text-gray-800 text-base leading-tight">{job.title}</h3>
                  <p className="text-[10px] text-gray-400 font-bold mt-1 mb-2">⏰ {formatDate(job.created_at)}</p>

                  {/* 🌟 1. Status Tracker Progress Bar */}
                  {job.status !== 'cancelled' && (
                    <div className="mt-3 mb-4">
                      <div className="flex items-center gap-1">
                        {steps.map((step, idx) => (
                          <div key={step} className={`flex-1 h-1.5 rounded-full transition-colors duration-500 ${idx <= progressIndex ? 'bg-emerald-500' : 'bg-gray-100'}`} />
                        ))}
                      </div>
                      <div className="flex justify-between mt-1 px-1">
                        <span className="text-[8px] font-black text-emerald-600">จองงาน</span>
                        <span className={`text-[8px] font-black ${progressIndex >= 2 ? 'text-emerald-600' : 'text-gray-300'}`}>พักเงิน/ทำ</span>
                        <span className={`text-[8px] font-black ${progressIndex >= 4 ? 'text-emerald-600' : 'text-gray-300'}`}>ปล่อยเงิน</span>
                      </div>
                    </div>
                  )}

                  {/* 🌟 2. Escrow Trust Badge (โชว์เฉพาะตอนพักเงิน) */}
                  {(job.status === 'in_progress' || job.status === 'delivered') && (
                    <div className="mb-4 bg-emerald-50/80 border border-emerald-100 rounded-2xl p-3 flex items-start gap-3 shadow-sm">
                      <div className="text-xl">🔒</div>
                      <div>
                        <p className="text-[11px] font-black text-emerald-800 tracking-wide">เงิน ฿{job.budget?.toLocaleString() || '0'} ถูกพักไว้ในระบบอย่างปลอดภัย</p>
                        <p className="text-[10px] text-emerald-600/80 font-bold mt-0.5 leading-tight">
                          {isHired 
                            ? 'ระบบจะโอนให้ช่าง ก็ต่อเมื่อคุณตรวจสอบและกดยืนยันรับงานเท่านั้น' 
                            : 'ผู้จ้างชำระเงินเรียบร้อยแล้ว ลุยงานและส่งมอบผ่านระบบได้เลย'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ส่วนแสดงรายชื่อผู้เสนอตัว (ซ่อนไว้ถ้ารับงานไปแล้ว) */}
                  {isHired && job.status === 'open' && proposals.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                      <p className="text-[11px] font-black text-[#EE4D2D] flex items-center gap-1">👥 มีผู้ยื่นข้อเสนอ {proposals.length} คน:</p>
                      {proposals.map((p: any) => (
                        <div key={p.id} className="bg-orange-50/50 rounded-2xl p-4 border border-orange-100/50 relative">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-[10px] shadow-sm border border-orange-200">👤</div>
                              <p className="text-[11px] font-black text-gray-800">{p.worker?.full_name}</p>
                            </div>
                            <p className="text-[12px] font-black text-[#EE4D2D]">{p.proposed_price?.toLocaleString()} ฿</p>
                          </div>
                          <p className="text-[10px] text-gray-600 font-medium leading-relaxed mb-3 italic">"{p.cover_letter}"</p>
                          <div className="flex gap-2">
                            <button 
                              disabled={!!actionLoading}
                              onClick={() => handleAcceptProposal(job, p)}
                              className="flex-1 bg-[#EE4D2D] text-white py-2 rounded-xl text-[10px] font-black shadow-sm active:scale-95 transition-all disabled:opacity-50"
                            >
                              {actionLoading === p.id ? '...' : 'จ้างงานคนนี้'}
                            </button>
                            <button className="px-4 py-2 bg-white text-gray-400 border border-gray-200 rounded-xl text-[10px] font-black active:scale-95 transition-all">ไม่สนใจ</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ราคา & แอคชันสำหรับงานที่เริ่มแล้ว */}
                  <div className="flex justify-between items-end pt-4 border-t border-gray-100 mt-3">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">งบประมาณ/ค่าบริการ</p>
                      <p className={`font-black text-2xl ${accent.text} tracking-tight`}>{job.budget ? `${job.budget.toLocaleString()} ฿` : 'เสนอราคา'}</p>
                    </div>
                    
                    {/* เปลี่ยนปุ่มตามสถานะ */}
                    <div className="flex gap-2">
                      {(job.status === 'in_progress' || job.status === 'delivered') && (
                        <Link href={`/chat/${job.id}`} className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2.5 rounded-xl text-[11px] font-black shadow-md active:scale-95 transition-transform">
                          {job.status === 'delivered' ? '📦 ตรวจรับงาน' : '💬 คุยรายละเอียด'}
                        </Link>
                      )}
                      {job.status === 'completed' && (
                        <span className="bg-gray-100 text-gray-400 px-4 py-2 rounded-xl text-[10px] font-black">งานสำเร็จแล้ว</span>
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

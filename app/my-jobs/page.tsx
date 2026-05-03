'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Mode = 'hired' | 'received';
// 🌟 สถานะทั้งหมดในระบบ รวมถึงรอตรวจสลิป
type Status = 'open' | 'verifying_slip' | 'in_progress' | 'delivered' | 'completed' | 'cancelled';

const STATUS_META: Record<Status, { label: string; icon: string; bg: string; text: string; ring: string }> = {
  open: { label: 'รอคนรับงาน', icon: '🟡', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
  verifying_slip: { label: 'กำลังตรวจสลิป', icon: '⏳', bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200' },
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
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        fetchMyJobs(session.user.id);
      } else {
        setLoading(false);
      }
    };
    initSession();

    // 🌟 เพิ่ม Realtime: ให้หน้าเว็บรีเฟรชเองเวลามีคนกดรับงานหรือแอดมินอนุมัติสลิป
    const channel = supabase.channel('my-jobs-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
        if (userId) fetchMyJobs(userId);
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchMyJobs, supabase, userId]);

  // แอคชัน: ลูกค้าเลือกล็อกคิวช่าง
  const handleAcceptProposal = async (job: any, proposal: any) => {
    if (!confirm(`ยืนยันเลือกล็อกคิว ${proposal.worker?.full_name} ใช่ไหมคะ? (ระบบจะพาไปหน้าชำระเงิน)`)) return;
    setActionLoading(proposal.id);

    try {
      const { error } = await supabase.rpc('accept_proposal', {
        p_job_id: job.id,
        p_proposal_id: proposal.id,
        p_worker_id: proposal.worker_id
      });

      if (error) throw error;

      alert('ล็อกคิวสำเร็จ! พาท่านไปชำระเงินเข้า Escrow ค่ะ 🚀');
      router.push(`/checkout/${job.id}`); 
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการจ้างงานค่ะ: ' + err.message);
      setActionLoading(null);
    }
  };

  // 🌟 แอคชันใหม่: ควบคุมสถานะงาน 3 สเต็ป
  const handleAdminApprove = async (jobId: string) => {
    if (!confirm('จำลอง: แอดมินตรวจสอบสลิปผ่านแล้ว ใช่หรือไม่?')) return;
    setActionLoading(jobId);
    await supabase.rpc('admin_approve_job_slip', { p_job_id: jobId });
    setActionLoading(null);
  };

  const handleDeliverJob = async (jobId: string) => {
    if (!confirm('ยืนยันส่งมอบงานให้ลูกค้าใช่ไหมคะ?')) return;
    setActionLoading(jobId);
    await supabase.rpc('provider_deliver_job', { p_job_id: jobId });
    setActionLoading(null);
  };

  const handleCompleteJob = async (jobId: string) => {
    if (!confirm('ตรวจสอบงานเรียบร้อย และยืนยันปล่อยเงินให้ช่างใช่ไหมคะ?')) return;
    setActionLoading(jobId);
    await supabase.rpc('buyer_complete_job', { p_job_id: jobId });
    setActionLoading(null);
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
          <Link href="/" className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 text-white text-xl mb-4 active:scale-95 transition-transform">←</Link>
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
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-[#EE4D2D] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="font-bold text-gray-400 text-sm">กำลังโหลดข้อมูล...</p>
            </div>
          ) : displayJobs.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-12 text-center border border-gray-100 shadow-sm mt-4">
              <div className="text-6xl mb-4 opacity-50">📭</div>
              <p className="font-black text-gray-800 text-lg">ยังไม่มีรายการงาน</p>
            </div>
          ) : (
            displayJobs.map((job) => {
              const s = STATUS_META[job.status as Status] || STATUS_META.open;
              const proposals = job.proposals?.filter((p: any) => p.status === 'pending') || [];
              const acceptedProposal = job.proposals?.find((p: any) => p.status === 'accepted') || job.proposals?.[0];

              // คำนวณ Progress Bar
              let progressIndex = 0;
              if (job.status === 'verifying_slip') progressIndex = 1;
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

                  {/* Status Tracker Progress Bar */}
                  {job.status !== 'cancelled' && (
                    <div className="mt-3 mb-4">
                      <div className="flex items-center gap-1">
                        {steps.map((step, idx) => (
                          <div key={step} className={`flex-1 h-1.5 rounded-full transition-colors duration-500 ${idx <= progressIndex ? 'bg-emerald-500' : 'bg-gray-100'}`} />
                        ))}
                      </div>
                      <div className="flex justify-between mt-1 px-1">
                        <span className="text-[8px] font-black text-emerald-600">จองงาน</span>
                        <span className={`text-[8px] font-black ${progressIndex >= 1 ? 'text-emerald-600' : 'text-gray-300'}`}>พักเงิน/ทำ</span>
                        <span className={`text-[8px] font-black ${progressIndex >= 4 ? 'text-emerald-600' : 'text-gray-300'}`}>ปล่อยเงิน</span>
                      </div>
                    </div>
                  )}

                  {/* ป้ายสถานะ Escrow */}
                  {(job.status === 'verifying_slip' || job.status === 'in_progress' || job.status === 'delivered') && (
                    <div className={`mb-4 border rounded-2xl p-3 flex items-start gap-3 shadow-sm ${job.status === 'verifying_slip' ? 'bg-orange-50/80 border-orange-100' : 'bg-emerald-50/80 border-emerald-100'}`}>
                      <div className="text-xl">{job.status === 'verifying_slip' ? '⏳' : '🔒'}</div>
                      <div>
                        <p className={`text-[11px] font-black tracking-wide ${job.status === 'verifying_slip' ? 'text-orange-800' : 'text-emerald-800'}`}>
                          {job.status === 'verifying_slip' 
                            ? `กำลังตรวจสอบสลิป ${job.budget?.toLocaleString('th-TH')} บาท` 
                            : `เงิน ${job.budget?.toLocaleString('th-TH')} บาท ถูกพักไว้ในระบบอย่างปลอดภัย`}
                        </p>
                        <p className={`text-[10px] font-bold mt-0.5 leading-tight ${job.status === 'verifying_slip' ? 'text-orange-600/80' : 'text-emerald-600/80'}`}>
                          {job.status === 'verifying_slip' 
                            ? 'แอดมินกำลังตรวจสอบสลิปโอนเงิน เมื่อผ่านแล้วช่างจะเริ่มงานทันที'
                            : (isHired ? 'ระบบจะโอนให้ช่าง ก็ต่อเมื่อคุณตรวจสอบและกดยืนยันรับงานเท่านั้น' : 'ผู้จ้างชำระเงินเรียบร้อยแล้ว ลุยงานและส่งมอบผ่านระบบได้เลย')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ส่วนแสดงรายชื่อผู้เสนอตัว (ฝั่งผู้จ้าง) แบบเลื่อนซ้าย-ขวา */}
                  {isHired && job.status === 'open' && proposals.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex justify-between items-end mb-3">
                        <p className="text-[11px] font-black text-[#EE4D2D] flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#EE4D2D]"></span>
                          </span>
                          มีข้อเสนอใหม่ {proposals.length} รายการ
                        </p>
                        <span className="text-[9px] font-bold text-gray-400">ปัดขวาเพื่อดูเพิ่มเติม 👉</span>
                      </div>
                      
                      {/* กล่องเลื่อนซ้ายขวา (Horizontal Scroll) */}
                      <div className="flex overflow-x-auto gap-3 pb-4 snap-x snap-mandatory scrollbar-hide -mx-5 px-5">
                        {proposals.map((p: any) => (
                          <div key={p.id} className="min-w-[260px] max-w-[260px] snap-center bg-white rounded-2xl p-4 border-2 border-orange-100 shadow-sm relative shrink-0 flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-sm shadow-sm border border-gray-100 overflow-hidden shrink-0">
                                  {p.worker?.avatar_url ? (
                                    <img src={p.worker.avatar_url} className="w-full h-full object-cover" />
                                  ) : ('👤')}
                                </div>
                                <div>
                                  <p className="text-xs font-black text-gray-800 line-clamp-1">{p.worker?.full_name}</p>
                                  <p className="text-[9px] font-bold text-gray-400 mt-0.5">⭐ 5.0 (รีวิว 12)</p>
                                </div>
                              </div>
                              <p className="text-sm font-black text-[#EE4D2D] bg-orange-50 px-2 py-1 rounded-lg">{p.proposed_price?.toLocaleString('th-TH')} บาท</p>
                            </div>
                            
                            <div className="bg-gray-50 rounded-xl p-2.5 mb-3 flex-1 border border-gray-100">
                              <p className="text-[10px] text-gray-600 font-medium leading-relaxed line-clamp-2">"{p.cover_letter}"</p>
                            </div>
                            
                            <div className="flex flex-col gap-2 mt-auto">
                              <div className="flex gap-2">
                                {/* 🌟 ปุ่มทักแชท */}
                                <Link 
                                  href={`/chat/proposal/${p.id}`} 
                                  className="flex-1 bg-blue-50 text-blue-600 py-2.5 rounded-xl text-[11px] font-black shadow-sm flex justify-center items-center gap-1 active:scale-95 transition-all"
                                >
                                  💬 คุยก่อนจ้าง
                                </Link>
                                <button className="w-10 h-10 bg-white text-gray-400 border border-gray-200 rounded-xl flex items-center justify-center text-sm active:scale-95 transition-all hover:bg-gray-50">✕</button>
                              </div>
                              <button 
                                disabled={!!actionLoading}
                                onClick={() => handleAcceptProposal(job, p)}
                                className="w-full bg-[#EE4D2D] text-white py-2.5 rounded-xl text-[11px] font-black shadow-sm active:scale-95 transition-all disabled:opacity-50 flex justify-center items-center"
                              >
                                {actionLoading === p.id ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : '✅ ยืนยันจ้างคนนี้'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* ซ่อน Scrollbar ของ Container นี้ */}
                      <style dangerouslySetInnerHTML={{__html: `
                        .scrollbar-hide::-webkit-scrollbar { display: none; }
                        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                      `}} />
                    </div>
                  )}

                  {/* 🌟 ราคา & แอคชันควบคุมสถานะงาน */}
                  <div className="flex justify-between items-end pt-4 border-t border-gray-100 mt-3">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">งบประมาณ/ค่าบริการ</p>
                      <p className={`font-black text-2xl ${accent.text} tracking-tight`}>
                        {job.budget ? `${job.budget.toLocaleString('th-TH')} บาท` : 'เสนอราคา'}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      {/* --- โหมดลูกค้า (isHired = true) --- */}
                      {isHired && job.status === 'verifying_slip' && (
                        <button onClick={() => handleAdminApprove(job.id)} disabled={actionLoading === job.id} className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-4 py-2.5 rounded-xl text-[10px] font-black shadow-sm flex items-center gap-1 transition-colors">
                          {actionLoading === job.id ? <span className="animate-spin text-sm">⏳</span> : '⏳ จำลองแอดมินอนุมัติ'}
                        </button>
                      )}
                      
                      {isHired && job.status === 'in_progress' && (
                        <span className="bg-blue-50 text-blue-600 px-4 py-2.5 rounded-xl text-[11px] font-black shadow-sm">⏳ ช่างกำลังทำ...</span>
                      )}

                      {isHired && job.status === 'delivered' && (
                        <button onClick={() => handleCompleteJob(job.id)} disabled={actionLoading === job.id} className="bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-[11px] font-black shadow-md active:scale-95 transition-transform">
                          {actionLoading === job.id ? <span className="animate-spin">⏳</span> : '✅ ตรวจรับ & ปล่อยเงิน'}
                        </button>
                      )}

                      {/* --- โหมดช่าง (!isHired = false) --- */}
                      {!isHired && job.status === 'verifying_slip' && (
                        <span className="bg-orange-50 text-orange-600 px-4 py-2.5 rounded-xl text-[11px] font-black shadow-sm">⏳ รอลูกค้าชำระเงิน</span>
                      )}

                      {!isHired && job.status === 'in_progress' && (
                        <button onClick={() => handleDeliverJob(job.id)} disabled={actionLoading === job.id} className="bg-purple-500 text-white px-4 py-2.5 rounded-xl text-[11px] font-black shadow-md active:scale-95 transition-transform">
                          {actionLoading === job.id ? <span className="animate-spin">⏳</span> : '📦 กดส่งมอบงาน'}
                        </button>
                      )}

                      {!isHired && job.status === 'delivered' && (
                        <span className="bg-purple-50 text-purple-600 px-4 py-2.5 rounded-xl text-[11px] font-black shadow-sm">⏳ รอลูกค้าตรวจรับ</span>
                      )}

                      {/* --- ปุ่มแชท มีทั้งสองฝั่ง (ถ้ารับงานแล้ว) --- */}
                      {(job.status === 'in_progress' || job.status === 'delivered') && acceptedProposal && (
                        <Link href={`/chat/proposal/${acceptedProposal.id}`} className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2.5 rounded-xl text-[11px] font-black shadow-sm active:scale-95 transition-transform">
                          💬 แชท
                        </Link>
                      )}

                      {/* --- จบงาน --- */}
                      {job.status === 'completed' && (
                        <span className="bg-emerald-100 text-emerald-700 px-4 py-2.5 rounded-xl text-[10px] font-black">🎉 งานสำเร็จแล้ว</span>
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

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Job {
  id: string;
  title: string;
  job_type: 'online' | 'onsite';
  status: 'open' | 'verifying_slip' | 'in_progress' | 'delivered' | 'completed' | 'cancelled';
  budget: number;
  created_at: string;
  proposals?: any[];
}

export default function MyJobsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // 🌟 State สลับแท็บ (คนจ้าง vs คนรับงาน)
  const [activeTab, setActiveTab] = useState<'employer' | 'freelancer'>('employer');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchMyJobs = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push('/auth/login?next=/my-jobs');
        return;
      }
      setCurrentUser(session.user);

      try {
        if (activeTab === 'employer') {
          // 💼 ดึงงานที่ฉันเป็นคน "จ้าง"
          const { data } = await supabase
            .from('jobs')
            .select(`*, proposals:job_proposals(*, profiles(*))`)
            .eq('employer_id', session.user.id)
            .order('created_at', { ascending: false });
          if (data) setJobs(data);
        } else {
          // 🛵 ดึงงานที่ฉัน "รับทำ" (ส่ง proposal ไปแล้ว)
          const { data } = await supabase
            .from('job_proposals')
            .select(`*, job:jobs(*)`)
            .eq('freelancer_id', session.user.id);
          
          if (data) {
            const mappedJobs = data.map(p => ({ ...p.job, my_proposal: p }));
            setJobs(mappedJobs as any);
          }
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyJobs();
  }, [activeTab, router, supabase]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleAcceptProposal = async (job: any, proposal: any) => {
    if (!confirm(`ยืนยันเลือกล็อกคิว ${proposal.profiles?.full_name || 'ช่างท่านนี้'} ใช่ไหมคะ? (ระบบจะพาไปหน้าชำระเงิน)`)) return;
    setActionLoading(proposal.id);

    try {
      const { error } = await supabase.rpc('accept_proposal', {
        p_job_id: job.id,
        p_proposal_id: proposal.id,
        p_worker_id: proposal.freelancer_id
      });
      if (error) throw error;
      alert('ล็อกคิวสำเร็จ! พาท่านไปชำระเงินเข้า Escrow ค่ะ 🚀');
      router.push(`/checkout/${job.id}`); 
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการจ้างงานค่ะ: ' + err.message);
      setActionLoading(null);
    }
  };

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

  // 🌟 ตัวแปรช่วยเรื่องสี ให้ตรงกับแท็บที่เลือก
  const isHired = activeTab === 'employer';
  const themeColor = isHired ? 'bg-[#EE4D2D]' : 'bg-[#0047FF]';
  const themeText = isHired ? 'text-[#EE4D2D]' : 'text-[#0047FF]';
  const themeShadow = isHired ? 'shadow-orange-200' : 'shadow-blue-200';
  const themeHover = isHired ? 'hover:bg-orange-50 hover:text-[#EE4D2D]' : 'hover:bg-blue-50 hover:text-[#0047FF]';

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-24 md:pb-10">
      <div className="w-full lg:max-w-5xl xl:max-w-6xl bg-[#F8FAFC] min-h-screen relative flex flex-col md:shadow-2xl overflow-x-hidden md:border-x border-gray-200/50">
        
        {/* 🟠 Header คุมโทนส้ม-แดง (เป็นโทนหลักของแอป) */}
        <header className="bg-gradient-to-br from-[#EE4D2D] to-[#FF7337] px-6 pt-12 pb-16 md:pb-24 rounded-b-[2.5rem] md:rounded-b-[4rem] text-white shadow-lg relative z-20">
          <div className="flex items-center gap-4 max-w-4xl mx-auto">
            <button onClick={() => router.back()} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 active:scale-95 transition-all backdrop-blur-md shrink-0">
              ←
            </button>
            <div>
              <h1 className="text-2xl md:text-4xl font-black tracking-tight">งานของฉัน 📋</h1>
              <p className="text-[11px] md:text-sm font-bold text-orange-100 opacity-90 mt-1 md:mt-2">จัดการรายการจ้างงานและงานที่รับผิดชอบ</p>
            </div>
          </div>
        </header>

        {/* 🌟 Tab Switcher (สีเปลี่ยนตามแท็บ) */}
        <div className="flex justify-center -mt-6 md:-mt-8 relative z-30 px-5 w-full max-w-4xl mx-auto">
           <div className="bg-white p-1.5 rounded-full shadow-lg border border-gray-100 flex gap-1 w-full max-w-md">
             <button 
               onClick={() => setActiveTab('employer')}
               className={`flex-1 py-3 rounded-full text-[11px] md:text-sm font-black transition-all ${isHired ? `${themeColor} text-white shadow-md ${themeShadow}` : `text-gray-500 ${themeHover}`}`}
             >
               💼 งานที่ฉันจ้าง
             </button>
             <button 
               onClick={() => setActiveTab('freelancer')}
               className={`flex-1 py-3 rounded-full text-[11px] md:text-sm font-black transition-all ${!isHired ? `${themeColor} text-white shadow-md ${themeShadow}` : `text-gray-500 ${themeHover}`}`}
             >
               🛵 งานที่ฉันรับ
             </button>
           </div>
        </div>

        <main className="flex-1 p-4 md:px-10 mt-4 w-full max-w-4xl mx-auto space-y-4">
          
          {loading ? (
            <div className="space-y-3 animate-pulse">
               {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white rounded-3xl border border-gray-100 shadow-sm" />)}
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-sm mt-4">
              <div className="text-5xl mb-3 opacity-50 grayscale">📭</div>
              <h3 className="font-black text-gray-800 text-base">ยังไม่มีรายการงาน</h3>
              <p className="text-[11px] text-gray-400 font-bold mt-1">
                {isHired ? 'ไปโพสต์จ้างงาน หรือหาคนช่วยทำสิคะ' : 'ไปหาโปรเจกต์ใหม่ๆ หรือเสนอราคางานดูสิคะ'}
              </p>
              <Link href="/job-board" className={`mt-5 inline-block ${themeColor} text-white font-black px-6 py-2.5 rounded-full shadow-lg active:scale-95 transition-transform text-xs`}>
                ไปบอร์ดหางาน ➔
              </Link>
            </div>
          ) : (
            jobs.map((job) => {
              const proposals = job.proposals?.filter((p: any) => p.status === 'pending') || [];
              const acceptedProposal = job.proposals?.find((p: any) => p.status === 'accepted') || job.proposals?.[0];

              return (
                <article key={job.id} className={`bg-white rounded-3xl p-4 md:p-5 shadow-sm border-l-4 border-y border-r border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden ${isHired ? 'border-l-[#EE4D2D]' : 'border-l-[#0047FF]'}`}>
                  
                  {/* 🌟 Badge สถานะ (ย่อส่วน) */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[8px] md:text-[9px] font-black px-2 py-1 rounded text-white shadow-sm tracking-widest ${job.job_type === 'onsite' ? 'bg-[#EE4D2D]' : 'bg-[#0047FF]'}`}>
                        {job.job_type === 'onsite' ? '📍 ONSITE' : '💻 ONLINE'}
                      </span>
                      <span className="text-[9px] font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded border border-yellow-100 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></span>
                        {job.status === 'open' ? 'รอคนรับงาน' : job.status === 'in_progress' ? 'กำลังดำเนินการ' : job.status === 'verifying_slip' ? 'รอแอดมินตรวจสลิป' : 'เสร็จสิ้น'}
                      </span>
                    </div>
                    <p className="text-[9px] text-gray-400 font-bold flex items-center gap-1">
                      <span className="text-xs">⏰</span> {formatDate(job.created_at)}
                    </p>
                  </div>

                  {/* 🌟 หัวข้องาน (เล็กลง) */}
                  <h2 className="text-base md:text-lg font-black text-gray-900 mb-3 leading-snug">{job.title}</h2>
                  
                  {/* 🌟 Progress Tracker สไตล์แอปดัง (เล็กลง) */}
                  <div className="relative mb-5 mt-1 px-4 max-w-sm">
                    <div className="absolute left-6 right-6 top-2 h-1 bg-gray-100 rounded-full -z-10"></div>
                    {job.status === 'in_progress' && <div className="absolute left-6 right-1/2 top-2 h-1 bg-[#00C300] rounded-full -z-10"></div>}
                    {job.status === 'completed' && <div className="absolute left-6 right-6 top-2 h-1 bg-[#00C300] rounded-full -z-10"></div>}
                    
                    <div className="flex justify-between">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-5 h-5 rounded-full bg-[#00C300] text-white flex items-center justify-center font-black text-[9px] shadow-sm shadow-green-200">1</div>
                        <span className="text-[8px] font-bold text-[#00C300]">จองงาน</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[9px] shadow-sm ${(job.status === 'in_progress' || job.status === 'completed') ? 'bg-[#0047FF] text-white' : 'bg-gray-200 text-gray-400'}`}>2</div>
                        <span className={`text-[8px] font-bold ${(job.status === 'in_progress' || job.status === 'completed') ? 'text-[#0047FF]' : 'text-gray-400'}`}>ทำ/พักเงิน</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[9px] shadow-sm ${job.status === 'completed' ? 'bg-[#00C300] text-white' : 'bg-gray-200 text-gray-400'}`}>3</div>
                        <span className={`text-[8px] font-bold ${job.status === 'completed' ? 'text-[#00C300]' : 'text-gray-400'}`}>ปล่อยเงิน</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-end border-t border-gray-50 pt-3">
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">งบประมาณ</p>
                      <p className="text-lg font-black text-gray-800">{job.budget ? `฿${job.budget.toLocaleString()}` : 'รอเสนอราคา'}</p>
                    </div>
                    <Link href={`/jobs/${job.id}`} className={`text-[10px] font-bold ${themeText} bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors`}>
                      ดูรายละเอียด
                    </Link>
                  </div>

                  {/* 🌟 ส่วนแสดงข้อเสนอ (โชว์เฉพาะฝั่งคนจ้าง) */}
                  {isHired && job.status === 'open' && proposals.length > 0 && (
                    <div className="mt-3 bg-gray-50 -mx-4 -mb-4 px-4 py-4 border-t border-gray-100 rounded-b-3xl">
                      <div className="flex items-center justify-between mb-2">
                        <p className={`text-[11px] font-black ${themeText} flex items-center gap-1.5`}>
                          <span className={`w-1.5 h-1.5 ${themeColor} rounded-full animate-pulse`}></span>
                          ข้อเสนอใหม่ ({proposals.length})
                        </p>
                      </div>

                      <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x pb-1">
                        {proposals.map((prop: any) => (
                          <div key={prop.id} className={`w-[260px] shrink-0 snap-center bg-white border border-gray-200 rounded-xl p-3 shadow-sm border-b-2 ${isHired ? 'border-b-[#EE4D2D]' : 'border-b-[#0047FF]'}`}>
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-gray-200 overflow-hidden">
                                  {prop.profiles?.avatar_url ? <img src={prop.profiles.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px]">👤</div>}
                                </div>
                                <div>
                                  <p className="text-[11px] font-black text-gray-800 line-clamp-1">{prop.profiles?.full_name}</p>
                                  <p className="text-[9px] font-bold text-yellow-500">⭐ 5.0 (รีวิว 12)</p>
                                </div>
                              </div>
                              <p className="text-[11px] font-black text-[#00C300] bg-green-50 px-1.5 py-0.5 rounded">฿{Number(prop.proposed_price).toLocaleString()}</p>
                            </div>
                            
                            <p className="text-[9px] font-medium text-gray-600 mb-3 bg-gray-50 p-1.5 rounded-lg italic line-clamp-2">
                              "{prop.cover_letter}"
                            </p>
                            
                            <div className="flex gap-1.5">
                              <Link 
                                href={`/chat?job=${job.id}&provider=${prop.freelancer_id}`}
                                className="flex-1 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[9px] font-black hover:bg-gray-200 transition-colors flex items-center justify-center"
                              >
                                💬 คุยรายละเอียด
                              </Link>
                              <button 
                                onClick={() => handleAcceptProposal(job, prop)}
                                disabled={actionLoading === prop.id}
                                className="flex-1 py-1.5 bg-[#00C300] text-white rounded-lg text-[9px] font-black shadow-sm hover:bg-[#00A300] transition-colors"
                              >
                                {actionLoading === prop.id ? 'รอ...' : '✅ จ้างคนนี้'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 🌟 ปุ่มสถานะงานด้านล่างสุด (เล็กลง) */}
                  <div className="flex gap-2 mt-3 border-t border-gray-50 pt-3">
                    
                    {isHired && job.status === 'verifying_slip' && (
                      <>
                        <span className="bg-orange-100 text-orange-600 px-3 py-2 rounded-lg text-[10px] font-black shadow-sm flex items-center gap-1">
                          <span className="animate-spin">⏳</span> รอตรวจสลิป
                        </span>
                        <button onClick={() => handleAdminApprove(job.id)} disabled={actionLoading === job.id} className="bg-orange-50 hover:bg-orange-100 text-orange-700 px-3 py-2 rounded-lg text-[9px] font-black border border-orange-200">
                          จำลองแอดมินอนุมัติ
                        </button>
                      </>
                    )}
                    
                    {isHired && job.status === 'in_progress' && (
                      <span className="bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-[10px] font-black border border-blue-100">⏳ ช่างกำลังทำ...</span>
                    )}

                    {isHired && job.status === 'delivered' && (
                      <button onClick={() => handleCompleteJob(job.id)} disabled={actionLoading === job.id} className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-[10px] font-black shadow-md active:scale-95">
                        {actionLoading === job.id ? '⏳' : '✅ ตรวจรับ & ปล่อยเงิน'}
                      </button>
                    )}

                    {!isHired && job.status === 'verifying_slip' && (
                      <span className="bg-orange-50 text-orange-600 px-3 py-2 rounded-lg text-[10px] font-black border border-orange-100">⏳ รอลูกค้าชำระเงิน</span>
                    )}

                    {!isHired && job.status === 'in_progress' && (
                      <button onClick={() => handleDeliverJob(job.id)} disabled={actionLoading === job.id} className="bg-purple-500 text-white px-4 py-2 rounded-lg text-[10px] font-black shadow-md active:scale-95">
                        {actionLoading === job.id ? '⏳' : '📦 กดส่งมอบงาน'}
                      </button>
                    )}

                    {!isHired && job.status === 'delivered' && (
                      <span className="bg-purple-50 text-purple-600 px-3 py-2 rounded-lg text-[10px] font-black border border-purple-100">⏳ รอลูกค้าตรวจรับ</span>
                    )}

                    {(job.status === 'in_progress' || job.status === 'delivered') && acceptedProposal && (
                      <Link 
                        href={`/chat?job=${job.id}&provider=${acceptedProposal.freelancer_id}`} 
                        className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg text-[10px] font-black active:scale-95"
                      >
                        💬 แชท
                      </Link>
                    )}

                    {job.status === 'completed' && (
                      <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-2 rounded-lg text-[10px] font-black w-full text-center">🎉 งานสำเร็จแล้ว</span>
                    )}
                  </div>

                </article>
              );
            })
          )}
        </main>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}

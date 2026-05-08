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
  
  // 🌟 เพิ่มแท็บ history
  const [activeTab, setActiveTab] = useState<'employer' | 'freelancer' | 'history'>('employer');
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
          // 💼 ดึงงานที่ฉันจ้าง (เฉพาะที่ยังไม่จบ)
          const { data } = await supabase
            .from('jobs')
            .select(`*, proposals:job_proposals(*, profiles(*))`)
            .eq('employer_id', session.user.id)
            .in('status', ['open', 'verifying_slip', 'in_progress', 'delivered'])
            .order('created_at', { ascending: false });
          if (data) setJobs(data);

        } else if (activeTab === 'freelancer') {
          // 🛵 ดึงงานที่ฉันรับ (เฉพาะที่ยังไม่จบ)
          const { data } = await supabase
            .from('job_proposals')
            .select(`*, job:jobs!inner(*)`)
            .eq('freelancer_id', session.user.id)
            .in('job.status', ['open', 'verifying_slip', 'in_progress', 'delivered']);
          
          if (data) {
            const mappedJobs = data.map(p => ({ ...p.job, my_proposal: p }));
            mappedJobs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setJobs(mappedJobs as any);
          }

        } else if (activeTab === 'history') {
          // 🗄️ ดึงประวัติงาน (เสร็จสิ้นหรือยกเลิก) ทั้งที่จ้างและรับทำ
          const { data } = await supabase
            .from('jobs')
            .select(`*, proposals:job_proposals(*, profiles(*))`)
            .or(`employer_id.eq.${session.user.id},worker_id.eq.${session.user.id}`)
            .in('status', ['completed', 'cancelled'])
            .order('updated_at', { ascending: false });
          if (data) setJobs(data);
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

  // 🌟 ตัวแปรช่วยเรื่องสีและสถานะ
  const isHired = activeTab === 'employer';
  const isHistory = activeTab === 'history';
  const themeText = isHired ? 'text-[#EE4D2D]' : 'text-[#0047FF]';

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-24 md:pb-10">
      <div className="w-full lg:max-w-5xl xl:max-w-6xl bg-[#F8FAFC] min-h-screen relative flex flex-col md:shadow-2xl overflow-x-hidden md:border-x border-gray-200/50">
        
        {/* 🟠 Header */}
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

        {/* 🌟 Tab Switcher (เปลี่ยนเป็น 3 ปุ่ม) */}
        <div className="flex justify-center -mt-6 md:-mt-8 relative z-30 px-5 w-full max-w-4xl mx-auto">
           <div className="bg-white p-1.5 rounded-full shadow-lg border border-gray-100 flex gap-1 w-full max-w-lg">
             <button 
               onClick={() => setActiveTab('employer')}
               className={`flex-1 py-3 rounded-full text-[10px] md:text-sm font-black transition-all ${activeTab === 'employer' ? 'bg-[#EE4D2D] text-white shadow-md shadow-orange-200' : 'text-gray-500 hover:bg-orange-50 hover:text-[#EE4D2D]'}`}
             >
               💼 งานที่จ้าง
             </button>
             <button 
               onClick={() => setActiveTab('freelancer')}
               className={`flex-1 py-3 rounded-full text-[10px] md:text-sm font-black transition-all ${activeTab === 'freelancer' ? 'bg-[#0047FF] text-white shadow-md shadow-blue-200' : 'text-gray-500 hover:bg-blue-50 hover:text-[#0047FF]'}`}
             >
               🛵 งานที่รับ
             </button>
             <button 
               onClick={() => setActiveTab('history')}
               className={`flex-1 py-3 rounded-full text-[10px] md:text-sm font-black transition-all ${activeTab === 'history' ? 'bg-gray-600 text-white shadow-md shadow-gray-300' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'}`}
             >
               🗄️ ประวัติ
             </button>
           </div>
        </div>

        <main className="flex-1 p-4 md:p-8 mt-4 w-full max-w-4xl mx-auto">
          {loading ? (
            <div className="flex flex-col gap-4 md:gap-6 animate-pulse">
               {[1, 2, 3].map(i => <div key={i} className="h-48 bg-white rounded-3xl border border-gray-100 shadow-sm" />)}
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-sm mt-4 mx-auto">
              <div className="text-5xl mb-3 opacity-50 grayscale">📭</div>
              <h3 className="font-black text-gray-800 text-base">ไม่มีรายการ</h3>
              <p className="text-[11px] text-gray-400 font-bold mt-1">
                {activeTab === 'employer' ? 'ไปโพสต์จ้างงาน หรือหาคนช่วยทำสิคะ' : activeTab === 'freelancer' ? 'ไปหาโปรเจกต์ใหม่ๆ หรือเสนอราคางานดูสิคะ' : 'ยังไม่มีประวัติการทำงานที่เสร็จสิ้นค่ะ'}
              </p>
              {!isHistory && (
                <Link href="/job-board" className={`mt-5 inline-block ${isHired ? 'bg-[#EE4D2D]' : 'bg-[#0047FF]'} text-white font-black px-6 py-2.5 rounded-full shadow-lg active:scale-95 transition-transform text-xs`}>
                  ไปบอร์ดหางาน ➔
                </Link>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4 md:gap-6">
              {jobs.map((job) => {
                const proposals = job.proposals?.filter((p: any) => p.status === 'pending') || [];
                const acceptedProposal = job.proposals?.find((p: any) => p.status === 'accepted') || job.proposals?.[0];

                return (
                  // 🌟 ปรับสี Background และ Border ให้เป็นสีเทาหมอก ถ้าอยู่ในหน้าประวัติ
                  <article key={job.id} className={`rounded-[2rem] p-5 md:p-6 shadow-sm border-l-4 border-y border-r hover:shadow-md transition-shadow relative overflow-hidden ${isHistory ? 'bg-gray-50 border-gray-200 border-l-gray-400 opacity-95' : 'bg-white border-gray-100 ' + (isHired ? 'border-l-[#EE4D2D]' : 'border-l-[#0047FF]')}`}>
                    
                    {/* Badge & Date */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[8px] md:text-[9px] font-black px-2 py-1 rounded text-white shadow-sm tracking-widest ${isHistory ? 'bg-gray-400' : job.job_type === 'onsite' ? 'bg-[#EE4D2D]' : 'bg-[#0047FF]'}`}>
                          {job.job_type === 'onsite' ? '📍 ONSITE' : '💻 ONLINE'}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-1 rounded border flex items-center gap-1 ${isHistory ? 'text-gray-500 bg-white border-gray-200' : 'text-yellow-600 bg-yellow-50 border-yellow-100'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isHistory ? 'bg-gray-400' : 'bg-yellow-400 animate-pulse'}`}></span>
                          {job.status === 'open' ? 'รอคนรับงาน' : job.status === 'in_progress' ? 'กำลังดำเนินการ' : job.status === 'verifying_slip' ? 'รอแอดมินตรวจสลิป' : job.status === 'completed' ? 'เสร็จสิ้น' : 'ยกเลิก'}
                        </span>
                      </div>
                      <p className="text-[9px] text-gray-400 font-bold flex items-center gap-1">
                        <span className="text-xs">⏰</span> {formatDate(job.created_at)}
                      </p>
                    </div>

                    <h2 className={`text-base md:text-xl font-black mb-2 leading-snug ${isHistory ? 'text-gray-500' : 'text-gray-900'}`}>{job.title}</h2>
                    
                    {/* Progress Tracker */}
                    <div className="relative mb-4 mt-2 px-2 mx-auto w-full">
                      <div className="absolute left-6 right-6 top-2 h-1 bg-gray-100 rounded-full -z-10"></div>
                      {job.status === 'in_progress' && <div className="absolute left-6 right-1/2 top-2 h-1 bg-[#00C300] rounded-full -z-10"></div>}
                      {job.status === 'completed' && <div className="absolute left-6 right-6 top-2 h-1 bg-[#00C300] rounded-full -z-10"></div>}
                      
                      <div className="flex justify-between">
                        <div className="flex flex-col items-center gap-1">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[9px] shadow-sm ${isHistory ? 'bg-gray-400 text-white' : 'bg-[#00C300] text-white shadow-green-200'}`}>1</div>
                          <span className={`text-[9px] font-bold ${isHistory ? 'text-gray-400' : 'text-[#00C300]'}`}>จองงาน</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[9px] shadow-sm ${(job.status === 'in_progress' || job.status === 'completed') ? (isHistory ? 'bg-gray-400 text-white' : 'bg-[#0047FF] text-white') : 'bg-gray-200 text-gray-400'}`}>2</div>
                          <span className={`text-[9px] font-bold ${(job.status === 'in_progress' || job.status === 'completed') ? (isHistory ? 'text-gray-400' : 'text-[#0047FF]') : 'text-gray-400'}`}>ทำ/พักเงิน</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[9px] shadow-sm ${job.status === 'completed' ? (isHistory ? 'bg-gray-400 text-white' : 'bg-[#00C300] text-white') : 'bg-gray-200 text-gray-400'}`}>3</div>
                          <span className={`text-[9px] font-bold ${job.status === 'completed' ? (isHistory ? 'text-gray-400' : 'text-[#00C300]') : 'text-gray-400'}`}>ปล่อยเงิน</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-end border-t border-gray-50 pt-3">
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">งบประมาณ</p>
                        <p className={`text-xl font-black ${isHistory ? 'text-gray-500' : 'text-gray-800'}`}>{job.budget ? `฿${job.budget.toLocaleString()}` : 'รอเสนอราคา'}</p>
                      </div>
                      <Link href={`/jobs/${job.id}`} className={`text-xs font-bold bg-gray-50 border border-gray-100 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors ${isHistory ? 'text-gray-500' : themeText}`}>
                        ดูรายละเอียด
                      </Link>
                    </div>

                    {/* 🌟 Proposals (ซ่อนในหน้าประวัติอัตโนมัติ เพราะเช็ค status === 'open') */}
                    {isHired && job.status === 'open' && proposals.length > 0 && (
                      <div className="mt-4 bg-gray-50 -mx-5 md:-mx-6 -mb-5 md:-mb-6 px-5 md:px-6 py-4 border-t border-gray-100 rounded-b-[2rem]">
                        <div className="flex items-center justify-between mb-3">
                          <p className={`text-[11px] font-black ${themeText} flex items-center gap-1.5`}>
                            <span className={`w-2 h-2 ${isHired ? 'bg-[#EE4D2D]' : 'bg-[#0047FF]'} rounded-full animate-pulse`}></span>
                            ข้อเสนอใหม่ ({proposals.length})
                          </p>
                          <span className="text-[9px] font-bold text-gray-400">ปัดขวาเพื่อดูเพิ่มเติม 👉</span>
                        </div>

                        <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x pb-2">
                          {proposals.map((prop: any) => (
                            <div key={prop.id} className={`w-[260px] md:w-[300px] shrink-0 snap-center bg-white border border-gray-200 rounded-2xl p-4 shadow-sm border-b-2 ${isHired ? 'border-b-[#EE4D2D]' : 'border-b-[#0047FF]'}`}>
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                                    {prop.profiles?.avatar_url ? <img src={prop.profiles.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs">👤</div>}
                                  </div>
                                  <div>
                                    <p className="text-xs font-black text-gray-800 line-clamp-1">{prop.profiles?.full_name}</p>
                                    <p className="text-[9px] font-bold text-yellow-500">⭐ 5.0 (รีวิว 12)</p>
                                  </div>
                                </div>
                                <p className="text-xs font-black text-[#00C300] bg-green-50 px-2 py-1 rounded-lg">฿{Number(prop.proposed_price).toLocaleString()}</p>
                              </div>
                              
                              <p className="text-[10px] font-medium text-gray-600 mb-4 bg-gray-50 p-2 rounded-xl italic line-clamp-2">
                                "{prop.cover_letter}"
                              </p>
                              
                              <div className="flex gap-2">
                                <Link 
                                  href={`/chat/${job.id}`}
                                  className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black hover:bg-gray-200 transition-colors flex items-center justify-center"
                                >
                                  💬 คุยรายละเอียด
                                </Link>
                                <button 
                                  onClick={() => handleAcceptProposal(job, prop)}
                                  disabled={actionLoading === prop.id}
                                  className="flex-1 py-2 bg-[#00C300] text-white rounded-xl text-[10px] font-black shadow-sm hover:bg-[#00A300] transition-colors"
                                >
                                  {actionLoading === prop.id ? 'รอ...' : '✅ จ้างคนนี้'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 🌟 ปุ่มสถานะงาน */}
                    <div className="flex gap-2 mt-4 border-t border-gray-50 pt-3">
                      {isHired && job.status === 'verifying_slip' && (
                        <>
                          <span className="bg-orange-100 text-orange-600 px-4 py-2.5 rounded-xl text-[10px] font-black shadow-sm flex items-center gap-1">
                            <span className="animate-spin">⏳</span> รอตรวจสลิป
                          </span>
                          <button onClick={() => handleAdminApprove(job.id)} disabled={actionLoading === job.id} className="bg-orange-50 hover:bg-orange-100 text-orange-700 px-4 py-2.5 rounded-xl text-[10px] font-black border border-orange-200">
                            จำลองแอดมินอนุมัติ
                          </button>
                        </>
                      )}
                      
                      {isHired && job.status === 'in_progress' && (
                        <span className="bg-blue-50 text-blue-600 px-4 py-2.5 rounded-xl text-[11px] font-black border border-blue-100 w-full text-center">⏳ ช่างกำลังดำเนินงาน...</span>
                      )}

                      {isHired && job.status === 'delivered' && (
                        <button onClick={() => handleCompleteJob(job.id)} disabled={actionLoading === job.id} className="bg-emerald-500 text-white px-4 py-3 rounded-xl text-[11px] font-black shadow-md active:scale-95 w-full">
                          {actionLoading === job.id ? '⏳' : '✅ ตรวจรับงาน & ปล่อยเงินให้ช่าง'}
                        </button>
                      )}

                      {!isHired && !isHistory && job.status === 'verifying_slip' && (
                        <span className="bg-orange-50 text-orange-600 px-4 py-2.5 rounded-xl text-[11px] font-black border border-orange-100 w-full text-center">⏳ รอลูกค้าชำระเงินเข้าสู่ระบบ</span>
                      )}

                      {!isHired && !isHistory && job.status === 'in_progress' && (
                        <button onClick={() => handleDeliverJob(job.id)} disabled={actionLoading === job.id} className="bg-purple-500 text-white px-4 py-3 rounded-xl text-[11px] font-black shadow-md active:scale-95 w-full">
                          {actionLoading === job.id ? '⏳' : '📦 กดส่งมอบงานให้ลูกค้า'}
                        </button>
                      )}

                      {!isHired && !isHistory && job.status === 'delivered' && (
                        <span className="bg-purple-50 text-purple-600 px-4 py-2.5 rounded-xl text-[11px] font-black border border-purple-100 w-full text-center">⏳ รอลูกค้าตรวจรับงาน</span>
                      )}

                      {(job.status === 'in_progress' || job.status === 'delivered') && acceptedProposal && (
                        <Link 
                          href={`/chat/${job.id}`} 
                          className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2.5 rounded-xl text-[11px] font-black active:scale-95 shrink-0 flex items-center justify-center"
                        >
                          💬 แชท
                        </Link>
                      )}

                      {job.status === 'completed' && (
                        <span className={`${isHistory ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-emerald-50 text-emerald-600 border-emerald-100'} px-4 py-3 rounded-xl text-[11px] font-black w-full text-center`}>
                          🎉 งานสำเร็จแล้ว
                        </span>
                      )}
                    </div>

                  </article>
                );
              })}
            </div>
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

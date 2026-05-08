'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const jobId = params.id;

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [job, setJob] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // 🌟 State สำหรับฟอร์มเสนอราคา
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposedPrice, setProposedPrice] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [durationDays, setDurationDays] = useState('1'); // ระยะเวลาทำงาน (วัน)
  const [portfolioUrl, setPortfolioUrl] = useState(''); // ลิงก์รูปผลงาน / Jobs-Card
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchJobDetail = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (user) setCurrentUser(user);

      try {
        const { data: jobData, error: jobError } = await supabase
          .from('jobs')
          .select(`
            *,
            employer:profiles!employer_id(full_name, avatar_url)
          `)
          .eq('id', jobId)
          .single();
        
        if (jobError) throw jobError;

        let proposalsData = [];
        if (user?.id === jobData.employer_id) {
          // ดึงข้อมูลข้อเสนอทั้งหมดสำหรับผู้จ้าง
          const { data } = await supabase.from('job_proposals').select('*, profiles(*)').eq('job_id', jobId);
          proposalsData = data || [];
        } else {
          // ดึงแค่ ID ไปเช็คว่าตัวเองเคยเสนอหรือยัง
          const { data } = await supabase.from('job_proposals').select('freelancer_id').eq('job_id', jobId);
          proposalsData = data || [];
        }

        if (jobData) {
          setJob({ ...jobData, proposals: proposalsData });
        }

      } catch (error) {
        console.error("Error fetching job details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetail();
  }, [jobId, supabase]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getDaysLeft = (deadline?: string) => {
    if (!deadline) return 'ไม่ระบุ';
    const diffDays = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return diffDays < 0 ? 'หมดอายุแล้ว' : diffDays === 0 ? 'วันนี้' : `อีก ${diffDays} วัน`;
  };

  // 🌟 ฟังก์ชันส่งข้อเสนอ
  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return router.push(`/auth/login?next=/job-board/${jobId}`);
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('job_proposals').insert({
        job_id: jobId,
        freelancer_id: currentUser.id,
        proposed_price: Number(proposedPrice),
        cover_letter: coverLetter,
        duration_days: Number(durationDays),
        portfolio_url: portfolioUrl || null,
        status: 'pending'
      });

      if (error) throw error;
      alert('🎉 ส่งข้อเสนอสำเร็จ! รอลูกค้าติดต่อกลับนะคะ');
      window.location.reload(); 
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptProposal = async (proposal: any) => {
    if (!confirm(`ยืนยันเลือกล็อกคิว ${proposal.profiles?.full_name || 'ช่างท่านนี้'} ใช่ไหมคะ?`)) return;
    setActionLoading(proposal.id);

    try {
      const { error } = await supabase.rpc('accept_proposal', {
        p_job_id: job.id,
        p_proposal_id: proposal.id,
        p_worker_id: proposal.freelancer_id
      });
      if (error) throw error;
      alert('เลือกล็อกคิวสำเร็จ! ระบบจะพาท่านไปหน้าชำระเงินค่ะ 🚀');
      router.push(`/checkout/${job.id}`); 
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
      setActionLoading(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center font-sans">
      <div className="w-10 h-10 border-4 border-[#0047FF] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!job) return (
    <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center font-sans">
      <p className="text-gray-500 font-bold">ไม่พบข้อมูลงานนี้ค่ะ 😢</p>
    </div>
  );

  const isEmployer = currentUser?.id === job.employer_id;
  const hasApplied = job.proposals?.some((p: any) => p.freelancer_id === currentUser?.id);
  const isJobOpen = job.status === 'open';

  const isAnonymous = job.is_anonymous; 
  const employerName = isAnonymous ? 'ผู้ว่าจ้างไม่ระบุตัวตน' : (job.employer?.full_name || 'ลูกค้าไม่ระบุชื่อ');

  const empTypeMap: any = { freelance: 'ฟรีแลนซ์ (รายชิ้น)', contract: 'สัญญาจ้าง', parttime: 'พาร์ทไทม์', fulltime: 'งานประจำ' };
  const catMap: any = { design: 'งานออกแบบ', tech: 'เทคโนโลยี', marketing: 'การตลาด', repair: 'ช่างซ่อม', lifestyle: 'ไลฟ์สไตล์' };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-24 md:pb-10">
      <div className="w-full lg:max-w-5xl xl:max-w-6xl bg-[#F8FAFC] min-h-screen relative flex flex-col md:shadow-2xl overflow-x-hidden md:border-x border-gray-200/50">
        
        {/* 🟠 Header */}
        <header className="bg-white px-6 pt-6 pb-4 border-b border-gray-200 sticky top-0 z-20 flex items-center gap-4">
          <button onClick={() => router.back()} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 active:scale-95 transition-all text-gray-600 font-bold shrink-0">
            ←
          </button>
          <div className="flex-1">
            <span className="font-black text-gray-800 text-sm">รายละเอียดงาน</span>
          </div>
        </header>

        {/* 🌟 ปรับโครงสร้างหลัก: ให้รองรับเนื้อหาแบบเต็มความกว้าง */}
        <main className="flex-1 p-5 md:p-8 max-w-5xl mx-auto w-full space-y-8">
          
          {/* ================= SECTION 1: รายละเอียดงาน ================= */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            
            {/* ฝั่งซ้าย: Brief */}
            <div className="flex-1 space-y-6">
              <div>
                <div className="flex gap-2 mb-3">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded text-white tracking-widest shadow-sm ${job.job_type === 'onsite' ? 'bg-[#EE4D2D]' : 'bg-[#0047FF]'}`}>
                    {job.job_type === 'onsite' ? '📍 ONSITE' : '💻 ONLINE'}
                  </span>
                  <span className="text-[10px] font-bold text-yellow-600 bg-yellow-50 px-2.5 py-1 rounded border border-yellow-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></span>
                    {job.status === 'open' ? 'รอคนรับงาน' : job.status === 'in_progress' ? 'กำลังดำเนินการ' : 'เสร็จสิ้น'}
                  </span>
                </div>

                <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight mb-4">{job.title}</h1>
                
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100 w-fit pr-6">
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {isAnonymous ? <span className="text-xl">🕵️</span> : job.employer?.avatar_url ? <img src={job.employer.avatar_url} className="w-full h-full object-cover" /> : <span className="text-sm">👤</span>}
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-500 mb-0.5">ผู้ว่าจ้าง</p>
                    <p className="text-sm font-bold text-gray-800">{employerName}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                <h3 className="text-base font-black text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-blue-500">📝</span> บรีฟงาน / รายละเอียด
                </h3>
                <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed font-medium">
                  {job.description || 'ไม่ได้ระบุรายละเอียดเพิ่มเติม'}
                </div>
              </div>
            </div>

            {/* ฝั่งขวา: Sidebar */}
            <div className="w-full md:w-[320px] shrink-0 space-y-4">
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col gap-5">
                <div>
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-1">งบประมาณตั้งต้น</p>
                  <p className="text-3xl font-black text-[#00C300]">{job.budget.toLocaleString()} <span className="text-base text-gray-500">บาท</span></p>
                </div>

                <div className="h-px bg-gray-100"></div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">หมวดหมู่</span>
                    <span className="font-bold text-gray-800">{catMap[job.category || 'lifestyle'] || 'ทั่วไป'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">ลักษณะการจ้าง</span>
                    <span className="font-bold text-gray-800">{empTypeMap[job.employment_type || 'freelance']}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">ลงประกาศเมื่อ</span>
                    <span className="font-bold text-gray-800">{formatDate(job.created_at)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">วันหมดอายุ</span>
                    <span className="font-bold text-orange-600">{job.deadline ? `${formatDate(job.deadline)} ( ${getDaysLeft(job.deadline)} )` : '-'}</span>
                  </div>
                </div>

                <div className="h-px bg-gray-100"></div>

                {isEmployer ? (
                  <div className="bg-blue-50 text-blue-700 p-4 rounded-2xl text-center text-sm font-black border border-blue-100">
                    💼 นี่คืองานที่คุณโพสต์เอง<br/><span className="text-xs font-bold text-blue-500">เลื่อนดูผู้เสนอราคาที่ด้านล่างได้เลยค่ะ</span>
                  </div>
                ) : hasApplied ? (
                  <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl text-center text-sm font-black border border-emerald-100">
                    ✅ คุณเสนอราคางานนี้ไปแล้ว<br/><span className="text-xs font-bold text-emerald-500">โปรดรอลูกค้าติดต่อกลับ</span>
                  </div>
                ) : !isJobOpen ? (
                  <div className="bg-gray-100 text-gray-500 p-4 rounded-2xl text-center text-sm font-black border border-gray-200">
                    🔒 งานนี้ปิดรับคนแล้ว
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowProposalForm(!showProposalForm)}
                    className="w-full bg-[#0047FF] hover:bg-blue-700 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-all"
                  >
                    {showProposalForm ? 'ซ่อนฟอร์ม' : '🚀 เสนอราคาและรับงาน'}
                  </button>
                )}
              </div>

              {/* ฟอร์มกรอกข้อเสนอ */}
              {showProposalForm && !hasApplied && !isEmployer && isJobOpen && (
                <form onSubmit={handleSubmitProposal} className="bg-white p-6 rounded-[2rem] shadow-xl border border-[#0047FF] animate-in slide-in-from-top-4 space-y-4">
                  <h3 className="text-sm font-black text-[#0047FF]">ฟอร์มยื่นข้อเสนอ</h3>
                  
                  <div>
                    <label className="block text-xs font-black text-gray-700 mb-2">ราคาที่คุณเสนอ (บาท)</label>
                    <input type="number" required min="1" value={proposedPrice} onChange={(e) => setProposedPrice(e.target.value)} placeholder={`แนะนำประมาณ ${job.budget}`} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-black text-[#00C300] focus:bg-white focus:ring-2 focus:ring-[#0047FF] outline-none transition-all" />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-700 mb-2">ระยะเวลาทำงานที่คาดว่าจะเสร็จสิ้น (วัน)</label>
                    <input type="number" required min="1" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} placeholder="เช่น 1, 3, 7" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-[#0047FF] outline-none transition-all" />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-700 mb-2">ลิงก์แนบรูปผลงาน / Jobs-Card (ตัวเลือก)</label>
                    <input type="url" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:ring-2 focus:ring-[#0047FF] outline-none transition-all" />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-700 mb-2">ข้อความแนะนำตัว</label>
                    <textarea required rows={3} value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} placeholder="สวัสดีครับ ผมมีประสบการณ์ตรงด้านนี้..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:ring-2 focus:ring-[#0047FF] outline-none transition-all resize-none" />
                  </div>

                  <button type="submit" disabled={isSubmitting} className="w-full bg-[#00C300] hover:bg-[#00A300] text-white font-black py-3 rounded-xl shadow-md active:scale-95 transition-all disabled:opacity-50 mt-2">
                    {isSubmitting ? 'กำลังส่ง...' : '✅ กดยืนยันส่งข้อเสนอ'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* ================= SECTION 2: รายการผู้นำเสนองาน (เต็มความกว้าง) ================= */}
          {isEmployer && (
            <section className="w-full pt-8 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xl">🎯</span>
                <h2 className="text-lg md:text-xl font-black text-gray-900">
                  มีผู้นำเสนองานแล้ว {job.proposals?.length || 0} คน
                </h2>
              </div>
              
              {job.proposals?.length === 0 ? (
                <div className="bg-white rounded-[2rem] p-10 text-center border border-gray-100 shadow-sm">
                  <div className="text-5xl mb-3 opacity-30 grayscale">📭</div>
                  <p className="text-base font-black text-gray-800">ยังไม่มีผู้รับจ้างเสนอราคา</p>
                  <p className="text-xs font-bold text-gray-400 mt-1">โปรดรอสักครู่ หรือแชร์ลิงก์งานนี้ให้ช่างที่คุณรู้จักนะคะ</p>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {job.proposals?.map((prop: any) => (
                    <article key={prop.id} className="bg-white border border-gray-200 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
                      
                      {/* ข้อมูลช่าง และ ราคา */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden border border-gray-100">
                            {prop.profiles?.avatar_url ? <img src={prop.profiles.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg">👤</div>}
                          </div>
                          <div>
                            <p className="text-base font-black text-gray-900">{prop.profiles?.full_name}</p>
                            <p className="text-xs font-bold text-yellow-500 mt-0.5">⭐ 5.0 (รีวิว 12)</p>
                          </div>
                        </div>
                        <div className="text-right bg-green-50 px-3 py-1.5 rounded-xl border border-green-100">
                          <p className="text-xl font-black text-[#00C300] leading-none">{Number(prop.proposed_price).toLocaleString()}</p>
                          <p className="text-[10px] text-green-600 font-bold uppercase mt-0.5">บาท</p>
                        </div>
                      </div>
                      
                      {/* Cover Letter */}
                      <p className="text-sm font-medium text-gray-600 bg-gray-50 p-4 rounded-xl italic">
                        "{prop.cover_letter}"
                      </p>

                      {/* ภาพผลงานที่แนบมา */}
                      {prop.portfolio_url && (
                        <div className="mt-2">
                          <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">ตัวอย่างผลงาน / Jobs-Card ที่แนบมา</p>
                          <div className="flex gap-2">
                            <a href={prop.portfolio_url} target="_blank" rel="noreferrer" className="block w-24 h-24 rounded-xl border border-gray-200 overflow-hidden hover:opacity-80 transition-opacity">
                              <img src={prop.portfolio_url} alt="Portfolio" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {/* Action Footer */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-4 border-t border-gray-50 gap-4 mt-2">
                        <div>
                          <span className="text-xs font-bold text-gray-500">ระยะเวลาที่คาดว่าจะเสร็จสิ้น: </span>
                          <span className="text-sm font-black text-gray-800">{prop.duration_days ? `${prop.duration_days} วัน` : 'ไม่ระบุ'}</span>
                        </div>
                        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                          <Link 
                            href={`/profile/${prop.freelancer_id}`} 
                            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl text-xs font-black hover:bg-gray-200 transition-colors text-center"
                          >
                            ดู Jobs-Card ผู้รับจ้าง
                          </Link>
                          <button 
                            onClick={() => handleAcceptProposal(prop)}
                            disabled={actionLoading === prop.id}
                            className="px-6 py-3 bg-[#00C300] text-white rounded-xl text-xs font-black shadow-md hover:bg-[#00A300] transition-colors"
                          >
                            {actionLoading === prop.id ? 'รอสักครู่...' : '✅ เลือกจ้างคนนี้'}
                          </button>
                        </div>
                      </div>

                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

        </main>
      </div>
    </div>
  );
}

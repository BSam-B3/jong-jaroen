'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const jobId = params.id;

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [job, setJob] = useState<any>(null);
  
  // 🌟 State สำหรับฟอร์มเสนอราคา
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposedPrice, setProposedPrice] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchJobDetail = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) setCurrentUser(session.user);

      try {
        // ดึงข้อมูลงาน พร้อมข้อมูลลูกค้า และเช็คว่าเราเคยเสนอราคาไปหรือยัง
        const { data: jobData } = await supabase
          .from('jobs')
          .select(`
            *,
            employer:profiles!employer_id(full_name, avatar_url),
            proposals:job_proposals(freelancer_id)
          `)
          .eq('id', jobId)
          .single();
        
        if (jobData) setJob(jobData);
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

  // 🌟 ฟังก์ชันส่งข้อเสนอ (Proposal)
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
        status: 'pending'
      });

      if (error) throw error;
      
      alert('🎉 ส่งข้อเสนอสำเร็จ! รอลูกค้าติดต่อกลับนะคะ');
      window.location.reload(); // รีเฟรชหน้าเพื่อโชว์ว่าส่งแล้ว
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setIsSubmitting(false);
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

  // เช็คสถานะต่างๆ เพื่อแสดงปุ่มให้ถูกต้อง
  const isEmployer = currentUser?.id === job.employer_id;
  const hasApplied = job.proposals?.some((p: any) => p.freelancer_id === currentUser?.id);
  const isJobOpen = job.status === 'open';

  // แปลงคำศัพท์
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
            <span className={`text-[10px] font-black px-2.5 py-1 rounded text-white tracking-widest ${job.job_type === 'onsite' ? 'bg-[#EE4D2D]' : 'bg-[#0047FF]'}`}>
              {job.job_type === 'onsite' ? '📍 ONSITE' : '💻 ONLINE'}
            </span>
          </div>
        </header>

        <main className="flex-1 p-5 md:p-8 max-w-4xl mx-auto w-full flex flex-col md:flex-row gap-6 md:gap-8">
          
          {/* 🌟 ฝั่งซ้าย: รายละเอียดงาน (Brief) */}
          <div className="flex-1 space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight mb-4">{job.title}</h1>
              
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0">
                  {job.employer?.avatar_url ? <img src={job.employer.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-sm">👤</div>}
                </div>
                <div>
                  <p className="text-xs font-black text-gray-500 mb-0.5">ผู้ว่าจ้าง</p>
                  <p className="text-sm font-bold text-gray-800">{job.employer?.full_name || 'ลูกค้าไม่ระบุชื่อ'}</p>
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

          {/* 🌟 ฝั่งขวา: สรุปข้อมูล & Action (Sidebar สไตล์ Fastwork) */}
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

              {/* 🌟 ปุ่ม Action ตาม Role */}
              {isEmployer ? (
                <div className="bg-blue-50 text-blue-700 p-4 rounded-2xl text-center text-sm font-black border border-blue-100">
                  💼 นี่คืองานที่คุณโพสต์เอง<br/><span className="text-xs font-bold text-blue-500">ไปที่เมนู "งานของฉัน" เพื่อดูผู้เสนอราคา</span>
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

            {/* 🌟 ฟอร์มกรอกข้อเสนอ (เปิด/ปิดได้) */}
            {showProposalForm && !hasApplied && !isEmployer && isJobOpen && (
              <form onSubmit={handleSubmitProposal} className="bg-white p-6 rounded-[2rem] shadow-xl border border-[#0047FF] animate-in slide-in-from-top-4">
                <h3 className="text-sm font-black text-[#0047FF] mb-4">ฟอร์มยื่นข้อเสนอ</h3>
                
                <div className="mb-4">
                  <label className="block text-xs font-black text-gray-700 mb-2">ราคาที่คุณเสนอ (บาท)</label>
                  <input 
                    type="number" required min="1"
                    value={proposedPrice} onChange={(e) => setProposedPrice(e.target.value)}
                    placeholder={`แนะนำประมาณ ${job.budget}`} 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-black text-[#00C300] focus:bg-white focus:ring-2 focus:ring-[#0047FF] outline-none transition-all"
                  />
                </div>

                <div className="mb-5">
                  <label className="block text-xs font-black text-gray-700 mb-2">ข้อความแนะนำตัว / ทำไมถึงเหมาะกับงานนี้</label>
                  <textarea 
                    required rows={3}
                    value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="สวัสดีครับ ผมมีประสบการณ์ตรงด้านนี้..." 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:ring-2 focus:ring-[#0047FF] outline-none transition-all resize-none"
                  />
                </div>

                <button 
                  type="submit" disabled={isSubmitting}
                  className="w-full bg-[#00C300] hover:bg-[#00A300] text-white font-black py-3 rounded-xl shadow-md active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'กำลังส่ง...' : '✅ กดยืนยันส่งข้อเสนอ'}
                </button>
              </form>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

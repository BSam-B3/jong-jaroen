'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

const JOB_CATEGORIES = [
  { key: 'all', label: 'ทั้งหมด', icon: '📋' },
  { key: 'online', label: 'งานออนไลน์', icon: '💻' },
  { key: 'graphic', label: 'กราฟิก/วิดีโอ', icon: '🎨' },
  { key: 'technician', label: 'ช่างซ่อม/ติดตั้ง', icon: '🛠️' },
  { key: 'other', label: 'บริการอื่นๆ', icon: '✨' },
];

export default function JobBoardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [displayLimit, setDisplayLimit] = useState(10); 

  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postDescription, setPostDescription] = useState('');
  const [postBudget, setPostBudget] = useState('');
  const [postCategory, setPostCategory] = useState('graphic');
  const [postJobType, setPostJobType] = useState<'online' | 'onsite'>('online');

  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);
  const [proposalText, setProposalText] = useState('');
  const [proposalPrice, setProposalPrice] = useState('');
  const [proposalDuration, setProposalDuration] = useState('');

  // 🌟 ฟังก์ชันดึงข้อมูล (ซ่อม Syntax .not และการซ่อนงานตัวเอง)
  const fetchFreelanceJobs = useCallback(async (uid?: string) => {
    setIsLoading(true);
    let query = supabase.from('jobs')
      .select(`*, employer:profiles!employer_id (first_name, full_name, avatar_url)`)
      .eq('status', 'open')
      .not('job_type', 'in', ['ride', 'buy', 'deliver']) // แก้เป็น Array ถูกต้องตามมาตรฐาน
      .order('created_at', { ascending: false })
      .limit(displayLimit);

    if (activeCategory !== 'all') {
      query = query.eq('category', activeCategory);
    }
    
    if (uid) {
      query = query.neq('employer_id', uid);
    }

    const { data, error } = await query;
    if (!error && data) setJobs(data);
    setIsLoading(false);
  }, [supabase, activeCategory, displayLimit]);

  useEffect(() => {
    const initData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (uid) setCurrentUser(session.user);
      fetchFreelanceJobs(uid);
    };
    initData();

    const channel = supabase.channel('public-jobs-freelance')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs', filter: "status=eq.open" }, async () => {
        const { data: { session } } = await supabase.auth.getSession();
        fetchFreelanceJobs(session?.user?.id);
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchFreelanceJobs, supabase]);

  const handleOpenProposalModal = (job: any) => {
    if (!currentUser) {
      alert('กรุณาเข้าสู่ระบบก่อนยื่นโปรไฟล์ค่ะ');
      router.push('/auth/login');
      return;
    }
    setSelectedJob(job);
    setProposalPrice(job.budget ? job.budget.toString() : '');
    setIsProposalModalOpen(true);
  };

  const submitProposalData = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProposal(true);
    const { error } = await supabase.from('job_proposals').insert({
      job_id: selectedJob.id,
      worker_id: currentUser.id,
      cover_letter: proposalText,
      proposed_price: proposalPrice ? Number(proposalPrice) : null,
      duration_days: proposalDuration ? Number(proposalDuration) : null,
      status: 'pending'
    });

    if (!error) {
      alert('ส่งโปรไฟล์สำเร็จ! 🚀');
      setIsProposalModalOpen(false);
      setProposalText(''); setProposalPrice(''); setProposalDuration('');
    } else {
      alert('เกิดข้อผิดพลาด หรือคุณอาจจะเคยยื่นเสนอไปแล้วค่ะ');
    }
    setIsSubmittingProposal(false);
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return router.push('/auth/login');
    setIsSubmitting(true);
    const { error } = await supabase.from('jobs').insert({
      employer_id: currentUser.id, title: postTitle, description: postDescription,
      budget: postBudget ? Number(postBudget) : null, category: postCategory,
      job_type: postJobType, status: 'open'
    });
    if (!error) {
      alert('ประกาศงานสำเร็จ! 🚀');
      setIsPostModalOpen(false);
      setPostTitle(''); setPostDescription(''); setPostBudget('');
      fetchFreelanceJobs(currentUser.id); 
    }
    setIsSubmitting(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex justify-center font-sans pb-24">
      <div className="w-full max-w-3xl bg-[#F8FAFC] min-h-screen relative flex flex-col shadow-2xl border-x border-gray-100">
        
        <header className="px-6 pt-12 pb-6 bg-gradient-to-br from-[#0047FF] to-[#0082FA] text-white shadow-lg rounded-b-[2.5rem] relative z-20">
          <div className="flex justify-between items-start mb-4">
            <div>
              <Link href="/" className="text-white/80 font-black text-xs mb-2 inline-block">← กลับหน้าหลัก</Link>
              <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">💼 ศูนย์รวมงานอิสระ</h1>
              <p className="text-xs text-blue-100 font-bold mt-1 opacity-90">จ้างงานออนไลน์และหาช่างฝีมือทั่วไทย</p>
            </div>
            <button onClick={() => setIsPostModalOpen(true)} className="bg-white text-[#0047FF] px-4 py-2.5 rounded-2xl text-[11px] font-black shadow-md active:scale-95 transition-transform hover:bg-blue-50">+ จ้างงาน</button>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 pt-2 -mx-2 px-2">
            {JOB_CATEGORIES.map((cat) => (
              <button key={cat.key} onClick={() => { setActiveCategory(cat.key); setDisplayLimit(10); }} className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-black transition-all shadow-sm border ${activeCategory === cat.key ? 'bg-white text-[#0047FF] border-white' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}>{cat.icon} {cat.label}</button>
            ))}
          </div>
        </header>

        <main className="p-4 space-y-4 mt-2">
          {isLoading && jobs.length === 0 ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map(i => <div key={i} className="h-48 bg-white rounded-[1.5rem]" />)}
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-12 text-center border border-gray-100 shadow-sm mt-4">
              <div className="text-6xl mb-4 opacity-50 grayscale">📭</div>
              <h3 className="font-black text-gray-800 text-lg">ยังไม่มีงานในหมวดหมู่นี้</h3>
              <p className="text-xs text-gray-400 font-bold mt-2">เปลี่ยนหมวดหมู่ หรือลองสร้างงานใหม่ดูนะคะ</p>
            </div>
          ) : (
            <>
              {jobs.map((job) => (
                <article key={job.id} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100 relative overflow-hidden group transition-colors">
                  <div className="absolute top-0 right-0 bg-[#0047FF] text-white text-[9px] font-black px-3 py-1.5 rounded-bl-xl">{job.job_type === 'online' ? '💻 ทำออนไลน์' : '📍 ลงพื้นที่'}</div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full overflow-hidden border border-gray-200 shrink-0">
                      {job.employer?.avatar_url ? <img src={job.employer.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg">👤</div>}
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-800">{job.employer?.full_name || job.employer?.first_name || 'ผู้ใช้ไม่ระบุชื่อ'}</p>
                      <p className="text-[9px] text-gray-400 font-bold">โพสต์เมื่อ {formatDate(job.created_at)}</p>
                    </div>
                  </div>
                  <h2 className="text-base font-black text-gray-900 leading-snug mb-2 pr-16">{job.title}</h2>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed line-clamp-3 mb-4 whitespace-pre-line">{job.description}</p>
                  <div className="flex justify-between items-end pt-4 border-t border-gray-50">
                    <div>
                      <p className="text-[9px] text-gray-400 font-black uppercase mb-1">งบประมาณ</p>
                      <p className="text-xl font-black text-[#0047FF]">{job.budget ? `${job.budget.toLocaleString()} ฿` : 'เสนอราคา'}</p>
                    </div>
                    <button onClick={() => handleOpenProposalModal(job)} className="bg-[#0047FF] text-white px-5 py-3 rounded-xl text-xs font-black shadow-md active:scale-95 transition-all">ยื่นโปรไฟล์เสนอตัว 📝</button>
                  </div>
                </article>
              ))}
              {jobs.length >= displayLimit && (
                <button onClick={() => setDisplayLimit(prev => prev + 10)} className="w-full bg-white border border-blue-100 text-[#0047FF] font-black py-4 rounded-[1.5rem] text-xs mt-2 shadow-sm active:scale-95">โหลดรายการเพิ่มเติม...</button>
              )}
            </>
          )}
        </main>

        {/* Modal โพสต์งาน & ยื่นเสนอตัว (ซ่อนไว้เพื่อความสั้น) */}
        {isPostModalOpen && ( /* ... ก๊อปปี้ส่วน Modal จากโค้ดเดิมมาวางตรงนี้ ... */ null )}
        {isProposalModalOpen && selectedJob && ( /* ... ก๊อปปี้ส่วน Modal จากโค้ดเดิมมาวางตรงนี้ ... */ null )}

      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

const PAGE_SIZE = 10;
const EXCLUDED_TYPES = ['ride', 'buy', 'deliver'] as const;

const JOB_CATEGORIES = [
  { key: 'all', label: 'ทั้งหมด', icon: '📋' },
  { key: 'online', label: 'งานออนไลน์', icon: '💻' },
  { key: 'graphic', label: 'กราฟิก/วิดีโอ', icon: '🎨' },
  { key: 'technician', label: 'ช่างซ่อม/ติดตั้ง', icon: '🛠️' },
  { key: 'other', label: 'บริการอื่นๆ', icon: '✨' },
];

export default function JobBoardPage() {
  const router = useRouter();
  // 🌟 ใช้ useMemo เพื่อไม่ให้ Supabase Client ถูกสร้างใหม่ทุกครั้งที่ State เปลี่ยน (แก้ปัญหา Memory Leak)
  const supabase = useMemo(() => createClient(), []);

  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState('all');

  // 🌟 ใช้ Ref เก็บค่าเพื่อใช้ในฟังก์ชันต่างๆ โดยไม่ต้องทำลายและสร้างฟังก์ชันใหม่
  const cursorRef = useRef<string | null>(null);
  const uidRef = useRef<string | null>(null);
  const categoryRef = useRef(activeCategory);
  categoryRef.current = activeCategory;

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

  // 🌟 ฟังก์ชันสร้าง Query ข้อมูลแบบ Keyset Pagination (เร็วและประหยัดเน็ตกว่า Limit แบบเดิม)
  const buildQuery = useCallback((opts: { cursor: string | null; uid: string | null; category: string }) => {
    let q = supabase.from('jobs')
      .select(`*, employer:profiles!employer_id (first_name, full_name, avatar_url)`)
      .eq('status', 'open')
      .not('job_type', 'in', `(${EXCLUDED_TYPES.join(',')})`)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (opts.category !== 'all') q = q.eq('category', opts.category);
    if (opts.uid) q = q.neq('employer_id', opts.uid);
    if (opts.cursor) q = q.lt('created_at', opts.cursor); // ดึงเฉพาะอันที่เก่ากว่าอันสุดท้าย

    return q;
  }, [supabase]);

  // ดึงข้อมูล 10 รายการแรก
  const loadFirstPage = useCallback(async () => {
    setIsLoading(true);
    cursorRef.current = null;
    const { data } = await buildQuery({ cursor: null, uid: uidRef.current, category: categoryRef.current });
    const rows = data ?? [];
    setJobs(rows);
    setHasMore(rows.length === PAGE_SIZE);
    if (rows.length) cursorRef.current = rows[rows.length - 1].created_at;
    setIsLoading(false);
  }, [buildQuery]);

  // ดึงข้อมูลเพิ่มเมื่อกดปุ่ม (ไม่ดึงของเก่าซ้ำ)
  const loadMore = useCallback(async () => {
    if (!hasMore || isFetchingMore) return;
    setIsFetchingMore(true);
    const { data } = await buildQuery({ cursor: cursorRef.current, uid: uidRef.current, category: categoryRef.current });
    const rows = data ?? [];
    
    setJobs(prev => {
      const seen = new Set(prev.map((j: any) => j.id));
      return [...prev, ...rows.filter((r: any) => !seen.has(r.id))]; // ป้องกันข้อมูลซ้ำ
    });
    
    setHasMore(rows.length === PAGE_SIZE);
    if (rows.length) cursorRef.current = rows[rows.length - 1].created_at;
    setIsFetchingMore(false);
  }, [buildQuery, hasMore, isFetchingMore]);

  // รีเซ็ตข้อมูลเมื่อเปลี่ยนหมวดหมู่
  useEffect(() => { loadFirstPage(); }, [activeCategory, loadFirstPage]);

  // 🌟 ฟังก์ชันดึง Real-time ที่ถูกปรับแต่งโดย C (เชื่อมต่อครั้งเดียวอยู่ได้ตลอดชีพ)
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      uidRef.current = session?.user?.id ?? null;
      if (session?.user) setCurrentUser(session.user);
      loadFirstPage();
    })();

    const channel = supabase.channel('public-jobs-freelance')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'jobs', filter: 'status=eq.open' },
        (payload: any) => {
          const row: any = payload.new ?? payload.old;
          if (!row) return;
          
          // คัดกรองข้อมูลฝั่งหน้าบ้านแทนหลังบ้าน เพื่อแก้ข้อจำกัดของ Supabase
          if (EXCLUDED_TYPES.includes(row.job_type)) return;
          if (uidRef.current && row.employer_id === uidRef.current) return;
          if (categoryRef.current !== 'all' && row.category !== categoryRef.current) return;

          setJobs(prev => {
            if (payload.eventType === 'DELETE') return prev.filter(j => j.id !== row.id);
            if (payload.eventType === 'UPDATE') {
              if (row.status !== 'open') return prev.filter(j => j.id !== row.id);
              return prev.map(j => j.id === row.id ? { ...j, ...row } : j);
            }
            // INSERT — แทรกข้อมูลใหม่ไว้บนสุด
            if (prev.some(j => j.id === row.id)) return prev;
            return [row, ...prev];
          });
        })
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(channel); };
  }, [supabase, loadFirstPage]);

  const handleOpenProposalModal = useCallback((job: any) => {
    if (!currentUser) {
      alert('กรุณาเข้าสู่ระบบก่อนยื่นโปรไฟล์ค่ะ');
      router.push('/auth/login');
      return;
    }
    setSelectedJob(job);
    setProposalPrice(job.budget ? String(job.budget) : '');
    setIsProposalModalOpen(true);
  }, [currentUser, router]);

  // 🌟 อัปเกรดความปลอดภัย: วิ่งไปเรียกใช้ RPC แทนการ Insert ตรงๆ
  const submitProposalData = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProposal(true);
    
    const { error } = await supabase.rpc('submit_proposal_with_notification', {
      p_job_id: selectedJob.id,
      p_cover_letter: proposalText,
      p_proposed_price: proposalPrice ? Number(proposalPrice) : null,
      p_duration_days: proposalDuration ? Number(proposalDuration) : null,
    });
    
    setIsSubmittingProposal(false);
    
    if (error) { 
      alert('เกิดข้อผิดพลาด: ' + error.message); 
      return; 
    }
    
    alert('ส่งโปรไฟล์สำเร็จ! 🚀 ระบบแจ้งเตือนผู้จ้างแล้วค่ะ');
    setIsProposalModalOpen(false);
    setProposalText(''); setProposalPrice(''); setProposalDuration('');
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return router.push('/auth/login');
    setIsSubmitting(true);
    
    const { error } = await supabase.from('jobs').insert({
      employer_id: currentUser.id,
      title: postTitle,
      description: postDescription,
      budget: postBudget ? Number(postBudget) : null,
      category: postCategory,
      job_type: postJobType,
      status: 'open'
    });

    if (!error) {
      alert('ประกาศงานสำเร็จเรียบร้อยค่ะ! 🚀 (คุณสามารถดูงานนี้ได้ในเมนู "งานของฉัน")');
      setIsPostModalOpen(false);
      setPostTitle(''); setPostDescription(''); setPostBudget('');
      loadFirstPage(); 
    } else {
      alert('เกิดข้อผิดพลาด: ' + error.message);
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
              <Link href="/" className="text-white/80 font-black text-xs mb-2 inline-block hover:text-white">← กลับหน้าหลัก</Link>
              <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">💼 ศูนย์รวมงานอิสระ</h1>
              <p className="text-xs text-blue-100 font-bold mt-1 opacity-90">จ้างงานออนไลน์และหาช่างฝีมือทั่วไทย</p>
            </div>
            <button 
              onClick={() => setIsPostModalOpen(true)} 
              className="bg-white text-[#0047FF] px-4 py-2.5 rounded-2xl text-[11px] font-black shadow-md active:scale-95 transition-transform flex items-center gap-1 hover:bg-blue-50"
            >
              <span className="text-sm">+</span> จ้างงาน
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 pt-2 -mx-2 px-2">
            {JOB_CATEGORIES.map((cat) => (
              <button 
                key={cat.key} 
                onClick={() => setActiveCategory(cat.key)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-black transition-all shadow-sm border ${activeCategory === cat.key ? 'bg-white text-[#0047FF] border-white' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </header>

        <main className="p-4 space-y-4 mt-2">
          {isLoading && jobs.length === 0 ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map(i => <div key={i} className="h-48 bg-white rounded-[1.5rem] border border-gray-100" />)}
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-12 text-center border border-gray-100 shadow-sm mt-4">
              <div className="text-6xl mb-4 opacity-50 grayscale">📭</div>
              <h3 className="font-black text-gray-800 text-lg">ยังไม่มีงานในหมวดหมู่นี้</h3>
              <p className="text-xs text-gray-400 font-bold mt-2 leading-relaxed">เปลี่ยนหมวดหมู่ หรือประกาศจ้างงานสิคะ</p>
            </div>
          ) : (
            <>
              {jobs.map((job) => (
                <article key={job.id} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100 relative overflow-hidden group hover:border-blue-200 transition-colors">
                  <div className="absolute top-0 right-0 bg-[#0047FF] text-white text-[9px] font-black px-3 py-1.5 rounded-bl-xl shadow-sm">
                    {job.job_type === 'online' ? '💻 ทำออนไลน์' : '📍 ลงพื้นที่'}
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full overflow-hidden border border-gray-200 shrink-0">
                      {job.employer?.avatar_url ? (
                        <img src={job.employer.avatar_url} alt="employer" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">👤</div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-800">{job.employer?.full_name || job.employer?.first_name || 'ผู้ใช้ไม่ระบุชื่อ'}</p>
                      <p className="text-[9px] text-gray-400 font-bold mt-0.5">โพสต์เมื่อ {formatDate(job.created_at)}</p>
                    </div>
                  </div>
                  <h2 className="text-base font-black text-gray-900 leading-snug mb-2 pr-16">{job.title}</h2>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed line-clamp-3 mb-4 whitespace-pre-line">
                    {job.description || 'ไม่มีคำอธิบายเพิ่มเติม สามารถทักแชทเพื่อสอบถามรายละเอียดได้เลยค่ะ'}
                  </p>
                  <div className="flex justify-between items-end pt-4 border-t border-gray-50">
                    <div>
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">งบประมาณ</p>
                      <p className="text-xl font-black text-[#0047FF]">
                        {job.budget ? `${job.budget.toLocaleString()} ฿` : 'เสนอราคา'}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleOpenProposalModal(job)}
                      className="bg-[#0047FF] hover:bg-[#0038cc] text-white px-5 py-3 rounded-xl text-xs font-black active:scale-95 transition-all shadow-md flex items-center gap-2"
                    >
                      <span>ยื่นโปรไฟล์เสนอตัว</span> <span>📝</span>
                    </button>
                  </div>
                </article>
              ))}

              {/* 🌟 แสดงปุ่มเมื่อยังมีข้อมูลให้โหลดต่อได้ */}
              {hasMore && (
                <button 
                  onClick={loadMore}
                  disabled={isFetchingMore}
                  className="w-full bg-white border border-blue-100 text-[#0047FF] font-black py-4 rounded-[1.5rem] text-xs mt-2 shadow-sm active:scale-95 transition-all hover:bg-blue-50 disabled:opacity-50"
                >
                  {isFetchingMore ? 'กำลังโหลดข้อมูล...' : 'โหลดรายการเพิ่มเติม...'}
                </button>
              )}
            </>
          )}
        </main>

        {/* 🌟 Modal 1: โพสต์งานใหม่ (ลูกค้า) */}
        {isPostModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-blue-900/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-xl rounded-t-[2rem] p-8 max-h-[90vh] overflow-y-auto pb-10 shadow-2xl relative">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-gray-800">ประกาศจ้างงาน 💼</h2>
                <button onClick={() => setIsPostModalOpen(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">✕</button>
              </div>

              <form onSubmit={handlePostJob} className="space-y-5">
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase mb-2">รูปแบบการทำงาน</label>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setPostJobType('online')} className={`flex-1 py-3 rounded-xl text-xs font-black border-2 transition-all ${postJobType === 'online' ? 'border-[#0047FF] bg-blue-50 text-[#0047FF]' : 'border-gray-100 text-gray-500'}`}>💻 ทำงานออนไลน์</button>
                    <button type="button" onClick={() => setPostJobType('onsite')} className={`flex-1 py-3 rounded-xl text-xs font-black border-2 transition-all ${postJobType === 'onsite' ? 'border-[#0047FF] bg-blue-50 text-[#0047FF]' : 'border-gray-100 text-gray-500'}`}>📍 ลงพื้นที่/เจอตัว</button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase mb-2">หมวดหมู่งาน</label>
                  <select value={postCategory} onChange={(e) => setPostCategory(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold text-gray-700 outline-none focus:border-[#0047FF] appearance-none">
                    {JOB_CATEGORIES.filter(c => c.key !== 'all').map(cat => (
                      <option key={cat.key} value={cat.key}>{cat.icon} {cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase mb-2">หัวข้องานที่ต้องการ</label>
                  <input type="text" required value={postTitle} onChange={(e) => setPostTitle(e.target.value)} placeholder="เช่น ออกแบบโลโก้ร้านกาแฟ, ซ่อมแอร์บ้าน..." className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:border-[#0047FF] transition-colors" />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase mb-2">รายละเอียดและขอบเขตงาน</label>
                  <textarea required rows={4} value={postDescription} onChange={(e) => setPostDescription(e.target.value)} placeholder="อธิบายรายละเอียด สิ่งที่ต้องการ หรือเงื่อนไขต่างๆ ให้ชัดเจน..." className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium outline-none focus:border-[#0047FF] transition-colors resize-none"></textarea>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase mb-2">งบประมาณที่ตั้งไว้ (ปล่อยว่างได้ถ้าต้องการให้เสนอราคา)</label>
                  <div className="relative">
                    <input type="number" min="0" value={postBudget} onChange={(e) => setPostBudget(e.target.value)} placeholder="เช่น 1500" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:border-[#0047FF] transition-colors pr-12" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">บาท</span>
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full bg-[#0047FF] text-white font-black py-4 rounded-xl text-sm mt-4 shadow-lg active:scale-95 transition-all disabled:opacity-50">
                  {isSubmitting ? 'กำลังประกาศงาน...' : 'ประกาศจ้างงาน 🚀'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 🌟 Modal 2: ยื่นข้อเสนอ (ฟรีแลนซ์/ช่าง) */}
        {isProposalModalOpen && selectedJob && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-blue-900/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-xl rounded-t-[2rem] p-8 max-h-[90vh] overflow-y-auto pb-10 shadow-2xl relative">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-black text-gray-800">ยื่นโปรไฟล์เสนอตัว 📝</h2>
                  <p className="text-xs text-gray-500 font-bold mt-1 truncate max-w-[250px]">สำหรับงาน: {selectedJob.title}</p>
                </div>
                <button onClick={() => setIsProposalModalOpen(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">✕</button>
              </div>

              <form onSubmit={submitProposalData} className="space-y-5">
                
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase mb-2">แนะนำตัวและพรีเซนต์ความสามารถ</label>
                  <textarea required rows={5} value={proposalText} onChange={(e) => setProposalText(e.target.value)} placeholder="บอกผู้จ้างว่าทำไมคุณถึงเหมาะกับงานนี้ มีประสบการณ์อะไรบ้าง หรือมีลิงก์ผลงานแนบมาได้เลยค่ะ..." className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium outline-none focus:border-[#0047FF] transition-colors resize-none"></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-gray-500 uppercase mb-2">ราคาที่เสนอ (บาท)</label>
                    <div className="relative">
                      <input type="number" min="0" required value={proposalPrice} onChange={(e) => setProposalPrice(e.target.value)} placeholder="0" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:border-[#0047FF] transition-colors pr-10" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">฿</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-gray-500 uppercase mb-2">ใช้เวลาทำงาน (วัน)</label>
                    <div className="relative">
                      <input type="number" min="1" required value={proposalDuration} onChange={(e) => setProposalDuration(e.target.value)} placeholder="เช่น 3" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:border-[#0047FF] transition-colors pr-10" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">วัน</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3 mt-4">
                  <span className="text-lg">💡</span>
                  <p className="text-[10px] text-blue-800 font-bold leading-relaxed">ข้อมูลและโปรไฟล์ของคุณจะถูกส่งให้ผู้จ้างพิจารณา หากผู้จ้างสนใจจะทำการเปิดห้องแชทเพื่อสนทนากับคุณโดยตรงค่ะ</p>
                </div>

                <button type="submit" disabled={isSubmittingProposal} className="w-full bg-gradient-to-r from-[#0047FF] to-[#0082FA] text-white font-black py-4 rounded-xl text-sm mt-4 shadow-lg active:scale-95 transition-all disabled:opacity-50 flex justify-center items-center gap-2">
                  {isSubmittingProposal ? 'กำลังส่งข้อมูล...' : <>ส่งโปรไฟล์ให้พิจารณา 🚀</>}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

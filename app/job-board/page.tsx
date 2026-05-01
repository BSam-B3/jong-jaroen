'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

// หมวดหมู่งานสไตล์ Fastwork
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

  // 🌟 State สำหรับฟอร์มโพสต์งาน
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postDescription, setPostDescription] = useState('');
  const [postBudget, setPostBudget] = useState('');
  const [postCategory, setPostCategory] = useState('graphic');
  const [postJobType, setPostJobType] = useState<'online' | 'onsite'>('online');

  const fetchFreelanceJobs = useCallback(async () => {
    setIsLoading(true);
    // ดึงงานที่เปิดอยู่ และ "ไม่ใช่งานวิน/ส่งของ" 
    let query = supabase.from('jobs')
      .select(`*, employer:profiles!employer_id (first_name, full_name, avatar_url)`)
      .eq('status', 'open')
      .not('job_type', 'in', '("ride","buy","deliver")')
      .order('created_at', { ascending: false });

    if (activeCategory !== 'all') {
      query = query.eq('category', activeCategory);
    }

    const { data } = await query;
    if (data) setJobs(data);
    setIsLoading(false);
  }, [supabase, activeCategory]);

  useEffect(() => {
    const initData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) setCurrentUser(session.user);
      fetchFreelanceJobs();
    };
    initData();

    // Real-time Feed สำหรับงานฟรีแลนซ์
    const channel = supabase.channel('public-jobs-freelance')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs', filter: "status=eq.open" }, () => {
        fetchFreelanceJobs();
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchFreelanceJobs, supabase]);

  const handleAcceptJob = async (jobId: string) => {
    if (!currentUser) return alert('กรุณาเข้าสู่ระบบก่อนรับงานค่ะ');
    if (!confirm('ยืนยันรับงานนี้ใช่ไหมคะ? (ระบบจะพาท่านไปหน้าแชทเพื่อคุยรายละเอียด)')) return;

    const { error } = await supabase
      .from('jobs')
      .update({ status: 'in_progress', worker_id: currentUser.id })
      .eq('id', jobId)
      .eq('status', 'open');

    if (error) {
      alert('ขออภัยค่ะ งานนี้ถูกรับไปแล้ว หรือเกิดข้อผิดพลาด 🙏');
    } else {
      alert('รับงานสำเร็จ! 🎉 ไปลุยกันเลยค่ะ');
      router.push('/my-jobs');
    }
    fetchFreelanceJobs();
  };

  // 🌟 ฟังก์ชันจัดการการโพสต์งานใหม่
  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('กรุณาเข้าสู่ระบบก่อนประกาศจ้างงานค่ะ');
      router.push('/auth/login');
      return;
    }
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
      alert('ประกาศงานสำเร็จเรียบร้อยค่ะ! 🚀');
      setIsPostModalOpen(false);
      setPostTitle('');
      setPostDescription('');
      setPostBudget('');
      fetchFreelanceJobs(); // โหลดหน้าฟีดใหม่
    } else {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
    setIsSubmitting(false);
  };

  // แปลงวันที่ให้อ่านง่าย
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex justify-center font-sans pb-24">
      <div className="w-full max-w-3xl bg-[#F8FAFC] min-h-screen relative flex flex-col shadow-2xl border-x border-gray-100">
        
        {/* 🔵 Header สไตล์ Professional */}
        <header className="px-6 pt-12 pb-6 bg-gradient-to-br from-[#0047FF] to-[#0082FA] text-white shadow-lg rounded-b-[2.5rem] relative z-20">
          <div className="flex justify-between items-start mb-4">
            <div>
              <Link href="/" className="text-white/80 font-black text-xs mb-2 inline-block hover:text-white">← กลับหน้าหลัก</Link>
              <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                💼 ศูนย์รวมงานอิสระ
              </h1>
              <p className="text-xs text-blue-100 font-bold mt-1 opacity-90">จ้างงานออนไลน์และหาช่างฝีมือทั่วไทย</p>
            </div>
            
            {/* ✅ ปุ่มเปิดหน้าต่างโพสต์งาน */}
            <button 
              onClick={() => setIsPostModalOpen(true)} 
              className="bg-white text-[#0047FF] px-4 py-2.5 rounded-2xl text-[11px] font-black shadow-md active:scale-95 transition-transform flex items-center gap-1 hover:bg-blue-50"
            >
              <span className="text-sm">+</span> จ้างงาน
            </button>
          </div>

          {/* หมวดหมู่งาน (Scrollable) */}
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

        {/* 📋 Job Feed */}
        <main className="p-4 space-y-4 mt-2">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map(i => <div key={i} className="h-48 bg-white rounded-[1.5rem] border border-gray-100" />)}
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-12 text-center border border-gray-100 shadow-sm mt-4">
              <div className="text-6xl mb-4 opacity-50 grayscale">📭</div>
              <h3 className="font-black text-gray-800 text-lg">ยังไม่มีงานในหมวดหมู่นี้</h3>
              <p className="text-xs text-gray-400 font-bold mt-2 leading-relaxed">ลองเปลี่ยนหมวดหมู่<br/>หรือเป็นคนแรกที่เริ่มโพสต์จ้างงานสิคะ</p>
            </div>
          ) : (
            jobs.map((job) => (
              <article key={job.id} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100 relative overflow-hidden group hover:border-blue-200 transition-colors">
                
                {/* ริบบิ้นประเภทงาน */}
                <div className="absolute top-0 right-0 bg-[#0047FF] text-white text-[9px] font-black px-3 py-1.5 rounded-bl-xl shadow-sm">
                  {job.job_type === 'online' ? '💻 ทำออนไลน์' : '📍 ลงพื้นที่'}
                </div>

                {/* โปรไฟล์ผู้จ้าง & เวลา */}
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

                {/* หัวข้องาน & รายละเอียด */}
                <h2 className="text-base font-black text-gray-900 leading-snug mb-2 pr-16">{job.title}</h2>
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed line-clamp-3 mb-4 whitespace-pre-line">
                  {job.description || 'ไม่มีคำอธิบายเพิ่มเติม สามารถทักแชทเพื่อสอบถามรายละเอียดได้เลยค่ะ'}
                </p>

                {/* งบประมาณ & ปุ่มรับงาน */}
                <div className="flex justify-between items-end pt-4 border-t border-gray-50">
                  <div>
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">งบประมาณ</p>
                    <p className="text-xl font-black text-[#0047FF]">
                      {job.budget ? `${job.budget.toLocaleString()} บาท` : 'เสนอราคา'}
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => handleAcceptJob(job.id)}
                    className="bg-[#0047FF] hover:bg-[#0038cc] text-white px-6 py-3 rounded-xl text-xs font-black active:scale-95 transition-all shadow-md flex items-center gap-2"
                  >
                    <span>เจรจารับงาน</span> <span>›</span>
                  </button>
                </div>
              </article>
            ))
          )}
        </main>

        {/* 🌟 Modal โพสต์งานใหม่ (Pop-up) */}
        {isPostModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-blue-900/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-xl rounded-t-[2rem] p-8 max-h-[90vh] overflow-y-auto pb-10 shadow-2xl relative">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-gray-800">ประกาศจ้างงาน 💼</h2>
                <button onClick={() => setIsPostModalOpen(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">✕</button>
              </div>

              <form onSubmit={handlePostJob} className="space-y-5">
                
                {/* 1. รูปแบบงาน (Online / Onsite) */}
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase mb-2">รูปแบบการทำงาน</label>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setPostJobType('online')} className={`flex-1 py-3 rounded-xl text-xs font-black border-2 transition-all ${postJobType === 'online' ? 'border-[#0047FF] bg-blue-50 text-[#0047FF]' : 'border-gray-100 text-gray-500'}`}>💻 ทำงานออนไลน์</button>
                    <button type="button" onClick={() => setPostJobType('onsite')} className={`flex-1 py-3 rounded-xl text-xs font-black border-2 transition-all ${postJobType === 'onsite' ? 'border-[#0047FF] bg-blue-50 text-[#0047FF]' : 'border-gray-100 text-gray-500'}`}>📍 ลงพื้นที่/เจอตัว</button>
                  </div>
                </div>

                {/* 2. หมวดหมู่ */}
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase mb-2">หมวดหมู่งาน</label>
                  <select value={postCategory} onChange={(e) => setPostCategory(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold text-gray-700 outline-none focus:border-[#0047FF] appearance-none">
                    {JOB_CATEGORIES.filter(c => c.key !== 'all').map(cat => (
                      <option key={cat.key} value={cat.key}>{cat.icon} {cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* 3. หัวข้องาน */}
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase mb-2">หัวข้องานที่ต้องการ</label>
                  <input type="text" required value={postTitle} onChange={(e) => setPostTitle(e.target.value)} placeholder="เช่น ออกแบบโลโก้ร้านกาแฟ, ซ่อมแอร์บ้าน..." className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:border-[#0047FF] transition-colors" />
                </div>

                {/* 4. รายละเอียด */}
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase mb-2">รายละเอียดและขอบเขตงาน</label>
                  <textarea required rows={4} value={postDescription} onChange={(e) => setPostDescription(e.target.value)} placeholder="อธิบายรายละเอียด สิ่งที่ต้องการ หรือเงื่อนไขต่างๆ ให้ชัดเจน..." className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium outline-none focus:border-[#0047FF] transition-colors resize-none"></textarea>
                </div>

                {/* 5. งบประมาณ */}
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase mb-2">งบประมาณที่ตั้งไว้ (ปล่อยว่างได้ถ้าต้องการให้เสนอราคา)</label>
                  <div className="relative">
                    <input type="number" min="0" value={postBudget} onChange={(e) => setPostBudget(e.target.value)} placeholder="เช่น 1500" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:border-[#0047FF] transition-colors pr-12" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">บาท</span>
                  </div>
                </div>

                {/* Submit Button */}
                <button type="submit" disabled={isSubmitting} className="w-full bg-[#0047FF] text-white font-black py-4 rounded-xl text-sm mt-4 shadow-lg active

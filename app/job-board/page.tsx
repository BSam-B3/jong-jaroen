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

  const fetchFreelanceJobs = useCallback(async () => {
    setIsLoading(true);
    // ดึงงานที่เปิดอยู่ และ "ไม่ใช่งานวิน/ส่งของ" 
    // (สมมติว่างานวินคือ ride, buy, deliver ที่เราทำไปในหน้า win-online)
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
            
            {/* ปุ่มสำหรับโพสต์งานใหม่ */}
            <button onClick={() => alert('เปิดหน้าต่างโพสต์งานฟรีแลนซ์')} className="bg-white text-[#0047FF] px-4 py-2.5 rounded-2xl text-[11px] font-black shadow-md active:scale-95 transition-transform flex items-center gap-1 hover:bg-blue-50">
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
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed line-clamp-3 mb-4">
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

      </div>
    </div>
  );
}

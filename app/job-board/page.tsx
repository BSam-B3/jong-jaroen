'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Job {
  id: string;
  title: string;
  job_type: 'online' | 'onsite';
  status: string;
  budget: number;
  created_at: string;
  employer?: { full_name: string; avatar_url: string };
}

export default function JobBoardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  
  // 🌟 State สำหรับค้นหาและกรองประเภทงาน
  const [activeTab, setActiveTab] = useState<'all' | 'online' | 'onsite'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchOpenJobs = async () => {
      setLoading(true);
      try {
        // ดึงเฉพาะงานที่สถานะ 'open' เพื่อให้ช่างเข้ามาเสนอราคาได้
        const { data } = await supabase
          .from('jobs')
          .select(`
            id, title, job_type, status, budget, created_at,
            employer:profiles!employer_id(full_name, avatar_url)
          `)
          .eq('status', 'open')
          .order('created_at', { ascending: false });
        
        if (data) {
          setJobs(data as any);
        }
      } catch (error) {
        console.error("Error fetching job board:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOpenJobs();
  }, [supabase]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // 🌟 ฟังก์ชันกรองงานตามแท็บและคำค้นหา
  const filteredJobs = jobs.filter(job => {
    const matchTab = activeTab === 'all' || job.job_type === activeTab;
    const matchSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-24 md:pb-10">
      <div className="w-full lg:max-w-5xl xl:max-w-6xl bg-[#F8FAFC] min-h-screen relative flex flex-col md:shadow-2xl overflow-x-hidden md:border-x border-gray-200/50">
        
        {/* 🟠 Header (คงโครงสร้างและโทนสีเดิมของบีสามไว้) */}
        <header className="bg-gradient-to-br from-[#0047FF] to-[#0082FA] px-6 pt-12 pb-16 md:pb-24 rounded-b-[2.5rem] md:rounded-b-[4rem] text-white shadow-lg relative z-20">
          <div className="flex items-center gap-4 max-w-4xl mx-auto">
            <button onClick={() => router.back()} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 active:scale-95 transition-all backdrop-blur-md shrink-0">
              ←
            </button>
            <div className="flex-1 flex justify-between items-center">
              <div>
                <h1 className="text-2xl md:text-4xl font-black tracking-tight">กระดานหางาน 📌</h1>
                <p className="text-xs md:text-sm font-bold text-blue-100 opacity-90 mt-1 md:mt-2">ค้นหางานที่ใช่ สำหรับฟรีแลนซ์และช่าง</p>
              </div>
              {/* ปุ่มโพสต์งานสำหรับลูกค้า */}
              <Link href="/jobs/create" className="hidden md:flex bg-white text-[#0047FF] px-6 py-2.5 rounded-full font-black text-sm shadow-md hover:bg-blue-50 transition-colors">
                + ลงประกาศงาน
              </Link>
            </div>
          </div>
        </header>

        {/* 🌟 Search & Filter Section (ดันขึ้นไปเกย Header) */}
        <div className="relative z-30 px-5 w-full max-w-4xl mx-auto -mt-8 md:-mt-10 flex flex-col gap-3">
          
          {/* ช่องค้นหา */}
          <div className="bg-white p-2 rounded-2xl shadow-lg border border-gray-100 flex items-center gap-2">
            <span className="pl-3 text-xl grayscale opacity-50">🔍</span>
            <input 
              type="text" 
              placeholder="ค้นหางานที่สนใจ เช่น ออกแบบ, ล้างแอร์..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 py-3 px-2 text-sm md:text-base font-bold text-gray-800 outline-none bg-transparent placeholder-gray-400"
            />
          </div>

          {/* แท็บกรองประเภทงาน */}
          <div className="bg-white p-1.5 rounded-full shadow-sm border border-gray-100 flex gap-1 w-full mt-1">
             <button 
               onClick={() => setActiveTab('all')}
               className={`flex-1 py-2.5 rounded-full text-[11px] md:text-sm font-black transition-all ${activeTab === 'all' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
             >
               📋 ทั้งหมด
             </button>
             <button 
               onClick={() => setActiveTab('online')}
               className={`flex-1 py-2.5 rounded-full text-[11px] md:text-sm font-black transition-all ${activeTab === 'online' ? 'bg-[#0047FF] text-white shadow-md shadow-blue-200' : 'text-gray-500 hover:bg-blue-50 hover:text-[#0047FF]'}`}
             >
               💻 ออนไลน์
             </button>
             <button 
               onClick={() => setActiveTab('onsite')}
               className={`flex-1 py-2.5 rounded-full text-[11px] md:text-sm font-black transition-all ${activeTab === 'onsite' ? 'bg-[#EE4D2D] text-white shadow-md shadow-orange-200' : 'text-gray-500 hover:bg-orange-50 hover:text-[#EE4D2D]'}`}
             >
               📍 ออนไซต์
             </button>
          </div>
        </div>

        {/* 🌟 Job Feed Area */}
        <main className="flex-1 p-4 md:px-10 mt-4 w-full max-w-4xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 animate-pulse">
               {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-white rounded-3xl border border-gray-100 shadow-sm" />)}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-12 text-center border border-gray-100 shadow-sm mt-4">
              <div className="text-6xl mb-4 opacity-40 grayscale">📭</div>
              <h3 className="font-black text-gray-800 text-lg">ไม่พบงานที่ค้นหา</h3>
              <p className="text-xs text-gray-400 font-bold mt-2">ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่ใหม่ดูนะคะ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              {filteredJobs.map((job) => (
                <Link 
                  href={`/job-board/${job.id}`} 
                  key={job.id} 
                  className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all group flex flex-col h-full"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded text-white shadow-sm tracking-widest ${job.job_type === 'onsite' ? 'bg-[#EE4D2D]' : 'bg-[#0047FF]'}`}>
                      {job.job_type === 'onsite' ? '📍 ONSITE' : '💻 ONLINE'}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400">{formatDate(job.created_at)}</span>
                  </div>

                  <h3 className="text-sm md:text-base font-black text-gray-800 line-clamp-2 leading-snug mb-4 group-hover:text-[#0047FF] transition-colors">
                    {job.title}
                  </h3>

                  <div className="mt-auto pt-4 border-t border-gray-50 flex items-end justify-between">
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">งบประมาณ</p>
                      <p className="text-lg font-black text-[#00C300]">{job.budget.toLocaleString()} <span className="text-xs text-gray-500">บาท</span></p>
                    </div>
                    
                    {/* ข้อมูลลูกค้า (ย่อส่วน) */}
                    <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
                      <div className="w-5 h-5 rounded-full bg-gray-200 overflow-hidden shrink-0">
                        {job.employer?.avatar_url ? <img src={job.employer.avatar_url} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-[10px]">👤</div>}
                      </div>
                      <span className="text-[9px] font-black text-gray-600 truncate max-w-[60px]">{job.employer?.full_name || 'ลูกค้า'}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>

        {/* Floating Action Button (FAB) สำหรับมือถือ */}
        <Link href="/jobs/create" className="md:hidden fixed bottom-24 right-5 w-14 h-14 bg-[#0047FF] text-white rounded-full flex items-center justify-center shadow-xl shadow-blue-200 active:scale-95 transition-transform z-40 border-2 border-white">
          <span className="text-2xl font-light">+</span>
        </Link>
        
      </div>
    </div>
  );
}

ในส่วนนี้ผมจะทำเป็นบอร์ดประกาศหางาน

- เอาช่องเสริชออก
- ทำดรอปดาวให้เลือก หมวดหมู่งาน และ ลักษณะการจ้าง ( ดูตัวอย่าง Fastwork https://jobboard.fastwork.co/jobs?order_by[]=inserted_at&order_directions[]=desc&page=1&page_size=20 )

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Job {
  id: string;
  title: string;
  job_type: 'online' | 'onsite';
  category?: string; // 🌟 เพิ่มหมวดหมู่งาน
  status: string;
  budget: number;
  created_at: string;
  deadline?: string; // 🌟 เพิ่มวันหมดอายุ / กำหนดส่งงาน
  employer?: { full_name: string; avatar_url: string };
}

export default function JobBoardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  
  // 🌟 State สำหรับ Dropdown Filter
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedJobType, setSelectedJobType] = useState('all');

  useEffect(() => {
    const fetchOpenJobs = async () => {
      setLoading(true);
      try {
        // ดึงเฉพาะงานที่สถานะ 'open' 
        // หมายเหตุ: ถ้าใน DB มีคอลัมน์ category และ deadline แล้ว ให้เพิ่มใน select(...) ด้วยนะคะ
        const { data } = await supabase
          .from('jobs')
          .select(`
            id, title, job_type, status, budget, created_at, category, deadline,
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
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('th-TH', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // 🌟 ฟังก์ชันกรองงานตาม Dropdown
  const filteredJobs = jobs.filter(job => {
    const matchCategory = selectedCategory === 'all' || job.category === selectedCategory;
    const matchType = selectedJobType === 'all' || job.job_type === selectedJobType;
    return matchCategory && matchType;
  });

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-24 md:pb-10">
      <div className="w-full lg:max-w-5xl xl:max-w-6xl bg-[#F8FAFC] min-h-screen relative flex flex-col md:shadow-2xl overflow-x-hidden md:border-x border-gray-200/50">
        
        {/* 🟠 Header (คงสีเดิม) */}
        <header className="bg-gradient-to-br from-[#0047FF] to-[#0082FA] px-6 pt-12 pb-20 md:pb-28 rounded-b-[2.5rem] md:rounded-b-[4rem] text-white shadow-lg relative z-20">
          <div className="flex items-center gap-4 max-w-4xl mx-auto">
            <button onClick={() => router.back()} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 active:scale-95 transition-all backdrop-blur-md shrink-0">
              ←
            </button>
            <div className="flex-1 flex justify-between items-center">
              <div>
                <h1 className="text-2xl md:text-4xl font-black tracking-tight">กระดานหางาน 📌</h1>
                <p className="text-xs md:text-sm font-bold text-blue-100 opacity-90 mt-1 md:mt-2">ผู้ว่าจ้างโพสต์งานเพื่อหาคนที่ใช่ ช่างเลือกงานที่สนใจ</p>
              </div>
              <Link href="/jobs/create" className="hidden md:flex bg-white text-[#0047FF] px-6 py-2.5 rounded-full font-black text-sm shadow-md hover:bg-blue-50 transition-colors">
                + ลงประกาศงาน
              </Link>
            </div>
          </div>
        </header>

        {/* 🌟 Dropdown Filter Section (สไตล์ Fastwork) */}
        <div className="relative z-30 px-5 w-full max-w-4xl mx-auto -mt-10 md:-mt-12">
          <div className="bg-white p-4 md:p-6 rounded-3xl shadow-xl border border-gray-100 flex flex-col md:flex-row gap-4">
            
            {/* หมวดหมู่งาน */}
            <div className="flex-1">
              <label className="block text-xs font-black text-gray-500 mb-2 pl-1">ค้นหาหมวดหมู่งาน</label>
              <div className="relative">
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm font-bold rounded-xl px-4 py-3 appearance-none focus:ring-2 focus:ring-[#0047FF] focus:border-transparent outline-none cursor-pointer"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="design">งานออกแบบ / กราฟิก</option>
                  <option value="tech">เขียนเว็บ / เทคโนโลยี</option>
                  <option value="marketing">การตลาด / โฆษณา</option>
                  <option value="repair">ช่างซ่อม / ประกอบ / ล้างแอร์</option>
                  <option value="lifestyle">ไลฟ์สไตล์ / อื่นๆ</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            {/* ลักษณะการจ้าง */}
            <div className="flex-1">
              <label className="block text-xs font-black text-gray-500 mb-2 pl-1">ลักษณะการจ้าง</label>
              <div className="relative">
                <select 
                  value={selectedJobType}
                  onChange={(e) => setSelectedJobType(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm font-bold rounded-xl px-4 py-3 appearance-none focus:ring-2 focus:ring-[#0047FF] focus:border-transparent outline-none cursor-pointer"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="online">💻 ออนไลน์ (ทำที่ไหนก็ได้)</option>
                  <option value="onsite">📍 ออนไซต์ (ลงพื้นที่จริง)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 🌟 Job Feed Area */}
        <main className="flex-1 p-4 md:px-10 mt-6 w-full max-w-4xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 md:gap-5 animate-pulse">
               {[1, 2, 3].map(i => <div key={i} className="h-44 bg-white rounded-3xl border border-gray-100 shadow-sm" />)}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-12 text-center border border-gray-100 shadow-sm mt-4">
              <div className="text-6xl mb-4 opacity-40 grayscale">📭</div>
              <h3 className="font-black text-gray-800 text-lg">ไม่พบงานในหมวดหมู่นี้</h3>
              <p className="text-xs text-gray-400 font-bold mt-2">ลองเปลี่ยนตัวกรอง หรือรอลูกค้ามาโพสต์งานใหม่นะคะ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:gap-5">
              {filteredJobs.map((job) => (
                <Link 
                  href={`/job-board/${job.id}`} 
                  key={job.id} 
                  className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all group flex flex-col md:flex-row md:items-center gap-4"
                >
                  {/* ฝั่งซ้าย: รายละเอียดงาน */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded text-white shadow-sm tracking-widest ${job.job_type === 'onsite' ? 'bg-[#EE4D2D]' : 'bg-[#0047FF]'}`}>
                        {job.job_type === 'onsite' ? '📍 ONSITE' : '💻 ONLINE'}
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                        {job.category === 'design' ? 'งานออกแบบ' : job.category === 'tech' ? 'เขียนเว็บ' : job.category === 'marketing' ? 'การตลาด' : job.category === 'repair' ? 'ช่างซ่อม' : job.category === 'lifestyle' ? 'ไลฟ์สไตล์' : 'อื่นๆ'}
                      </span>
                    </div>

                    <h3 className="text-base md:text-lg font-black text-gray-900 line-clamp-2 leading-snug mb-3 group-hover:text-[#0047FF] transition-colors">
                      {job.title}
                    </h3>

                    {/* ข้อมูลลูกค้า */}
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden shrink-0 border border-gray-100">
                        {job.employer?.avatar_url ? <img src={job.employer.avatar_url} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-[10px]">👤</div>}
                      </div>
                      <span className="text-xs font-bold text-gray-600 truncate max-w-[150px]">{job.employer?.full_name || 'ลูกค้าไม่ระบุชื่อ'}</span>
                    </div>
                  </div>

                  {/* เส้นคั่นสำหรับมือถือ */}
                  <div className="h-px w-full bg-gray-100 md:hidden my-2"></div>

                  {/* ฝั่งขวา: วันที่ และ งบประมาณ (สไตล์ Fastwork) */}
                  <div className="flex md:flex-col items-end justify-between md:justify-center md:min-w-[180px] gap-2 md:gap-3 md:pl-6 md:border-l border-gray-100">
                    <div className="text-left md:text-right w-full md:w-auto">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">งบประมาณ</p>
                      <p className="text-xl md:text-2xl font-black text-[#00C300] leading-none">
                        {job.budget.toLocaleString()} <span className="text-sm text-gray-500">บาท</span>
                      </p>
                    </div>

                    <div className="flex flex-col items-end text-[10px] font-medium text-gray-500 gap-1">
                      <div className="flex gap-1.5 items-center">
                        <span className="text-gray-400">ลงประกาศ:</span> 
                        <span className="font-bold text-gray-700">{formatDate(job.created_at)}</span>
                      </div>
                      <div className="flex gap-1.5 items-center bg-orange-50 px-2 py-0.5 rounded text-orange-600">
                        <span>หมดอายุ:</span> 
                        <span className="font-bold">{job.deadline ? formatDate(job.deadline) : 'ไม่ระบุ'}</span>
                      </div>
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

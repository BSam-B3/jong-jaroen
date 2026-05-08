'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Job {
  id: string;
  title: string;
  job_type: 'online' | 'onsite';
  category?: string; // หมวดหมู่งาน
  employment_type?: 'freelance' | 'contract' | 'parttime' | 'fulltime'; // ลักษณะการจ้าง
  status: string;
  budget: number;
  created_at: string;
  deadline?: string; // วันหมดอายุประกาศ
}

export default function JobBoardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  
  // 🌟 State สำหรับกรองงาน
  const [activeTab, setActiveTab] = useState('all'); // ลักษณะการจ้าง
  const [selectedCategory, setSelectedCategory] = useState('all'); // หมวดหมู่งาน

  // รายการลักษณะการจ้าง (สำหรับทำแถบเลื่อน)
  const employmentTypes = [
    { id: 'all', label: '📋 ทั้งหมด' },
    { id: 'freelance', label: '🚀 ฟรีแลนซ์' },
    { id: 'contract', label: '📄 สัญญาจ้าง' },
    { id: 'parttime', label: '⏱️ พาร์ทไทม์' },
    { id: 'fulltime', label: '💼 งานประจำ' }
  ];

  useEffect(() => {
    const fetchOpenJobs = async () => {
      setLoading(true);
      try {
        // ดึงเฉพาะงานที่สถานะ 'open'
        const { data } = await supabase
          .from('jobs')
          .select(`
            id, title, job_type, status, budget, created_at, category, employment_type, deadline
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

  // 🌟 ฟังก์ชันคำนวณวันหมดอายุ
  const getDaysLeft = (deadline?: string) => {
    if (!deadline) return 'ไม่ระบุวันหมดอายุ';
    const today = new Date();
    const target = new Date(deadline);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'หมดอายุแล้ว';
    if (diffDays === 0) return 'หมดอายุวันนี้';
    return `หมดอายุในอีก ${diffDays} วัน`;
  };

  // 🌟 ฟังก์ชันกรองงาน
  const filteredJobs = jobs.filter(job => {
    // ถ้าใน DB ยังไม่มี employment_type ให้ถือว่าเป็น freelance ไปก่อน (จำลองข้อมูล)
    const empType = job.employment_type || 'freelance'; 
    const matchTab = activeTab === 'all' || empType === activeTab;
    const matchCategory = selectedCategory === 'all' || job.category === selectedCategory;
    return matchTab && matchCategory;
  });

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-24 md:pb-10">
      <div className="w-full lg:max-w-5xl xl:max-w-6xl bg-[#F8FAFC] min-h-screen relative flex flex-col md:shadow-2xl overflow-x-hidden md:border-x border-gray-200/50">
        
        {/* 🟠 Header (คงโครงสร้างเดิม) */}
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
              <Link href="/jobs/create" className="hidden md:flex bg-white text-[#0047FF] px-6 py-2.5 rounded-full font-black text-sm shadow-md hover:bg-blue-50 transition-colors">
                + ลงประกาศงาน
              </Link>
            </div>
          </div>
        </header>

        {/* 🌟 Search & Filter Section */}
        <div className="relative z-30 px-5 w-full max-w-4xl mx-auto -mt-8 md:-mt-10 flex flex-col gap-3">
          
          {/* เลือกหมวดหมู่งาน (แทนช่องค้นหา) */}
          <div className="bg-white p-2 rounded-2xl shadow-lg border border-gray-100 flex items-center gap-2">
            <span className="pl-3 text-xl grayscale opacity-50">📂</span>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 py-3 px-2 text-sm md:text-base font-bold text-gray-800 outline-none bg-transparent cursor-pointer appearance-none"
            >
              <option value="all">หมวดหมู่งานทั้งหมด</option>
              <option value="design">งานออกแบบ / กราฟิก</option>
              <option value="tech">เขียนโปรแกรม / เทคโนโลยี</option>
              <option value="marketing">การตลาด / โฆษณา</option>
              <option value="repair">ช่างซ่อม / ล้างแอร์</option>
              <option value="lifestyle">ไลฟ์สไตล์ / ทั่วไป</option>
            </select>
            <div className="pr-4 pointer-events-none text-gray-400">▼</div>
          </div>

          {/* แถบเลื่อนประเภทการจ้าง (Scrollable Tabs) */}
          <div className="bg-white p-1.5 rounded-full shadow-sm border border-gray-100 w-full mt-1 relative">
             <div className="flex gap-1 w-full overflow-x-auto no-scrollbar snap-x items-center">
               {employmentTypes.map(type => (
                 <button 
                   key={type.id}
                   onClick={() => setActiveTab(type.id)}
                   className={`shrink-0 snap-start px-5 py-2.5 rounded-full text-[11px] md:text-sm font-black transition-all ${activeTab === type.id ? 'bg-[#0047FF] text-white shadow-md shadow-blue-200' : 'text-gray-500 hover:bg-blue-50 hover:text-[#0047FF]'}`}
                 >
                   {type.label}
                 </button>
               ))}
             </div>
             {/* Hint ลูกศรสำหรับมือถือให้รู้ว่าเลื่อนได้ */}
             <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none md:hidden animate-pulse">
               &gt;
             </div>
          </div>
        </div>

        {/* 🌟 Job Feed Area (1 แถวยาว) */}
        <main className="flex-1 p-4 md:px-10 mt-4 w-full max-w-4xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 md:gap-5 animate-pulse">
               {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-3xl border border-gray-100 shadow-sm" />)}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-12 text-center border border-gray-100 shadow-sm mt-4">
              <div className="text-6xl mb-4 opacity-40 grayscale">📭</div>
              <h3 className="font-black text-gray-800 text-lg">ไม่พบงานที่ตรงกับตัวกรอง</h3>
              <p className="text-xs text-gray-400 font-bold mt-2">ลองเปลี่ยนประเภทการจ้าง หรือหมวดหมู่งานดูนะคะ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:gap-5">
              {filteredJobs.map((job) => {
                // แปลงคำศัพท์ให้ตรงกับ Badge
                const empTypeLabel = employmentTypes.find(t => t.id === (job.employment_type || 'freelance'))?.label.replace(/[^ก-๙a-zA-Z]/g, '').trim() || 'ฟรีแลนซ์';

                return (
                  <Link 
                    href={`/job-board/${job.id}`} 
                    key={job.id} 
                    className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all group flex flex-col"
                  >
                    {/* Badge & ประเภทการจ้าง */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-2 items-center">
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded text-white shadow-sm tracking-widest ${job.job_type === 'onsite' ? 'bg-[#EE4D2D]' : 'bg-[#0047FF]'}`}>
                          {job.job_type === 'onsite' ? '📍 ONSITE' : '💻 ONLINE'}
                        </span>
                        <span className="text-[9px] font-black text-gray-600 bg-gray-100 px-2.5 py-1 rounded border border-gray-200">
                          {empTypeLabel}
                        </span>
                      </div>
                    </div>

                    {/* ชื่องาน */}
                    <h3 className="text-base md:text-xl font-black text-gray-800 leading-snug mb-4 group-hover:text-[#0047FF] transition-colors pr-4">
                      {job.title}
                    </h3>

                    {/* งบประมาณ & วันที่ (ตัดโปรไฟล์ลูกค้าออก) */}
                    <div className="mt-auto pt-4 border-t border-gray-50 flex flex-row items-end justify-between">
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">งบประมาณ</p>
                        <p className="text-lg md:text-2xl font-black text-[#00C300] leading-none">
                          {job.budget.toLocaleString()} <span className="text-xs md:text-sm text-gray-500">บาท</span>
                        </p>
                      </div>
                      
                      <div className="text-right flex flex-col gap-1">
                        <p className="text-[10px] md:text-xs text-gray-400 font-bold">
                          ลงประกาศ: <span className="text-gray-600">{formatDate(job.created_at)}</span>
                        </p>
                        <div className="inline-flex items-center justify-end gap-1.5 bg-orange-50 px-2 py-1 rounded-md">
                          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span>
                          <p className="text-[9px] md:text-[10px] font-black text-orange-600">
                            {getDaysLeft(job.deadline)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </main>

        <Link href="/jobs/create" className="md:hidden fixed bottom-24 right-5 w-14 h-14 bg-[#0047FF] text-white rounded-full flex items-center justify-center shadow-xl shadow-blue-200 active:scale-95 transition-transform z-40 border-2 border-white">
          <span className="text-2xl font-light">+</span>
        </Link>
        
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}

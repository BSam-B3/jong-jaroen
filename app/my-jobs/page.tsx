'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

// โครงสร้างจำลอง (ปรับให้ตรงกับ Database จริงของบีสามได้เลย)
interface Job {
  id: string;
  title: string;
  job_type: 'online' | 'onsite';
  status: 'open' | 'in_progress' | 'completed';
  budget: number;
  created_at: string;
  proposals?: any[]; // เก็บข้อเสนอจากช่าง
}

export default function MyJobsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // 🌟 State สลับแท็บ (คนจ้าง vs คนรับงาน)
  const [activeTab, setActiveTab] = useState<'employer' | 'freelancer'>('employer');
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    const fetchMyJobs = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push('/auth/login?next=/my-jobs');
        return;
      }
      setCurrentUser(session.user);

      // 🌟 ดึงข้อมูลงาน 
      try {
        if (activeTab === 'employer') {
          // ดึงงานที่ฉันเป็นคนโพสต์จ้าง
          const { data } = await supabase
            .from('jobs')
            .select(`*, proposals:job_proposals(*, profiles(*))`)
            .eq('employer_id', session.user.id)
            .order('created_at', { ascending: false });
          if (data) setJobs(data);
        } else {
          // ดึงงานที่ฉันไปเสนอตัวรับทำ (ดึงจากตาราง proposals แล้ว join กลับไปหา jobs)
          const { data } = await supabase
            .from('job_proposals')
            .select(`*, job:jobs(*)`)
            .eq('freelancer_id', session.user.id);
          
          if (data) {
            // Map ข้อมูลให้หน้าตาเหมือนกัน
            const mappedJobs = data.map(p => ({ ...p.job, my_proposal: p }));
            setJobs(mappedJobs as any);
          }
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

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-24 md:pb-10">
      {/* 🌟 ปรับขนาดจอให้รองรับคอมพิวเตอร์ (Responsive) เหมือนหน้า Profile */}
      <div className="w-full lg:max-w-5xl xl:max-w-6xl bg-[#F8FAFC] min-h-screen relative flex flex-col md:shadow-2xl overflow-x-hidden md:border-x border-gray-200/50">
        
        {/* 🟠 Header คุมโทนน้ำเงิน */}
        <header className="bg-gradient-to-br from-[#0047FF] to-[#0082FA] px-6 pt-12 pb-16 md:pb-24 rounded-b-[2.5rem] md:rounded-b-[4rem] text-white shadow-lg relative z-20">
          <div className="flex items-center gap-4 max-w-4xl mx-auto">
            <button onClick={() => router.back()} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 active:scale-95 transition-all backdrop-blur-md">
              ←
            </button>
            <div>
              <h1 className="text-2xl md:text-4xl font-black tracking-tight">งานของฉัน 📋</h1>
              <p className="text-xs md:text-sm font-bold text-blue-100 opacity-90 mt-1 md:mt-2">จัดการรายการจ้างงานและงานที่รับผิดชอบ</p>
            </div>
          </div>
        </header>

        {/* 🌟 Tab Switcher (ดันขึ้นไปเกย Header) */}
        <div className="flex justify-center -mt-6 md:-mt-8 relative z-30 px-5 w-full max-w-4xl mx-auto">
           <div className="bg-white p-1.5 rounded-full shadow-lg border border-gray-100 flex gap-1 w-full max-w-md">
             <button 
               onClick={() => setActiveTab('employer')}
               className={`flex-1 py-3 rounded-full text-xs md:text-sm font-black transition-all ${activeTab === 'employer' ? 'bg-[#0047FF] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
             >
               💼 งานที่ฉันจ้าง
             </button>
             <button 
               onClick={() => setActiveTab('freelancer')}
               className={`flex-1 py-3 rounded-full text-xs md:text-sm font-black transition-all ${activeTab === 'freelancer' ? 'bg-[#0047FF] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
             >
               🛵 งานที่ฉันรับ
             </button>
           </div>
        </div>

        <main className="flex-1 p-5 md:px-10 mt-6 w-full max-w-4xl mx-auto space-y-6">
          
          {loading ? (
            <div className="space-y-4 animate-pulse">
               {[1, 2].map(i => <div key={i} className="h-48 bg-white rounded-[2rem] border border-gray-100 shadow-sm" />)}
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-12 text-center border border-gray-100 shadow-sm mt-4">
              <div className="text-6xl mb-4 opacity-50 grayscale">📭</div>
              <h3 className="font-black text-gray-800 text-lg">ยังไม่มีรายการงาน</h3>
              <p className="text-xs text-gray-400 font-bold mt-2">ไปโพสต์จ้างงาน หรือไปหาโปรเจกต์ใหม่ๆ ทำกันเถอะค่ะ</p>
              <Link href="/job-board" className="mt-6 inline-block bg-[#0047FF] text-white font-black px-8 py-3 rounded-full shadow-lg active:scale-95 transition-transform">
                ไปบอร์ดหางาน ➔
              </Link>
            </div>
          ) : (
            jobs.map((job) => (
              <article key={job.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                
                {/* 🌟 Badge สถานะ */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] md:text-[10px] font-black px-3 py-1 rounded-md text-white shadow-sm tracking-wider ${job.job_type === 'onsite' ? 'bg-[#EE4D2D]' : 'bg-[#0047FF]'}`}>
                      {job.job_type === 'onsite' ? '📍 ONSITE' : '💻 ONLINE'}
                    </span>
                    <span className="text-[10px] font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md border border-yellow-100 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></span>
                      {job.status === 'open' ? 'รอคนมาสมัคร' : job.status === 'in_progress' ? 'กำลังดำเนินการ' : 'เสร็จสิ้น'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1"><span className="text-sm">⏰</span> {formatDate(job.created_at)}</p>
                </div>

                {/* 🌟 หัวข้องาน */}
                <h2 className="text-lg md:text-xl font-black text-gray-900 mb-4">{job.title}</h2>
                
                {/* 🌟 Progress Tracker สไตล์แอปดัง */}
                <div className="relative mb-8 mt-2 px-4">
                  <div className="absolute left-10 right-10 top-3 h-1 bg-gray-100 rounded-full -z-10"></div>
                  {job.status === 'in_progress' && <div className="absolute left-10 right-1/2 top-3 h-1 bg-[#00C300] rounded-full -z-10"></div>}
                  
                  <div className="flex justify-between">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#00C300] text-white flex items-center justify-center font-black text-xs shadow-md shadow-green-200">1</div>
                      <span className="text-[10px] font-bold text-[#00C300]">จองงาน</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shadow-sm ${job.status === 'in_progress' ? 'bg-[#0047FF] text-white shadow-blue-200' : 'bg-gray-200 text-gray-400'}`}>2</div>
                      <span className={`text-[10px] font-bold ${job.status === 'in_progress' ? 'text-[#0047FF]' : 'text-gray-400'}`}>พักเงิน/ทำ</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center font-black text-xs shadow-sm">3</div>
                      <span className="text-[10px] font-bold text-gray-400">ปล่อยเงิน</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-end border-t border-gray-50 pt-4">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">งบประมาณ / ค่าบริการ</p>
                    <p className="text-xl font-black text-gray-800">{job.budget ? `฿${job.budget.toLocaleString()}` : 'รอเสนอราคา'}</p>
                  </div>
                  <Link href={`/jobs/${job.id}`} className="text-[11px] font-bold text-[#0047FF] bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors">
                    ดูรายละเอียด
                  </Link>
                </div>

                {/* 🌟 ส่วนแสดงข้อเสนอจากช่าง (Proposals) */}
                {activeTab === 'employer' && job.proposals && job.proposals.length > 0 && (
                  <div className="mt-4 bg-gray-50 -mx-6 -mb-6 px-6 py-5 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-black text-[#0047FF] flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#0047FF] rounded-full animate-pulse"></span>
                        มีข้อเสนอใหม่ {job.proposals.length} รายการ
                      </p>
                      <span className="text-[10px] font-bold text-gray-400">ปัดขวาเพื่อดูเพิ่มเติม 👉</span>
                    </div>

                    <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x pb-2">
                      {job.proposals.map((prop: any) => (
                        <div key={prop.id} className="w-[85%] md:w-[320px] shrink-0 snap-center bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                                {prop.profiles?.avatar_url ? <img src={prop.profiles.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs">👤</div>}
                              </div>
                              <div>
                                <p className="text-xs font-black text-gray-800">{prop.profiles?.full_name}</p>
                                <p className="text-[10px] font-bold text-yellow-500">⭐ 5.0 (รีวิว 12)</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-black text-[#00C300]">฿{Number(prop.proposed_price).toLocaleString()}</p>
                              <p className="text-[9px] text-gray-400 font-bold uppercase">เสนอราคามาที่</p>
                            </div>
                          </div>
                          
                          <p className="text-[11px] font-medium text-gray-600 mb-4 bg-gray-50 p-2 rounded-lg italic line-clamp-2">
                            "{prop.cover_letter}"
                          </p>
                          
                          <div className="flex gap-2">
                            {/* 🌟 ลิงก์ไปแชททำงานแล้วค่ะ */}
                            <button 
                              onClick={() => router.push(`/chat?job=${job.id}&provider=${prop.freelancer_id}`)}
                              className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black hover:bg-gray-200 transition-colors"
                            >
                              💬 คุยก่อนจ้าง
                            </button>
                            {/* 🌟 ลิงก์ไปจ่ายเงิน */}
                            <button 
                              onClick={() => router.push(`/checkout/${job.id}?proposal_id=${prop.id}`)}
                              className="flex-1 py-2 bg-[#00C300] text-white rounded-xl text-[10px] font-black shadow-md hover:bg-[#00A300] transition-colors"
                            >
                              ✅ ยืนยันจ้างคนนี้
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            ))
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

// Component ย่อยสำหรับ Progress Step
function Step({ node, label, active, color }: { node: string, label: string, active: boolean, color: string }) {
  return (
    <div className="flex flex-col items-center gap-3 relative">
      <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-500 shadow-md ${active ? `${color} text-white scale-110` : 'bg-white text-gray-300 border-2 border-gray-100'}`}>
        {active ? '✓' : node}
      </div>
      <span className={`text-[10px] md:text-xs font-black transition-colors duration-500 ${active ? 'text-gray-800' : 'text-gray-300'}`}>
        {label}
      </span>
    </div>
  );
}

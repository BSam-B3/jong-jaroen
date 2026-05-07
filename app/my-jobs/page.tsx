'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

// Interface สำหรับจัดการข้อมูลงาน
interface Job {
  id: string;
  title: string;
  job_type: 'online' | 'onsite';
  status: 'open' | 'in_progress' | 'completed' | 'closed';
  budget: number;
  created_at: string;
  category: string;
  proposals?: any[];
}

export default function MyJobsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'employer' | 'freelancer'>('employer');
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push('/auth/login?next=/my-jobs');
        return;
      }
      setCurrentUser(session.user);

      try {
        if (activeTab === 'employer') {
          // 💼 ดึงงานที่ฉันเป็นคนโพสต์จ้าง
          const { data } = await supabase
            .from('jobs')
            .select(`*, proposals:job_proposals(*, profiles(*))`)
            .eq('employer_id', session.user.id)
            .order('created_at', { ascending: false });
          if (data) setJobs(data);
        } else {
          // 🛵 ดึงงานที่ฉันส่งข้อเสนอไปทำ
          const { data } = await supabase
            .from('job_proposals')
            .select(`*, job:jobs(*)`)
            .eq('freelancer_id', session.user.id);
          
          if (data) {
            const mappedJobs = data.map(p => ({ ...p.job, my_proposal: p }));
            setJobs(mappedJobs as any);
          }
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [activeTab, router, supabase]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-24 md:pb-10">
      {/* 🌟 ปรับขนาดจอให้รองรับคอมพิวเตอร์ (Responsive) เหมือนหน้าแรก */}
      <div className="w-full lg:max-w-5xl xl:max-w-6xl bg-[#F4F6F8] min-h-screen relative flex flex-col md:shadow-2xl overflow-x-hidden md:border-x border-gray-200/50">
        
        {/* 🟠 Header ไล่สีส้มแบรนด์จงเจริญ */}
        <header className="bg-gradient-to-br from-[#EE4D2D] to-[#FF7337] px-6 pt-12 pb-20 md:pb-28 rounded-b-[2.5rem] md:rounded-b-[4rem] text-white shadow-lg relative z-20 flex flex-col items-center">
          
          {/* ปุ่มย้อนกลับมุมซ้าย */}
          <button 
            onClick={() => router.back()} 
            className="absolute top-6 left-6 md:top-10 md:left-10 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 active:scale-95 transition-all backdrop-blur-md"
          >
            ←
          </button>

          <div className="text-center">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight drop-shadow-md">งานของฉัน 📋</h1>
            <p className="text-xs md:text-sm font-bold text-orange-100 opacity-90 mt-2 uppercase tracking-widest">Job Management Dashboard</p>
          </div>
        </header>

        {/* 🌟 Tab Switcher (ดันขึ้นไปเกย Header) */}
        <div className="flex justify-center -mt-8 md:-mt-10 relative z-30 px-5">
           <div className="bg-white p-1.5 rounded-full shadow-xl border border-gray-100 flex gap-1 w-full max-w-md md:max-w-lg">
             <button 
               onClick={() => setActiveTab('employer')}
               className={`flex-1 py-3 md:py-4 rounded-full text-xs md:text-sm font-black transition-all ${activeTab === 'employer' ? 'bg-[#EE4D2D] text-white shadow-lg shadow-orange-200' : 'text-gray-500 hover:bg-orange-50 hover:text-[#EE4D2D]'}`}
             >
               💼 งานที่ฉันจ้าง
             </button>
             <button 
               onClick={() => setActiveTab('freelancer')}
               className={`flex-1 py-3 md:py-4 rounded-full text-xs md:text-sm font-black transition-all ${activeTab === 'freelancer' ? 'bg-[#EE4D2D] text-white shadow-lg shadow-orange-200' : 'text-gray-500 hover:bg-orange-50 hover:text-[#EE4D2D]'}`}
             >
               🛵 งานที่ฉันรับทำ
             </button>
           </div>
        </div>

        <main className="flex-1 p-5 md:px-10 mt-6 md:mt-10 w-full max-w-4xl mx-auto space-y-6">
          
          {loading ? (
            <div className="space-y-6 animate-pulse">
               {[1, 2].map(i => <div key={i} className="h-64 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm" />)}
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-16 text-center border border-gray-100 shadow-sm mt-4">
              <div className="text-7xl mb-6 opacity-30 grayscale">📭</div>
              <h3 className="font-black text-gray-800 text-xl">ยังไม่มีรายการงานในขณะนี้</h3>
              <p className="text-sm text-gray-400 font-bold mt-2">ไปโพสต์จ้างงาน หรือค้นหาโปรเจกต์ใหม่ๆ กันเถอะค่ะ</p>
              <Link href="/job-board" className="mt-8 inline-block bg-[#EE4D2D] text-white font-black px-10 py-4 rounded-full shadow-xl hover:shadow-orange-200 active:scale-95 transition-all">
                ไปที่บอร์ดหางาน ➔
              </Link>
            </div>
          ) : (
            jobs.map((job) => (
              <article key={job.id} className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-all relative overflow-hidden group">
                
                {/* Status Badges */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-lg text-white shadow-sm tracking-wider ${job.job_type === 'onsite' ? 'bg-rose-500' : 'bg-blue-500'}`}>
                      {job.job_type === 'onsite' ? '📍 ONSITE' : '💻 ONLINE'}
                    </span>
                    <span className="text-[10px] font-bold text-yellow-600 bg-yellow-50 px-3 py-1 rounded-lg border border-yellow-100 flex items-center gap-2">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                      {job.status === 'open' ? 'รอคนมาสมัคร' : job.status === 'in_progress' ? 'กำลังทำงาน' : 'เสร็จสิ้น'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-bold flex items-center gap-1">
                    <span className="text-sm">🗓️</span> {formatDate(job.created_at)}
                  </p>
                </div>

                <h2 className="text-xl md:text-3xl font-black text-gray-900 mb-6 leading-tight group-hover:text-[#EE4D2D] transition-colors">{job.title}</h2>
                
                {/* 🌟 Premium Progress Tracker */}
                <div className="relative mb-10 mt-4 px-2 md:px-10">
                  <div className="absolute left-10 right-10 top-4 h-1.5 bg-gray-100 rounded-full -z-10"></div>
                  {/* แถบสีที่จะวิ่งตามสถานะ */}
                  <div 
                    className="absolute left-10 top-4 h-1.5 bg-[#EE4D2D] rounded-full -z-10 transition-all duration-1000" 
                    style={{ width: job.status === 'open' ? '0%' : job.status === 'in_progress' ? '50%' : '100%' }}
                  ></div>
                  
                  <div className="flex justify-between">
                    <Step node="1" label="โพสต์งาน" active={true} color="bg-[#EE4D2D]" />
                    <Step node="2" label="พักเงิน/ทำ" active={job.status === 'in_progress' || job.status === 'completed'} color="bg-[#EE4D2D]" />
                    <Step node="3" label="ปล่อยเงิน" active={job.status === 'completed'} color="bg-[#00C300]" />
                  </div>
                </div>

                {/* Footer Info */}
                <div className="flex justify-between items-end border-t border-gray-50 pt-6">
                  <div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.15em] mb-1">งบประมาณที่ตั้งไว้</p>
                    <p className="text-2xl font-black text-gray-800">
                      {job.budget ? `฿${job.budget.toLocaleString()}` : 'เสนอราคา'}
                    </p>
                  </div>
                  <Link 
                    href={`/jobs/${job.id}`}
                    className="text-xs font-black text-[#EE4D2D] bg-orange-50 px-6 py-3 rounded-2xl hover:bg-[#EE4D2D] hover:text-white transition-all shadow-sm"
                  >
                    ดูรายละเอียดงาน
                  </Link>
                </div>

                {/* 🌟 Proposals Section (โชว์เฉพาะฝั่งคนจ้าง และเมื่องานยังเปิดอยู่) */}
                {activeTab === 'employer' && job.proposals && job.proposals.length > 0 && job.status === 'open' && (
                  <div className="mt-8 bg-gray-50 -mx-6 -mb-6 md:-mx-8 md:-mb-8 px-6 md:px-8 py-8 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-3 w-3 rounded-full bg-[#EE4D2D] animate-ping"></span>
                        <p className="text-sm font-black text-gray-800">มีข้อเสนอใหม่จากช่าง ({job.proposals.length})</p>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ปัดดูข้อเสนอ 👉</span>
                    </div>

                    <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x pb-4">
                      {job.proposals.map((prop: any) => (
                        <div key={prop.id} className="w-[88%] md:w-[340px] shrink-0 snap-center bg-white border border-gray-200 rounded-[2rem] p-5 shadow-sm hover:shadow-lg transition-all border-b-4 border-b-[#EE4D2D]">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-2xl bg-gray-100 overflow-hidden shadow-inner border border-gray-100">
                                {prop.profiles?.avatar_url ? (
                                  <img src={prop.profiles.avatar_url} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xl">👤</div>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-black text-gray-800">{prop.profiles?.full_name || 'ช่างนิรนาม'}</p>
                                <p className="text-xs font-bold text-yellow-500">⭐ 5.0 <span className="text-gray-300 ml-1">| 12 งาน</span></p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-black text-[#00C300]">฿{Number(prop.proposed_price).toLocaleString()}</p>
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">เสนอราคามาที่</p>
                            </div>
                          </div>
                          
                          <div className="bg-orange-50/50 p-4 rounded-2xl mb-5">
                            <p className="text-[11px] font-medium text-gray-700 leading-relaxed italic line-clamp-2">
                              "{prop.cover_letter || 'พร้อมเริ่มงานทันทีครับ ประสบการณ์ตรงสายงานนี้แน่นอน...'}"
                            </p>
                          </div>
                          
                          <div className="flex gap-2">
                            {/* 🌟 ลิงก์ไปยังระบบแชท โดยแนบ ID งาน และ ID ช่างไปกับ URL */}
                            <button 
                              onClick={() => router.push(`/chat?job=${job.id}&provider=${prop.freelancer_id}`)}
                              className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-[11px] font-black hover:bg-gray-200 hover:text-gray-800 active:scale-95 transition-all"
                            >
                              💬 คุยรายละเอียด
                            </button>
                            <button 
                              onClick={() => router.push(`/checkout/${job.id}?proposal_id=${prop.id}`)}
                              className="flex-1 py-3 bg-[#00C300] text-white rounded-xl text-[11px] font-black shadow-lg shadow-green-100 hover:bg-[#00A300] active:scale-95 transition-all"
                            >
                              ✅ จ้างคนนี้
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

      {/* Hide Scrollbar CSS */}
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

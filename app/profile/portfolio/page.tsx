'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  full_name: string;
  location: string;
  phone: string;
  bio: string | null;
  skills: string[];
  avg_rating: number;
  total_jobs: number;
  is_verified: boolean;
  kyc_status: string;
  earning_total: number;
}

interface Job {
  id: string;
  title: string;
  category: string;
  budget: number;
  status: string;
  created_at: string;
  review_text?: string;
  rating?: number;
}

export default function PortfolioPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileData) setProfile(profileData as Profile);

        // ดึงประวัติงานที่ทำเสร็จแล้ว
        const { data: jobsData } = await supabase
          .from('jobs')
          .select('id, title, category, budget, status, created_at')
          .eq('freelancer_id', user.id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(10);

        if (jobsData) setJobs(jobsData as Job[]);
      } catch (error) {
        console.error('Error loading portfolio:', error);
      }
      setLoading(false);
    };
    load();
  }, [router]);

  const handlePrint = () => { window.print(); };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-2 text-[#EE4D2D]">📋</div>
          <p className="text-gray-500 font-bold text-sm">กำลังโหลดแฟ้มประวัติ...</p>
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #portfolio-printable, #portfolio-printable * { visibility: visible; }
          #portfolio-printable {
            position: absolute; left: 0; top: 0;
            width: 100%; background: white;
            padding: 0 !important; margin: 0 !important;
            box-shadow: none !important;
          }
          .no-print { display: none !important; }
        }
        @page { margin: 0.5cm; }
      `}</style>

      <div className="min-h-screen bg-gray-100 flex justify-center pb-24">
        <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl">
          
          {/* 🟠 Header (No Print) */}
          <header className="bg-gradient-to-br from-[#EE4D2D] to-[#FF7337] rounded-b-[2.5rem] p-6 pt-12 shadow-sm relative z-10 no-print">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <button onClick={() => router.back()} className="text-white font-bold text-lg active:scale-90 transition-transform">←</button>
                <div className="leading-tight">
                  <h1 className="text-xl font-black text-white tracking-tight">เรซูเม่ & ประวัติงาน</h1>
                  <p className="text-[10px] text-white/90 font-medium mt-0.5">สรุปผลงานของคุณบนจงเจริญ</p>
                </div>
              </div>
              <button
                onClick={handlePrint}
                className="bg-white text-[#EE4D2D] text-xs px-4 py-2 rounded-full font-bold shadow-md hover:bg-gray-50 active:scale-95 transition-all flex items-center gap-1"
              >
                🖨️ บันทึก PDF
              </button>
            </div>
          </header>

          <main className="p-4 flex-1 relative z-20 -mt-2 space-y-4">
            
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-2 no-print shadow-sm flex items-start gap-3">
              <span className="text-lg">💡</span>
              <p className="text-[10px] text-gray-700 leading-relaxed font-medium">
                คุณสามารถกดปุ่ม <strong className="text-[#EE4D2D]">บันทึก PDF</strong> ด้านบน เพื่อเซฟหน้านี้เป็นไฟล์เรซูเม่สำหรับใช้เป็นโปรไฟล์อ้างอิงความน่าเชื่อถือให้กับลูกค้าได้เลยค่ะ
              </p>
            </div>

            {/* 📄 เอกสาร Portfolio (ส่วนที่จะถูก Print) */}
            <div id="portfolio-printable" ref={printRef} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
              
              {/* ส่วนหัว Resume */}
              <div className="bg-gradient-to-br from-[#EE4D2D] via-[#FF7337] to-[#EE4D2D] px-6 py-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] bg-white text-[#EE4D2D] font-black px-2 py-0.5 rounded-sm uppercase tracking-wider shadow-sm">
                        Jong Jaroen Platform
                      </span>
                      {profile?.is_verified && (
                        <span className="text-[9px] bg-green-500 text-white font-bold px-2 py-0.5 rounded-sm shadow-sm flex items-center gap-1">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black mt-2 drop-shadow-sm">{profile?.full_name || 'ชื่อ-นามสกุล'}</h1>
                    <p className="text-white/90 text-xs sm:text-sm font-medium mt-1">ผู้ให้บริการมืออาชีพ (Freelance Professional)</p>
                    
                    {profile?.bio && (
                      <p className="text-white/80 text-[11px] mt-3 max-w-sm font-medium leading-relaxed bg-black/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                        "{profile.bio}"
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right text-[10px] text-white/90 space-y-1.5 font-medium ml-4 bg-black/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                    {profile?.location && <p className="flex items-center justify-end gap-1">📍 <span className="truncate w-24 text-right">{profile.location}</span></p>}
                    {profile?.phone && <p className="flex items-center justify-end gap-1">📞 {profile.phone}</p>}
                    <p className="flex items-center justify-end gap-1 text-white mt-2 pt-2 border-t border-white/20">🗓️ {today}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-8">
                
                {/* สถิติการทำงาน */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'งานที่สำเร็จ', value: profile?.total_jobs || 0, unit: 'งาน', emoji: '✅', color: 'text-green-600' },
                    { label: 'คะแนนรีวิว', value: (profile?.avg_rating || 0).toFixed(1), unit: '/ 5.0', emoji: '⭐', color: 'text-yellow-500' },
                    { label: 'รายได้รวม', value: ((profile?.earning_total || 0) / 1000).toFixed(1) + 'K', unit: 'บาท', emoji: '💰', color: 'text-[#EE4D2D]' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-gray-50 rounded-[1.2rem] p-4 text-center border border-gray-100">
                      <div className="text-2xl mb-1">{stat.emoji}</div>
                      <div className={`text-xl font-black ${stat.color} leading-none mb-1`}>{stat.value}</div>
                      <div className="text-[10px] font-bold text-gray-500">{stat.label}</div>
                      <div className="text-[9px] text-gray-400 mt-0.5">{stat.unit}</div>
                    </div>
                  ))}
                </div>

                {/* ทักษะความเชี่ยวชาญ */}
                {profile?.skills && profile.skills.length > 0 && (
                  <div>
                    <h2 className="text-sm font-black text-gray-800 mb-3 flex items-center gap-2 border-b border-gray-100 pb-2">
                      <span className="text-[#EE4D2D] text-lg">🎯</span> ทักษะ / ความเชี่ยวชาญ (Skills)
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill, i) => (
                        <span key={i} className="text-xs bg-orange-50 text-[#EE4D2D] border border-orange-100 px-3 py-1.5 rounded-full font-bold">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ประวัติการทำงาน 10 งานล่าสุด */}
                <div>
                  <h2 className="text-sm font-black text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                    <span className="text-[#EE4D2D] text-lg">📁</span> ประวัติการทำงาน (ล่าสุด 10 งาน)
                  </h2>

                  {jobs.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <div className="text-3xl mb-2 opacity-50">📭</div>
                      <p className="text-sm font-bold text-gray-500">ยังไม่มีประวัติงานบนระบบ</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {jobs.map((job, i) => (
                        <div key={job.id} className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
                          <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-[#EE4D2D] text-xs font-black flex-shrink-0 border border-orange-100">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-gray-800 truncate mb-1">{job.title}</p>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                                {job.category}
                              </span>
                              <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-md">
                                ฿{job.budget?.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="text-[10px] font-bold text-gray-400 flex-shrink-0 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                            {new Date(job.created_at).toLocaleDateString('th-TH', { month: 'short', year: '2-digit' })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer สำหรับ Print */}
                <div className="flex items-center justify-between pt-6 border-t-2 border-dashed border-gray-200">
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Auto-generated Profile by</p>
                    <p className="text-xs font-black text-[#EE4D2D]">Jong Jaroen · Local Marketplace</p>
                    <p className="text-[9px] text-gray-500 font-medium">Prasae Community, Rayong, Thailand</p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center gap-1.5 border rounded-full px-3 py-1 ${profile?.kyc_status === 'approved' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <span className="text-xs">{profile?.kyc_status === 'approved' ? '✅' : '⏳'}</span>
                      <span className={`text-[9px] font-black uppercase tracking-wider ${profile?.kyc_status === 'approved' ? 'text-green-700' : 'text-gray-500'}`}>
                        {profile?.kyc_status === 'approved' ? 'KYC Verified' : 'Unverified'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </main>

          {/* 🧭 Bottom Nav */}
          <div className="fixed bottom-0 w-full sm:max-w-2xl md:max-w-3xl bg-white/95 backdrop-blur-md border-t border-gray-100 px-8 py-4 flex justify-between items-center shadow-[0_-4px_25px_rgba(0,0,0,0.06)] rounded-t-[2.5rem] z-50 no-print">
             <button onClick={() => router.push('/')} className="flex flex-col items-center gap-1 opacity-40"><span className="text-xl">🏠</span><span className="text-[10px] font-bold text-gray-500">หน้าแรก</span></button>
             <button onClick={() => router.push('/services')} className="flex flex-col items-center gap-1 opacity-40"><span className="text-xl">🛠️</span><span className="text-[10px] font-bold text-gray-500">บริการ</span></button>
             <button onClick={() => router.push('/win-online')} className="flex flex-col items-center gap-1 opacity-40"><span className="text-xl">📋</span><span className="text-[10px] font-bold text-gray-500">ด่วนนน</span></button>
             <button onClick={() => router.push('/history')} className="flex flex-col items-center gap-1 opacity-40"><span className="text-xl">📜</span><span className="text-[10px] font-bold text-gray-500">ประวัติ</span></button>
             <div className="flex flex-col items-center gap-1 scale-110"><span className="text-xl">👤</span><span className="text-[10px] font-bold text-[#EE4D2D]">ฉัน</span><div className="w-1.5 h-1.5 bg-[#EE4D2D] rounded-full shadow-sm"></div></div>
          </div>

        </div>
      </div>
    </>
  );
}

'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) setProfile(profileData as Profile);

      // Get completed jobs as freelancer
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('id, title, category, budget, status, created_at')
        .eq('freelancer_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (jobsData) setJobs(jobsData as Job[]);
      setLoading(false);
    };
    load();
  }, [router]);

  const handlePrint = () => { window.print(); };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-2">📋</div>
          <p className="text-gray-500 text-sm">กำลังโหลด Portfolio...</p>
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
            position: fixed; left: 0; top: 0;
            width: 100%; background: white;
            font-size: 12px;
          }
          .no-print { display: none !important; }
        }
        @page { margin: 1cm; }
      `}</style>

      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10 no-print">
          <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link href="/profile" className="text-gray-400 hover:text-gray-600">← กลับ</Link>
            <h1 className="text-lg font-bold text-gray-800 flex-1">📋 Portfolio / Resume</h1>
            <button
              onClick={handlePrint}
              className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              🖨️ ดาวน์โหลด PDF
            </button>
          </div>
        </header>

        <main className="max-w-xl mx-auto px-4 py-5">
          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-5 no-print">
            <p className="text-xs text-blue-700">
              <strong>💡 วิธีดาวน์โหลด PDF:</strong> กดปุ่ม "ดาวน์โหลด PDF" แล้วเลือก "Save as PDF" ในหน้าต่างพิมพ์
            </p>
          </div>

          {/* Portfolio Document */}
          <div id="portfolio-printable" ref={printRef} className="bg-white rounded-3xl shadow-lg overflow-hidden">
            {/* Header Band */}
            <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 px-8 py-6 text-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-yellow-400 text-blue-900 font-bold px-2 py-0.5 rounded-full">
                      จงเจริญ
                    </span>
                    {profile?.is_verified && (
                      <span className="text-xs bg-green-400 text-green-900 font-bold px-2 py-0.5 rounded-full">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl font-black mt-2">{profile?.full_name}</h1>
                  <p className="text-blue-200 text-sm mt-1">Freelance Professional</p>
                  {profile?.bio && (
                    <p className="text-blue-100 text-xs mt-2 max-w-sm italic">"{profile.bio}"</p>
                  )}
                </div>
                <div className="text-right text-xs text-blue-200 space-y-1">
                  {profile?.location && <p>📍 {profile.location}</p>}
                  {profile?.phone && <p>📞 {profile.phone}</p>}
                  <p className="mt-2 text-blue-300">{today}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'งานที่เสร็จ', value: profile?.total_jobs || 0, unit: 'งาน', emoji: '✅' },
                  { label: 'คะแนนเฉลี่ย', value: (profile?.avg_rating || 0).toFixed(1), unit: '/ 5', emoji: '⭐' },
                  { label: 'รายได้รวม', value: ((profile?.earning_total || 0) / 1000).toFixed(1) + 'K', unit: 'บาท', emoji: '💰' },
                ].map((stat, i) => (
                  <div key={i} className="bg-blue-50 rounded-2xl p-3 text-center">
                    <div className="text-xl mb-0.5">{stat.emoji}</div>
                    <div className="text-lg font-black text-blue-900">{stat.value}</div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                    <div className="text-xs text-gray-400">{stat.unit}</div>
                  </div>
                ))}
              </div>

              {/* Skills */}
              {profile?.skills && profile.skills.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-blue-600">🏷️</span> ทักษะ / ความเชี่ยวชาญ
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-full font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-gray-100" />

              {/* Work History */}
              <div>
                <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-blue-600">📁</span> ประวัติงาน (ล่าสุด 10 งาน)
                </h2>

                {jobs.length === 0 ? (
                  <div className="text-center py-6 text-gray-400">
                    <div className="text-3xl mb-2">📭</div>
                    <p className="text-sm">ยังไม่มีประวัติงาน</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {jobs.map((job, i) => (
                      <div key={job.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{job.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                              {job.category}
                            </span>
                            <span className="text-xs text-green-600 font-medium">
                              ฿{job.budget?.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 flex-shrink-0">
                          {new Date(job.created_at).toLocaleDateString('th-TH', { month: 'short', year: '2-digit' })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100" />

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">เอกสารนี้ออกโดยอัตโนมัติจาก</p>
                  <p className="text-sm font-bold text-blue-900">จงเจริญ · Local Freelance Marketplace</p>
                  <p className="text-xs text-gray-400">Prasae Community, Rayong</p>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                    <span className="text-green-600 text-xs">✅</span>
                    <span className="text-xs text-green-700 font-medium">
                      {profile?.kyc_status === 'approved' ? 'KYC ผ่านแล้ว' : 'รอยืนยัน KYC'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 z-50 no-print">
          <Link href="/" className="flex flex-col items-center text-gray-400 text-xs gap-0.5"><span>🏠</span>หน้าหลัก</Link>
          <Link href="/services" className="flex flex-col items-center text-gray-400 text-xs gap-0.5"><span>🔍</span>ค้นหา</Link>
          <Link href="/dashboard" className="flex flex-col items-center text-gray-400 text-xs gap-0.5"><span>📋</span>งานของฉัน</Link>
          <Link href="/profile" className="flex flex-col items-center text-blue-600 text-xs gap-0.5"><span>👤</span>โปรไฟล์</Link>
        </nav>
      </div>
    </>
  );
}

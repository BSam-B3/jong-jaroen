'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  full_name: string;
  location: string;
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
  status: string;
  base_price: number;
  created_at: string;
}

function QRCodeSVG({ data, size = 120 }: { data: string; size?: number }) {
  // Simple QR code placeholder - uses URL encoding for visual representation
  const encodedData = encodeURIComponent(data);
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="border-4 border-gray-800 rounded"
        style={{ width: size, height: size, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}
      >
        {/* QR pattern visual */}
        <div style={{ fontSize: 8, textAlign: 'center', padding: 4, wordBreak: 'break-all', color: '#333' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, margin: '0 auto', width: 70 }}>
            {Array.from({ length: 49 }, (_, i) => {
              const hash = (data.charCodeAt(i % data.length) + i) % 3;
              return (
                <div key={i} style={{
                  width: 9, height: 9,
                  background: hash === 0 ? '#000' : 'transparent',
                  border: '0.5px solid #eee'
                }} />
              );
            })}
          </div>
          <div style={{ fontSize: 6, marginTop: 4, color: '#666' }}>SCAN</div>
        </div>
      </div>
      <p style={{ fontSize: 9, color: '#666', textAlign: 'center', maxWidth: size }}>ตรวจสอบใบรับรองนี้</p>
    </div>
  );
}

export default function CertificatePage() {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [completedJobs, setCompletedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profileData) setProfile(profileData as Profile);

      const { data: jobsData } = await supabase
        .from('jobs')
        .select('id, title, status, base_price, created_at')
        .eq('freelancer_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);
      setCompletedJobs((jobsData || []) as Job[]);
      setLoading(false);
    };
    load();
  }, [router]);

  const verifyUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/verify/${profile?.id}`
    : '';

  const meetsPortfolioCriteria = (profile?.total_jobs || 0) >= 1;
  const meetsCertCriteria = (profile?.total_jobs || 0) >= 5 && (profile?.avg_rating || 0) >= 4.0;

  const handlePrint = () => {
    setGenerating(true);
    setTimeout(() => {
      window.print();
      setGenerating(false);
    }, 300);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center"><div className="text-4xl animate-bounce mb-2">📄</div><p className="text-gray-500 text-sm">กำลังโหลด...</p></div>
      </div>
    );
  }

  return (
    <>
      {/* Print Styles */}
      <style>{
        `@media print {
          .no-print { display: none !important; }
          .print-area { display: block !important; }
          body { background: white; }
        }
        @media screen {
          .print-area { display: none; }
        }`
      }</style>

      <div className="min-h-screen bg-gray-50 pb-20 no-print">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10 no-print">
          <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link href="/profile" className="text-gray-400 hover:text-gray-600">← กลับ</Link>
            <h1 className="text-lg font-bold text-gray-800 flex-1">📄 Portfolio & ใบรับรอง</h1>
          </div>
        </header>

        <main className="max-w-xl mx-auto px-4 py-5 space-y-4">
          {/* Stats Summary */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-800 mb-3">📊 สถิติงานของคุณ</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center bg-blue-50 rounded-xl p-3">
                <div className="text-2xl font-bold text-blue-600">{profile?.total_jobs || 0}</div>
                <div className="text-xs text-gray-500">งานทั้งหมด</div>
              </div>
              <div className="text-center bg-yellow-50 rounded-xl p-3">
                <div className="text-2xl font-bold text-yellow-600">⭐{(profile?.avg_rating || 0).toFixed(1)}</div>
                <div className="text-xs text-gray-500">คะแนนเฉลี่ย</div>
              </div>
              <div className="text-center bg-green-50 rounded-xl p-3">
                <div className="text-2xl font-bold text-green-600">{completedJobs.length}</div>
                <div className="text-xs text-gray-500">งานเสร็จสิ้น</div>
              </div>
            </div>
          </div>

          {/* Portfolio PDF */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-800">📋 Portfolio PDF</h2>
                <p className="text-xs text-gray-400 mt-0.5">สรุปประวัติการทำงานและผลงาน</p>
              </div>
              {meetsPortfolioCriteria ? (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">✅ พร้อมดาวน์โหลด</span>
              ) : (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">ต้องมีอย่างน้อย 1 งาน</span>
              )}
            </div>

            {meetsPortfolioCriteria ? (
              <button onClick={handlePrint} disabled={generating}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl text-sm transition-colors"
              >
                {generating ? '⏳ กำลังสร้าง PDF...' : '⬇️ ดาวน์โหลด Portfolio PDF'}
              </button>
            ) : (
              <div className="bg-gray-50 rounded-xl p-3 text-center text-xs text-gray-400">
                รับงานและทำสำเร็จอย่างน้อย 1 งาน เพื่อสร้าง Portfolio
              </div>
            )}
          </div>

          {/* e-Certificate */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-800">🏅 ใบรับรองฝีมือแรงงาน</h2>
                <p className="text-xs text-gray-400 mt-0.5">เงื่อนไข: งาน ≥ 5 ชิ้น และคะแนน ≥ 4.0</p>
              </div>
              {meetsCertCriteria ? (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">🏅 พร้อมออกใบรับรอง</span>
              ) : (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                  ยังไม่ครบเงื่อนไข
                </span>
              )}
            </div>

            {!meetsCertCriteria && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-3 text-xs text-orange-700 space-y-1">
                <p>{(profile?.total_jobs || 0) < 5 ? `📋 งานที่รับ: ${profile?.total_jobs || 0}/5 ✗` : '📋 งาน: ✓'}</p>
                <p>{(profile?.avg_rating || 0) < 4.0 ? `⭐ คะแนน: ${(profile?.avg_rating || 0).toFixed(1)}/4.0 ✗` : '⭐ คะแนน: ✓'}</p>
              </div>
            )}

            {meetsCertCriteria && (
              <button onClick={handlePrint} disabled={generating}
                className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl text-sm transition-colors"
              >
                {generating ? '⏳ กำลังสร้าง...' : '🏅 ดาวน์โหลดใบรับรอง PDF'}
              </button>
            )}
          </div>

          {/* Recent Completed Jobs */}
          {completedJobs.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-3">✅ งานที่เสร็จสิ้น</h3>
              <div className="space-y-2">
                {completedJobs.map(job => (
                  <div key={job.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{job.title}</p>
                      <p className="text-xs text-gray-400">{new Date(job.created_at).toLocaleDateString('th-TH')}</p>
                    </div>
                    <span className="text-sm font-medium text-gray-700">฿{(job.base_price || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 z-50 no-print">
          <Link href="/" className="flex flex-col items-center text-gray-400 text-xs gap-0.5"><span>🏠</span>หน้าหลัก</Link>
          <Link href="/services" className="flex flex-col items-center text-gray-400 text-xs gap-0.5"><span>🔍</span>ค้นหา</Link>
          <Link href="/dashboard" className="flex flex-col items-center text-gray-400 text-xs gap-0.5"><span>📋</span>งานของฉัน</Link>
          <Link href="/profile" className="flex flex-col items-center text-blue-600 text-xs gap-0.5"><span>👤</span>โปรไฟล์</Link>
        </nav>
      </div>

      {/* ===== PRINT AREA (PDF) ===== */}
      <div ref={printRef} className="print-area" style={{ padding: 40, fontFamily: 'serif', maxWidth: 794 }}>
        {/* Portfolio Header */}
        <div style={{ textAlign: 'center', borderBottom: '3px solid #1e3a8a', paddingBottom: 20, marginBottom: 24 }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#1e3a8a' }}>จงเจริญ — Jong Jaroen</div>
          <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>ชุมชนแรงงานปากน้ำประแส | PandVHappiness</div>
          {meetsCertCriteria ? (
            <div style={{ fontSize: 22, fontWeight: 700, color: '#b45309', marginTop: 12, border: '2px solid #b45309', display: 'inline-block', padding: '4px 24px', borderRadius: 8 }}>
              ใบรับรองฝีมือแรงงาน 🏅
            </div>
          ) : (
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1e3a8a', marginTop: 12 }}>
              Portfolio ผลงาน
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1e3a8a' }}>{profile?.full_name}</div>
            <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>📍 {profile?.location || 'ปากน้ำประแส'}</div>
            {profile?.bio && <div style={{ fontSize: 13, color: '#444', marginTop: 6, fontStyle: 'italic' }}>"{profile.bio}"</div>}
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(profile?.skills || []).map((skill, i) => (
                <span key={i} style={{ fontSize: 11, background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: 12 }}>{skill}</span>
              ))}
            </div>
          </div>
          <div style={{ marginLeft: 20, textAlign: 'center' }}>
            <QRCodeSVG data={verifyUrl} size={100} />
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'งานที่รับทั้งหมด', value: String(profile?.total_jobs || 0), unit: 'ชิ้น', color: '#1e3a8a' },
            { label: 'คะแนนรีวิว', value: (profile?.avg_rating || 0).toFixed(1), unit: '/ 5.0 ⭐', color: '#d97706' },
            { label: 'งานที่เสร็จสิ้น', value: String(completedJobs.length), unit: 'ชิ้น', color: '#059669' },
          ].map((stat, i) => (
            <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 10, color: '#6b7280' }}>{stat.unit}</div>
              <div style={{ fontSize: 11, color: '#374151', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Completed Jobs */}
        {completedJobs.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e3a8a', borderBottom: '1px solid #e5e7eb', paddingBottom: 8, marginBottom: 12 }}>
              ✅ ประวัติงานที่เสร็จสิ้น
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #e5e7eb' }}>ชื่องาน</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #e5e7eb', width: 100 }}>วันที่</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #e5e7eb', width: 80 }}>ค่าจ้าง</th>
                </tr>
              </thead>
              <tbody>
                {completedJobs.map((job, i) => (
                  <tr key={job.id} style={{ background: i % 2 === 0 ? 'white' : '#f9fafb' }}>
                    <td style={{ padding: '5px 8px', border: '1px solid #e5e7eb' }}>{job.title}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'center', border: '1px solid #e5e7eb' }}>{new Date(job.created_at).toLocaleDateString('th-TH')}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', border: '1px solid #e5e7eb' }}>฿{(job.base_price || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Certificate Footer */}
        {meetsCertCriteria && (
          <div style={{ border: '2px solid #b45309', borderRadius: 8, padding: 16, textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 14, color: '#92400e', fontWeight: 600 }}>🏅 ผู้ถือใบรับรองนี้ได้ผ่านการรับงานและได้รับการประเมินจากลูกค้าจริง</div>
            <div style={{ fontSize: 11, color: '#78350f', marginTop: 6 }}>
              ออกให้ ณ วันที่ {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e5e7eb', paddingTop: 12, fontSize: 10, color: '#9ca3af' }}>
          <div>jong-jaroen.vercel.app | PandVHappiness © {new Date().getFullYear()}</div>
          <div>ตรวจสอบได้ที่: {verifyUrl}</div>
        </div>
      </div>
    </>
  );
}

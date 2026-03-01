'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { NotificationBell } from '@/app/components/NotificationBell';

interface Profile {
  id: string;
  full_name: string;
  location: string;
  phone: string;
  mode: string;
  spending_total: number;
  earning_total: number;
  lottery_count_this_month: number;
  avg_rating: number;
  total_jobs: number;
  is_verified: boolean;
  kyc_status: string;
  skills: string[];
  bio: string | null;
}

interface Job {
  id: string;
  title: string;
  status: string;
  base_price: number;
  created_at: string;
  customer_id: string;
  freelancer_id: string | null;
}

function MilestoneBar({ label, value, max, unit = '', color = 'bg-green-500', emoji = '' }: {
  label: string; value: number; max: number; unit?: string; color?: string; emoji?: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-gray-700">{emoji} {label}</span>
        <span className="text-xs text-gray-500">{value.toLocaleString()}{unit}/{max.toLocaleString()}{unit}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
        <div className={`h-3 rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-right text-xs text-gray-400 mt-0.5">{pct}%</div>
    </div>
  );
}

export default function UnifiedDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'customer' | 'freelancer'>('customer');
  const [switching, setSwitching] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [userId, setUserId] = useState('');
  const [welcomeMsg, setWelcomeMsg] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }
      setUserId(user.id);

      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('id', user.id).single();
      if (!profileData) { router.push('/auth/login'); return; }

      setProfile(profileData as Profile);
      const currentMode = (profileData.mode || 'customer') as 'customer' | 'freelancer';
      setMode(currentMode);

      const { data: jobsData } = await supabase
        .from('jobs')
        .select('id, title, status, base_price, created_at, customer_id, freelancer_id')
        .or(`customer_id.eq.${user.id},freelancer_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(5);
      setJobs((jobsData || []) as Job[]);
      setLoading(false);
    };
    loadData();

    const params = new URLSearchParams(window.location.search);
    if (params.get('welcome') === '1') {
      setWelcomeMsg('🎉 ยินดีต้อนรับสู่จงเจริญ! บัญชีของคุณพร้อมใช้งานแล้ว');
      setTimeout(() => setWelcomeMsg(''), 6000);
    }
    if (params.get('success') === 'job_created') {
      setWelcomeMsg('✅ สร้างงานสำเร็จ! ช่างจะได้รับการแจ้งเตือน');
      setTimeout(() => setWelcomeMsg(''), 5000);
    }
  }, [router]);

  const switchMode = async (newMode: 'customer' | 'freelancer') => {
    if (newMode === mode || !profile) return;
    if (newMode === 'freelancer' && profile.kyc_status === 'none') {
      router.push('/profile?tab=kyc');
      return;
    }
    setSwitching(true);
    await supabase.from('profiles').update({ mode: newMode }).eq('id', userId);
    setMode(newMode);
    setProfile(prev => prev ? { ...prev, mode: newMode } : null);
    setSwitching(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">⚙️</div>
          <p className="text-blue-700 font-medium">กำลังโหลด Dashboard...</p>
        </div>
      </div>
    );
  }

  const isCustomerMode = mode === 'customer';
  const themeColor = isCustomerMode ? 'green' : 'blue';
  const bgGradient = isCustomerMode ? 'from-green-50 to-emerald-100' : 'from-blue-50 to-indigo-100';
  const headerColor = isCustomerMode ? 'text-green-700' : 'text-blue-700';
  const cardGradient = isCustomerMode ? 'from-green-600 to-emerald-500' : 'from-blue-600 to-indigo-500';

  const myJobs = isCustomerMode
    ? jobs.filter(j => j.customer_id === userId)
    : jobs.filter(j => j.freelancer_id === userId);

  const pendingCount = myJobs.filter(j => j.status === 'pending').length;
  const completedCount = myJobs.filter(j => j.status === 'completed').length;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgGradient}`}>
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{isCustomerMode ? '🏠' : '🔧'}</span>
            <div>
              <h1 className={`text-lg font-bold leading-none ${headerColor}`}>จงเจริญ</h1>
              <p className="text-xs text-gray-400">{isCustomerMode ? 'โหมดจ้างงาน' : 'โหมดรับงาน'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {userId && <NotificationBell userId={userId} />}
            <button
              onClick={handleLogout} disabled={loggingOut}
              className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {loggingOut ? '...' : '🚪'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-5 space-y-4">
        {/* Welcome / Success Message */}
        {welcomeMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm font-medium">
            {welcomeMsg}
          </div>
        )}

        {/* Mode Switch */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-2 text-center font-medium">สลับโหมดการใช้งาน</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => switchMode('customer')}
              disabled={switching}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                isCustomerMode
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              🏠 จ้างงาน
            </button>
            <button
              onClick={() => switchMode('freelancer')}
              disabled={switching}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                !isCustomerMode
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              🔧 รับงาน
              {profile?.kyc_status === 'none' && (
                <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">ต้อง KYC</span>
              )}
            </button>
          </div>
          {switching && <p className="text-center text-xs text-gray-400 mt-2">⏳ กำลังสลับโหมด...</p>}
        </div>

        {/* Profile Card */}
        <div className={`bg-gradient-to-r ${cardGradient} rounded-2xl p-5 text-white shadow-lg`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm opacity-80">สวัสดี 👋</p>
              <h2 className="text-2xl font-bold mt-0.5">{profile?.full_name || 'ผู้ใช้'}</h2>
              <p className="text-sm opacity-70 mt-0.5">📍 {profile?.location || 'ปากน้ำประแส'}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {profile?.is_verified && (
                <span className="bg-white/20 text-xs px-2 py-1 rounded-full font-medium">✅ ยืนยันแล้ว</span>
              )}
              {profile?.avg_rating && profile.avg_rating > 0 && (
                <span className="bg-white/20 text-xs px-2 py-1 rounded-full">⭐ {profile.avg_rating.toFixed(1)}</span>
              )}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="bg-white/20 rounded-xl px-2 py-2 text-center">
              <div className="text-xl font-bold">{profile?.total_jobs || 0}</div>
              <div className="text-xs opacity-80">งานทั้งหมด</div>
            </div>
            <div className="bg-white/20 rounded-xl px-2 py-2 text-center">
              <div className="text-xl font-bold">{profile?.lottery_count_this_month || 0}</div>
              <div className="text-xs opacity-80">ตั๋วลอตเตอรี่</div>
            </div>
            <div className="bg-white/20 rounded-xl px-2 py-2 text-center">
              <div className="text-xl font-bold">
                ฿{isCustomerMode
                  ? ((profile?.spending_total || 0) / 1000).toFixed(1)
                  : ((profile?.earning_total || 0) / 1000).toFixed(1)}K
              </div>
              <div className="text-xs opacity-80">{isCustomerMode ? 'ใช้จ่าย' : 'รายได้'}</div>
            </div>
          </div>
        </div>

        {/* Milestone Bars */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-3">📊 Milestone Progress</h3>
          {isCustomerMode ? (
            <>
              <MilestoneBar label="จ้างงานสะสม (เป้า 3,000฿)" value={profile?.spending_total || 0} max={3000} unit="฿" color="bg-green-500" emoji="💸" />
              <MilestoneBar label="จำนวนงานที่จ้าง" value={profile?.total_jobs || 0} max={10} unit=" งาน" color="bg-blue-500" emoji="📋" />
            </>
          ) : (
            <>
              <MilestoneBar label="รายได้สะสม (เป้า 5,000฿)" value={profile?.earning_total || 0} max={5000} unit="฿" color="bg-blue-500" emoji="💰" />
              <MilestoneBar label="งานที่รับสำเร็จ" value={completedCount} max={20} unit=" งาน" color="bg-indigo-500" emoji="✅" />
            </>
          )}
          <MilestoneBar label="ตั๋วลอตเตอรี่เดือนนี้" value={profile?.lottery_count_this_month || 0} max={5} unit=" ใบ" color="bg-yellow-400" emoji="🎟️" />
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-2.5 mt-2">
            <p className="text-xs text-yellow-700">
              🎯 {isCustomerMode
                ? `จ้างงานครบ ฿3,000 รับตั๋วลอตเตอรี่ฟรี! เหลือ ฿${Math.max(0, 3000 - (profile?.spending_total || 0)).toLocaleString()}`
                : `รับงานครบ ฿5,000 รับตั๋วลอตเตอรี่ฟรี! เหลือ ฿${Math.max(0, 5000 - (profile?.earning_total || 0)).toLocaleString()}`
              }
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <div className="text-3xl font-bold text-orange-500">{pendingCount}</div>
            <div className="text-xs text-gray-500 mt-1">⏳ รอดำเนินการ</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <div className="text-3xl font-bold text-green-500">{completedCount}</div>
            <div className="text-xs text-gray-500 mt-1">✅ เสร็จสิ้น</div>
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-800">📋 {isCustomerMode ? 'งานที่จ้าง' : 'งานที่รับ'}</h3>
            {isCustomerMode && (
              <Link href="/jobs/new" className={`text-xs font-medium ${headerColor} hover:underline`}>+ จ้างงาน</Link>
            )}
          </div>
          {myJobs.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">{isCustomerMode ? '🔧' : '🔍'}</div>
              <p className="text-gray-400 text-xs">ยังไม่มีงาน</p>
              {isCustomerMode && (
                <Link href="/jobs/new" className="mt-2 inline-block bg-green-600 text-white text-xs px-3 py-1.5 rounded-xl">จ้างงานแรก!</Link>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {myJobs.map(job => (
                <Link key={job.id} href={`/jobs/${job.id}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{job.title}</p>
                    <p className="text-xs text-gray-400">{new Date(job.created_at).toLocaleDateString('th-TH')}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-sm font-medium">฿{(job.base_price || 0).toLocaleString()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      job.status === 'completed' ? 'bg-green-100 text-green-700' :
                      job.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {job.status === 'completed' ? '✅' : job.status === 'in_progress' ? '🔄' : '⏳'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pb-6">
          {isCustomerMode ? (
            <>
              <Link href="/jobs/new" className="bg-green-600 hover:bg-green-700 text-white text-center font-semibold py-3 rounded-xl text-sm transition-colors">
                🔧 จ้างงาน
              </Link>
              <Link href="/services" className="bg-white hover:bg-gray-50 text-gray-700 text-center font-semibold py-3 rounded-xl border border-gray-200 text-sm transition-colors">
                🔍 ค้นหาช่าง
              </Link>
            </>
          ) : (
            <>
              <Link href="/services/manage" className="bg-blue-600 hover:bg-blue-700 text-white text-center font-semibold py-3 rounded-xl text-sm transition-colors">
                ✏️ จัดการบริการ
              </Link>
              <Link href="/profile" className="bg-white hover:bg-gray-50 text-gray-700 text-center font-semibold py-3 rounded-xl border border-gray-200 text-sm transition-colors">
                👤 โปรไฟล์
              </Link>
            </>
          )}
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 z-50">
        <Link href="/" className="flex flex-col items-center text-gray-400 text-xs gap-0.5"><span>🏠</span>หน้าหลัก</Link>
        <Link href="/services" className="flex flex-col items-center text-gray-400 text-xs gap-0.5"><span>🔍</span>ค้นหา</Link>
        <Link href="/dashboard" className="flex flex-col items-center text-blue-600 text-xs gap-0.5"><span>📋</span>งานของฉัน</Link>
        <Link href="/profile" className="flex flex-col items-center text-gray-400 text-xs gap-0.5"><span>👤</span>โปรไฟล์</Link>
      </nav>
    </div>
  );
}

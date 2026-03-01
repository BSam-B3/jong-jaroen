'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { NotificationBell } from '@/app/components/NotificationBell';

interface Profile {
  id: string;
  full_name: string;
  role: string;
  location: string;
  phone: string;
  earning_total: number;
  avg_rating: number;
  total_jobs: number;
  is_verified: boolean;
  lottery_count_this_month: number;
}

interface Job {
  id: string;
  title: string;
  status: string;
  base_price: number;
  created_at: string;
  customer_id: string;
}

interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  unit?: string;
  color?: string;
  emoji?: string;
}

function ProgressBar({ label, value, max, unit = '', color = 'bg-blue-500', emoji = '' }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{emoji} {label}</span>
        <span className="text-sm text-gray-500">
          {value.toLocaleString()}{unit} / {max.toLocaleString()}{unit}
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
        <div
          className={`h-4 rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-right text-xs text-gray-400 mt-0.5">{pct}%</div>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={`text-lg ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`}>
          ★
        </span>
      ))}
    </div>
  );
}

export default function FreelancerDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setUserId(user.id);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData?.role !== 'freelancer') {
        router.push('/dashboard/customer');
        return;
      }
      setProfile(profileData);

      const { data: jobsData } = await supabase
        .from('jobs')
        .select('id, title, status, base_price, created_at, customer_id')
        .eq('freelancer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setJobs(jobsData || []);
      setLoading(false);
    };
    loadData();
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🔧</div>
          <p className="text-blue-700 font-medium">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  const earningGoal = 20000;
  const jobGoal = 20;
  const ratingGoal = 5;
  const pendingJobs = jobs.filter(j => j.status === 'pending').length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const currentRating = profile?.avg_rating || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔧</span>
            <div>
              <h1 className="text-lg font-bold text-blue-700 leading-none">จงเจริญ</h1>
              <p className="text-xs text-gray-400">ผู้รับจ้าง Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {userId && <NotificationBell userId={userId} />}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {loggingOut ? '...' : '🚪 ออกจากระบบ'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 space-y-5">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-500 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-100 text-sm">สวัสดีครับคุณช่าง 👷</p>
              <h2 className="text-2xl font-bold mt-1">{profile?.full_name || 'ผู้รับจ้าง'}</h2>
              <p className="text-blue-200 text-sm mt-1">📍 {profile?.location || 'ปากน้ำประแส'}</p>
            </div>
            {profile?.is_verified && (
              <div className="bg-white/20 rounded-xl px-2 py-1 text-xs font-medium">
                ✅ ยืนยันแล้ว
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <StarRating rating={currentRating} />
            <span className="text-white font-bold">{currentRating.toFixed(1)}</span>
            <span className="text-blue-200 text-sm">/ 5.0</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="bg-white/20 rounded-xl px-2 py-2 text-center">
              <div className="text-xl font-bold">{profile?.total_jobs || 0}</div>
              <div className="text-xs text-blue-100">งานทั้งหมด</div>
            </div>
            <div className="bg-white/20 rounded-xl px-2 py-2 text-center">
              <div className="text-xl font-bold">{completedJobs}</div>
              <div className="text-xs text-blue-100">เสร็จแล้ว</div>
            </div>
            <div className="bg-white/20 rounded-xl px-2 py-2 text-center">
              <div className="text-xl font-bold">฿{((profile?.earning_total || 0) / 1000).toFixed(1)}K</div>
              <div className="text-xs text-blue-100">รายได้</div>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-base font-bold text-gray-800 mb-4">📊 Progress ของคุณ</h3>
          <ProgressBar label="รายได้สะสม" value={profile?.earning_total || 0} max={earningGoal} unit=" ฿" color="bg-blue-500" emoji="💰" />
          <ProgressBar label="งานที่รับสะสม" value={profile?.total_jobs || 0} max={jobGoal} unit=" งาน" color="bg-indigo-500" emoji="📋" />
          <ProgressBar label="คะแนนรีวิว" value={currentRating} max={ratingGoal} unit=" ดาว" color="bg-yellow-400" emoji="⭐" />
          <ProgressBar label="ตั๋วลอตเตอรี่เดือนนี้" value={profile?.lottery_count_this_month || 0} max={5} unit=" ใบ" color="bg-purple-500" emoji="🎟️" />
          <div className="mt-3 space-y-2">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-xs text-blue-700 font-medium">
                🎯 รับงานครบ {jobGoal} งาน = badge "ช่างมืออาชีพ"!
              </p>
              <p className="text-xs text-blue-500 mt-0.5">
                เหลืออีก {Math.max(0, jobGoal - (profile?.total_jobs || 0))} งาน
              </p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
              <p className="text-xs text-purple-700 font-medium">
                🎟️ รายได้ครบ ฿{earningGoal.toLocaleString()} รับตั๋วลอตเตอรี่ฟรี!
              </p>
              <p className="text-xs text-purple-500 mt-0.5">
                เหลืออีก ฿{Math.max(0, earningGoal - (profile?.earning_total || 0)).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <div className="text-3xl font-bold text-orange-500">{pendingJobs}</div>
            <div className="text-sm text-gray-500 mt-1">⏳ งานรอดำเนินการ</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <div className="text-3xl font-bold text-green-500">{completedJobs}</div>
            <div className="text-sm text-gray-500 mt-1">✅ งานเสร็จแล้ว</div>
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-800">📋 งานที่รับล่าสุด</h3>
            <Link href="/services/manage" className="text-sm text-blue-600 font-medium hover:underline">
              จัดการบริการ
            </Link>
          </div>
          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🔍</div>
              <p className="text-gray-500 text-sm">ยังไม่มีงานที่รับ</p>
              <Link
                href="/services/manage"
                className="mt-3 inline-block bg-blue-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-blue-700"
              >
                เพิ่มบริการของคุณ
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{job.title || 'งานที่ไม่มีชื่อ'}</p>
                    <p className="text-xs text-gray-400">{new Date(job.created_at).toLocaleDateString('th-TH')}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-sm font-medium text-gray-700">฿{(job.base_price || 0).toLocaleString()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      job.status === 'completed' ? 'bg-green-100 text-green-700' :
                      job.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {job.status === 'completed' ? '✅' : job.status === 'pending' ? '⏳' : '🔄'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pb-6">
          <Link
            href="/services/manage"
            className="bg-blue-600 hover:bg-blue-700 text-white text-center font-semibold py-3 rounded-xl transition-colors"
          >
            ✏️ จัดการบริการ
          </Link>
          <Link
            href="/profile"
            className="bg-white hover:bg-gray-50 text-gray-700 text-center font-semibold py-3 rounded-xl border border-gray-200 transition-colors"
          >
            👤 โปรไฟล์
          </Link>
        </div>
      </main>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  full_name: string;
  role: string;
  location: string;
  phone: string;
  spending_total: number;
  lottery_count_this_month: number;
  avg_rating: number;
  total_jobs: number;
}

interface Job {
  id: string;
  title: string;
  status: string;
  base_price: number;
  created_at: string;
  rating: number | null;
}

interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  unit?: string;
  color?: string;
  emoji?: string;
}

function ProgressBar({ label, value, max, unit = '', color = 'bg-green-500', emoji = '' }: ProgressBarProps) {
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

export default function CustomerDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData?.role !== 'customer') {
        router.push('/dashboard/freelancer');
        return;
      }

      setProfile(profileData);

      const { data: jobsData } = await supabase
        .from('jobs')
        .select('id, title, status, base_price, created_at, rating')
        .eq('customer_id', user.id)
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🏠</div>
          <p className="text-green-700 font-medium">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  const spendingGoal = 10000;
  const jobGoal = 10;
  const lotteryGoal = 5;
  const pendingJobs = jobs.filter(j => j.status === 'pending').length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏠</span>
            <div>
              <h1 className="text-lg font-bold text-green-700 leading-none">จงเจริญ</h1>
              <p className="text-xs text-gray-400">ผู้ว่าจ้าง Dashboard</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {loggingOut ? '...' : '🚪 ออกจากระบบ'}
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 space-y-5">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-500 rounded-2xl p-5 text-white shadow-lg">
          <p className="text-green-100 text-sm">สวัสดีครับคุณ 👋</p>
          <h2 className="text-2xl font-bold mt-1">{profile?.full_name || 'ผู้ว่าจ้าง'}</h2>
          <p className="text-green-200 text-sm mt-1">📍 {profile?.location || 'ปากน้ำประแส'}</p>
          <div className="mt-3 flex gap-3">
            <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
              <div className="text-xl font-bold">{profile?.total_jobs || 0}</div>
              <div className="text-xs text-green-100">งานทั้งหมด</div>
            </div>
            <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
              <div className="text-xl font-bold">{profile?.lottery_count_this_month || 0}</div>
              <div className="text-xs text-green-100">ตั๋วลอตเตอรี่</div>
            </div>
            <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
              <div className="text-xl font-bold">฿{((profile?.spending_total || 0) / 1000).toFixed(1)}K</div>
              <div className="text-xs text-green-100">ยอดใช้จ่าย</div>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-base font-bold text-gray-800 mb-4">📊 Progress ของคุณ</h3>

          <ProgressBar
            label="ยอดใช้จ่ายสะสม"
            value={profile?.spending_total || 0}
            max={spendingGoal}
            unit=" ฿"
            color="bg-green-500"
            emoji="💸"
          />
          <ProgressBar
            label="งานที่จ้างสะสม"
            value={profile?.total_jobs || 0}
            max={jobGoal}
            unit=" งาน"
            color="bg-blue-500"
            emoji="📋"
          />
          <ProgressBar
            label="ตั๋วลอตเตอรี่เดือนนี้"
            value={profile?.lottery_count_this_month || 0}
            max={lotteryGoal}
            unit=" ใบ"
            color="bg-yellow-500"
            emoji="🎟️"
          />

          <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
            <p className="text-xs text-yellow-700 font-medium">
              🎯 ใช้จ่ายครบ ฿{spendingGoal.toLocaleString()} รับตั๋วลอตเตอรี่ฟรี 1 ใบ!
            </p>
            <p className="text-xs text-yellow-600 mt-0.5">
              เหลืออีก ฿{Math.max(0, spendingGoal - (profile?.spending_total || 0)).toLocaleString()}
            </p>
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
            <h3 className="text-base font-bold text-gray-800">📋 งานล่าสุด</h3>
            <Link href="/jobs/new" className="text-sm text-green-600 font-medium hover:underline">
              + จ้างงานใหม่
            </Link>
          </div>

          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🔍</div>
              <p className="text-gray-500 text-sm">ยังไม่มีงาน</p>
              <Link
                href="/jobs/new"
                className="mt-3 inline-block bg-green-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-green-700"
              >
                จ้างงานแรก!
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{job.title || 'งานที่ไม่มีชื่อ'}</p>
                    <p className="text-xs text-gray-400">{new Date(job.created_at).toLocaleDateString('th-TH')}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-sm font-medium text-gray-700">฿{(job.base_price || 0).toLocaleString()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      job.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : job.status === 'pending'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {job.status === 'completed' ? '✅' : job.status === 'pending' ? '⏳' : '🔄'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pb-6">
          <Link
            href="/jobs/new"
            className="bg-green-600 hover:bg-green-700 text-white text-center font-semibold py-3 rounded-xl transition-colors"
          >
            🔧 จ้างงาน
          </Link>
          <Link
            href="/services"
            className="bg-white hover:bg-gray-50 text-gray-700 text-center font-semibold py-3 rounded-xl border border-gray-200 transition-colors"
          >
            🔍 ค้นหาช่าง
          </Link>
        </div>
      </main>
    </div>
  );
}

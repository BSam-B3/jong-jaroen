'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const CATEGORIES = [
  { icon: '⚡', titleTH: 'ช่างไฟ', price: 350 },
  { icon: '🏠', titleTH: 'แม่บ้าน', price: 250 },
  { icon: '⛵', titleTH: 'ซ่อมเรือ', price: 500 },
  { icon: '🔧', titleTH: 'รับจ้างทั่วไป', price: 200 },
];

interface Freelancer {
  id: string;
  full_name: string;
  bio: string | null;
  avg_rating: number;
  total_jobs: number;
  skills: string[];
  is_verified: boolean;
}

export default function HomePage() {
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userMode, setUserMode] = useState('customer');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsLoggedIn(true);
        const { data: profile } = await supabase
          .from('profiles')
          .select('mode')
          .eq('id', user.id)
          .single();
        if (profile?.mode) setUserMode(profile.mode);
      }
    };
    checkAuth();

    const loadFreelancers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, bio, avg_rating, total_jobs, skills, is_verified')
        .order('avg_rating', { ascending: false })
        .limit(5);
      setFreelancers((data || []) as Freelancer[]);
    };
    loadFreelancers();
  }, []);

  const dashboardHref = '/dashboard';

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-blue-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-yellow-500 rounded-full flex items-center justify-center text-blue-900 font-black text-sm">JJ</div>
          <div>
            <div className="font-bold text-sm">จงเจริญ</div>
            <div className="text-yellow-400 text-xs">PandVHappiness</div>
          </div>
        </div>
        {isLoggedIn ? (
          <Link href={dashboardHref} className="bg-yellow-500 text-blue-900 text-xs font-bold px-3 py-1.5 rounded-full">
            Dashboard
          </Link>
        ) : (
          <Link href="/auth/login" className="bg-yellow-500 text-blue-900 text-xs font-bold px-3 py-1.5 rounded-full">
            Login
          </Link>
        )}
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white px-4 py-8 text-center">
        <h1 className="text-2xl font-black mb-1">Hire Local, Get Lucky!</h1>
        <p className="text-blue-200 text-sm mb-4">จ้างช่างปากน้ำประแส รับคูปองจงเจริญฟรี!</p>
        <div className="bg-white/10 border border-yellow-400/40 rounded-2xl p-4 mx-auto max-w-xs">
          <div className="text-yellow-400 text-xs font-semibold mb-1">🎟️ คูปองจงเจริญของคุณ</div>
          <div className="text-4xl font-black text-yellow-300 tracking-widest my-2">JJ-????</div>
          <div className="text-blue-200 text-xs">จ้างงานทุกครั้ง = รับคูปองทันที!</div>
        </div>
        <div className="mt-4 flex gap-3 justify-center">
          {!isLoggedIn && (
            <>
              <Link href="/auth/signup" className="bg-yellow-500 text-blue-900 font-bold px-5 py-2.5 rounded-full text-sm">
                สมัครสมาชิก
              </Link>
              <Link href="/auth/login" className="bg-white/20 text-white font-bold px-5 py-2.5 rounded-full text-sm border border-white/30">
                เข้าสู่ระบบ
              </Link>
            </>
          )}
          {isLoggedIn && (
            <Link href="/jobs/new" className="bg-yellow-500 text-blue-900 font-bold px-5 py-2.5 rounded-full text-sm">
              🔧 จ้างงานเลย!
            </Link>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="px-4 py-5">
        <h2 className="text-blue-900 font-bold text-base mb-3">หมวดหมู่บริการ</h2>
        <div className="grid grid-cols-4 gap-2">
          {CATEGORIES.map((s, i) => (
            <Link key={i} href="/services" className="bg-white flex flex-col items-center p-3 rounded-xl shadow-sm border border-blue-50 text-center hover:border-blue-300 transition-colors">
              <span className="text-2xl">{s.icon}</span>
              <span className="text-xs font-medium text-blue-900 mt-1">{s.titleTH}</span>
              <span className="text-xs text-gray-400">฿{s.price}+</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Freelancers */}
      <section className="px-4 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-blue-900 font-bold text-base">ช่างแนะนำในประแส</h2>
          <Link href="/services" className="text-blue-600 text-xs font-medium">ดูทั้งหมด →</Link>
        </div>
        <div className="flex flex-col gap-3">
          {freelancers.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">กำลังโหลด...</div>
          ) : (
            freelancers.map((f) => (
              <div key={f.id} className="bg-white rounded-2xl shadow-sm border border-blue-50 p-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {f.full_name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <div className="font-semibold text-blue-900 text-sm truncate">{f.full_name}</div>
                    {f.is_verified && <span className="text-blue-500 text-xs">✓</span>}
                  </div>
                  <div className="text-gray-500 text-xs truncate">{f.bio || 'ช่างฝีมือดีปากน้ำประแส'}</div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-yellow-500 text-xs">⭐ {(f.avg_rating || 0).toFixed(1)}</span>
                    <span className="text-gray-400 text-xs">{f.total_jobs || 0} งาน</span>
                    {(f.skills || []).slice(0, 2).map((skill, si) => (
                      <span key={si} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">{skill}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <Link href={isLoggedIn ? '/jobs/new' : '/auth/login'} className="bg-blue-900 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    จ้างเลย!
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 z-50">
        <Link href="/" className="flex flex-col items-center text-blue-900 text-xs gap-0.5">
          <span>🏠</span>หน้าหลัก
        </Link>
        <Link href="/services" className="flex flex-col items-center text-gray-400 text-xs gap-0.5">
          <span>🔍</span>ค้นหา
        </Link>
        <Link href={isLoggedIn ? '/dashboard' : '/auth/login'} className="flex flex-col items-center text-gray-400 text-xs gap-0.5">
          <span>📋</span>งานของฉัน
        </Link>
        <Link href={isLoggedIn ? '/profile' : '/auth/login'} className="flex flex-col items-center text-gray-400 text-xs gap-0.5">
          <span>👤</span>โปรไฟล์
        </Link>
      </nav>
    </main>
  );
}

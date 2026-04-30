'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import PushToggle from '@/app/components/PushToggle';

export default function ProfilePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      setProfile(data);
      setLoading(false);
    }
    getProfile();
  }, [router, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#EE4D2D] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-10">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-x-hidden">
        
        {/* 🟠 Header ส้มจงเจริญ */}
        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] p-6 pt-12 pb-8 shadow-sm relative z-20 flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm shadow-inner border border-white/30 overflow-hidden shrink-0">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-3xl overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover" alt="profile" />
              ) : '👤'}
            </div>
          </div>

          <div className="flex flex-col">
            <h1 className="text-white text-lg font-black tracking-tight line-clamp-1">
              {profile?.full_name || 'สมาชิกจงเจริญ'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/30 backdrop-blur-sm">
                Classic
              </span>
              <span className="text-white/80 text-[10px] font-bold tracking-wider uppercase">
                ID: {profile?.id?.slice(0, 8)}
              </span>
            </div>
          </div>
        </div>

        <main className="flex-1 relative z-10 space-y-3 mt-3">
          
          {/* 🌟 Section 1: ระบบแจ้งเตือน (ขยับขึ้นบนสุด และลดขนาดลง) */}
          <section className="px-4 py-1">
             <div className="bg-white rounded-[1.2rem] shadow-sm border border-gray-100 overflow-hidden transform scale-[0.95] origin-top">
               <PushToggle />
             </div>
          </section>

          {/* 🌟 Section 2: เมนูการจัดการ (List Style ทั้งหมด) */}
          <section className="bg-white shadow-sm border-y border-gray-100">
            
            {/* ✅ งานของฉัน (ปรับเป็นแถวเดียว รูปกระเป๋า 💼) */}
            <Link href="/my-jobs" className="flex items-center justify-between p-3.5 hover:bg-gray-50 transition-colors active:bg-gray-100 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <span className="text-[22px]">💼</span>
                <span className="font-medium text-gray-800 text-sm">งานของฉัน</span>
              </div>
              <span className="text-gray-400 text-lg font-bold">›</span>
            </Link>

            <Link href="/profile/edit" className="flex items-center justify-between p-3.5 hover:bg-gray-50 transition-colors active:bg-gray-100 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <span className="text-[22px]">⚙️</span>
                <span className="font-medium text-gray-800 text-sm">จัดการข้อมูลส่วนตัว</span>
              </div>
              <span className="text-gray-400 text-lg font-bold">›</span>
            </Link>
            
            <Link href="/support" className="flex items-center justify-between p-3.5 hover:bg-gray-50 transition-colors active:bg-gray-100 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <span className="text-[22px]">🎧</span>
                <span className="font-medium text-gray-800 text-sm">ศูนย์ช่วยเหลือ (Help Center)</span>
              </div>
              <span className="text-gray-400 text-lg font-bold">›</span>
            </Link>

            <Link href="/about" className="flex items-center justify-between p-3.5 hover:bg-gray-50 transition-colors active:bg-gray-100">
              <div className="flex items-center gap-3">
                <span className="text-[22px]">ℹ️</span>
                <span className="font-medium text-gray-800 text-sm">เกี่ยวกับจงเจริญ</span>
              </div>
              <span className="text-gray-400 text-lg font-bold">›</span>
            </Link>
          </section>

          {/* 🌟 Section 3: ปุ่มออกจากระบบ */}
          <div className="px-4 pt-4 pb-8">
            <button 
              onClick={handleSignOut}
              className="w-full py-3 bg-white border border-gray-200 text-gray-500 font-bold text-sm rounded-xl shadow-sm active:scale-95 transition-all hover:bg-red-50 hover:text-red-500 hover:border-red-100 flex items-center justify-center gap-2"
            >
              ออกจากระบบ 🚪
            </button>
          </div>

        </main>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
// ✅ Import ปุ่ม PushToggle มาใช้งาน
import PushToggle from '@/app/components/PushToggle';

export default function ProfilePage() {
  const router = useRouter();
  // ✅ ใช้ useMemo เพื่อป้องกันการ render ซ้ำซ้อน
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#EE4D2D] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans">
      {/* Header สวยๆ */}
      <div className="bg-white px-6 pt-16 pb-12 rounded-b-[3rem] shadow-sm border-b border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-orange-50 rounded-full -mr-20 -mt-20 blur-3xl" />
        
        <div className="flex flex-col items-center relative z-10">
          <div className="w-28 h-28 rounded-[2.5rem] bg-gradient-to-tr from-[#EE4D2D] to-[#FF7337] p-1 shadow-2xl mb-5">
            <div className="w-full h-full rounded-[2.3rem] bg-white flex items-center justify-center text-4xl overflow-hidden border-4 border-white">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover" alt="profile" />
              ) : '👤'}
            </div>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-1 italic">
            {profile?.full_name || 'สมาชิกจงเจริญ'}
          </h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">
            ID: {profile?.id?.slice(0, 8)}
          </p>
        </div>
      </div>

      <main className="px-6 -mt-8 space-y-4">
        {/* 🌟 ส่วนการตั้งค่าแจ้งเตือน (ที่เราเพิ่งทำ) */}
        <section>
           <PushToggle />
        </section>

        {/* เมนูอื่นๆ */}
        <section className="bg-white rounded-[2rem] p-2 shadow-sm border border-gray-50">
          <Link href="/profile/edit" className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors">
            <div className="flex items-center gap-4">
              <span className="text-xl">📝</span>
              <span className="font-bold text-gray-700 text-sm">แก้ไขข้อมูลส่วนตัว</span>
            </div>
            <span className="text-gray-300">→</span>
          </Link>
          
          <div className="h-[1px] bg-gray-50 mx-4" />
          
          <Link href="/my-jobs" className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors">
            <div className="flex items-center gap-4">
              <span className="text-xl">📋</span>
              <span className="font-bold text-gray-700 text-sm">ประวัติงานของฉัน</span>
            </div>
            <span className="text-gray-300">→</span>
          </Link>
        </section>

        {/* ปุ่มออกจากระบบ */}
        <button 
          onClick={handleSignOut}
          className="w-full py-5 bg-white border border-red-100 text-red-500 font-black rounded-[2rem] shadow-sm active:scale-95 transition-transform hover:bg-red-50"
        >
          ออกจากระบบ 🚪
        </button>
      </main>
      
      {/* ✂️ เจมลบ Navigation Bar ส่วนเกินตรงนี้ออกให้แล้วค่ะ */}
    </div>
  );
}

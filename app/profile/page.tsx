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
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-24">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-x-hidden">
        
        {/* 🟠 Header ส้มจงเจริญ */}
        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-b-[2.5rem] p-6 pt-12 pb-10 shadow-md relative z-20 flex flex-col items-center">
          
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm shadow-inner border border-white/30 overflow-hidden mb-4 p-1">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-4xl overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover" alt="profile" />
              ) : '👤'}
            </div>
          </div>

          <h1 className="text-white text-2xl font-black tracking-tight mb-1">
            {profile?.full_name || 'สมาชิกจงเจริญ'}
          </h1>
          <p className="text-white/80 text-[10px] font-bold tracking-wider bg-black/10 px-4 py-1.5 rounded-full mt-1 uppercase">
            ID: {profile?.id?.slice(0, 8)}
          </p>
        </div>

        <main className="px-5 mt-4 flex-1 relative z-10 mb-6 space-y-4">
          {/* 🌟 ส่วนการตั้งค่าแจ้งเตือน (ใส่กรอบให้เข้าเซ็ต) */}
          <section className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden">
             <PushToggle />
          </section>

          {/* เมนูอื่นๆ ปรับให้เหมือน Reference */}
          <section className="bg-white rounded-[1.5rem] p-2 shadow-sm border border-gray-100">
            <Link href="/profile/edit" className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors active:scale-95">
              <div className="flex items-center gap-4">
                {/* ✅ เปลี่ยนเป็นไอคอนฟันเฟือง ตามที่บรีฟ */}
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-2xl">⚙️</div>
                <span className="font-black text-gray-800 text-sm">จัดการข้อมูลส่วนตัว</span>
              </div>
              <span className="text-gray-300 font-bold text-xl">›</span>
            </Link>
            
            <div className="h-[1px] bg-gray-50 mx-4" />
            
            <Link href="/my-jobs" className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors active:scale-95">
              <div className="flex items-center gap-4">
                {/* ปรับสีพื้นหลังไอคอนให้คลีนๆ */}
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-2xl">📋</div>
                <span className="font-black text-gray-800 text-sm">ประวัติงานของฉัน</span>
              </div>
              <span className="text-gray-300 font-bold text-xl">›</span>
            </Link>
          </section>

          {/* ปุ่มออกจากระบบ */}
          <button 
            onClick={handleSignOut}
            className="w-full py-4 bg-white border border-red-100 text-[#EE4D2D] font-black text-sm rounded-[1.5rem] shadow-sm active:scale-95 transition-all hover:bg-red-50 mt-2 flex items-center justify-center gap-2"
          >
            ออกจากระบบ 🚪
          </button>
        </main>

        {/* Navigation Bar ด้านล่าง */}
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <nav className="w-full sm:max-w-2xl md:max-w-3xl pb-6 px-6 pointer-events-auto">
            <div className="bg-gray-900/95 backdrop-blur-xl rounded-[2rem] py-3.5 px-8 flex justify-between items-center shadow-2xl border border-white/10">
              <Link href="/win-online" className="text-gray-400 text-2xl hover:text-white transition-colors active:scale-95">🏠</Link>
              <Link href="/my-jobs" className="text-gray-400 text-2xl hover:text-white transition-colors active:scale-95">💼</Link>
              <Link href="/profile" className="text-white text-2xl relative transition-transform scale-110 active:scale-95">
                  👤
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#EE4D2D] rounded-full shadow-[0_0_8px_#EE4D2D]" />
              </Link>
            </div>
          </nav>
        </div>

      </div>
    </div>
  );
}

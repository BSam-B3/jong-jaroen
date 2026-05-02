'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import PushToggle from '@/app/components/PushToggle';
import BottomNav from '@/app/components/BottomNav';

export default function ProfilePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      setProfile(profileData);
      setLoading(false);

      const { data: walletData } = await supabase
        .from('wallets')
        .select('balance_satang')
        .eq('owner_id', session.user.id)
        .eq('kind', 'user')
        .maybeSingle();

      if (walletData) {
        setWalletBalance(walletData.balance_satang / 100);
      }
      setIsLoadingWallet(false);
    }
    
    fetchData();
  }, [router, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#EE4D2D] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex justify-center font-sans pb-10">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F8FAFC] min-h-screen relative flex flex-col shadow-xl overflow-x-hidden">
        
        {/* 🟠 Header โฉมใหม่ (จัดกลาง + ไล่สีนุ่มขึ้น) */}
        <div className="bg-gradient-to-br from-[#EE4D2D] via-[#FF6243] to-[#FF8A65] rounded-b-[3rem] px-6 pt-12 pb-20 shadow-lg relative z-10 flex flex-col items-center text-center">
          
          {/* 🚪 ปุ่มออกจากระบบ (ย้ายไปมุมซ้ายให้บาลานซ์ หรือไว้ขวาเหมือนเดิม) */}
          <button 
            onClick={handleSignOut}
            className="absolute top-6 right-6 text-white bg-white/20 hover:bg-white/30 active:scale-95 transition-all text-xs font-bold px-4 py-2 rounded-full backdrop-blur-md shadow-sm flex items-center gap-2"
          >
            ออกจากระบบ 🚪
          </button>

          {/* 👤 รูปโปรไฟล์ */}
          <div className="relative mb-4">
            <div className="w-24 h-24 bg-white p-1 rounded-full shadow-xl">
              <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-4xl overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} className="w-full h-full object-cover" alt="profile" />
                ) : '👤'}
              </div>
            </div>
            {/* จุด Online สีเขียว */}
            <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full"></div>
          </div>

          {/* 📝 ชื่อและข้อมูล */}
          <h1 className="text-white text-2xl font-black tracking-tight drop-shadow-sm mb-1">
            {profile?.full_name || 'สมาชิกจงเจริญ'}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="bg-white text-[#EE4D2D] text-[10px] font-black px-3 py-1 rounded-full shadow-sm">
              👑 สมาชิก Classic
            </span>
            <span className="text-white/90 text-xs font-bold tracking-wider uppercase bg-black/10 px-3 py-1 rounded-full backdrop-blur-sm">
              ID: {profile?.id?.slice(0, 8)}
            </span>
          </div>
        </div>

        {/* 💳 การ์ดกระเป๋าเงิน (ดันขึ้นไปเกยทับ Header) */}
        <div 
          onClick={() => router.push('/wallet')}
          className="mx-5 -mt-12 bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-[2rem] p-6 text-white shadow-2xl cursor-pointer active:scale-95 transition-transform relative z-20 overflow-hidden border border-gray-700/50"
        >
          {/* แสงสะท้อนบนการ์ด */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#EE4D2D]/20 rounded-full blur-xl -ml-10 -mb-10"></div>

          <div className="flex justify-between items-center mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-xl">💸</span>
              <span className="font-bold text-gray-300 text-sm tracking-wide">กระเป๋าตังค์ของฉัน</span>
            </div>
            <div className="flex items-center text-gray-900 bg-emerald-400 px-4 py-1.5 rounded-full text-xs font-black shadow-lg">
              ถอนเงิน <span className="ml-1 text-lg leading-none">›</span>
            </div>
          </div>
          
          <div className="flex items-baseline gap-1 relative z-10">
            <span className="text-4xl font-black tracking-tight">
              {isLoadingWallet ? '...' : `฿${walletBalance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`}
            </span>
          </div>
        </div>

        {/* ✅ ปรับ UI เมนูต่างๆ ให้เป็นสไตล์ Card */}
        <main className="flex-1 relative z-10 px-5 mt-6 pb-32 space-y-4">
          
          {/* 🌟 Section 1: ระบบแจ้งเตือน */}
          <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 p-2">
            <PushToggle />
          </div>

          {/* 🌟 Section 2: เมนูการจัดการ */}
          <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
            
            <Link href="/my-jobs" className="flex items-center justify-between p-4 hover:bg-orange-50/50 transition-colors active:bg-gray-50 group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">💼</div>
                <span className="font-bold text-gray-800 text-sm">งานของฉัน</span>
              </div>
              <span className="text-gray-300 text-xl font-bold group-hover:text-[#EE4D2D] transition-colors">›</span>
            </Link>

            <Link href="/profile/edit" className="flex items-center justify-between p-4 hover:bg-orange-50/50 transition-colors active:bg-gray-50 group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">⚙️</div>
                <span className="font-bold text-gray-800 text-sm">จัดการข้อมูลส่วนตัว</span>
              </div>
              <span className="text-gray-300 text-xl font-bold group-hover:text-[#EE4D2D] transition-colors">›</span>
            </Link>
            
            <Link href="/support" className="flex items-center justify-between p-4 hover:bg-orange-50/50 transition-colors active:bg-gray-50 group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🎧</div>
                <span className="font-bold text-gray-800 text-sm">ศูนย์ช่วยเหลือ (Help Center)</span>
              </div>
              <span className="text-gray-300 text-xl font-bold group-hover:text-[#EE4D2D] transition-colors">›</span>
            </Link>

            <Link href="/about" className="flex items-center justify-between p-4 hover:bg-orange-50/50 transition-colors active:bg-gray-50 group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">ℹ️</div>
                <span className="font-bold text-gray-800 text-sm">เกี่ยวกับจงเจริญ</span>
              </div>
              <span className="text-gray-300 text-xl font-bold group-hover:text-[#EE4D2D] transition-colors">›</span>
            </Link>
          </div>

        </main>

        {/* ✅ BottomNav */}
        <BottomNav />

      </div>
    </div>
  );
}

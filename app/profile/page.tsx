"use client";

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

  const handleRiderModeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // ✅ ลิงก์ไปยังหน้า Rider Board ที่เราทำเสร็จแล้ว
    router.push('/marketplace/rider');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#EE4D2D] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-24 md:pb-10">
      <div className="w-full lg:max-w-5xl xl:max-w-6xl bg-[#F8FAFC] min-h-screen relative flex flex-col md:shadow-2xl overflow-x-hidden md:border-x border-gray-200/50">
        
        {/* Header ส่วนหัวโปรไฟล์ */}
        <div className="bg-gradient-to-br from-[#EE4D2D] via-[#FF6243] to-[#FF8A65] rounded-b-[3rem] md:rounded-b-[4rem] px-6 pt-12 pb-24 md:pb-32 shadow-lg relative z-10 flex flex-col items-center text-center">
          
          <button 
            onClick={handleSignOut}
            className="absolute top-6 right-6 md:top-10 md:right-10 text-white bg-white/20 hover:bg-red-500 active:scale-95 transition-all text-xs font-black px-5 py-2.5 rounded-full backdrop-blur-md shadow-sm flex items-center gap-2"
          >
            ออกจากระบบ 🚪
          </button>

          <div className="relative mb-6">
            <div className="w-28 h-28 md:w-36 md:h-36 bg-white p-1.5 rounded-full shadow-2xl">
              <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-5xl md:text-6xl overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} className="w-full h-full object-cover" alt="profile" />
                ) : '👤'}
              </div>
            </div>
            <div className="absolute bottom-2 right-2 w-6 h-6 md:w-8 md:h-8 bg-emerald-500 border-4 border-white rounded-full shadow-lg"></div>
          </div>

          <h1 className="text-white text-3xl md:text-5xl font-black tracking-tight drop-shadow-md mb-2">
            {profile?.full_name || 'สมาชิกจงเจริญ'}
          </h1>
          
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            <span className="bg-white text-[#EE4D2D] text-[10px] md:text-xs font-black px-4 py-1.5 rounded-full shadow-sm">
              👑 สมาชิก Classic
            </span>
            <span className="text-white/90 text-[10px] md:text-xs font-bold tracking-wider uppercase bg-black/10 px-4 py-1.5 rounded-full backdrop-blur-sm">
              ID: {profile?.id?.slice(0, 8)}
            </span>
          </div>
        </div>

        {/* การ์ดกระเป๋าเงิน */}
        <div className="px-5 md:px-20 -mt-16 md:-mt-20 relative z-20 w-full max-w-4xl mx-auto">
          <div 
            onClick={() => router.push('/wallet')}
            className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-[2.5rem] p-8 md:p-12 text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden border border-gray-700/50 group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-[#EE4D2D]/10 transition-colors"></div>
            
            <div className="flex justify-between items-center mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl backdrop-blur-sm">💰</div>
                <div className="flex flex-col">
                  <span className="font-bold text-gray-400 text-xs uppercase tracking-[0.2em]">ยอดเงินคงเหลือ</span>
                  <span className="font-black text-gray-200 text-sm">กระเป๋าเงินจงเจริญ</span>
                </div>
              </div>
              <div className="flex items-center text-gray-900 bg-[#00C300] px-6 py-2.5 rounded-full text-sm font-black shadow-[0_0_20px_rgba(0,195,0,0.4)] group-hover:scale-105 transition-transform">
                ถอนเงิน <span className="ml-2 text-xl leading-none">›</span>
              </div>
            </div>
            
            <div className="flex items-baseline gap-2 relative z-10">
              <span className="text-gray-400 text-2xl font-bold">฿</span>
              <span className="text-5xl md:text-7xl font-black tracking-tighter">
                {isLoadingWallet ? '...' : walletBalance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Section สถิติ */}
        <div className="px-5 md:px-20 mt-6 relative z-20 w-full max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-3 md:gap-5">
            <div className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
              <span className="text-2xl md:text-3xl mb-1 md:mb-2">⭐</span>
              <span className="font-black text-gray-800 text-lg md:text-2xl">5.0</span>
              <span className="text-[9px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">คะแนนรีวิว</span>
            </div>
            <div className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
              <span className="text-2xl md:text-3xl mb-1 md:mb-2">🏆</span>
              <span className="font-black text-[#00C300] text-lg md:text-2xl">12</span>
              <span className="text-[9px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">งานสำเร็จ</span>
            </div>
            <div className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
              <span className="text-2xl md:text-3xl mb-1 md:mb-2">⚡</span>
              <span className="font-black text-[#EE4D2D] text-lg md:text-2xl">100%</span>
              <span className="text-[9px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">ตอบกลับ</span>
            </div>
          </div>
        </div>

        {/* เมนูหลัก */}
        <main className="flex-1 relative z-10 px-5 md:px-20 mt-6 pb-32 space-y-6 w-full max-w-4xl mx-auto">
          
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-2 md:p-4">
            <PushToggle />
          </div>

          {/* Section: กระเป๋า Jobs-Card */}
          <div className="bg-white rounded-[2rem] shadow-md border-2 border-emerald-50 overflow-hidden">
            <div className="bg-emerald-50 px-6 py-3 border-b border-emerald-100 flex items-center justify-between">
              <span className="text-[11px] font-black text-emerald-700 uppercase tracking-widest">การนำเสนอของฉัน</span>
              <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md animate-pulse">LIVE</span>
            </div>
            
            <Link href="/profile/jobs-cards" className="flex items-center justify-between p-6 hover:bg-emerald-50/30 transition-all active:bg-emerald-50 group">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-3xl shadow-lg shadow-emerald-100 group-hover:rotate-6 transition-transform">
                  📇
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-gray-800 text-lg">กระเป๋า Jobs-Card ของฉัน</span>
                  <span className="text-xs font-bold text-gray-400 mt-0.5">สร้างและแก้ไขนามบัตรบริการเพื่อใช้โพสต์งาน</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all text-emerald-500">
                <span className="text-2xl font-bold">›</span>
              </div>
            </Link>
          </div>

          {/* 🆕 Section: กระเป๋า Shop-Card (ร้านค้าชุมชน) */}
          <div className="bg-white rounded-[2rem] shadow-md border-2 border-orange-50 overflow-hidden">
            <div className="bg-orange-50 px-6 py-3 border-b border-orange-100 flex items-center justify-between">
              <span className="text-[11px] font-black text-[#EE4D2D] uppercase tracking-widest">ร้านค้าของฉัน</span>
              <span className="bg-[#EE4D2D] text-white text-[10px] font-black px-2 py-0.5 rounded-md animate-pulse">SHOP</span>
            </div>
            
            <Link href="/profile/shop-cards" className="flex items-center justify-between p-6 hover:bg-orange-50/50 transition-all active:bg-orange-50 group">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-[#EE4D2D] text-white flex items-center justify-center text-3xl shadow-lg shadow-[#EE4D2D]/20 group-hover:-rotate-6 transition-transform">
                  🏪
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-gray-800 text-lg">กระเป๋า Shop-Card</span>
                  <span className="text-xs font-bold text-gray-400 mt-0.5">ลงทะเบียนร้าน เปิด/ปิดร้าน และจัดการสินค้า</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center group-hover:bg-[#EE4D2D] group-hover:text-white transition-all text-[#EE4D2D]">
                <span className="text-2xl font-bold">›</span>
              </div>
            </Link>
          </div>

          {/* Section: เมนูทั่วไป */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
            
            <button onClick={handleRiderModeClick} className="w-full flex items-center justify-between p-5 hover:bg-orange-50/50 transition-colors active:bg-gray-50 group text-left">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-2xl flex items-center justify-center group-hover:scale-110 transition-transform">🛵</div>
                <div className="flex flex-col">
                  <span className="font-bold text-gray-800 text-base">โหมดคนขับ (Rider Board)</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">รับงานจัดส่งสินค้า</span>
                </div>
              </div>
              <span className="text-gray-300 text-2xl font-bold group-hover:text-[#EE4D2D] transition-colors pr-2">›</span>
            </button>

            <Link href="/marketplace/orders" className="flex items-center justify-between p-5 hover:bg-orange-50/50 transition-colors active:bg-gray-50 group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-2xl flex items-center justify-center group-hover:scale-110 transition-transform">💼</div>
                <div className="flex flex-col">
                  <span className="font-bold text-gray-800 text-base">ประวัติคำสั่งซื้อ</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Track your orders</span>
                </div>
              </div>
              <span className="text-gray-300 text-2xl font-bold group-hover:text-[#EE4D2D] transition-colors pr-2">›</span>
            </Link>

            <Link href="/profile/edit" className="flex items-center justify-between p-5 hover:bg-orange-50/50 transition-colors active:bg-gray-50 group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-2xl flex items-center justify-center group-hover:scale-110 transition-transform">⚙️</div>
                <div className="flex flex-col">
                  <span className="font-bold text-gray-800 text-base">จัดการข้อมูลส่วนตัว</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Profile Settings</span>
                </div>
              </div>
              <span className="text-gray-300 text-2xl font-bold group-hover:text-[#EE4D2D] transition-colors pr-2">›</span>
            </Link>
            
            <Link href="/about" className="flex items-center justify-between p-5 hover:bg-orange-50/50 transition-colors active:bg-gray-50 group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-2xl flex items-center justify-center group-hover:scale-110 transition-transform">ℹ️</div>
                <div className="flex flex-col">
                  <span className="font-bold text-gray-800 text-base">เกี่ยวกับจงเจริญ</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">About App</span>
                </div>
              </div>
              <span className="text-gray-300 text-2xl font-bold group-hover:text-[#EE4D2D] transition-colors pr-2">›</span>
            </Link>
          </div>

        </main>

        <BottomNav />
      </div>
    </div>
  );
}

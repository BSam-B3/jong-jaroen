'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/app/components/BottomNav';

export default function ProfilePage() {
  const router = useRouter();

  // State สำหรับจัดการข้อมูล
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/auth/login');
          return;
        }

        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;

        if (profileData) {
          setUserProfile({
            ...profileData,
            initial: profileData.first_name ? profileData.first_name.charAt(0).toUpperCase() : '?',
            // ✅ แก้ไข: ใช้ phone_number ตามฐานข้อมูลจริง
            formattedPhone: profileData.phone_number ? formatPhone(profileData.phone_number) : 'ยังไม่ระบุเบอร์โทรศัพท์',
            // ✅ แก้ไข: นำ first_name และ last_name มาต่อกัน
            full_name: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || 'ผู้ใช้งานชุมชน',
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  const formatPhone = (phone: string) => {
    let p = phone;
    if (p.startsWith('66')) p = '0' + p.slice(2);
    if (p.length === 10) return `${p.slice(0, 3)}-${p.slice(3, 6)}-${p.slice(6)}`;
    return p;
  };

  const handleSignOut = async () => {
    if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
      await supabase.auth.signOut();
      router.push('/auth/login');
    }
  };

  const handleRegisterProvider = () => {
    alert('ฟีเจอร์ลงทะเบียนพาร์ทเนอร์ (คนขับ/ช่าง) กำลังอยู่ในช่วงพัฒนาสำหรับเฟสต่อไปค่ะ 🚀');
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans">
      <div className="w-full max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-2xl overflow-x-hidden border-x border-gray-100">
        
        {/* 🟠 Premium Header (Glassmorphism Style) */}
        <div className="m-4 bg-gradient-to-br from-[#EE4D2D] to-[#FF7337] rounded-[2.5rem] p-8 shadow-lg relative z-10 overflow-hidden pb-12">
          {/* แสงเงาตกแต่งข้างหลัง */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="flex items-center gap-6 relative z-20">
            {/* รูปโปรไฟล์อัปเกรด */}
            <div className="w-20 h-20 bg-white rounded-[1.5rem] rotate-3 shadow-xl flex items-center justify-center text-3xl font-black text-[#EE4D2D] relative border-4 border-white/30 transition-transform hover:rotate-0 cursor-pointer shrink-0">
              {isLoading ? (
                <div className="w-full h-full bg-orange-50 animate-pulse rounded-2xl"></div>
              ) : (
                <span className="-rotate-3">{userProfile?.initial}</span>
              )}
              <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg border border-gray-100">
                <span className="text-[10px] block leading-none">✏️</span>
              </div>
            </div>
            
            <div className="text-white overflow-hidden">
              {isLoading ? (
                <div className="space-y-3">
                  <div className="h-6 w-40 bg-white/30 rounded-lg animate-pulse"></div>
                  <div className="h-4 w-24 bg-white/20 rounded-lg animate-pulse"></div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight truncate">{userProfile?.full_name}</h1>
                  </div>
                  <p className="text-white/90 text-[11px] sm:text-xs font-bold mt-1.5 opacity-90 truncate">{userProfile?.formattedPhone}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 📋 ส่วนเนื้อหาหลัก (✅ ต่อโค้ดให้สมบูรณ์แล้ว) */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 space-y-4 pb-32 -mt-8 relative z-20 scrollbar-hide">
          
          {/* 🌟 แบนเนอร์สมัครไรเดอร์ (รับสมัครพาร์ทเนอร์) */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-[2rem] p-6 shadow-xl text-white relative overflow-hidden group">
            <div className="absolute right-0 bottom-0 text-8xl opacity-10 transform translate-x-4 translate-y-4 group-hover:scale-110 transition-transform duration-500">🛵</div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-orange-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">เปิดรับสมัคร</span>
              </div>
              <h3 className="text-lg font-black mb-1">ร่วมเป็นพาร์ทเนอร์</h3>
              <p className="text-[11px] text-gray-300 mb-5 leading-relaxed max-w-[75%] font-medium">
                สมัครเป็นไรเดอร์ หรือช่างชุมชน รับรายได้ 100% ไม่มีหักเปอร์เซ็นต์
              </p>
              <button onClick={handleRegisterProvider} className="bg-gradient-to-r from-[#FF5A2D] to-[#EE4D2D] text-white px-6 py-3 rounded-full text-xs font-black shadow-lg active:scale-95 transition-all">
                ยืนยันตัวตนเลย 🚀
              </button>
            </div>
          </div>

          {/* ⚙️ เมนูการตั้งค่า */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-50 flex items-center justify-between cursor-pointer hover:bg-orange-50/50 transition-colors">
              <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 text-lg">💳</div><span className="text-sm font-bold text-gray-700">ช่องทางการชำระเงิน</span></div>
              <span className="text-gray-300 font-bold">›</span>
            </div>
            <div className="p-5 border-b border-gray-50 flex items-center justify-between cursor-pointer hover:bg-orange-50/50 transition-colors">
              <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500 text-lg">📍</div><span className="text-sm font-bold text-gray-700">ที่อยู่ที่บันทึกไว้</span></div>
              <span className="text-gray-300 font-bold">›</span>
            </div>
            <div className="p-5 flex items-center justify-between cursor-pointer hover:bg-orange-50/50 transition-colors">
              <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 text-lg">🎧</div><span className="text-sm font-bold text-gray-700">ศูนย์ช่วยเหลือ (Support)</span></div>
              <span className="text-gray-300 font-bold">›</span>
            </div>
          </div>

          {/* 🔴 ปุ่มออกจากระบบ */}
          <button onClick={handleSignOut} className="w-full bg-white hover:bg-red-50 text-red-500 py-4.5 rounded-[2rem] text-sm font-black transition-all border border-gray-100 hover:border-red-100 shadow-sm mt-2 active:scale-95">
            ออกจากระบบ
          </button>

          <div className="text-center pt-4 pb-6">
            <p className="text-[10px] text-gray-400 font-bold tracking-wider uppercase">Jong Jaroen App v1.0.0</p>
          </div>
        </div>

        {/* แถบเมนูด้านล่าง */}
        <BottomNav />
      </div>
      <style dangerouslySetInnerHTML={{__html: `.scrollbar-hide::-webkit-scrollbar { display: none; }`}} />
    </div>
  );
}

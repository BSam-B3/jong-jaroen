'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ProfilePage() {
  const router = useRouter();

  // State เก็บข้อมูลผู้ใช้
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ดึงข้อมูลผู้ใช้จาก Supabase
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // 1. เช็ค Session ว่าล็อกอินอยู่ไหม
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // ถ้าไม่ได้ล็อกอิน ให้เด้งไปหน้า Login
          router.push('/auth/login');
          return;
        }

        // 2. ดึงข้อมูลจากตาราง profiles
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;

        if (profileData) {
          setUserProfile({
            ...profileData,
            // ดึงอักษรตัวแรกของชื่อมาทำเป็นรูปโปรไฟล์
            initial: profileData.first_name ? profileData.first_name.charAt(0).toUpperCase() : '?',
            // จัดฟอร์แมตเบอร์โทรให้สวยงาม (ถ้ามี)
            formattedPhone: profileData.phone ? formatPhone(profileData.phone) : 'ยังไม่ระบุเบอร์โทร',
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

  // ฟังก์ชันจัดฟอร์แมตเบอร์โทร (เช่น 0812345678 -> 081-234-5678)
  const formatPhone = (phone: string) => {
    let p = phone;
    if (p.startsWith('66')) p = '0' + p.slice(2);
    if (p.length === 10) return `${p.slice(0, 3)}-${p.slice(3, 6)}-${p.slice(6)}`;
    return p;
  };

  // ฟังก์ชันออกจากระบบ
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pb-24">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-x-hidden rounded-t-[2.5rem]">
        
        {/* 🟠 Header */}
        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-b-[2.5rem] p-6 pt-12 shadow-md relative z-10">
          <div className="flex items-center gap-4 mt-2 mb-2">
            
            {/* รูปโปรไฟล์ */}
            <div className="w-16 h-16 bg-white rounded-full border-2 border-white/20 shadow-md flex items-center justify-center text-2xl font-black text-[#EE4D2D] relative flex-shrink-0 overflow-hidden">
              {isLoading ? (
                <div className="w-full h-full bg-orange-100 animate-pulse"></div>
              ) : (
                userProfile?.initial
              )}
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                <span className="text-[8px] text-gray-600 block leading-none">✏️</span>
              </div>
            </div>
            
            {/* ชื่อและเบอร์โทร */}
            <div className="text-white flex-1">
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-5 w-3/4 bg-white/30 rounded animate-pulse"></div>
                  <div className="h-3 w-1/2 bg-white/20 rounded animate-pulse"></div>
                </div>
              ) : (
                <>
                  <h1 className="text-xl font-black tracking-tight leading-tight">
                    {userProfile?.full_name || 'ผู้ใช้งาน'}
                  </h1>
                  <p className="text-white/80 text-xs mt-0.5">{userProfile?.formattedPhone}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 📋 ส่วนเนื้อหาหลัก */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 relative z-20 scrollbar-hide pb-24">
          
          <div className="bg-orange-50 border border-[#EE4D2D]/20 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
             <span className="text-xl">💡</span>
             <p className="text-[10px] text-gray-700 leading-relaxed font-medium">
               หน้าต่างนี้สำหรับจัดการข้อมูลส่วนตัว ตั้งค่าช่องทางรับเงิน และเรียกดูประวัติผลงานของคุณค่ะ
             </p>
          </div>

          {/* 👤 หมวด: แก้ไขข้อมูลส่วนตัว */}
          <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
              <span className="text-[#EE4D2D] text-sm">👤</span>
              <h3 className="font-bold text-gray-800 text-xs">ข้อมูลส่วนตัว</h3>
            </div>
            <div className="p-4 text-center">
               <button 
                 onClick={() => router.push('/auth/signup')} 
                 className="w-full text-xs font-bold text-[#EE4D2D] bg-orange-50 px-6 py-3 rounded-full border border-orange-100 active:scale-95 transition-transform shadow-sm"
               >
                 อัปเดต / แก้ไขโปรไฟล์
               </button>
            </div>
          </div>

          {/* 🛡️ หมวด: ยืนยันตัวตน แฟ้มเอกสาร และประวัติ */}
          <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
              <span className="text-[#EE4D2D] text-sm">🛡️</span>
              <h3 className="font-bold text-gray-800 text-xs">ยืนยันตัวตนและประวัติการใช้งาน</h3>
            </div>
            
            <MenuRow 
              icon="🔍" 
              title="ยืนยันตัวตน (KYC)" 
              subtitle="ยืนยันเบอร์โทรศัพท์และประวัติ"
              status={userProfile?.national_id ? '✅ มีข้อมูลแล้ว' : '⏳ รอข้อมูล'}
              onClick={() => {}} 
            />
            <MenuRow 
              icon="🪪" 
              title="แฟ้มเอกสารส่วนตัว" 
              subtitle="วุฒิการศึกษา, ใบขับขี่, ใบอนุญาต"
              onClick={() => {}} 
            />
            <MenuRow 
              icon="🏦" 
              title="บัญชีรับเงิน (Bank Account)" 
              subtitle="ตั้งค่าช่องทางรับเงินสำหรับผู้รับงาน"
              onClick={() => {}} 
            />
            <MenuRow 
              icon="📜" 
              title="ประวัติรายการ (History)" 
              subtitle="บันทึกกิจกรรมและประวัติการจ้างงาน"
              onClick={() => {}} 
            />
          </div>

          {/* 🏆 หมวด: ผลงานและใบรับรอง */}
          <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
              <span className="text-[#EE4D2D] text-sm">🏆</span>
              <h3 className="font-bold text-gray-800 text-xs">ผลงานและใบรับรอง</h3>
            </div>
            
            <MenuRow 
              icon="🖼️" 
              title="คลังใบประกาศ (Certificates)" 
              subtitle="อัปโหลดใบประกาศ / ใบผ่านงาน"
              onClick={() => {}} 
            />
            <MenuRow 
              icon="📋" 
              title="เรซูเม่และประวัติงาน (Portfolio)" 
              subtitle="ดาวน์โหลดประวัติการทำงาน (PDF)"
              onClick={() => {}} 
            />
          </div>

          {/* 🛑 ปุ่มออกจากระบบ */}
          <div className="pb-8">
            <button 
              onClick={handleSignOut}
              className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-bold text-sm shadow-inner hover:bg-gray-200 active:scale-[0.98] transition-all"
            >
              ออกจากระบบ
            </button>
          </div>

        </div>

        {/* ✅ Bottom Navigation */}
        <div className="fixed bottom-0 w-full sm:max-w-2xl md:max-w-3xl bg-white/95 backdrop-blur-md border-t border-gray-100 px-1 py-4 flex justify-between items-center shadow-[0_-4px_25px_rgba(0,0,0,0.06)] rounded-t-[2.5rem] z-50">
          <NavItem icon="🏠" label="หน้าแรก" active={false} onClick={() => router.push('/')} />
          <NavItem icon="🛠️" label="บริการ" active={false} onClick={() => router.push('/services')} />
          <NavItem icon="📋" label="งานด่วน" active={false} onClick={() => router.push('/win-online')} />
          <NavItem icon="📰" label="ข่าวสาร" active={false} onClick={() => router.push('/news')} />
          <NavItem icon="🎟️" label="ปองเจริญ" active={false} onClick={() => router.push('/coupons')} />
          <NavItem icon="👤" label="ฉัน" active={true} onClick={() => {}} />
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}

// คอมโพเนนต์ย่อยสำหรับแถวเมนู
function MenuRow({ icon, title, subtitle, onClick, status }: any) {
  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-between p-4 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl shadow-inner border border-gray-100 shrink-0">
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-800 leading-tight">{title}</h4>
          {subtitle && <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        {status && <span className="text-[9px] font-bold bg-gray-100 px-2 py-1 rounded-md text-gray-600 shadow-inner">{status}</span>}
        <span className="text-gray-300 text-xl leading-none">›</span>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: any) {
  return (
    <div onClick={onClick} className={`flex flex-col items-center gap-1.5 cursor-pointer transition-all ${active ? 'scale-110' : 'opacity-40 hover:opacity-100'} flex-1`}>
      <span className="text-[22px]">{icon}</span>
      <span className={`text-[9px] font-bold ${active ? 'text-[#EE4D2D]' : 'text-gray-500'} whitespace-nowrap`}>{label}</span>
      {active && <div className="w-1.5 h-1.5 bg-[#EE4D2D] rounded-full shadow-sm mt-0.5"></div>}
    </div>
  );
}

// app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // ⚠️ ปรับ path ตามโปรเจกต์ของคุณ
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// คอมโพเนนต์ย่อยสำหรับแถวเมนู (Menu Row) เพื่อความสะอาดของโค้ด
function ProfileMenuRow({ icon, label, href, status, isPrivate = false, isLoggedIn = false }) {
  // ✅ เงื่อนไข: ถ้าเป็นเมนูส่วนตัว และผู้ใช้ยังไม่ได้ล็อกอิน ให้ซ่อนเมนูนี้
  if (isPrivate && !isLoggedIn) return null;

  return (
    <Link href={href} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-2 rounded-lg transition-colors">
      <div className="flex items-center gap-3.5">
        <span className="text-xl text-gray-700">{icon}</span>
        <div>
          <span className="font-bold text-gray-800 text-sm">{label}</span>
          {status && <p className="text-[10px] text-gray-500 mt-0.5">{status}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {status && <span className="text-[9px] font-bold bg-gray-100 px-2.5 py-1 rounded-full text-gray-600 shadow-inner">{status}</span>}
        <span className="text-gray-300 text-lg">›</span>
      </div>
    </Link>
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 🔍 ดึงข้อมูลผู้ใช้ปัจจุบันจาก Supabase
    async function getUserData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }
      setLoading(false);
    }
    getUserData();
  }, []);

  const isLoggedIn = !!user; // ตรวจสอบสถานะการล็อกอิน

  // ฟังก์ชันสำหรับ Handle การ Log Out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login'); // พากลับไปหน้า Login
  };

  if (loading) return <div className="p-10 text-center text-gray-500">กำลังโหลด...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center pb-24">
      {/* Container หลัก */}
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-white min-h-screen relative flex flex-col shadow-xl overflow-hidden rounded-t-[2.5rem]">
        
        {/* 🟠 ส่วนหัว Profile (เหมือนใน image_2.png) */}
        <div className="bg-orange-50 p-6 pt-12 flex items-center gap-4 border-b border-orange-100">
          <div className="w-16 h-16 bg-white rounded-full border-4 border-white shadow-md flex items-center justify-center text-2xl font-black text-orange-600 flex-shrink-0">
            {isLoggedIn ? (user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()) : 'G'}
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">
              {isLoggedIn ? (user.user_metadata?.full_name || user.email?.split('@')[0]) : 'ผู้เยี่ยมชม'}
            </h1>
            <p className="text-gray-600 text-xs mt-0.5">
              {isLoggedIn ? user.email : 'สมัครสมาชิกเพื่อใช้บริการเต็มรูปแบบ'}
            </p>
          </div>
          {!isLoggedIn && (
            <Link href="/login" className="ml-auto bg-orange-600 text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-md hover:bg-orange-700 active:scale-95 transition-all">
              เข้าสู่ระบบ
            </Link>
          )}
        </div>

        {/* 📋 ส่วนรายการเมนู */}
        <div className="p-6 space-y-8 flex-1">
          
          {/* ✅ กลุ่มเมนู: ข้อมูลส่วนตัวและการเงิน */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2 px-1">ข้อมูลส่วนตัวและการเงิน</h2>
            <div className="space-y-0.5">
              <ProfileMenuRow 
                icon="💳" 
                label="บัญชีรับเงิน (Bank Account)" 
                href="/profile/bank-account" 
                status="ตั้งค่าช่องทางรับเงิน" 
                isPrivate={true} 
                isLoggedIn={isLoggedIn} // ✅ แสดงเฉพาะเมื่อล็อกอิน
              />
              {/* ✅ โค้ดที่บีสามต้องเพิ่ม: เมนูประวัติรายการ */}
              <ProfileMenuRow 
                icon="📜" // ใช้ไอคอนรูปม้วนกระดาษ หรือ 🕒 นาฬิกา ก็ได้ครับ
                label="ประวัติรายการ" 
                href="/history" 
                status="บันทึกกิจกรรมทั้งหมด" 
                isPrivate={true} // ✅ เป็นเมนูส่วนตัว
                isLoggedIn={isLoggedIn} // ✅ แสดงเฉพาะเมื่อล็อกอินแล้วเท่านั้น
              />
            </div>
          </div>

          {/* กลุ่มเมนู: ยืนยันตัวตน (ตามภาพ image_2.png) */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2 px-1">ยืนยันตัวตน</h2>
            <div className="space-y-0.5">
              <ProfileMenuRow 
                icon="🛡️" 
                label="ยืนยันตัวตน (KYC)" 
                href="/profile/kyc" 
                status="ผ่านแล้ว" 
                isPrivate={true} 
                isLoggedIn={isLoggedIn} 
              />
              {/* เมนูอื่นๆ เช่น แฟ้มเอกสาร... */}
            </div>
          </div>

          {/* กลุ่มเมนู: ตั้งค่าและอื่นๆ */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2 px-1">ตั้งค่า</h2>
            <div className="space-y-0.5">
              <ProfileMenuRow icon="⚙️" label="ตั้งค่าแอป" href="/settings" />
              <ProfileMenuRow icon="💬" label="ศูนย์ความช่วยเหลือ" href="/help" />
            </div>
          </div>

          {/* ✅ ปุ่ม Log Out (แสดงเฉพาะเมื่อล็อกอิน) */}
          {isLoggedIn && (
            <button 
              onClick={handleSignOut}
              className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-bold text-sm shadow-inner hover:bg-gray-200 active:scale-[0.98] transition-all mt-6"
            >
              ออกจากระบบ
            </button>
          )}

        </div>
      </div>
    </div>
  );
}

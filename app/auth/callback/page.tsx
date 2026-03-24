'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // ฟังก์ชันตรวจสอบและรอรับ Session จาก URL (Supabase จะจัดการดึง Token จาก URL ให้อัตโนมัติ)
    const handleCallback = async () => {
      // 1. ลองเช็คว่ามี Session เกิดขึ้นหรือยัง
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // ถ้ามีแล้ว ให้ส่งไปหน้า Signup เพื่อให้ตั้งค่าโปรไฟล์ (กรอกชื่อ/เบอร์)
        router.push('/auth/signup');
      }
    };

    // 2. ดักจับ Event (เผื่อระบบกำลังประมวลผล Token อยู่)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/auth/signup');
      }
    });

    // เรียกใช้งานฟังก์ชัน
    handleCallback();

    // คืนค่า Memory เมื่อเปลี่ยนหน้า
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl px-12 py-10 text-center border border-orange-50 flex flex-col items-center">
        {/* 🌟 ไอคอนหมุนๆ (Loading) */}
        <div className="text-5xl mb-6 animate-spin drop-shadow-sm">🌟</div>
        <h2 className="text-xl font-bold text-gray-800 tracking-tight mb-2">
          กำลังยืนยันตัวตน...
        </h2>
        <p className="text-sm font-medium text-gray-500">
          กรุณารอสักครู่ ระบบกำลังพาคุณเข้าสู่แพลตฟอร์ม
        </p>
        
        {/* Loading Bar เล็กๆ ด้านล่าง */}
        <div className="w-48 h-1.5 bg-gray-100 rounded-full mt-6 overflow-hidden">
          <div className="w-1/2 h-full bg-orange-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

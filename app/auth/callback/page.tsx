'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleCallback = async () => {
      // 1. ตรวจสอบ Session จาก URL (Supabase จะจัดการดึง Token ให้อัตโนมัติ)
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth error:', error.message);
        router.push('/auth/login');
        return;
      }

      if (session) {
        // ✅ ถ้ามี Session แล้ว ให้ส่งไปหน้า Signup เพื่อให้ตั้งค่าโปรไฟล์ (กรอกชื่อ/เบอร์)
        router.push('/auth/signup');
      }
    };

    // 2. ดักจับ Event เผื่อกรณีที่ระบบกำลังประมวลผล Token ในพื้นหลัง
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/auth/signup');
      }
    });

    handleCallback();

    // คืนค่า Memory เมื่อเปลี่ยนหน้า
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, supabase.auth]);

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center font-sans">
      <div className="text-center">
        {/* Loader สวยๆ สไตล์แอปจงเจริญ */}
        <div className="w-12 h-12 border-4 border-[#EE4D2D] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="font-black text-gray-600 text-sm">กำลังยืนยันตัวตน...</p>
        <p className="text-[10px] text-gray-400 font-bold mt-1">กรุณารอสักครู่นะคะ</p>
      </div>
    </div>
  );
}

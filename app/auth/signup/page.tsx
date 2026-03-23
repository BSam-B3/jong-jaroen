'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
  const router = useRouter();
  
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);

  // -------------------------------------------------------------
  // ✨ โหลดข้อมูล User ปัจจุบัน (เช็คว่าผ่านหน้า Login มาจริงไหม)
  // -------------------------------------------------------------
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        // ถ้าผู้ใช้เคยล็อกอินด้วย Google/LINE อาจจะมีชื่อติดมาด้วย ให้เอามาใส่ช่องไว้เลย
        if (session.user.user_metadata?.full_name) {
          setFullName(session.user.user_metadata.full_name);
        }
      } else {
        // ถ้าไม่มี Session แอบเข้ามาหน้านี้ ให้เด้งกลับไปหน้า Login
        router.push('/auth/login');
      }
    };
    checkUser();
  }, [router]);

  // -------------------------------------------------------------
  // 💾 บันทึกข้อมูลลงตาราง Profiles
  // -------------------------------------------------------------
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('กรุณากรอกชื่อ-นามสกุล');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // อัปเดตข้อมูลในตาราง profiles ของ Supabase
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
          id: user?.id, 
          full_name: fullName,
          updated_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;

      // อัปเดต metadata ใน Auth (เผื่อเรียกใช้ง่ายๆ)
      await supabase.auth.updateUser({
        data: { full_name: fullName }
      });

      // เสร็จสมบูรณ์ พาเข้าแอปเลย!
      alert('สร้างโปรไฟล์สำเร็จ! ยินดีต้อนรับสู่จงเจริญ 🎉');
      router.push('/'); 
      
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-300/20 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 relative z-10 border border-orange-50">
        
        {/* 🌟 Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3 drop-shadow-sm">🌟</div>
          <h1 className="text-3xl font-black text-gray-800">จงเจริญ</h1>
          <p className="text-gray-500 mt-1 text-sm">ตลาดแรงงานชุมชนประแส</p>
          <h2 className="text-xl font-semibold text-orange-600 mt-4">สร้างโปรไฟล์ของคุณ</h2>
          <p className="text-xs text-gray-500 mt-2">อีกเพียงขั้นตอนเดียวเพื่อเริ่มต้นใช้งาน</p>
        </div>

        {/* ⚠️ Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm font-medium text-center">
            {error}
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* ฟอร์ม: กรอกข้อมูลส่วนตัว */}
        {/* ----------------------------------------------------------- */}
        <form onSubmit={handleSaveProfile} className="space-y-5 animate-fade-in">
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 pl-1">
              ชื่อ-นามสกุล <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="เช่น สมชาย ใจดี"
              className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !user}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-lg transition-colors mt-4 shadow-md active:scale-[0.98]"
          >
            {loading ? 'กำลังบันทึกข้อมูล...' : 'เริ่มใช้งาน 🚀'}
          </button>
        </form>

        {/* 🤝 Unified Account Note */}
        <div className="mt-8 bg-orange-50 rounded-2xl border border-orange-100 p-4">
          <p className="text-xs text-orange-700 text-center">
            🎯 <strong>บัญชีเดียว</strong> — ใช้ได้ทั้งเป็นลูกค้าและช่าง
          </p>
        </div>

      </div>
    </div>
  );
}

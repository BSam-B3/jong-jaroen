'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// ✅ แก้ไข: เปลี่ยนมาใช้กุญแจตัวใหม่จากโฟลเดอร์ client
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  // ✅ แก้ไข: สร้างกุญแจเชื่อมต่อภายใน Component
  const supabase = useMemo(() => createClient(), []);

  // States ควบคุมโหมดการล็อกอิน
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  
  // States ข้อมูลฟอร์ม
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // States สำหรับเบอร์โทร
  const [phoneDisplay, setPhoneDisplay] = useState('');
  const [phoneRaw, setPhoneRaw] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState<1 | 2>(1);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // -------------------------------------------------------------
  // ✨ ฟังก์ชันจัดการ Input เบอร์โทร (Auto-spacing)
  // -------------------------------------------------------------
  const handlePhoneChange = (e: any) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 10) val = val.slice(0, 10);
    setPhoneRaw(val);
    
    // จัดฟอร์แมต 08X-XXX-XXXX
    let formatted = val;
    if (val.length > 6) {
      formatted = `${val.slice(0, 3)}-${val.slice(3, 6)}-${val.slice(6)}`;
    } else if (val.length > 3) {
      formatted = `${val.slice(0, 3)}-${val.slice(3)}`;
    }
    setPhoneDisplay(formatted);
  };

  // -------------------------------------------------------------
  // 🚀 ฟังก์ชันเข้าสู่ระบบด้วย Email
  // -------------------------------------------------------------
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้องค่ะ');
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">จงเจริญ</h1>
          <p className="text-gray-500 mt-2 font-medium">เข้าสู่ระบบเพื่อใช้งานต่อค่ะ</p>
        </div>

        {/* สลับโหมด Login */}
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          <button 
            onClick={() => setLoginMethod('email')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${loginMethod === 'email' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
          >
            อีเมล
          </button>
          <button 
            onClick={() => setLoginMethod('phone')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${loginMethod === 'phone' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
          >
            เบอร์โทรศัพท์
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100 animate-in fade-in zoom-in duration-300">
            ⚠️ {error}
          </div>
        )}

        {loginMethod === 'email' ? (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <input
              type="email"
              placeholder="อีเมลของคุณ"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-orange-500 transition-all outline-none"
              required
            />
            <input
              type="password"
              placeholder="รหัสผ่าน"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-orange-500 transition-all outline-none"
              required
            />
            <button
              disabled={loading}
              className="w-full bg-[#EE4D2D] text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-orange-200 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>
        ) : (
          <div className="space-y-4 text-center py-8">
            <p className="text-gray-400 text-sm italic">ระบบเข้าสู่ระบบด้วยเบอร์โทรศัพท์กำลังปรับปรุงค่ะ</p>
          </div>
        )}

        <p className="text-center text-sm text-gray-500">
          ยังไม่มีบัญชี?{' '}
          <Link href="/auth/signup" className="text-orange-600 font-bold hover:underline">
            สมัครสมาชิกใหม่
          </Link>
        </p>
      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  
  // States ควบคุมโหมดการล็อกอิน
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  
  // States ข้อมูลฟอร์ม
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState<1 | 2>(1); // 1 = ขอ OTP, 2 = กรอก OTP
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // -------------------------------------------------------------
  // 📧 1. ล็อกอินด้วย Email / Password
  // -------------------------------------------------------------
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (authError) throw authError;

      if (data.user) {
        router.push('/'); // Unified Account เข้าหน้า Home/Dashboard ได้เลย
      }
    } catch (err: any) {
      if (err.message.includes('Invalid login credentials') || err.message.includes('invalid_credentials')) {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      } else if (err.message.includes('Email not confirmed')) {
        setError('กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ');
      } else {
        setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
      }
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 📱 2. ล็อกอินด้วยเบอร์โทรศัพท์ (OTP)
  // -------------------------------------------------------------
  const formatPhoneNumber = (phoneNumber: string) => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.startsWith('0')) return '+66' + cleaned.slice(1);
    return '+' + cleaned;
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const phoneFormatted = formatPhoneNumber(phone);
      const { error } = await supabase.auth.signInWithOtp({ phone: phoneFormatted });
      if (error) throw error;
      setOtpStep(2);
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถส่งรหัส OTP ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const phoneFormatted = formatPhoneNumber(phone);
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneFormatted,
        token: otp,
        type: 'sms',
      });
      if (error) throw error;
      if (data.session) router.push('/');
    } catch (err: any) {
      setError('รหัส OTP ไม่ถูกต้อง หรือหมดอายุแล้ว');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 🌐 3. ล็อกอินด้วย Social (Google, LINE)
  // -------------------------------------------------------------
  // ✅ แก้ไข Type เป็น string เพื่อไม่ให้ Vercel ฟ้อง Error
  const handleOAuthLogin = async (provider: string) => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as any, // ✅ บังคับ as any เพื่อให้ผ่านกฎของ TypeScript
        options: {
          redirectTo: `${window.location.origin}/auth/callback` // URL ที่ให้ Supabase เด้งกลับมา
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(`ไม่สามารถเข้าสู่ระบบด้วย ${provider} ได้`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-300/20 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 relative z-10 border border-orange-50">
        
        {/* 🌟 Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3 drop-shadow-sm">🌟</div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">จงเจริญ</h1>
          <p className="text-gray-500 mt-1 text-[11px] font-bold tracking-widest">ตลาดแรงงานชุมชนประแส</p>
          <h2 className="text-xl font-bold text-[#EE4D2D] mt-4">เข้าสู่ระบบ</h2>
        </div>

        {/* 🔘 สวิตช์เลือกวิธีล็อกอิน (Tabs) */}
        {otpStep === 1 && (
          <div className="flex bg-gray-100 p-1 rounded-xl mb-6 shadow-inner">
            <button
              onClick={() => { setLoginMethod('email'); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                loginMethod === 'email' ? 'bg-white text-[#EE4D2D] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              อีเมล
            </button>
            <button
              onClick={() => { setLoginMethod('phone'); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                loginMethod === 'phone' ? 'bg-white text-[#EE4D2D] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              เบอร์โทร (OTP)
            </button>
          </div>
        )}

        {/* ⚠️ Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-[11px] font-bold flex items-center gap-2">
            <span className="text-sm">⚠️</span> {error}
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* ฟอร์ม: อีเมล & รหัสผ่าน */}
        {/* ----------------------------------------------------------- */}
        {loginMethod === 'email' && (
          <form onSubmit={handleEmailLogin} className="space-y-4 animate-fade-in">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 pl-1">อีเมล</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="example@email.com"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-[#EE4D2D] transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-end">
                <label className="text-[11px] font-bold text-gray-500 pl-1">รหัสผ่าน</label>
                <Link href="/auth/reset-password" className="text-[10px] text-[#EE4D2D] font-bold hover:underline">ลืมรหัสผ่าน?</Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-[#EE4D2D] transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#EE4D2D] to-[#FF7337] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl text-sm transition-all mt-2 active:scale-[0.98]"
            >
              {loading ? '⏳ กำลังเข้าสู่ระบบ...' : '🚀 เข้าสู่ระบบ'}
            </button>
          </form>
        )}

        {/* ----------------------------------------------------------- */}
        {/* ฟอร์ม: เบอร์โทรศัพท์ OTP */}
        {/* ----------------------------------------------------------- */}
        {loginMethod === 'phone' && (
          <div className="animate-fade-in">
            {otpStep === 1 ? (
              <form onSubmit={handleRequestOTP} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 pl-1">เบอร์โทรศัพท์มือถือ</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🇹🇭</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      required
                      placeholder="0812345678"
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold tracking-wide focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-[#EE4D2D] transition-all"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading || phone.length < 9}
                  className="w-full bg-gradient-to-r from-[#EE4D2D] to-[#FF7337] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl text-sm transition-all active:scale-[0.98]"
                >
                  {loading ? 'กำลังส่งรหัส...' : 'ส่งรหัส OTP 📱'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-4 animate-fade-in-up">
                <div className="text-center mb-4">
                  <p className="text-[11px] text-gray-500 font-medium">รหัส 6 หลักถูกส่งไปที่เบอร์</p>
                  <p className="text-sm font-black text-[#EE4D2D] mt-0.5">{phone}</p>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  placeholder="------"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-center text-2xl tracking-[0.75em] font-black text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-[#EE4D2D] transition-all"
                />
                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full bg-gradient-to-r from-[#EE4D2D] to-[#FF7337] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl text-sm transition-all mt-2 active:scale-[0.98]"
                >
                  {loading ? 'กำลังตรวจสอบ...' : 'ยืนยันตัวตน ✅'}
                </button>
                <div className="flex justify-between items-center px-1">
                  <button type="button" onClick={() => setOtpStep(1)} className="text-[10px] text-gray-400 font-bold hover:text-gray-600">← เปลี่ยนเบอร์</button>
                  <button type="button" onClick={handleRequestOTP} className="text-[10px] text-[#EE4D2D] font-bold hover:underline">ส่งรหัสใหม่อีกครั้ง</button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* Social Login (โชว์เฉพาะหน้าหลักของ Login) */}
        {/* ----------------------------------------------------------- */}
        {otpStep === 1 && (
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">หรือเข้าสู่ระบบด้วย</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleOAuthLogin('google')}
                type="button" 
                className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-600 py-2.5 rounded-xl text-[11px] font-bold shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
              >
                <span className="text-base">G</span> Google
              </button>
              <button 
                onClick={() => handleOAuthLogin('line')}
                type="button" 
                className="flex items-center justify-center gap-2 bg-[#00C300] text-white py-2.5 rounded-xl text-[11px] font-bold shadow-sm hover:bg-[#00B300] active:scale-95 transition-all"
              >
                <span className="text-base">💬</span> LINE
              </button>
            </div>
          </div>
        )}

        {/* Links กลับหน้าแรก & สมัครสมาชิก */}
        <div className="text-center mt-8 space-y-4">
          <p className="text-xs text-gray-500 font-medium">
            ยังไม่มีบัญชี?{' '}
            <Link href="/auth/signup" className="text-[#EE4D2D] font-black hover:underline">
              สมัครสมาชิก
            </Link>
          </p>
          <div>
            <Link href="/" className="text-[10px] text-gray-400 font-bold hover:text-gray-600">
              ← กลับหน้าหลัก
            </Link>
          </div>
        </div>

        {/* 🤝 Unified Account Note */}
        <div className="mt-8 bg-orange-50 rounded-2xl border border-orange-100 p-3 shadow-sm">
          <p className="text-[10px] text-orange-800 text-center font-bold flex items-center justify-center gap-1.5">
            <span className="text-sm text-orange-500">🤝</span> บัญชีเดียว — ใช้ได้ทั้งเป็นลูกค้าและช่าง
          </p>
        </div>

      </div>
    </div>
  );
}

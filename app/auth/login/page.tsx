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
  
  // States สำหรับเบอร์โทร
  const [phoneDisplay, setPhoneDisplay] = useState(''); 
  const [phoneRaw, setPhoneRaw] = useState('');
  
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState<1 | 2>(1);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // -------------------------------------------------------------
  // ✨ ฟังก์ชันจัดการ Input เบอร์โทร
  // -------------------------------------------------------------
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 10) val = val.slice(0, 10);
    
    setPhoneRaw(val);

    let formatted = val;
    if (val.length > 3 && val.length <= 6) {
      formatted = `${val.slice(0, 3)} ${val.slice(3)}`;
    } else if (val.length > 6) {
      formatted = `${val.slice(0, 3)} ${val.slice(3, 6)} ${val.slice(6)}`;
    }
    setPhoneDisplay(formatted);
  };

  const formatPhoneNumberForAPI = (phoneNumber: string) => {
    if (phoneNumber.startsWith('0')) return '+66' + phoneNumber.slice(1);
    return '+' + phoneNumber;
  };

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
        router.push('/');
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
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneRaw.length < 10) {
      setError('กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const phoneFormatted = formatPhoneNumberForAPI(phoneRaw);
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
      const phoneFormatted = formatPhoneNumberForAPI(phoneRaw);
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneFormatted,
        token: otp,
        type: 'sms',
      });
      if (error) throw error;
      if (data.session) router.push('/auth/signup');
    } catch (err: any) {
      setError('รหัส OTP ไม่ถูกต้อง หรือหมดอายุแล้ว');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 🌐 3. ล็อกอินด้วย Social (Google, LINE, Facebook)
  // -------------------------------------------------------------
  const handleOAuthLogin = async (provider: string) => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo: `${window.location.origin}/auth/callback` 
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(`ไม่สามารถเข้าสู่ระบบด้วย ${provider} ได้`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-300/20 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="bg-white rounded-[2.5rem] shadow-xl w-full max-w-sm p-8 relative z-10 border border-gray-100">
        
        {/* 🌟 Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3 drop-shadow-sm">🌟</div>
          <h1 className="text-3xl font-black text-[#EE4D2D] tracking-tight">จงเจริญ</h1>
          <p className="text-gray-500 mt-1 text-[11px] font-bold tracking-widest uppercase">ตลาดแรงงานชุมชนประแส</p>
          <h2 className="text-lg font-bold text-gray-800 mt-6">เข้าสู่ระบบ</h2>
        </div>

        {/* 🔘 สวิตช์เลือกวิธีล็อกอิน */}
        {otpStep === 1 && (
          <div className="flex bg-gray-100 p-1 rounded-xl mb-6 shadow-inner">
            <button
              onClick={() => { setLoginMethod('email'); setError(''); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
                loginMethod === 'email' ? 'bg-white text-[#EE4D2D] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              อีเมล
            </button>
            <button
              onClick={() => { setLoginMethod('phone'); setError(''); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
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
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D] transition-all"
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
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D] transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#EE4D2D] hover:bg-[#D9381E] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl text-sm transition-all mt-2 active:scale-[0.98] shadow-md"
            >
              {loading ? '⏳ กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
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
                  <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-2xl focus-within:border-[#EE4D2D] focus-within:ring-2 focus-within:ring-[#EE4D2D]/30 transition-all overflow-hidden">
                    <div className="px-4 py-3.5 bg-gray-100 border-r border-gray-200 text-gray-500 text-sm font-bold flex items-center gap-2">
                      🇹🇭 <span className="text-[10px]">TH</span>
                    </div>
                    <input
                      type="tel"
                      value={phoneDisplay}
                      onChange={handlePhoneChange}
                      required
                      placeholder="081 234 5678"
                      className="w-full bg-transparent px-4 py-3.5 text-sm font-black tracking-wider outline-none placeholder:text-gray-300 placeholder:font-medium"
                    />
                  </div>
                  <p className="text-[9px] text-[#EE4D2D] font-bold pl-1 pt-1">กรุณากรอกให้ครบ 10 หลัก</p>
                </div>
                <button
                  type="submit"
                  disabled={loading || phoneRaw.length < 10}
                  className="w-full bg-[#EE4D2D] hover:bg-[#D9381E] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl text-sm transition-all shadow-md active:scale-[0.98]"
                >
                  {loading ? 'กำลังส่งรหัส...' : 'ส่งรหัส OTP 📱'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-4 animate-fade-in-up">
                <div className="text-center mb-4">
                  <p className="text-[11px] text-gray-500 font-medium">รหัส 6 หลักถูกส่งไปที่เบอร์</p>
                  <p className="text-sm font-black text-[#EE4D2D] mt-0.5">{phoneDisplay}</p>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  placeholder="------"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-center text-2xl tracking-[0.75em] font-black text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D] transition-all"
                />
                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full bg-[#EE4D2D] hover:bg-[#D9381E] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl text-sm transition-all mt-2 active:scale-[0.98] shadow-md"
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
        {/* Social Login Buttons */}
        {/* ----------------------------------------------------------- */}
        {otpStep === 1 && (
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">หรือเข้าสู่ระบบด้วย</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => handleOAuthLogin('google')}
                type="button" 
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 py-3.5 rounded-2xl text-[11px] font-bold shadow-sm hover:bg-gray-50 active:scale-[0.98] transition-all"
              >
                <span className="text-lg">G</span> Google Account
              </button>
              
              <button 
                onClick={() => handleOAuthLogin('line')}
                type="button" 
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 py-3.5 rounded-2xl text-[11px] font-bold shadow-sm hover:bg-gray-50 active:scale-[0.98] transition-all"
              >
                <span className="text-lg text-[#00C300]">💬</span> LINE Account
              </button>

              <button 
                onClick={() => handleOAuthLogin('facebook')}
                type="button" 
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 py-3.5 rounded-2xl text-[11px] font-bold shadow-sm hover:bg-gray-50 active:scale-[0.98] transition-all"
              >
                <span className="text-lg text-[#1877F2]">f</span> Facebook Account
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
        <div className="mt-8 bg-orange-50 rounded-xl border border-orange-100 p-3 shadow-sm">
          <p className="text-[10px] text-[#EE4D2D] text-center font-bold flex items-center justify-center gap-1.5">
            🎯 บัญชีเดียว — ใช้ได้ทั้งเป็นลูกค้าและช่าง
          </p>
        </div>

      </div>
    </div>
  );
}

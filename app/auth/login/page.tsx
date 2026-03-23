'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

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
  // ✨ ฟังก์ชันจัดการ Input เบอร์โทร (Auto-spacing)
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
        router.push('/dashboard'); // นำไปหน้า Dashboard ตามโค้ดเดิมของคุณ
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
      if (data.session) router.push('/dashboard');
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 relative">
        
        {/* 🌟 Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌟</div>
          <h1 className="text-3xl font-bold text-gray-800">จงเจริญ</h1>
          <p className="text-gray-500 mt-1 text-sm">ตลาดแรงงานชุมชนประแส</p>
          <h2 className="text-xl font-semibold text-orange-600 mt-4">เข้าสู่ระบบ</h2>
        </div>

        {/* 🔘 สวิตช์เลือกวิธีล็อกอิน */}
        {otpStep === 1 && (
          <div className="flex bg-gray-100 p-1 rounded-xl mb-6 shadow-inner">
            <button
              onClick={() => { setLoginMethod('email'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                loginMethod === 'email' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              อีเมล
            </button>
            <button
              onClick={() => { setLoginMethod('phone'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                loginMethod === 'phone' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              เบอร์โทร (OTP)
            </button>
          </div>
        )}

        {/* ⚠️ Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm font-medium">
            {error}
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* ฟอร์ม: อีเมล & รหัสผ่าน */}
        {/* ----------------------------------------------------------- */}
        {loginMethod === 'email' && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 pl-1">อีเมล</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="example@email.com"
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-end">
                <label className="text-sm font-medium text-gray-700 pl-1">รหัสผ่าน</label>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="รหัสผ่านของคุณ"
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-lg transition-colors mt-2"
            >
              {loading ? '⏳ กำลังเข้าสู่ระบบ...' : '🚀 เข้าสู่ระบบ'}
            </button>
          </form>
        )}

        {/* ----------------------------------------------------------- */}
        {/* ฟอร์ม: เบอร์โทรศัพท์ OTP */}
        {/* ----------------------------------------------------------- */}
        {loginMethod === 'phone' && (
          <div>
            {otpStep === 1 ? (
              <form onSubmit={handleRequestOTP} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 pl-1">เบอร์โทรศัพท์มือถือ</label>
                  
                  {/* แก้ปัญหา TH ซ้ำซ้อน เปลี่ยนเป็น +66 เพื่อความเป็นสากล */}
                  <div className="relative flex items-center bg-white border border-gray-200 rounded-2xl focus-within:ring-2 focus-within:ring-orange-300 focus-within:border-transparent transition-all overflow-hidden">
                    <div className="px-4 py-3.5 bg-gray-50 border-r border-gray-200 text-gray-600 text-sm font-bold">
                      +66
                    </div>
                    <input
                      type="tel"
                      value={phoneDisplay}
                      onChange={handlePhoneChange}
                      required
                      placeholder="081 234 5678"
                      className="w-full bg-transparent px-4 py-3 text-sm font-bold tracking-wide outline-none placeholder:text-gray-300 placeholder:font-normal placeholder:tracking-normal"
                    />
                  </div>
                  <p className="text-xs text-orange-500 pl-1 pt-1">กรุณากรอกให้ครบ 10 หลัก</p>
                </div>
                <button
                  type="submit"
                  disabled={loading || phoneRaw.length < 10}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-lg transition-colors"
                >
                  {loading ? 'กำลังส่งรหัส...' : 'ส่งรหัส OTP 📱'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-500 font-medium">รหัส 6 หลักถูกส่งไปที่เบอร์</p>
                  <p className="text-lg font-bold text-orange-600 mt-1">{phoneDisplay}</p>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  placeholder="------"
                  className="w-full border border-gray-200 rounded-2xl px-4 py-4 text-center text-2xl tracking-[0.75em] font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all"
                />
                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-lg transition-colors mt-2"
                >
                  {loading ? 'กำลังตรวจสอบ...' : 'ยืนยันตัวตน ✅'}
                </button>
                <div className="flex justify-between items-center px-1">
                  <button type="button" onClick={() => setOtpStep(1)} className="text-xs text-gray-500 hover:text-gray-700">← เปลี่ยนเบอร์</button>
                  <button type="button" onClick={handleRequestOTP} className="text-xs text-orange-600 font-semibold hover:underline">ส่งรหัสใหม่อีกครั้ง</button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* Social Login Buttons (Google, LINE, Facebook) */}
        {/* ----------------------------------------------------------- */}
        {otpStep === 1 && (
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-xs text-gray-400 font-medium">หรือเข้าสู่ระบบด้วย</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            <div className="space-y-3">
              {/* Google */}
              <button 
                onClick={() => handleOAuthLogin('google')}
                type="button" 
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 py-3.5 rounded-2xl text-sm font-semibold shadow-sm hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
              
              {/* LINE */}
              <button 
                onClick={() => handleOAuthLogin('line')}
                type="button" 
                className="w-full flex items-center justify-center gap-3 bg-[#06C755] hover:bg-[#05A546] text-white py-3.5 rounded-2xl text-sm font-semibold shadow-sm transition-colors border border-transparent"
              >
                <span className="text-xl font-bold">LINE</span>
              </button>

              {/* Facebook */}
              <button 
                onClick={() => handleOAuthLogin('facebook')}
                type="button" 
                className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166FE5] text-white py-3.5 rounded-2xl text-sm font-semibold shadow-sm transition-colors border border-transparent"
              >
                <span className="text-xl font-bold font-serif">f</span> Facebook
              </button>
            </div>
          </div>
        )}

        {/* Links กลับหน้าแรก & สมัครสมาชิก */}
        <div className="text-center mt-8 space-y-3">
          <p className="text-sm text-gray-500">
            ยังไม่มีบัญชี?{' '}
            <Link href="/auth/signup" className="text-orange-600 font-semibold hover:underline">
              สมัครสมาชิก
            </Link>
          </p>
          <div>
            <Link href="/" className="text-xs text-gray-400 font-medium hover:text-gray-600">
              ← กลับหน้าหลัก
            </Link>
          </div>
        </div>

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

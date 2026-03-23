'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  
  // States สำหรับฟอร์ม
  const [inputValue, setInputValue] = useState(''); // รับได้ทั้งเบอร์และอีเมล
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<1 | 2>(1); // Step 1: ขอ OTP, Step 2: กรอก OTP
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ตรวจสอบว่าเป็นอีเมลหรือเบอร์โทร
  const isEmail = inputValue.includes('@');

  // ฟังก์ชันแปลงเบอร์โทรไทยให้เป็นฟอร์แมตสากล (+66)
  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      return '+66' + cleaned.slice(1);
    }
    return '+' + cleaned; // กรณีพิมพ์ +66 มาแล้ว
  };

  // 🚀 ขั้นตอนที่ 1: กดขอ OTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      setErrorMsg('กรุณากรอกเบอร์โทรศัพท์ หรือ อีเมล');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      if (isEmail) {
        // ขอ OTP ผ่าน Email
        const { error } = await supabase.auth.signInWithOtp({ email: inputValue });
        if (error) throw error;
      } else {
        // ขอ OTP ผ่าน SMS
        const phoneData = formatPhoneNumber(inputValue);
        const { error } = await supabase.auth.signInWithOtp({ phone: phoneData });
        if (error) throw error;
      }
      
      setStep(2); // เปลี่ยนไปหน้ากรอก OTP
    } catch (error: any) {
      setErrorMsg(error.message || 'ไม่สามารถส่งรหัส OTP ได้ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  // 🔐 ขั้นตอนที่ 2: ตรวจสอบรหัส OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      setErrorMsg('กรุณากรอกรหัส OTP ให้ครบ 6 หลัก');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      if (isEmail) {
        // ยืนยัน OTP อีเมล
        const { data, error } = await supabase.auth.verifyOtp({
          email: inputValue,
          token: otp,
          type: 'email',
        });
        if (error) throw error;
        if (data.session) router.push('/');
      } else {
        // ยืนยัน OTP เบอร์โทร
        const phoneData = formatPhoneNumber(inputValue);
        const { data, error } = await supabase.auth.verifyOtp({
          phone: phoneData,
          token: otp,
          type: 'sms',
        });
        if (error) throw error;
        if (data.session) router.push('/');
      }
    } catch (error: any) {
      setErrorMsg('รหัส OTP ไม่ถูกต้อง หรือหมดอายุแล้ว');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center items-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-300/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-300/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl p-8 relative border border-gray-100 z-10">

        {/* 🌟 ส่วนหัว (Header) */}
        <div className="flex flex-col items-center justify-center text-center mb-8 relative">
          {step === 2 && (
            <button 
              onClick={() => { setStep(1); setOtp(''); setErrorMsg(''); }} 
              className="absolute left-0 top-0 text-gray-400 hover:text-[#EE4D2D] transition-colors p-2"
            >
              ← กลับ
            </button>
          )}
          <div className="w-16 h-16 bg-gradient-to-br from-[#EE4D2D] to-[#FF7337] rounded-2xl shadow-lg flex items-center justify-center text-3xl mb-4 transform rotate-3">
            🌟
          </div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">จงเจริญ</h1>
          <p className="text-gray-500 text-[10px] font-bold mt-1 tracking-widest">ตลาดแรงงานชุมชนประแส</p>
          <h2 className="text-lg font-bold text-[#EE4D2D] mt-6">
            {step === 1 ? 'เข้าสู่ระบบ / สมัครสมาชิก' : 'ยืนยันรหัส OTP'}
          </h2>
        </div>

        {/* ⚠️ Error Message */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-[10px] font-bold px-4 py-3 rounded-xl mb-4 flex items-start gap-2">
            <span>⚠️</span> <span>{errorMsg}</span>
          </div>
        )}

        {/* 📋 Step 1: ฟอร์มขอ OTP */}
        {step === 1 && (
          <form onSubmit={handleRequestOTP} className="space-y-4 animate-fade-in">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 pl-1">เบอร์โทรศัพท์ หรือ อีเมล</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">📱</span>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="0812345678 หรือ email@example.com"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-3.5 text-sm font-bold text-gray-800 outline-none focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]/30 transition-all placeholder:text-gray-400 placeholder:font-medium"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] text-white py-4 rounded-2xl font-black text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition-all mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'กำลังส่งรหัส...' : 'รับรหัส OTP 🚀'}
            </button>
            
            {/* Social Login (แนะนำให้ใช้ฟรี) */}
            <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
              <p className="text-[9px] text-center font-bold text-gray-400 mb-2 uppercase tracking-widest">ทางเลือกเข้าสู่ระบบ (ฟรี)</p>
              <button type="button" className="w-full bg-white border border-gray-200 text-gray-700 py-3.5 rounded-2xl font-bold text-xs shadow-sm active:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <span className="text-lg">🌐</span> เข้าสู่ระบบด้วย Google
              </button>
            </div>
          </form>
        )}

        {/* 🔐 Step 2: ฟอร์มกรอก OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="space-y-4 animate-fade-in-up">
            <div className="text-center mb-6">
              <p className="text-xs text-gray-600 font-medium">
                รหัส 6 หลักถูกส่งไปที่
              </p>
              <p className="text-sm font-black text-[#EE4D2D] mt-1">{inputValue}</p>
            </div>

            <div className="space-y-1.5">
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="กรอกรหัส 6 หลัก"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-center text-xl tracking-[0.5em] font-black text-gray-800 outline-none focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]/30 transition-all placeholder:text-gray-300 placeholder:tracking-normal placeholder:font-medium"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] text-white py-4 rounded-2xl font-black text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition-all mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'กำลังตรวจสอบ...' : 'ยืนยันตัวตน ✅'}
            </button>

            <p className="text-[10px] text-center font-bold text-gray-400 mt-4 cursor-pointer hover:text-[#EE4D2D]" onClick={handleRequestOTP}>
              ส่งรหัสใหม่อีกครั้ง
            </p>
          </form>
        )}

      </div>

      <Link href="/" className="absolute bottom-10 text-[10px] text-gray-400 font-medium hover:text-gray-600 flex items-center gap-1">
        ← กลับหน้าหลัก
      </Link>
    </div>
  );
}

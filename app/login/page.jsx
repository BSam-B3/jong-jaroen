'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ฟอร์แมตเบอร์ไทยเป็น E.164 (+66xxxxxxxxx)
  function formatPhone(raw) {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('0')) return '+66' + digits.slice(1);
    if (digits.startsWith('66')) return '+' + digits;
    return '+' + digits;
  }

  async function handleSendOtp(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const formatted = formatPhone(phone);
      const { error: otpErr } = await supabase.auth.signInWithOtp({ phone: formatted });
      if (otpErr) throw otpErr;
      setStep('otp');
    } catch (err) {
      setError(err.message || 'ส่ง OTP ไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const formatted = formatPhone(phone);
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        phone: formatted,
        token: otp,
        type: 'sms',
      });
      if (verifyErr) throw verifyErr;
      router.push('/');
    } catch (err) {
      setError(err.message || 'รหัส OTP ไม่ถูกต้อง กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🌟</div>
          <h1 className="text-4xl font-extrabold text-gray-800">จงเจริญ</h1>
          <p className="text-gray-500 mt-1">ตลาดแรงงานชุมชนประแส</p>
          <h2 className="text-3xl font-extrabold text-gray-700 mt-4">
            {step === 'phone' ? 'เข้าสู่ระบบ / ลงทะเบียน' : 'กรอกรหัส OTP'}
          </h2>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4 text-lg font-semibold text-center">
            ⚠️ {error}
          </div>
        )}

        {/* Step 1: กรอกเบอร์โทร */}
        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <label className="block text-xl font-bold text-gray-700 mb-2">
                📱 เบอร์โทรศัพท์
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
                placeholder="0XX-XXX-XXXX"
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-6 text-4xl text-center tracking-widest focus:outline-none focus:ring-4 focus:ring-orange-300 focus:border-orange-400 font-bold"
              />
              <p className="text-gray-400 text-sm text-center mt-2">รองรับเบอร์มือถือไทย 10 หลัก</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-extrabold py-10 rounded-2xl text-4xl shadow-2xl flex flex-col items-center transition"
            >
              <span className="text-6xl mb-2">📲</span>
              {loading ? 'กำลังส่ง...' : 'รับรหัส OTP'}
            </button>
          </form>
        )}

        {/* Step 2: กรอก OTP */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
              <p className="text-blue-700 font-semibold text-lg">
                ส่งรหัส OTP ไปที่ 📱 <strong>{phone}</strong> แล้ว
              </p>
            </div>
            <div>
              <label className="block text-xl font-bold text-gray-700 mb-2">
                🔐 รหัส OTP 6 หลัก
              </label>
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                placeholder="------"
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-6 text-4xl text-center tracking-widest font-bold focus:outline-none focus:ring-4 focus:ring-green-300 focus:border-green-400 letter-spacing-widest"
              />
            </div>
            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:opacity-50 text-white font-extrabold py-12 rounded-2xl text-4xl shadow-2xl flex flex-col items-center transition"
            >
              <span className="text-6xl mb-2">✅</span>
              {loading ? 'กำลังยืนยัน...' : 'ยืนยันเข้าสู่ระบบ'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
              className="w-full text-gray-500 border border-gray-200 py-4 rounded-2xl text-lg font-medium hover:bg-gray-50 transition"
            >
              🔄 เปลี่ยนเบอร์โทรศัพท์
            </button>
          </form>
        )}

        <div className="mt-8 p-4 bg-orange-50 rounded-2xl border border-orange-100">
          <p className="text-sm text-orange-700 text-center">
            🎯 <strong>บัญชีเดียว</strong> — ไม่ต้องจำรหัสผ่าน ใช้เบอร์มือถือเข้าสู่ระบบได้เลย
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.full_name.trim()) {
      setError('กรุณากรอกชื่อ-นามสกุล');
      return;
    }
    if (!formData.email.trim()) {
      setError('กรุณากรอกอีเมล');
      return;
    }
    if (formData.password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name.trim(),
            phone: formData.phone.trim(),
          }
        }
      });

      if (authError) {
        if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
          setError('อีเมลนี้มีผู้ใช้งานแล้ว กรุณาใช้อีเมลอื่นหรือเข้าสู่ระบบ');
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
        setLoading(false);
        return;
      }

      // Step 2: Upsert profile (trigger should auto-create, but we upsert to be safe + add phone)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim(),
          mode: 'both',
          spending_total: 0,
          earning_total: 0,
          total_jobs: 0,
          avg_rating: 0,
          is_verified: false,
          is_kyc_verified: false,
          skills: [],
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id', ignoreDuplicates: false });

      if (profileError) {
        console.error('Profile upsert error:', profileError);
        // Don't fail signup - trigger may have already created profile
        // Just log and continue
      }

      // Step 3: Check if email confirmation required
      if (authData.session) {
        // No email confirmation needed - redirect to dashboard
        router.push('/dashboard');
      } else {
        // Email confirmation required
        setStep('verify');
      }

    } catch (err: any) {
      console.error('Signup error:', err);
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่ครับ');
    }

    setLoading(false);
  };

  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="text-6xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">ยืนยันอีเมลของคุณ</h2>
          <p className="text-gray-600 mb-2">
            เราส่งลิงก์ยืนยันไปที่
          </p>
          <p className="font-bold text-orange-600 mb-6">{formData.email}</p>
          <p className="text-sm text-gray-500 mb-6">
            กรุณาตรวจสอบอีเมลและคลิกลิงก์ยืนยันเพื่อเริ่มใช้งาน
          </p>
          <Link
            href="/auth/login"
            className="block w-full bg-orange-500 text-white py-3 rounded-2xl font-bold hover:bg-orange-600 transition"
          >
            ไปหน้าเข้าสู่ระบบ
          </Link>
          <p className="text-xs text-gray-400 mt-4">
            ไม่ได้รับอีเมล? ตรวจสอบโฟลเดอร์ Spam
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌟</div>
          <h1 className="text-3xl font-bold text-gray-800">จงเจริญ</h1>
          <p className="text-gray-500 mt-1 text-sm">ตลาดแรงงานชุมชนประแส</p>
        </div>

        <h2 className="text-xl font-bold text-gray-700 mb-6 text-center">สมัครสมาชิก</h2>

        {/* Unified account info */}
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-3 mb-6">
          <p className="text-sm text-orange-700 text-center">
            🎯 <strong>บัญชีเดียว</strong> — ใช้ได้ทั้งเป็นลูกค้าและช่าง
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อ-นามสกุล <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="กรอกชื่อ-นามสกุล"
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              อีเมล <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@email.com"
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เบอร์โทรศัพท์
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="08x-xxx-xxxx"
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              รหัสผ่าน <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="อย่างน้อย 6 ตัวอักษร"
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
              required
              minLength={6}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ กำลังสมัคร...' : '✨ สมัครสมาชิก'}
          </button>
        </form>

        {/* Login link */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            มีบัญชีแล้ว?{' '}
            <Link href="/auth/login" className="text-orange-600 font-semibold hover:underline">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>

        {/* Terms */}
        <p className="text-xs text-center text-gray-400 mt-4">
          การสมัครถือว่าคุณยอมรับ{' '}
          <span className="text-orange-500 cursor-pointer">เงื่อนไขการใช้งาน</span>
        </p>
      </div>
    </div>
  );
}

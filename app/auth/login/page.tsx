'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (authError) throw authError;

      if (data.user) {
        // Unified Account — always go to /dashboard
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (
          err.message.includes('Invalid login credentials') ||
          err.message.includes('invalid_credentials')
        ) {
          setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        } else if (err.message.includes('Email not confirmed')) {
          setError('กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ');
        } else {
          setError(err.message);
        }
      } else {
        setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌟</div>
          <h1 className="text-3xl font-bold text-gray-800">จงเจริญ</h1>
          <p className="text-gray-500 mt-1 text-sm">ตลาดแรงงานชุมชนประแส</p>
          <h2 className="text-xl font-semibold text-gray-700 mt-4">เข้าสู่ระบบ</h2>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              อีเมล
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="example@email.com"
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              รหัสผ่าน
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="รหัสผ่านของคุณ"
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-lg transition-colors"
          >
            {loading ? '⏳ กำลังเข้าสู่ระบบ...' : '🚀 เข้าสู่ระบบ'}
          </button>
        </form>

        {/* Links */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-sm text-gray-500">
            ยังไม่มีบัญชี?{' '}
            <Link href="/auth/signup" className="text-orange-600 font-semibold hover:underline">
              สมัครสมาชิก
            </Link>
          </p>
          <p className="text-sm">
            <Link href="/" className="text-gray-400 hover:text-gray-600 text-xs">
              ← กลับหน้าหลัก
            </Link>
          </p>
        </div>

        {/* Unified account note */}
        <div className="mt-6 p-4 bg-orange-50 rounded-2xl border border-orange-100">
          <p className="text-xs text-orange-700 text-center">
            🎯 <strong>บัญชีเดียว</strong> — ใช้ได้ทั้งเป็นลูกค้าและช่าง
          </p>
        </div>
      </div>
    </div>
  );
}

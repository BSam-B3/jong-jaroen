'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
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
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (data.user) {
        // Fetch profile to get role and redirect accordingly
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError) throw profileError;

        if (profile?.role === 'freelancer') {
          router.push('/dashboard/freelancer');
        } else {
          router.push('/dashboard/customer');
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('Invalid login credentials')) {
          setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-700">จงเจริญ</h1>
          <p className="text-gray-500 mt-1">Jong Jaroen - ปากน้ำประแส</p>
          <h2 className="text-xl font-semibold text-gray-800 mt-4">เข้าสู่ระบบ</h2>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
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
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
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
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        {/* Links */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-sm text-gray-500">
            ยังไม่มีบัญชี?{' '}
            <Link href="/auth/signup" className="text-green-600 font-medium hover:underline">
              สมัครสมาชิก
            </Link>
          </p>
          <p className="text-sm">
            <Link href="/" className="text-gray-400 hover:text-gray-600 text-xs">
              ← กลับหน้าหลัก
            </Link>
          </p>
        </div>

        {/* Role Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-500 text-center font-medium mb-2">ระบบจะนำคุณไปยังหน้าที่เหมาะสมอัตโนมัติ</p>
          <div className="flex gap-4 justify-center text-xs text-gray-400">
            <span>🏠 ผู้ว่าจ้าง → Dashboard Customer</span>
            <span>🔧 ผู้รับจ้าง → Dashboard Freelancer</span>
          </div>
        </div>
      </div>
    </div>
  );
}

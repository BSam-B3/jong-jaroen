'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'user'
        }
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      alert('สมัครสมาชิกเรียบร้อย! กรุณาตรวจสอบอีเมลเพื่อยืนยันตนเองนะคะ');
      router.push('/auth/login');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">จงเจริญ</h1>
          <p className="text-gray-500 mt-2 font-medium">เริ่มต้นสร้างบัญชีใหม่ค่ะ</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="text"
            placeholder="ชื่อ-นามสกุล"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-orange-500 transition-all"
            required
          />
          <input
            type="email"
            placeholder="อีเมลของคุณ"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-orange-500 transition-all"
            required
          />
          <input
            type="password"
            placeholder="รหัสผ่าน (6 ตัวขึ้นไป)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-orange-500 transition-all"
            required
          />
          <button
            disabled={loading}
            className="w-full bg-[#EE4D2D] text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-orange-200 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'กำลังลงทะเบียน...' : 'สมัครสมาชิก'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          มีบัญชีอยู่แล้ว?{' '}
          <Link href="/auth/login" className="text-orange-600 font-bold hover:underline">
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    location: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.full_name.trim()) { setError('กรุณาใส่ชื่อ-นามสกุล'); return; }
    if (!formData.email.trim()) { setError('กรุณาใส่อีเมล'); return; }
    if (formData.password.length < 6) { setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัว'); return; }

    setLoading(true);
    try {
      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('ไม่สามารถสร้างบัญชีได้');

      // 2. Insert profile (Unified Account - no role selection)
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        full_name: formData.full_name.trim(),
        role: 'customer', // default role for backward compat
        mode: 'customer', // unified mode
        phone: formData.phone.trim(),
        location: formData.location.trim() || 'ปากน้ำประแส',
        is_verified: false,
        kyc_status: 'none',
        skills: [],
      });

      if (profileError) throw profileError;

      // 3. Redirect to dashboard
      router.push('/dashboard?welcome=1');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-6">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center text-white font-black text-2xl mx-auto mb-3">JJ</div>
          <h1 className="text-xl font-black text-blue-900">จงเจริญ</h1>
          <p className="text-gray-500 text-sm">Jong Jaroen - ปากน้ำประแส</p>
        </div>

        <h2 className="text-lg font-bold text-gray-800 text-center mb-1">สมัครสมาชิก</h2>
        <p className="text-center text-gray-500 text-xs mb-5">
          บัญชีเดียว — จ้างงานและรับงานได้เลย!
        </p>

        {/* Unified Account Benefits */}
        <div className="bg-blue-50 rounded-xl p-3 mb-4 flex gap-3">
          <div className="text-center flex-1">
            <div className="text-xl">🏠</div>
            <div className="text-xs text-blue-700 font-medium mt-0.5">จ้างช่าง</div>
          </div>
          <div className="w-px bg-blue-200" />
          <div className="text-center flex-1">
            <div className="text-xl">🔧</div>
            <div className="text-xs text-blue-700 font-medium mt-0.5">รับงาน</div>
          </div>
          <div className="w-px bg-blue-200" />
          <div className="text-center flex-1">
            <div className="text-xl">🎟️</div>
            <div className="text-xs text-blue-700 font-medium mt-0.5">ลุ้นหวย</div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">ชื่อ-นามสกุล *</label>
            <input
              type="text" name="full_name" value={formData.full_name} onChange={handleChange}
              placeholder="ชื่อ นามสกุล" required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">อีเมล *</label>
            <input
              type="email" name="email" value={formData.email} onChange={handleChange}
              placeholder="example@email.com" required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">รหัสผ่าน *</label>
            <input
              type="password" name="password" value={formData.password} onChange={handleChange}
              placeholder="อย่างน้อย 6 ตัวอักษร" required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">เบอร์โทรศัพท์</label>
            <input
              type="tel" name="phone" value={formData.phone} onChange={handleChange}
              placeholder="08X-XXX-XXXX"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">ที่อยู่ / หมู่บ้าน</label>
            <input
              type="text" name="location" value={formData.location} onChange={handleChange}
              placeholder="เช่น ปากน้ำประแส ตำบล..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-900 hover:bg-blue-800 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition-colors text-sm mt-2"
          >
            {loading ? '⏳ กำลังสมัคร...' : '🚀 สมัครสมาชิก'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          มีบัญชีแล้ว?{' '}
          <Link href="/auth/login" className="text-blue-600 font-medium hover:underline">
            เข้าสู่ระบบ
          </Link>
        </p>
        <p className="text-center text-xs text-gray-400 mt-1">
          <Link href="/" className="text-gray-400 hover:underline">← กลับหน้าหลัก</Link>
        </p>
      </div>
    </div>
  );
}

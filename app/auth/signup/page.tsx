'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  
  // States ข้อมูลผู้ใช้
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // รหัสผ่านสำหรับคนสมัครใหม่
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // State เช็คว่ามี Session ยืนยันตัวตนมาแล้วหรือยัง
  const [hasSession, setHasSession] = useState(false); 
  const [user, setUser] = useState<any>(null);

  // -------------------------------------------------------------
  // ✨ โหลดข้อมูล (แยกว่าเป็น User สมัครใหม่ หรือ User ที่ผ่าน OTP มาแล้ว)
  // -------------------------------------------------------------
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // ✅ กรณีที่ 1: ยืนยัน OTP/Social มาแล้ว (ไม่ต้องตั้งรหัสผ่าน)
        setHasSession(true);
        setUser(session.user);
        const metadata = session.user.user_metadata;
        
        if (session.user.email) setEmail(session.user.email);
        if (session.user.phone) {
          let p = session.user.phone;
          if (p.startsWith('+66')) p = '0' + p.slice(3);
          setPhone(formatPhoneDisplay(p));
        }
        if (metadata?.full_name) {
          const nameParts = metadata.full_name.split(' ');
          setFirstName(nameParts[0] || '');
          if (nameParts.length > 1) setLastName(nameParts.slice(1).join(' '));
        }
      } else {
        // ✅ กรณีที่ 2: กดปุ่มสมัครสมาชิกมาตรงๆ (ต้องกรอก Email + Password)
        setHasSession(false);
      }
    };
    checkUser();
  }, []);

  // -------------------------------------------------------------
  // ✨ ฟังก์ชันจัดการ Input Masking
  // -------------------------------------------------------------
  const formatPhoneDisplay = (val: string) => {
    const v = val.replace(/\D/g, '');
    if (v.length > 10) return v.slice(0, 10);
    if (v.length > 6) return `${v.slice(0, 3)}-${v.slice(3, 6)}-${v.slice(6)}`;
    if (v.length > 3) return `${v.slice(0, 3)}-${v.slice(3)}`;
    return v;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhoneDisplay(e.target.value));
  };

  const handleNationalIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 13) v = v.slice(0, 13);
    
    let formatted = v;
    if (v.length > 12) formatted = `${v.slice(0,1)}-${v.slice(1,5)}-${v.slice(5,10)}-${v.slice(10,12)}-${v.slice(12)}`;
    else if (v.length > 10) formatted = `${v.slice(0,1)}-${v.slice(1,5)}-${v.slice(5,10)}-${v.slice(10)}`;
    else if (v.length > 5) formatted = `${v.slice(0,1)}-${v.slice(1,5)}-${v.slice(5)}`;
    else if (v.length > 1) formatted = `${v.slice(0,1)}-${v.slice(1)}`;
    
    setNationalId(formatted);
  };

  // -------------------------------------------------------------
  // 💾 บันทึกข้อมูลและสร้างบัญชี
  // -------------------------------------------------------------
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate พื้นฐาน
    if (!firstName.trim() || !lastName.trim()) return setError('กรุณากรอกชื่อและนามสกุลให้ครบถ้วน');
    if (phone.replace(/\D/g, '').length < 10) return setError('กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก');
    
    // Validate กรณีสมัครใหม่ (ต้องมี Email และ Password)
    if (!hasSession && (!email.trim() || password.length < 6)) {
      return setError('กรุณากรอกอีเมล และตั้งรหัสผ่านอย่างน้อย 6 ตัวอักษร');
    }

    setLoading(true);

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const cleanPhone = phone.replace(/\D/g, '');
      const cleanNationalId = nationalId.replace(/\D/g, '');
      let finalUserId = user?.id;

      // 🔴 ถ้าเป็นการสมัครใหม่ด้วย Email + Password (ไม่มี Session)
      if (!hasSession) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: { full_name: fullName, phone: cleanPhone }
          }
        });
        if (signUpError) throw signUpError;
        if (!signUpData.user) throw new Error('ไม่สามารถสร้างบัญชีได้');
        
        finalUserId = signUpData.user.id;
      }

      // 🟢 บันทึกข้อมูลลงตาราง Profiles (ทำทั้งคนเก่าและคนใหม่)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
          id: finalUserId, 
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: fullName,
          phone: cleanPhone,
          email: email.trim(),
          national_id: cleanNationalId,
          updated_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;

      // ถ้าผ่าน OTP มา ให้อัปเดตข้อมูล Metadata ใน Auth ด้วย
      if (hasSession) {
        await supabase.auth.updateUser({
          data: { full_name: fullName, phone: cleanPhone }
        });
      }

      router.push('/dashboard'); 
      
    } catch (err: any) {
      if (err.message.includes('User already registered')) {
        setError('อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น หรือเข้าสู่ระบบ');
      } else {
        setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    // ✅ นำสีพื้นหลังส้ม-เหลือง กลับมาให้เหมือนหน้า Login
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-300/20 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 relative z-10 my-8">
        
        {/* 🌟 Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3 drop-shadow-sm">📋</div>
          <h1 className="text-2xl font-bold text-gray-800">สมัครสมาชิก</h1>
          <p className="text-gray-500 mt-1 text-[11px] font-bold tracking-widest uppercase">แพลตฟอร์มตลาดแรงงานชุมชน</p>
          <p className="text-gray-500 mt-4 text-xs font-medium">
            {hasSession ? 'กรอกข้อมูลส่วนตัวเพื่อเริ่มใช้งาน' : 'สร้างบัญชีใหม่เพื่อเข้าสู่ระบบ'}
          </p>
        </div>

        {/* ⚠️ Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-5 text-sm font-medium">
            {error}
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* ฟอร์มกรอกข้อมูล */}
        {/* ----------------------------------------------------------- */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          
          {/* ชื่อ - สกุล */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 pl-1">ชื่อจริง <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                placeholder="สมชาย"
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 pl-1">นามสกุล <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                placeholder="ใจดี"
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* เบอร์โทรศัพท์ */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 pl-1">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              required
              placeholder="08X-XXX-XXXX"
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm tracking-wider focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all"
            />
          </div>

          {/* อีเมล (บังคับถ้าเป็นคนสมัครใหม่) */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 pl-1">อีเมล {!hasSession && <span className="text-red-500">*</span>}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required={!hasSession}
              placeholder="example@email.com"
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all"
            />
          </div>

          {/* 🔐 รหัสผ่าน (โชว์เฉพาะคนมากดสมัครใหม่ ที่ยังไม่ได้ผ่าน OTP) */}
          {!hasSession && (
            <div className="space-y-1.5 pt-2">
              <label className="text-sm font-medium text-gray-700 pl-1">ตั้งรหัสผ่าน <span className="text-red-500">*</span></label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all"
              />
            </div>
          )}

          {/* เลขบัตรประชาชน */}
          <div className="space-y-1.5 pt-2">
            <label className="text-sm font-medium text-gray-700 pl-1 flex items-center justify-between">
              <span>เลขประจำตัวประชาชน</span>
            </label>
            <input
              type="text"
              value={nationalId}
              onChange={handleNationalIdChange}
              placeholder="X-XXXX-XXXXX-XX-X"
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all"
            />
            <p className="text-xs text-gray-500 pl-1">
              *จำเป็นสำหรับผู้รับงานเพื่อยืนยันตัวตน
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-lg transition-colors mt-6"
          >
            {loading ? 'กำลังดำเนินการ...' : 'สมัครสมาชิก และเริ่มใช้งาน 🚀'}
          </button>
        </form>

        {/* 🤝 Unified Account Note */}
        <div className="mt-8 bg-orange-50 rounded-2xl border border-orange-100 p-4">
          <p className="text-xs text-orange-700 text-center">
            🎯 <strong>บัญชีเดียว</strong> — ใช้ได้ทั้งเป็นลูกค้าและช่าง
          </p>
        </div>

        {/* ✅ ปุ่มย้อนกลับ */}
        <div className="mt-6 text-center">
          <button 
            onClick={() => router.back()} 
            className="text-sm text-gray-400 font-medium hover:text-gray-600 transition-colors"
          >
            ← ย้อนกลับ
          </button>
        </div>

      </div>
    </div>
  );
}

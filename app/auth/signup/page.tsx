'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
  const router = useRouter();
  
  // States ข้อมูลผู้ใช้
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // ✅ เพิ่ม State รหัสผ่าน
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // ✅ State เช็คว่ามาจาก OTP/Social หรือมากดสมัครใหม่ตรงๆ
  const [hasSession, setHasSession] = useState(false); 
  const [user, setUser] = useState<any>(null);

  // -------------------------------------------------------------
  // ✨ โหลดข้อมูล (แยกว่าเป็น User สมัครใหม่ หรือ User ที่ผ่าน OTP มาแล้ว)
  // -------------------------------------------------------------
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // กรณีที่ 2: ผ่านการยืนยันตัวตนมาแล้ว (OTP/Social)
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
        // กรณีที่ 1: เข้ามากดสมัครใหม่ (ไม่มี Session)
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

    // Validate
    if (!firstName.trim() || !lastName.trim()) return setError('กรุณากรอกชื่อและนามสกุลให้ครบถ้วน');
    if (phone.replace(/\D/g, '').length < 10) return setError('กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก');
    if (!hasSession && (!email.trim() || password.length < 6)) {
      return setError('กรุณากรอกอีเมล และตั้งรหัสผ่านอย่างน้อย 6 ตัวอักษร');
    }

    setLoading(true);

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const cleanPhone = phone.replace(/\D/g, '');
      const cleanNationalId = nationalId.replace(/\D/g, '');
      let finalUserId = user?.id;

      // 🔴 ถ้าเป็นการสมัครใหม่ด้วย Email + Password
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

      // 🟢 บันทึกข้อมูลลงตาราง Profiles
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

      // ถ้าเป็น OTP มาก่อน ให้อัปเดตข้อมูลด้วย
      if (hasSession) {
        await supabase.auth.updateUser({
          data: { full_name: fullName, phone: cleanPhone }
        });
      }

      alert('สมัครสมาชิกสำเร็จ! 🎉');
      router.push('/'); 
      
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
    <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-4 relative overflow-hidden">
      
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-300/20 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="bg-white rounded-[2.5rem] shadow-xl w-full max-w-md p-8 relative z-10 border border-gray-100 mt-8 mb-8">
        
        {/* 🌟 Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#EE4D2D] to-[#FF7337] rounded-2xl shadow-lg flex items-center justify-center text-3xl mb-4 mx-auto transform rotate-3">
            📝
          </div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">สมัครสมาชิก</h1>
          <p className="text-gray-500 mt-1 text-[11px] font-bold tracking-widest uppercase">แพลตฟอร์มตลาดแรงงานชุมชน</p>
          <p className="text-gray-500 mt-4 text-xs font-medium">
            {hasSession ? 'กรอกข้อมูลให้ครบถ้วนเพื่อเริ่มใช้งาน' : 'สร้างบัญชีใหม่เพื่อเข้าสู่ระบบ'}
          </p>
        </div>

        {/* ⚠️ Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-5 text-[11px] font-bold flex items-start gap-2">
            <span className="text-sm">⚠️</span> <span>{error}</span>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* ฟอร์มกรอกข้อมูล */}
        {/* ----------------------------------------------------------- */}
        <form onSubmit={handleSaveProfile} className="space-y-4 animate-fade-in">
          
          {/* ชื่อ - สกุล */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 pl-1">ชื่อจริง <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                placeholder="สมชาย"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D] transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 pl-1">นามสกุล <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                placeholder="ใจดี"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D] transition-all"
              />
            </div>
          </div>

          {/* เบอร์โทรศัพท์ */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 pl-1">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              required
              placeholder="08X-XXX-XXXX"
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium tracking-wider focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D] transition-all"
            />
          </div>

          {/* อีเมล (บังคับถ้าสมัครใหม่) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 pl-1">อีเมล {!hasSession && <span className="text-red-500">*</span>}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required={!hasSession}
              placeholder="example@email.com"
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D] transition-all"
            />
          </div>

          {/* 🔐 รหัสผ่าน (โชว์เฉพาะสมัครใหม่ที่ยังไม่มี Session) */}
          {!hasSession && (
            <div className="space-y-1.5 animate-fade-in-up">
              <label className="text-[11px] font-bold text-gray-500 pl-1">ตั้งรหัสผ่าน <span className="text-red-500">*</span></label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D] transition-all"
              />
            </div>
          )}

          {/* เลขบัตรประชาชน */}
          <div className="space-y-1.5 pt-2">
            <label className="text-[11px] font-bold text-gray-500 pl-1 flex items-center justify-between">
              <span>เลขประจำตัวประชาชน</span>
              <span className="text-[9px] text-[#EE4D2D] bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">จำเป็นสำหรับผู้รับงาน</span>
            </label>
            <input
              type="text"
              value={nationalId}
              onChange={handleNationalIdChange}
              placeholder="X-XXXX-XXXXX-XX-X"
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D] transition-all"
            />
            <p className="text-[9px] text-gray-400 pl-1 leading-relaxed">
              *หากคุณเป็นผู้รับงาน กรุณากรอกข้อมูลนี้เพื่อยืนยันตัวตนกับทางแพลตฟอร์ม
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] text-white py-4 rounded-2xl font-black text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition-all mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'กำลังดำเนินการ...' : 'สมัครสมาชิก และเริ่มใช้งาน 🚀'}
          </button>
        </form>

      </div>
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ServicesPage() {
  const [userName, setUserName] = useState('กำลังโหลด...');
  const [userInitial, setUserInitial] = useState('');
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // ถ้าไม่มี Session ให้เด้งกลับไปหน้า Login
      if (!session) {
        router.push('/login');
        return;
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/services`
      }
    });
    if (error) alert('เกิดข้อผิดพลาดในการเชื่อมต่อ Google: ' + error.message);
  };

      const user = session.user;
      
      // ดึงชื่อจาก Google (full_name) หรือถ้าล็อกอินด้วยอีเมลปกติ ให้ดึงชื่อจากหน้า @ มาโชว์
      const name = user.user_metadata?.full_name 
                   || user.user_metadata?.name 
                   || user.email?.split('@')[0] 
                   || 'ผู้ใช้งาน';
                   
      setUserName(name);
      
      // เอาตัวอักษรตัวแรกมาทำเป็นรูปโปรไฟล์แบบย่อ
      setUserInitial(name.charAt(0).toUpperCase());
    };
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วนค่ะ');
      return;
    }
    setLoading(true);
    let { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error && error.message.includes('Invalid login credentials')) {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
         alert('สมัครสมาชิกไม่สำเร็จ: ' + signUpError.message);
         setLoading(false);
         return;
      }
      alert('สร้างบัญชีและเข้าสู่ระบบสำเร็จ! 🚀');
      router.push('/services');
      return;
    }

    fetchUser();
  }, [router]);
    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } else {
      router.push('/services');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-20">
      {/* 🟠 ส่วน Header (สีส้ม) */}
      <div className="bg-[#F05D40] rounded-b-[2rem] p-6 pt-12 shadow-sm relative">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              จงเจริญ <span className="text-xl">🌟</span>
            </h1>
            <p className="text-white/90 text-sm mt-1">แอปพลิเคชันคู่ชุมชนปากน้ำประแส</p>
          </div>
          
          {/* ✅ จุดที่ 1: ดึงชื่อ User มาโชว์ (แทนตัว N เดิม) */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-3">
              <span className="text-white font-bold text-sm bg-white/20 px-3 py-1 rounded-full border border-white/30 truncate max-w-[120px]">
                {userName}
              </span>
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#F05D40] font-black text-lg shadow-md">
                {userInitial}
              </div>
            </div>
          </div>
        </div>
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col justify-center items-center p-4 pb-safe">
      <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-gray-100 w-full max-w-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#F05D40] to-[#FF8769]"></div>

        {/* 🔍 Search Bar */}
        <div className="bg-white rounded-2xl p-3.5 flex items-center shadow-md">
          <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <input 
            type="text" 
            placeholder="หาช่างแอร์, แม่บ้าน, คนช่วยยกของ..." 
            className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
          />
        <div className="text-center mb-8 mt-2">
          <div className="w-16 h-16 bg-orange-50 rounded-full mx-auto flex items-center justify-center text-3xl mb-3 border border-orange-100 shadow-inner">🌟</div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">จงเจริญ</h1>
          <p className="text-xs font-medium text-gray-500 mt-1">เข้าสู่ระบบด้วยบัญชี Google ของคุณ</p>
        </div>
      </div>

      <div className="p-4 space-y-4 -mt-2">
        {/* 🗂️ เมนูลัด */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center active:scale-95 transition-transform cursor-pointer">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-2xl mb-2">🛠️</div>
            <h3 className="font-bold text-gray-800 text-sm">จ้างช่าง/แม่บ้าน</h3>
            <p className="text-[10px] text-gray-500 mt-1">ค้นหาบริการมืออาชีพ</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100 flex flex-col items-center justify-center text-center active:scale-95 transition-transform cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#F05D40] text-white text-[8px] font-bold px-2 py-1 rounded-bl-lg">วินออนไลน์</div>
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-2xl mb-2">🛵</div>
            <h3 className="font-bold text-gray-800 text-sm">งานด่วน/ฝากซื้อ</h3>
            <p className="text-[10px] text-gray-500 mt-1">หาคนช่วยวิ่งธุระ</p>
          </div>
        </div>
        {/* 🔴 ปุ่ม Google Login (Gmail) */}
        <button 
          onClick={handleGoogleLogin}
          className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-sm mb-6"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          <span className="text-[15px]">เข้าใช้งานด้วย Google</span>
        </button>

        {/* 🛠️ หมวดหมู่บริการ */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-[#F05D40] rounded-full"></div>
              <h2 className="font-bold text-gray-800">หมวดหมู่บริการ</h2>
            </div>
            <button className="text-[#F05D40] text-xs font-bold">ดูทั้งหมด</button>
          </div>
          <div className="grid grid-cols-4 gap-y-4 gap-x-2">
            {[
              { icon: '❄️', name: 'ล้างแอร์' },
              { icon: '🧹', name: 'แม่บ้าน' },
              { icon: '⚡', name: 'ช่างไฟ' },
              { icon: '💧', name: 'ประปา' },
              { icon: '🔧', name: 'ซ่อมรถ' },
              { icon: '🚚', name: 'ขนส่ง' },
              { icon: '📦', name: 'ย้ายบ้าน' },
              { icon: '✨', name: 'อื่นๆ' },
            ].map((item, index) => (
              <div key={index} className="flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform cursor-pointer">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-xl border border-gray-100 shadow-sm">{item.icon}</div>
                <span className="text-[10px] text-gray-600 font-medium">{item.name}</span>
              </div>
            ))}
          </div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px bg-gray-200 flex-1"></div>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">หรือ</span>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        {/* ✅ จุดที่ 2: ปรับ Banner เป็น Job Board */}
        <div className="bg-gradient-to-r from-[#0082FA] to-[#00A3FF] rounded-2xl p-5 shadow-md flex justify-between items-center text-white relative overflow-hidden cursor-pointer active:scale-95 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <div className="z-10">
            <h2 className="font-bold text-lg flex items-center gap-2">
              💼 กระดานหางาน
            </h2>
            <p className="text-xs text-white/90 mt-1 font-light">ค้นหาตำแหน่งงานว่าง หรือลงประกาศในชุมชน</p>
          </div>
          <button className="z-10 bg-white text-[#0082FA] text-xs font-bold py-2.5 px-4 rounded-full shadow-sm flex items-center gap-1">
            เข้าดู <span className="text-sm">🚀</span>
        <form onSubmit={handleEmailAuth} className="space-y-3">
          <input 
            type="email" placeholder="อีเมล" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl text-sm outline-none focus:border-[#F05D40]" required
          />
          <input 
            type="password" placeholder="รหัสผ่าน" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl text-sm outline-none focus:border-[#F05D40]" required
          />
          <button 
            type="submit" disabled={loading}
            className="w-full bg-[#F05D40] hover:bg-[#E04D30] text-white font-bold py-3.5 rounded-xl active:scale-95 transition-all shadow-md shadow-orange-200 mt-2"
          >
            {loading ? 'กำลังดำเนินการ...' : 'เข้าสู่ระบบ / ลงทะเบียน'}
          </button>
        </div>
        
        </form>
      </div>
    </div>
  );

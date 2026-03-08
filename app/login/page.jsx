'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [loginMethod, setLoginMethod] = useState('phone');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSocialLogin = async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: `${window.location.origin}/services`
      }
    });
    if (error) alert(`เกิดข้อผิดพลาดในการเชื่อมต่อ ${provider}: ` + error.message);
  };

  const handleTraditionalAuth = async (e) => {
    e.preventDefault();
    if (!emailOrPhone || !password) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วนค่ะ');
      return;
    }
    
    setLoading(true);
    alert(`กำลังเข้าสู่ระบบด้วย ${loginMethod === 'phone' ? 'เบอร์โทร' : 'อีเมล'}\n(จำลองการล็อกอิน รอต่อท่อหลังบ้านค่ะ)`);
    setTimeout(() => {
      router.push('/services');
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col justify-center items-center p-4 selection:bg-orange-200 pb-safe">
      <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-gray-100 w-full max-w-sm relative overflow-hidden">
        
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#F05D40] to-[#FF8769]"></div>

        <div className="text-center mb-6 mt-2">
          <div className="w-16 h-16 bg-orange-50 rounded-full mx-auto flex items-center justify-center text-3xl mb-3 border border-orange-100 shadow-inner">
            🌟
          </div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">เข้าสู่ระบบ</h1>
          <p className="text-xs font-medium text-gray-500 mt-1">แอปพลิเคชันชุมชนจงเจริญ</p>
        </div>

        <div className="flex justify-center gap-4 mb-6">
          <button onClick={() => handleSocialLogin('line')} className="w-14 h-14 bg-[#00B900] hover:bg-[#00A000] rounded-full flex items-center justify-center text-white active:scale-95 transition-all shadow-md shadow-green-200">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor"><path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.114.277.073.71.035 1.011-.052.404-.336 2.016-.407 2.455-.088.546.402.766.866.495.342-.2 1.839-1.082 3.385-1.954 3.73-2.107 9.028-5.304 9.028-12.207z"/></svg>
          </button>
          <button onClick={() => handleSocialLogin('facebook')} className="w-14 h-14 bg-[#1877F2] hover:bg-[#166FE5] rounded-full flex items-center justify-center text-white active:scale-95 transition-all shadow-md shadow-blue-200">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </button>
          <button onClick={() => handleSocialLogin('google')} className="w-14 h-14 bg-white border border-gray-200 hover:bg-gray-50 rounded-full flex items-center justify-center active:scale-95 transition-all shadow-sm">
            <svg className="w-6 h-6" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          </button>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="h-px bg-gray-200 flex-1"></div>
          <span className="text-[11px] font-bold text-gray-400">หรือล็อกอินด้วย</span>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
          <button 
            onClick={() => setLoginMethod('phone')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${loginMethod === 'phone' ? 'bg-white text-[#F05D40] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            เบอร์โทรศัพท์
          </button>
          <button 
            onClick={() => setLoginMethod('email')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${loginMethod === 'email' ? 'bg-white text-[#F05D40] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            อีเมล
          </button>
        </div>

        <form onSubmit={handleTraditionalAuth} className="space-y-3">
          <div>
            <input 
              type={loginMethod === 'email' ? 'email' : 'tel'} 
              placeholder={loginMethod === 'email' ? 'ระบุอีเมล' : 'ระบุเบอร์โทรศัพท์'}
              value={emailOrPhone} 
              onChange={e => setEmailOrPhone(e.target.value)} 
              className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl text-sm font-medium text-gray-800 outline-none focus:border-[#F05D40] focus:ring-1 focus:ring-[#F05D40] transition-all" 
              required
            />
          </div>
          <div>
            <input 
              type="password" 
              placeholder="รหัสผ่าน"
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl text-sm font-medium text-gray-800 outline-none focus:border-[#F05D40] focus:ring-1 focus:ring-[#F05D40] transition-all" 
              required
            />
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[#F05D40] hover:bg-[#E04D30] disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl active:scale-95 transition-transform shadow-md shadow-orange-200 mt-2 text-[15px]"
          >
            {loading ? 'กำลังดำเนินการ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

      </div>
    </div>
  );
}

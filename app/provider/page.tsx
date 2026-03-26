'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ProviderDashboardPage() {
  const router = useRouter();

  // States
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false); // สวิตช์พร้อมรับงาน
  const [kycStatus, setKycStatus] = useState<'none' | 'pending' | 'approved'>('none'); // สถานะยืนยันตัวตน
  
  // Mock Data: รายได้และสถิติ
  const [stats, setStats] = useState({
    todayEarnings: 450,
    jobsCompleted: 3,
    rating: 4.8
  });

  useEffect(() => {
    // โหลดข้อมูลผู้ใช้ (ของจริงจะดึงสถานะ KYC จาก DB ด้วย)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/auth/login');
      } else {
        setCurrentUser(session.user);
        // จำลองว่ายังไม่ได้ทำ KYC เพื่อให้เห็นหน้าตาแจ้งเตือน
        setKycStatus('none'); 
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pb-24">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-x-hidden rounded-t-[2.5rem]">
        
        {/* 🌑 Header ฝั่งคนรับจ้าง (ใช้สีเข้มให้ต่างจากโหมดลูกค้า) */}
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-[2.5rem] p-6 pt-10 pb-8 shadow-md relative z-10 m-3 mt-4 overflow-hidden">
          {/* เอฟเฟกต์ตกแต่ง */}
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex justify-between items-center relative z-10 px-2 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-700 border-2 border-gray-600 rounded-full flex items-center justify-center text-xl text-white">
                {currentUser?.user_metadata?.full_name?.charAt(0) || '👤'}
              </div>
              <div className="text-left">
                <h1 className="text-white text-lg font-black tracking-tight leading-tight">
                  {currentUser?.user_metadata?.full_name || 'คนรับจ้าง'}
                </h1>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                  โหมดผู้ให้บริการ
                </p>
              </div>
            </div>
            
            {/* ปุ่มสลับโหมดกลับไปเป็นลูกค้า */}
            <button 
              onClick={() => router.push('/')}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold px-3 py-1.5 rounded-full border border-white/20 transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>🔄</span> โหมดลูกค้า
            </button>
          </div>

          {/* 🚦 สวิตช์ เปิด-ปิด รับงาน (Online/Offline) */}
          <div className="mt-4 px-2 relative z-10">
            <div className={`rounded-2xl p-4 flex items-center justify-between transition-colors duration-300 shadow-inner border ${isOnline ? 'bg-green-500/20 border-green-500/30' : 'bg-gray-800 border-gray-700'}`}>
              <div>
                <h2 className={`text-sm font-black ${isOnline ? 'text-green-400' : 'text-gray-300'}`}>
                  {isOnline ? '🟢 พร้อมรับงาน' : '⚫ ออฟไลน์'}
                </h2>
                <p className="text-gray-400 text-[9px] mt-0.5">
                  {isOnline ? 'ระบบกำลังกระจายงานให้คุณในรัศมี 5 กม.' : 'เปิดสวิตช์เพื่อเริ่มดูงานด่วนในพื้นที่'}
                </p>
              </div>

              {/* Toggle UI */}
              <div 
                onClick={() => setIsOnline(!isOnline)}
                className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${isOnline ? 'bg-green-500' : 'bg-gray-600'}`}
              >
                <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${isOnline ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </div>
            </div>
          </div>
        </div>

        {/* 📋 เนื้อหาหลัก Dashboard */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide pb-24 z-0">
          
          {/* ⚠️ แจ้งเตือน KYC (ถ้ายังไม่ยืนยันตัวตน) */}
          {kycStatus === 'none' && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm animate-fade-in">
              <div className="text-2xl mt-0.5">🚨</div>
              <div className="flex-1">
                <h3 className="text-sm font-black text-red-700">คุณยังไม่ได้ยืนยันตัวตน</h3>
                <p className="text-[10px] text-red-600 mt-1 leading-relaxed">
                  เพื่อความปลอดภัยของชุมชน กรุณาอัปโหลดรูปบัตรประชาชน (KYC) ก่อนเริ่มรับงานแรกค่ะ
                </p>
                <button 
                  onClick={() => alert('เตรียมไปหน้าอัปโหลดเอกสาร KYC')}
                  className="mt-2 bg-red-600 text-white text-[10px] font-bold px-4 py-2 rounded-lg shadow-sm active:scale-95 transition-transform"
                >
                  ยืนยันตัวตนเดี๋ยวนี้ ›
                </button>
              </div>
            </div>
          )}

          {/* 📊 สรุปสถิติวันนี้ */}
          <h2 className="text-sm font-black text-gray-800 tracking-tight px-1 pt-2">📊 สรุปผลงานวันนี้</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-center">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">รายได้สุทธิ (บาท)</p>
              <h3 className="text-2xl font-black text-green-600">฿{stats.todayEarnings}</h3>
            </div>
            <div className="grid grid-rows-2 gap-3">
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex items-center justify-between">
                <span className="text-[10px] text-gray-500 font-bold">งานสำเร็จ</span>
                <span className="text-lg font-black text-gray-800">{stats.jobsCompleted}</span>
              </div>
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex items-center justify-between">
                <span className="text-[10px] text-gray-500 font-bold">คะแนนดาว</span>
                <span className="text-lg font-black text-orange-500 flex items-center gap-1">⭐ {stats.rating}</span>
              </div>
            </div>
          </div>

          {/* 🎯 กระดานงานที่รอกดรับ (สมมติว่าดึงมาจาก express_jobs ที่สถานะ open) */}
          <div className="pt-4">
            <div className="flex justify-between items-end mb-3 px-1">
              <h2 className="text-sm font-black text-gray-800 tracking-tight flex items-center gap-2">
                <span className="text-blue-500">📡</span> งานที่เข้ามาใหม่
              </h2>
            </div>

            {!isOnline ? (
              <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-200 border-dashed">
                <span className="text-4xl opacity-50 block mb-2">😴</span>
                <p className="text-xs font-bold text-gray-500">คุณกำลังออฟไลน์</p>
                <p className="text-[9px] text-gray-400 mt-1">เปิดสวิตช์ด้านบนเพื่อเริ่มดูงานที่เข้ามา</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Mock Job 1 */}
                <div className="bg-white rounded-[1.5rem] p-4 shadow-sm border-2 border-orange-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-[#EE4D2D] text-white text-[9px] font-black px-3 py-1 rounded-bl-xl shadow-sm">
                    ด่วน!
                  </div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-800 text-sm pr-10">ซื้อข้าวมันไก่ เจ๊หมวย 3 ห่อ</h3>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-gray-500 font-medium mb-3">
                    <span className="flex items-center gap-1">📍 ห่างไป 1.2 กม.</span>
                    <span className="flex items-center gap-1">🛵 มอเตอร์ไซค์</span>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex justify-between items-center mb-3">
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold">ค่าจ้างที่คุณจะได้</p>
                      <p className="text-base font-black text-[#EE4D2D]">฿35.00</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-gray-400 font-bold">สำรองค่าของ</p>
                      <p className="text-xs font-bold text-blue-600">~ ฿150</p>
                    </div>
                  </div>
                  <button className="w-full bg-[#EE4D2D] text-white py-3 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-transform">
                    ปัดเพื่อรับงาน ›››
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ✅ Bottom Navigation (ปรับเมนูให้เข้ากับคนรับจ้าง) */}
        <div className="fixed bottom-0 w-full sm:max-w-2xl md:max-w-3xl bg-white/95 backdrop-blur-md border-t border-gray-100 px-1 py-4 flex justify-between items-center shadow-[0_-4px_25px_rgba(0,0,0,0.06)] rounded-t-[2.5rem] z-50">
          <NavItem icon="📈" label="แดชบอร์ด" active={true} onClick={() => {}} />
          <NavItem icon="📋" label="งานของฉัน" active={false} onClick={() => {}} />
          <NavItem icon="💬" label="แชท" active={false} onClick={() => {}} />
          <NavItem icon="⚙️" label="ตั้งค่า" active={false} onClick={() => {}} />
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}} />
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: any) {
  return (
    <div onClick={onClick} className={`flex flex-col items-center gap-1.5 cursor-pointer transition-all ${active ? 'scale-110' : 'opacity-40 hover:opacity-100'} flex-1`}>
      <span className="text-[22px]">{icon}</span>
      <span className={`text-[9px] font-bold ${active ? 'text-gray-800' : 'text-gray-500'} whitespace-nowrap`}>{label}</span>
      {active && <div className="w-1.5 h-1.5 bg-gray-800 rounded-full shadow-sm mt-0.5"></div>}
    </div>
  );
}

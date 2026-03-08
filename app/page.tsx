'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [userName, setUserName] = useState('กำลังโหลด...');
  const [userInitial, setUserInitial] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      const user = session.user;
      const name = user.user_metadata?.full_name 
                   || user.user_metadata?.name 
                   || user.email?.split('@')[0] 
                   || 'ผู้ใช้งาน';
                   
      setUserName(name);
      setUserInitial(name.charAt(0).toUpperCase());
    };

    fetchUser();
  }, [router]);

  return (
    /* 📱 พื้นหลังด้านนอกสุด (Desk/Background) */
    <div className="min-h-screen bg-[#E5E7EB] flex justify-center items-start md:items-center md:py-8">
      
      {/* 📱 ตัวแอป (Main App Container) - ปรับขนาดอัตโนมัติตาม Device */}
      <div className="w-full sm:max-w-xl md:max-w-md bg-[#F4F6F8] min-h-screen md:min-h-[850px] md:h-[850px] md:rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col border-[8px] border-transparent md:border-black">
        
        {/* ส่วนเนื้อหาที่ Scroll ได้ */}
        <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
          
          {/* 🟠 Header (สีส้ม) */}
          <div className="bg-[#F05D40] rounded-b-[2.5rem] p-6 pt-12 shadow-sm relative">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-black text-white flex items-center gap-2">
                  จงเจริญ <span className="text-xl">🌟</span>
                </h1>
                <p className="text-white/90 text-[10px] sm:text-xs mt-1 font-medium">แอปพลิเคชันคู่ชุมชนปากน้ำประแส</p>
              </div>
              
              <div className="flex items-center gap-2 bg-white/10 p-1 pr-3 rounded-full border border-white/20 backdrop-blur-sm">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#F05D40] font-black text-sm shadow-sm">
                  {userInitial}
                </div>
                <span className="text-white font-bold text-[10px] sm:text-xs truncate max-w-[80px]">
                  {userName}
                </span>
              </div>
            </div>

            {/* 🔍 Search Bar */}
            <div className="bg-white rounded-2xl p-3.5 flex items-center shadow-lg transform translate-y-2">
              <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              <input 
                type="text" 
                placeholder="หาช่างแอร์, แม่บ้าน, คนช่วยยกของ..." 
                className="w-full bg-transparent outline-none text-xs sm:text-sm text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>

          {/* 🧩 Content Area */}
          <div className="p-4 space-y-5 mt-4">
            
            {/* 🗂️ เมนูลัด */}
            <div className="grid grid-cols-2 gap-4">
              <MenuButton 
                icon="🛠️" 
                title="จ้างช่าง/แม่บ้าน" 
                desc="ค้นหาบริการมืออาชีพ" 
                color="blue"
                onClick={() => router.push('/hire')} 
              />
              <MenuButton 
                icon="🛵" 
                title="งานด่วน/ฝากซื้อ" 
                desc="หาคนช่วยวิ่งธุระ" 
                color="orange"
                badge="วินออนไลน์"
                onClick={() => router.push('/win-online')} 
              />
            </div>

            {/* 🛠️ หมวดหมู่บริการ */}
            <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-5 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-5 bg-[#F05D40] rounded-full"></div>
                  <h2 className="font-bold text-gray-800 text-sm sm:text-base">หมวดหมู่บริการ</h2>
                </div>
                <button className="text-[#F05D40] text-[10px] sm:text-xs font-bold bg-orange-50 px-3 py-1 rounded-full">ดูทั้งหมด</button>
              </div>
              <div className="grid grid-cols-4 gap-y-6 gap-x-2">
                {[
                  { icon: '❄️', name: 'ล้างแอร์' }, { icon: '🧹', name: 'แม่บ้าน' },
                  { icon: '⚡', name: 'ช่างไฟ' }, { icon: '💧', name: 'ประปา' },
                  { icon: '🔧', name: 'ซ่อมรถ' }, { icon: '🚚', name: 'ขนส่ง' },
                  { icon: '📦', name: 'ย้ายบ้าน' }, { icon: '✨', name: 'อื่นๆ' },
                ].map((item, index) => (
                  <div key={index} className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform cursor-pointer">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-xl border border-gray-100 shadow-sm">{item.icon}</div>
                    <span className="text-[9px] sm:text-[10px] text-gray-600 font-semibold">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ✅ Job Board Banner */}
            <div 
              onClick={() => router.push('/job-board')}
              className="bg-gradient-to-br from-[#0082FA] to-[#00A3FF] rounded-[2rem] p-6 shadow-lg flex justify-between items-center text-white relative overflow-hidden cursor-pointer active:scale-95 transition-all"
            >
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div className="z-10">
                <h2 className="font-bold text-lg sm:text-xl flex items-center gap-2">💼 กระดานหางาน</h2>
                <p className="text-[10px] sm:text-xs text-white/90 mt-1 font-medium">ค้นหาตำแหน่งงานว่างในชุมชน</p>
              </div>
              <button className="z-10 bg-white text-[#0082FA] text-[10px] font-black py-2.5 px-5 rounded-full shadow-md">เข้าดู 🚀</button>
            </div>
          </div>
        </div>

        {/* 🧭 แถบเมนูด้านล่าง (ปรับให้อยู่ในกรอบเสมอ) */}
        <div className="absolute bottom-0 left-0 w-full bg-white/80 backdrop-blur-md border-t border-gray-100 px-6 py-3 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-[2.5rem] z-50">
          <NavItem icon="🏠" label="หน้าแรก" active={activeTab === 'home'} onClick={() => {setActiveTab('home'); router.push('/')}} />
          <NavItem icon="🛠️" label="บริการ" active={activeTab === 'services'} onClick={() => setActiveTab('services')} />
          <NavItem icon="📋" label="งานด่วน" active={activeTab === 'urgent'} onClick={() => setActiveTab('urgent')} />
          <NavItem icon="📜" label="ประวัติ" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
          <NavItem icon="👤" label="ฉัน" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
        </div>

      </div>
    </div>
  );
}

// --- คอมโพเนนต์ย่อย ---

function MenuButton({ icon, title, desc, color, badge, onClick }: any) {
  const colorClass = color === 'blue' ? 'bg-blue-50 border-gray-100' : 'bg-orange-50 border-orange-100';
  return (
    <div onClick={onClick} className={`bg-white p-5 rounded-3xl shadow-sm border ${colorClass} flex flex-col items-center justify-center text-center active:scale-95 transition-all cursor-pointer relative overflow-hidden h-full`}>
      {badge && <div className="absolute top-0 right-0 bg-[#F05D40] text-white text-[8px] font-bold px-3 py-1 rounded-bl-xl shadow-sm">{badge}</div>}
      <div className={`w-14 h-14 ${colorClass} rounded-2xl flex items-center justify-center text-3xl mb-3 shadow-inner`}>{icon}</div>
      <h3 className="font-bold text-gray-800 text-xs sm:text-sm">{title}</h3>
      <p className="text-[9px] sm:text-[10px] text-gray-500 mt-1">{desc}</p>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: any) {
  return (
    <div onClick={onClick} className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${active ? 'scale-110' : 'opacity-40'}`}>
      <span className="text-xl sm:text-2xl">{icon}</span>
      <span className={`text-[9px] sm:text-[10px] font-bold ${active ? 'text-[#F05D40]' : 'text-gray-500'}`}>{label}</span>
      {active && <div className="w-1 h-1 bg-[#F05D40] rounded-full"></div>}
    </div>
  );
}

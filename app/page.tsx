'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [userName, setUserName] = useState('กำลังโหลด...');
  const [userInitial, setUserInitial] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setUserName('ผู้เยี่ยมชม');
        setUserInitial('ผ');
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/services?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    // ✅ ปรับพื้นหลังและคอนเทนเนอร์ให้ตรงกับหน้าอื่นๆ ของแอป (ไม่มีขอบดำ)
    <div className="min-h-screen bg-gray-100 flex justify-center pb-24">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-x-hidden">

        {/* ส่วนเนื้อหาที่ Scroll ได้ */}
        <div className="flex-1 overflow-y-auto pb-6 scrollbar-hide">
          
          {/* 🟠 Header (สีส้ม) */}
          <div className="bg-[#F05D40] rounded-b-[2.5rem] p-6 pt-12 shadow-sm relative z-10">
            <div className="flex justify-between items-start mb-6 px-2">
              <div>
                <h1 className="text-2xl font-black text-white flex items-center gap-2">
                  จงเจริญ <span className="text-xl">🌟</span>
                </h1>
                <p className="text-white/90 text-xs mt-1 font-medium">แอปพลิเคชันคู่ชุมชนปากน้ำประแส</p>
              </div>
              
              <button 
                onClick={() => router.push('/profile/edit')}
                className="flex items-center gap-2 bg-white/10 p-1.5 pr-4 rounded-full border border-white/20 backdrop-blur-md active:scale-95 transition-transform"
              >
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#F05D40] font-black text-sm shadow-sm">
                  {userInitial}
                </div>
                <span className="text-white font-bold text-xs truncate max-w-[120px]">
                  {userName}
                </span>
              </button>
            </div>

            {/* 🔍 Search Bar */}
            <form onSubmit={handleSearch} className="bg-white rounded-2xl p-3.5 flex items-center shadow-lg transform translate-y-2 mx-2">
              <svg className="w-5 h-5 text-gray-400 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="หาช่างแอร์, แม่บ้าน, คนช่วยยกของ..." 
                className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400 font-medium"
              />
            </form>
          </div>

          {/* 🧩 Content Area */}
          <div className="p-5 space-y-6 mt-4 relative z-20">
            
            {/* 🗂️ เมนูลัด (Grid 2 คอลัมน์) */}
            <div className="grid grid-cols-2 gap-5">
              <MenuButton 
                icon="🛠️" title="จ้างช่าง/แม่บ้าน" desc="ค้นหาบริการมืออาชีพ" color="blue"
                onClick={() => router.push('/services')} 
              />
              <MenuButton 
                icon="🛵" title="งานด่วน/ฝากซื้อ" desc="หาคนช่วยวิ่งธุระ" color="orange" badge="วินออนไลน์"
                onClick={() => router.push('/win-online')} 
              />
            </div>

            {/* 🛠️ หมวดหมู่บริการ (Grid 4 คอลัมน์) */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-5 bg-[#F05D40] rounded-full"></div>
                  <h2 className="font-bold text-gray-800">หมวดหมู่บริการ</h2>
                </div>
                <button 
                  onClick={() => router.push('/services')}
                  className="text-[#F05D40] text-xs font-bold bg-orange-50 px-4 py-1.5 rounded-full hover:bg-orange-100 transition-colors"
                >
                  ดูทั้งหมด
                </button>
              </div>
              
              <div className="grid grid-cols-4 gap-y-8 gap-x-2">
                {[
                  { icon: '❄️', name: 'ล้างแอร์' }, { icon: '🧹', name: 'แม่บ้าน' },
                  { icon: '⚡', name: 'ช่างไฟ' }, { icon: '💧', name: 'ประปา' },
                  { icon: '🔧', name: 'ซ่อมรถ' }, { icon: '🚚', name: 'ขนส่ง' },
                  { icon: '📦', name: 'ย้ายบ้าน' }, { icon: '✨', name: 'อื่นๆ' },
                ].map((item, index) => (
                  <div 
                    key={index} 
                    onClick={() => router.push(`/services?category=${item.name}`)}
                    className="flex flex-col items-center gap-2 active:scale-90 transition-transform cursor-pointer"
                  >
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl border border-gray-100 shadow-sm hover:border-[#F05D40]/30 transition-colors">
                      {item.icon}
                    </div>
                    <span className="text-[10px] text-gray-600 font-bold">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ✅ แบนเนอร์ Job Board */}
            <div 
              onClick={() => router.push('/job-board')}
              className="bg-gradient-to-br from-[#0082FA] to-[#00A3FF] rounded-[2.5rem] p-7 shadow-lg flex justify-between items-center text-white relative overflow-hidden cursor-pointer active:scale-95 transition-all"
            >
              <div className="absolute -right-6 -top-6 w-36 h-36 bg-white/10 rounded-full blur-2xl"></div>
              <div className="z-10">
                <h2 className="font-bold text-xl flex items-center gap-2">💼 กระดานหางาน</h2>
                <p className="text-xs text-white/90 mt-1 font-medium">ค้นหาตำแหน่งงานว่างในชุมชน</p>
              </div>
              <button className="z-10 bg-white text-[#0082FA] text-[10px] font-black py-3 px-6 rounded-full shadow-md uppercase tracking-widest">
                เข้าดู 🚀
              </button>
            </div>
          </div>

        </div>

        {/* 🧭 แถบเมนูด้านล่าง (Bottom Navigation) */}
        <div className="fixed bottom-0 w-full sm:max-w-2xl md:max-w-3xl bg-white/95 backdrop-blur-md border-t border-gray-100 px-8 py-4 flex justify-between items-center shadow-[0_-4px_25px_rgba(0,0,0,0.06)] rounded-t-[2.5rem] z-50">
          <NavItem icon="🏠" label="หน้าแรก" active={activeTab === 'home'} onClick={() => {setActiveTab('home'); router.push('/')}} />
          <NavItem icon="🛠️" label="บริการ" active={activeTab === 'services'} onClick={() => {setActiveTab('services'); router.push('/services')}} />
          <NavItem icon="📋" label="งานด่วน" active={activeTab === 'urgent'} onClick={() => {setActiveTab('urgent'); router.push('/win-online')}} />
          <NavItem icon="📜" label="ประวัติ" active={activeTab === 'history'} onClick={() => {setActiveTab('history'); router.push('/history')}} />
          <NavItem icon="👤" label="ฉัน" active={activeTab === 'profile'} onClick={() => {setActiveTab('profile'); router.push('/profile/edit')}} />
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}

// --- คอมโพเนนต์ย่อย ---

// --- คอมโพเนนต์ปุ่มเมนูลัด ---
function MenuButton({ icon, title, desc, color, badge, onClick }: any) {
  const colorClass = color === 'blue' ? 'bg-blue-50 border-blue-50 text-blue-500' : 'bg-orange-50 border-orange-50 text-[#F05D40]';
  return (
    <div onClick={onClick} className={`bg-white p-6 rounded-[2rem] shadow-sm border ${colorClass} flex flex-col items-center justify-center text-center active:scale-95 transition-all cursor-pointer relative overflow-hidden h-full hover:shadow-md`}>
      {badge && <div className="absolute top-0 right-0 bg-[#F05D40] text-white text-[9px] font-black px-4 py-1 rounded-bl-2xl shadow-sm z-10">{badge}</div>}
      <div className={`w-16 h-16 ${colorClass} rounded-3xl flex items-center justify-center text-4xl mb-4 shadow-inner border border-black/5`}>{icon}</div>
      <h3 className="font-black text-gray-800 text-sm">{title}</h3>
      <p className="text-[10px] text-gray-500 mt-1 font-medium">{desc}</p>
    </div>
  );
}

// --- คอมโพเนนต์เมนูด้านล่าง ---
function NavItem({ icon, label, active, onClick }: any) {
  return (
    <div onClick={onClick} className={`flex flex-col items-center gap-1.5 cursor-pointer transition-all ${active ? 'scale-110' : 'opacity-40 hover:opacity-100'}`}>
      <span className="text-2xl">{icon}</span>
      <span className={`text-[10px] font-bold ${active ? 'text-[#F05D40]' : 'text-gray-500'}`}>{label}</span>
      {active && <div className="w-1.5 h-1.5 bg-[#F05D40] rounded-full shadow-sm"></div>}
    </div>
  );
}

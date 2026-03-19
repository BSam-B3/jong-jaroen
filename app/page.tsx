'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [userName, setUserName] = useState('กำลังโหลด...');
  const [userInitial, setUserInitial] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [couponNumber, setCouponNumber] = useState('');
  const router = useRouter();

  // 🚧 Mock Data: ข่าวสารชุมชน
  const MOCK_NEWS = [
    { id: 1, title: 'ประกาศ: ตัดกระแสไฟฟ้าเพื่อซ่อมบำรุง ซ.เทศบาล 4', date: '20 มี.ค. 69', type: 'แจ้งเตือน', color: 'text-red-600 bg-red-50 border-red-100' },
    { id: 2, title: 'ขอเชิญร่วมงานบุญ ทอดผ้าป่าวัดปากน้ำประแส', date: '18 มี.ค. 69', type: 'กิจกรรม', color: 'text-blue-600 bg-blue-50 border-blue-100' },
    { id: 3, title: 'หน่วยแพทย์เคลื่อนที่ ฉีดวัคซีนพิษสุนัขบ้า ฟรี!', date: '15 มี.ค. 69', type: 'สาธารณสุข', color: 'text-green-600 bg-green-50 border-green-100' },
  ];

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

  const handleCheckCoupon = () => {
    if (couponNumber.length !== 6) {
      alert('กรุณากรอกเลขคูปองให้ครบ 6 หลักค่ะ');
      return;
    }
    alert(`กำลังตรวจผลคูปองจงเจริญหมายเลข: ${couponNumber} ... (รอเชื่อม API)`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pb-24">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-x-hidden">

        {/* ส่วนเนื้อหาที่ Scroll ได้ */}
        <div className="flex-1 overflow-y-auto pb-6 scrollbar-hide">
          
          {/* 🟠 Header ปรับไล่สีส้ม-ทอง */}
          <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-b-[2.5rem] p-6 pt-12 shadow-md relative z-10">
            <div className="flex justify-between items-start mb-6 px-2">
              <div>
                <h1 className="text-2xl font-black text-white flex items-center gap-2">
                  จงเจริญ <span className="text-xl">🌟</span>
                </h1>
                <p className="text-white/90 text-xs mt-1 font-medium">แอปพลิเคชันคู่ชุมชนปากน้ำประแส</p>
              </div>
              
              <button 
                onClick={() => router.push('/profile')}
                className="flex items-center gap-2 bg-white/10 p-1.5 pr-4 rounded-full border border-white/20 backdrop-blur-md active:scale-95 transition-transform"
              >
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#EE4D2D] font-black text-sm shadow-sm">
                  {userInitial}
                </div>
                <span className="text-white font-bold text-xs truncate max-w-[120px]">
                  {userName}
                </span>
              </button>
            </div>

            {/* 🔍 Search Bar */}
            <form onSubmit={handleSearch} className="bg-white rounded-2xl p-3.5 flex items-center shadow-lg transform translate-y-2 mx-2">
              <span className="text-gray-400 mr-2 shrink-0 text-lg">🔍</span>
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

            {/* 📰 ข่าวสารชุมชน (ฟีเจอร์ใหม่) */}
            <div>
              <div className="flex justify-between items-center mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-5 bg-[#EE4D2D] rounded-full"></div>
                  <h2 className="font-bold text-gray-800">ข่าวสารชุมชน</h2>
                </div>
                <button className="text-[#EE4D2D] text-[10px] font-bold bg-orange-50 px-3 py-1 rounded-full">ดูทั้งหมด</button>
              </div>
              
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x hide-scrollbar px-1">
                {MOCK_NEWS.map(news => (
                  <div key={news.id} className="min-w-[220px] bg-white rounded-2xl p-4 shadow-sm border border-gray-100 snap-start shrink-0 cursor-pointer active:scale-95 transition-transform hover:border-orange-200">
                    <span className={`text-[9px] font-bold px-2 py-1 rounded-full border ${news.color}`}>{news.type}</span>
                    <h3 className="font-bold text-gray-800 text-xs mt-3 line-clamp-2 leading-relaxed">{news.title}</h3>
                    <p className="text-[9px] text-gray-400 mt-2 font-medium">📅 {news.date}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 🛠️ หมวดหมู่บริการ */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-5 bg-[#EE4D2D] rounded-full"></div>
                  <h2 className="font-bold text-gray-800">หมวดหมู่บริการ</h2>
                </div>
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
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl border border-gray-100 shadow-sm hover:border-[#EE4D2D]/30 transition-colors">
                      {item.icon}
                    </div>
                    <span className="text-[10px] text-gray-600 font-bold">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 🎟️ คูปองจงเจริญ (ฟีเจอร์ใหม่ แทนผลสลาก) */}
            <div className="bg-gradient-to-br from-[#FFD700] to-[#FF8C00] rounded-[2.5rem] p-6 shadow-md relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 text-8xl opacity-20 transform rotate-12">🎟️</div>
              <div className="relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="font-black text-white text-lg flex items-center gap-2">🎟️ คูปองจงเจริญ</h2>
                    <p className="text-white/90 text-[10px] font-medium mt-1">ลุ้นรางวัลใหญ่! ทุกวันที่ 1 และ 16 ของเดือน</p>
                  </div>
                  <div className="bg-white/20 px-3 py-1 rounded-full border border-white/30 backdrop-blur-sm">
                    <span className="text-white text-[9px] font-bold">งวด 1 เม.ย.</span>
                  </div>
                </div>
                
                <div className="mt-5 flex gap-2">
                  <input 
                    type="number" 
                    value={couponNumber}
                    onChange={(e) => setCouponNumber(e.target.value.slice(0, 6))}
                    placeholder="กรอกเลข 6 หลัก" 
                    className="flex-1 bg-white/95 rounded-xl px-4 py-3 text-sm font-black text-gray-800 outline-none text-center tracking-widest placeholder:tracking-normal placeholder:font-medium placeholder:text-gray-400 shadow-inner"
                  />
                  <button 
                    onClick={handleCheckCoupon}
                    className="bg-[#D9381E] text-white font-black text-[11px] px-5 py-3 rounded-xl shadow-md hover:bg-red-700 active:scale-95 transition-all whitespace-nowrap border border-red-800/50"
                  >
                    ตรวจรางวัล
                  </button>
                </div>
              </div>
            </div>

            {/* ✅ แบนเนอร์ Job Board */}
            <div 
              onClick={() => router.push('/job-board')}
              className="bg-gradient-to-br from-[#0082FA] to-[#00A3FF] rounded-[2.5rem] p-7 shadow-lg flex justify-between items-center text-white relative overflow-hidden cursor-pointer active:scale-95 transition-all mb-4"
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

        {/* ✅ Bottom Navigation (จัดใหม่เป็น 5 ไอคอน พร้อมเมนู ปองเจริญ!) */}
        <div className="fixed bottom-0 w-full sm:max-w-2xl md:max-w-3xl bg-white/95 backdrop-blur-md border-t border-gray-100 px-2 py-4 flex justify-between items-center shadow-[0_-4px_25px_rgba(0,0,0,0.06)] rounded-t-[2.5rem] z-50">
          <NavItem icon="🏠" label="หน้าแรก" active={true} onClick={() => router.push('/')} />
          <NavItem icon="🛠️" label="บริการ" active={false} onClick={() => router.push('/services')} />
          <NavItem icon="🎟️" label="ปองเจริญ" active={false} onClick={() => alert('กำลังเปิดหน้าคูปองจงเจริญ...')} />
          <NavItem icon="📋" label="งานด่วน" active={false} onClick={() => router.push('/win-online')} />
          <NavItem icon="👤" label="ฉัน" active={false} onClick={() => router.push('/profile')} />
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
      `}} />
    </div>
  );
}

// --- คอมโพเนนต์ปุ่มเมนูลัด ---
function MenuButton({ icon, title, desc, color, badge, onClick }: any) {
  const colorClass = color === 'blue' ? 'bg-blue-50 border-blue-50 text-blue-500' : 'bg-orange-50 border-orange-50 text-[#EE4D2D]';
  return (
    <div onClick={onClick} className={`bg-white p-6 rounded-[2rem] shadow-sm border ${colorClass} flex flex-col items-center justify-center text-center active:scale-95 transition-all cursor-pointer relative overflow-hidden h-full hover:shadow-md`}>
      {badge && <div className="absolute top-0 right-0 bg-[#EE4D2D] text-white text-[9px] font-black px-4 py-1 rounded-bl-2xl shadow-sm z-10">{badge}</div>}
      <div className={`w-16 h-16 ${colorClass} rounded-3xl flex items-center justify-center text-4xl mb-4 shadow-inner border border-black/5`}>{icon}</div>
      <h3 className="font-black text-gray-800 text-sm">{title}</h3>
      <p className="text-[10px] text-gray-500 mt-1 font-medium">{desc}</p>
    </div>
  );
}

// --- คอมโพเนนต์เมนูด้านล่าง ---
function NavItem({ icon, label, active, onClick }: any) {
  return (
    <div onClick={onClick} className={`flex flex-col items-center gap-1.5 cursor-pointer transition-all ${active ? 'scale-110' : 'opacity-40 hover:opacity-100'} w-[60px]`}>
      <span className="text-2xl">{icon}</span>
      <span className={`text-[9px] font-bold ${active ? 'text-[#EE4D2D]' : 'text-gray-500'}`}>{label}</span>
      {active && <div className="w-1.5 h-1.5 bg-[#EE4D2D] rounded-full shadow-sm mt-0.5"></div>}
    </div>
  );
}

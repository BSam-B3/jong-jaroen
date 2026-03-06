'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────
interface ServiceCategory {
  id: string;
  title: string;
  icon: string;
  bgColor: string;
  customLink?: string; // 🌟 เพิ่มตัวแปรนี้เพื่อแยกให้ลิงก์ไปหน้าอื่นได้โดยเฉพาะ
}

// ── Soft Shopee Palette ─────────────────────────────────────────
const themePalette = {
  primaryOrange: '#F05D40', 
  lightOrange: '#FF8769',   
  bgGray: '#F9FAFB',        
  textDark: '#1F2937',      
};

// 🌟 หมวดหมู่บริการ (เพิ่ม "ข่าวชุมชน" ไว้คิวแรก) 🌟
const categories: ServiceCategory[] = [
  // 👉 ปุ่มข่าวสารชุมชน จะลิงก์ไปที่ /news ตรงๆ 
  { id: 'news', title: 'ข่าวชุมชน', icon: '📰', bgColor: 'bg-gradient-to-br from-red-100 to-orange-100 border border-red-200', customLink: '/news' },
  
  { id: 'electrician', title: 'ช่างไฟฟ้า', icon: '⚡', bgColor: 'bg-gradient-to-br from-yellow-100 to-orange-100 border border-orange-200' },
  { id: 'cleaning', title: 'แม่บ้าน', icon: '🧹', bgColor: 'bg-gradient-to-br from-blue-100 to-cyan-100 border border-blue-200' },
  { id: 'aircon', title: 'ล้างแอร์', icon: '❄️', bgColor: 'bg-gradient-to-br from-sky-100 to-blue-100 border border-sky-200' },
  { id: 'plumbing', title: 'ช่างประปา', icon: '💧', bgColor: 'bg-gradient-to-br from-cyan-100 to-teal-100 border border-cyan-200' },
  { id: 'mechanic', title: 'ช่างยนต์', icon: '🛠️', bgColor: 'bg-gradient-to-br from-gray-100 to-slate-200 border border-gray-300' },
  { id: 'construction', title: 'ก่อสร้าง', icon: '🏗️', bgColor: 'bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200' },
  { id: 'haircut', title: 'ตัดผม', icon: '✂️', bgColor: 'bg-gradient-to-br from-purple-100 to-fuchsia-100 border border-purple-200' },
  { id: 'nails', title: 'ทำเล็บ', icon: '💅', bgColor: 'bg-gradient-to-br from-pink-100 to-rose-100 border border-pink-200' },
  { id: 'beauty', title: 'เสริมสวย', icon: '💄', bgColor: 'bg-gradient-to-br from-red-100 to-rose-100 border border-red-200' },
  { id: 'massage', title: 'นวดแผนไทย', icon: '💆', bgColor: 'bg-gradient-to-br from-rose-100 to-pink-100 border border-rose-200' },
  { id: 'moving', title: 'ย้ายบ้าน', icon: '🏠', bgColor: 'bg-gradient-to-br from-emerald-100 to-green-100 border border-emerald-200' },
  { id: 'lifting', title: 'ยกของ', icon: '📦', bgColor: 'bg-gradient-to-br from-orange-100 to-amber-100 border border-orange-200' },
  { id: 'transport', title: 'รถขนส่ง', icon: '🚚', bgColor: 'bg-gradient-to-br from-indigo-100 to-blue-100 border border-indigo-200' },
  { id: 'tech', title: 'ซ่อมคอม', icon: '💻', bgColor: 'bg-gradient-to-br from-slate-100 to-gray-200 border border-slate-300' },
  { id: 'others', title: 'อื่นๆ', icon: '✨', bgColor: 'bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200' },
];

// 🌟 Mock Data: จำลองงานล่าสุดเพื่อเอามา "ล่อแมลง" 🌟
const recentJobs = [
  { id: 1, title: 'ต้องการช่างซ่อมหลังคารั่ว ด่วนมาก!', category: 'ก่อสร้าง', location: 'ปากน้ำประแส', budget: 800, time: '15 นาทีที่แล้ว' },
  { id: 2, title: 'หาแม่บ้านทำความสะอาดบ้าน 2 ชั้น', category: 'แม่บ้าน', location: 'แกลง', budget: 1200, time: '2 ชั่วโมงที่แล้ว' },
  { id: 3, title: 'แอร์ห้องนอนไม่เย็น มีน้ำหยด', category: 'ช่างไฟฟ้า', location: 'ปากน้ำประแส', budget: 500, time: '5 ชั่วโมงที่แล้ว' },
];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleSearch = () => {
    if (searchQuery.trim().length < 3) return; 
    setIsSearching(true);
    console.log("AI กำลังวิเคราะห์คำว่า:", searchQuery);
    setTimeout(() => {
      setIsSearching(false);
    }, 2000); 
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: themePalette.bgGray }}>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* ── Hero Section ── */}
      <section className="pt-8 pb-16 px-4 shadow-md relative overflow-hidden"
        style={{ background: `linear-gradient(180deg, ${themePalette.primaryOrange} 0%, ${themePalette.lightOrange} 100%)` }}>
        
        <div className="max-w-xl mx-auto text-center relative z-10 space-y-6">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="bg-white/95 p-1.5 rounded-[30px] shadow-2xl inline-block border-2 border-white/20 transform hover:scale-105 transition-transform duration-300">
               <img 
                 src="/logo.png" 
                 alt="จงเจริญ โลโก้" 
                 className="h-48 sm:h-56 w-auto object-contain drop-shadow-lg" 
                 onError={(e) => {
                   e.currentTarget.src = "/logo.jpg";
                 }}
               />
            </div>
            <p className="text-white text-xs sm:text-sm font-bold tracking-wide drop-shadow-sm opacity-90">
              จงเจริญไปด้วยกัน • ผู้เชี่ยวชาญใกล้คุณ
            </p>
          </div>

          <div className="relative max-w-md mx-auto mt-1">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <span className="text-lg animate-pulse">✨</span>
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="บอก AI ว่าต้องการให้ช่วยอะไร..." 
              className="w-full py-4 pl-12 pr-24 rounded-lg shadow-inner focus:outline-none text-gray-800 text-sm border-2 border-transparent focus:border-white bg-white/95 backdrop-blur-sm"
            />
            <button 
              onClick={handleSearch}
              disabled={searchQuery.trim().length < 3 || isSearching}
              className={`absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-md text-white text-xs font-bold shadow-sm transition-all 
                ${searchQuery.trim().length < 3 || isSearching ? 'bg-orange-300/50 cursor-not-allowed' : 'bg-[#F05D40] hover:bg-[#D95339] hover:scale-105'}`}
            >
              {isSearching ? '⏳...' : 'ค้นหา'}
            </button>
          </div>
        </div>
      </section>

      <main className="max-w-xl mx-auto px-2 space-y-5 -mt-4 relative z-20">
        
        {/* ── Categories Slider ── */}
        <section className="bg-white rounded-xl py-6 shadow-sm border border-gray-100 relative group overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
          <button onClick={() => scroll('right')} className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white rounded-full shadow-md border border-gray-100 flex items-center justify-center text-gray-500 hover:text-[#F05D40] hover:scale-110 transition-all opacity-90 hover:opacity-100">❯</button>
          <button onClick={() => scroll('left')} className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white rounded-full shadow-md border border-gray-100 flex items-center justify-center text-gray-500 hover:text-[#F05D40] hover:scale-110 transition-all opacity-0 group-hover:opacity-90">❮</button>

          <div ref={scrollContainerRef} className="flex overflow-x-auto px-5 gap-4 pb-4 snap-x snap-mandatory scroll-smooth hide-scrollbar relative z-0 pr-12 pt-2">
            {categories.map((cat) => (
              <Link 
                key={cat.id} 
                // 🌟 ถ้ามี customLink ให้ไปที่นั่น (เช่น /news) ถ้าไม่มีก็ไปหน้า /services ตามปกติ 🌟
                href={cat.customLink || `/services?cat=${cat.id}`} 
                className="flex flex-col items-center gap-2.5 min-w-[72px] snap-start group cursor-pointer"
              >
                <div className={`w-16 h-16 flex items-center justify-center text-3xl group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300 rounded-[20px] shadow-sm group-hover:shadow-md ${cat.bgColor}`}>
                  {cat.icon}
                </div>
                <span className="text-[11px] font-bold text-gray-700 whitespace-nowrap group-hover:text-[#F05D40] transition-colors">{cat.title}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Job Board Preview ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-2 bg-white py-3 border-b border-gray-100 rounded-t-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: themePalette.primaryOrange }}>
              <span className="text-lg">📢</span> ประกาศงานล่าสุด
            </h2>
            <Link href="/jobs" className="text-xs font-medium text-gray-400 hover:text-orange-500 transition-colors">ดูทั้งหมด {' >'}</Link>
          </div>

          <div className="space-y-2.5">
            {recentJobs.map((job) => (
              <Link href="/jobs" key={job.id} className="block bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-[#F05D40] hover:shadow-md transition-all group relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-300 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="flex justify-between items-start mb-1.5">
                  <span className="bg-orange-50 text-[#F05D40] px-2 py-0.5 rounded text-[10px] font-bold">
                    {job.category}
                  </span>
                  <span className="text-[10px] text-gray-400">{job.time}</span>
                </div>
                
                <h3 className="text-sm font-bold text-gray-800 mb-2 group-hover:text-[#F05D40] transition-colors line-clamp-1">
                  {job.title}
                </h3>
                
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                    <span>📍 {job.location}</span>
                  </div>
                  <div className="text-sm font-black" style={{ color: themePalette.primaryOrange }}>
                    ฿{job.budget.toLocaleString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <Link href="/jobs" 
            className="block w-full py-3.5 mt-2 text-center rounded-xl text-[#F05D40] text-xs font-bold bg-orange-50 hover:bg-orange-100 transition-colors border border-orange-100 flex items-center justify-center gap-2">
            <span>ดูกระดานงานทั้งหมด</span>
            <span className="text-base leading-none">🚀</span>
          </Link>
        </section>

      </main>

      {/* 🛠️ Bottom Nav 🛠️ */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 z-[100] shadow-[0_-5px_20px_rgba(0,0,0,0.05)] pb-safe">
        <Link href="/" className="flex flex-col items-center gap-0.5 font-bold" style={{ color: themePalette.primaryOrange }}>
          <span className="text-xl">🏠</span>
          <span className="text-[10px]">หน้าแรก</span>
        </Link>
        <Link href="/services" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-orange-400 transition-colors">
          <span className="text-xl">🔍</span>
          <span className="text-[10px]">ค้นหา</span>
        </Link>
        <Link href="/coupons" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-orange-400 transition-colors">
          <span className="text-xl">🎟️</span>
          <span className="text-[10px]">รางวัล</span>
        </Link>
        <Link href="/jobs" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-orange-400 transition-colors">
          <span className="text-xl">📋</span>
          <span className="text-[10px]">งาน</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-orange-400 transition-colors">
          <span className="text-xl">👤</span>
          <span className="text-[10px]">ฉัน</span>
        </Link>
      </nav>
    </div>
  );
}

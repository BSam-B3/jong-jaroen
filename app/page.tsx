'use client';
import { useState } from 'react';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────
interface ServiceCategory {
  id: string;
  title: string;
  icon: string;
  bgColor: string;
}

// ── Soft Shopee Palette ─────────────────────────────────────────
const themePalette = {
  primaryOrange: '#F05D40', 
  lightOrange: '#FF8769',   
  bgGray: '#F9FAFB',        
  textDark: '#1F2937',      
};

const categories: ServiceCategory[] = [
  { id: 'electrician', title: 'ช่างไฟฟ้า', icon: '⚡', bgColor: 'bg-orange-50' },
  { id: 'cleaning', title: 'แม่บ้าน', icon: '🧹', bgColor: 'bg-orange-50' },
  { id: 'plumbing', title: 'ช่างประปา', icon: '💧', bgColor: 'bg-orange-50' },
  { id: 'mechanic', title: 'ช่างยนต์', icon: '🛠️', bgColor: 'bg-orange-50' },
  { id: 'construction', title: 'ก่อสร้าง', icon: '🏗️', bgColor: 'bg-orange-50' },
  { id: 'massage', title: 'นวดแผนไทย', icon: '💆', bgColor: 'bg-orange-50' },
];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    if (searchQuery.trim().length < 3) return; 
    setIsSearching(true);
    console.log("AI กำลังวิเคราะห์คำว่า:", searchQuery);
    setTimeout(() => {
      setIsSearching(false);
    }, 2000); 
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: themePalette.bgGray }}>
      
      {/* ── Hero Section: Soft Shopee Orange Gradient ── */}
      <section className="pt-8 pb-16 px-4 shadow-md relative overflow-hidden"
        style={{ background: `linear-gradient(180deg, ${themePalette.primaryOrange} 0%, ${themePalette.lightOrange} 100%)` }}>
        
        <div className="max-w-xl mx-auto text-center relative z-10 space-y-6">
          <div className="flex flex-col items-center justify-center space-y-3">
            
            {/* 🌟 BIGGER LOGO, TINIER FRAME 🌟 */}
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

          {/* 🌟 AI Search Agent Input 🌟 */}
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

      <main className="max-w-xl mx-auto px-2 space-y-4 -mt-4 relative z-20">
        
        {/* ── Categories Grid ── */}
        <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="grid grid-cols-3 gap-y-6">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/services?cat=${cat.id}`} className="flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  {cat.icon}
                </div>
                <span className="text-[11px] font-medium text-gray-700">{cat.title}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── 🌟 NEW: Job Board Banner (แทนที่ผู้เชี่ยวชาญ) 🌟 ── */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-orange-100 flex flex-col items-center text-center space-y-4 relative overflow-hidden group">
          {/* Background Decoration เล่นลวดลายฟุ้งๆ */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-16 -mt-16 opacity-60 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-50 rounded-full -ml-12 -mb-12 opacity-60 group-hover:scale-110 transition-transform duration-500"></div>

          <div className="relative z-10 space-y-2">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-2xl mx-auto mb-2 shadow-inner">
              📢
            </div>
            <h2 className="text-lg font-black tracking-tight" style={{ color: themePalette.primaryOrange }}>
              บอร์ดงานจงเจริญ
            </h2>
            <p className="text-[11px] text-gray-500 font-medium leading-relaxed px-4">
              แหล่งรวมประกาศจ้างงานในชุมชนปากน้ำประแสและพื้นที่ใกล้เคียง <br/>หาช่าง หาคนช่วยงาน หรือรับงานเพื่อสร้างรายได้
            </p>
          </div>

          <Link href="/jobs"
            className="relative z-10 w-full py-3.5 rounded-lg text-white text-xs font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            style={{ backgroundColor: themePalette.primaryOrange }}>
            <span>ดูประกาศงานทั้งหมด</span>
            <span className="text-lg leading-none">👉</span>
          </Link>
        </section>
      </main>

      {/* 🛠️ Bottom Nav (Shopee Style) + z-[100] 🛠️ */}
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

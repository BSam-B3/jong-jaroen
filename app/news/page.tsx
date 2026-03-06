'use client';
import { useState } from 'react';
import Link from 'next/link';

// ── Soft Shopee Palette ─────────────────────────────────────────
const themePalette = {
  primaryOrange: '#F05D40', 
  lightOrange: '#FF8769',   
  bgGray: '#F9FAFB',        
  textDark: '#1F2937',      
};

// 🌟 Mock Data: ข่าวสารและกิจกรรมในชุมชน 🌟
const communityNews = [
  { id: 1, title: 'นัดตรวจเบาหวานและความดัน ผู้สูงอายุ', date: 15, category: 'สาธารณสุข', icon: '🩺', color: 'bg-rose-100 text-rose-600' },
  { id: 2, title: 'เทศบาลให้บริการฉีดวัคซีนพิษสุนัขบ้า ฟรี!', date: 22, category: 'ปศุสัตว์', icon: '🐕', color: 'bg-blue-100 text-blue-600' },
  { id: 3, title: 'ประชุมลูกบ้าน: วางแผนรับมือน้ำทะเลหนุน', date: 10, category: 'ส่วนรวม', icon: '🌊', color: 'bg-cyan-100 text-cyan-600' },
  { id: 4, title: 'แจ้งตัดไฟชั่วคราว บริเวณตลาดเก่า', date: 28, category: 'แจ้งเตือน', icon: '⚡', color: 'bg-amber-100 text-amber-600' },
];

export default function NewsPage() {
  // State สำหรับเก็บวันที่ที่ถูกเลือก (เมื่อผู้ใช้คลิกข่าว)
  const [activeDate, setActiveDate] = useState<number | null>(null);

  // จำลองปฏิทินเดือนปัจจุบัน (มี 31 วัน)
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);
  const weekDays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  // ฟังก์ชันเช็กว่าวันไหนมีกิจกรรมบ้าง
  const getEventsForDay = (day: number) => {
    return communityNews.filter(news => news.date === day);
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: themePalette.bgGray }}>
      
      {/* ── Header ── */}
      <header className="pt-10 pb-6 px-4 shadow-sm relative overflow-hidden rounded-b-[32px]"
        style={{ background: `linear-gradient(180deg, ${themePalette.primaryOrange} 0%, ${themePalette.lightOrange} 100%)` }}>
        <div className="max-w-xl mx-auto flex items-center gap-4 relative z-10">
          <Link href="/" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm hover:bg-white/30 transition-colors">
            ❮
          </Link>
          <div className="space-y-1 text-left">
            <h1 className="text-white text-2xl font-black drop-shadow-md tracking-tight">
              📰 ข่าวสารชุมชน
            </h1>
            <p className="text-white/90 text-[11px] font-medium">
              อัปเดตทุกความเคลื่อนไหว กิจกรรม และประกาศสำคัญ
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 mt-6 space-y-6 relative z-20">
        
        {/* ── 🌟 Gimmick: Interactive Calendar 🌟 ── */}
        <section className="bg-white rounded-3xl p-5 shadow-sm border border-orange-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-gray-800 flex items-center gap-2">
              📅 ปฏิทินกิจกรรมเดือนนี้
            </h2>
            <span className="text-xs font-bold text-[#F05D40] bg-orange-50 px-3 py-1 rounded-full">มีนาคม</span>
          </div>

          <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-[10px] font-bold text-gray-400">{day}</div>
            ))}
            
            {/* พื้นที่ว่าง (สมมติให้วันที่ 1 เริ่มวันอาทิตย์) */}
            {/* {Array.from({ length: 0 }).map((_, i) => <div key={`empty-${i}`} />)} */}

            {daysInMonth.map(day => {
              const hasEvents = getEventsForDay(day).length > 0;
              const isActive = activeDate === day;

              return (
                <div key={day} className="flex flex-col items-center justify-center relative h-10 cursor-pointer group"
                     onClick={() => setActiveDate(day)}>
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold transition-all duration-300
                    ${isActive 
                      ? 'bg-[#F05D40] text-white shadow-lg scale-110 animate-bounce-short' // ไฮไลต์เด้งดึ๋งเมื่อกดข่าว
                      : hasEvents 
                        ? 'bg-orange-50 text-orange-600 border border-orange-100' // วันที่มีงาน
                        : 'text-gray-600 hover:bg-gray-50' // วันปกติ
                    }`}>
                    {day}
                  </span>
                  {/* จุดไข่ปลาบอกว่ามีงาน */}
                  {hasEvents && !isActive && (
                    <span className="absolute bottom-0 w-1 h-1 bg-orange-400 rounded-full"></span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── News Feed ── */}
        <section className="space-y-3">
          <h2 className="text-sm font-black text-gray-800 px-1">ประกาศล่าสุด</h2>
          
          <div className="space-y-3">
            {communityNews.map((news) => {
              const isActive = activeDate === news.date;
              
              return (
                <div 
                  key={news.id} 
                  onClick={() => setActiveDate(isActive ? null : news.date)}
                  className={`bg-white rounded-2xl p-4 shadow-sm border cursor-pointer transition-all duration-300 hover:shadow-md
                    ${isActive ? 'border-[#F05D40] ring-2 ring-orange-100 scale-[1.02]' : 'border-gray-100'}
                  `}
                >
                  <div className="flex gap-4 items-start">
                    <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center text-2xl shadow-inner shrink-0 ${news.color}`}>
                      {news.icon}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex justify-between items-start">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded
                          ${isActive ? 'bg-[#F05D40] text-white' : 'bg-gray-100 text-gray-500'}`}>
                          {news.category}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                          {news.date} มี.ค.
                        </span>
                      </div>
                      <h3 className={`text-sm font-bold leading-snug transition-colors
                        ${isActive ? 'text-[#F05D40]' : 'text-gray-800'}`}>
                        {news.title}
                      </h3>
                      {isActive && (
                        <p className="text-xs text-gray-500 pt-2 border-t border-gray-50 mt-2 animate-fade-in-up">
                          แตะเพื่อดูรายละเอียดสถานที่และเวลาเพิ่มเติม...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </main>

      {/* 🛠️ Bottom Nav (ไม่มีการ Active สีส้ม เพราะถือเป็นหน้าย่อย) 🛠️ */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 flex justify-around py-2 z-[100] shadow-[0_-5px_20px_rgba(0,0,0,0.05)] pb-safe">
        <Link href="/" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-orange-400 transition-colors">
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

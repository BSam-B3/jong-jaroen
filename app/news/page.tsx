'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';

// ── Soft Shopee Palette ─────────────────────────────────────────
const themePalette = {
  primaryOrange: '#F05D40', 
  lightOrange: '#FF8769',   
  bgGray: '#F9FAFB',        
};

// 🌟 Mock Data: ข่าวสารและกิจกรรม 🌟
const communityNews = [
  { id: 1, title: 'ประชุมลูกบ้าน: วางแผนรับมือน้ำทะเลหนุน', startDate: '2026-03-10', endDate: '2026-03-10', category: 'ส่วนรวม', icon: '🌊', colorCard: 'bg-cyan-100 text-cyan-700', colorDot: 'bg-cyan-500', colorActive: 'bg-cyan-500 text-white shadow-cyan-200' },
  { id: 2, title: 'นัดตรวจเบาหวานและความดัน ผู้สูงอายุ', startDate: '2026-03-15', endDate: '2026-03-15', category: 'สาธารณสุข', icon: '🩺', colorCard: 'bg-rose-100 text-rose-700', colorDot: 'bg-rose-500', colorActive: 'bg-rose-500 text-white shadow-rose-200' },
  { id: 3, title: 'งานประเพณีทอดผ้าป่ากลางน้ำ ประแส', startDate: '2026-03-18', endDate: '2026-03-20', category: 'เทศกาล', icon: '🛶', colorCard: 'bg-amber-100 text-amber-700', colorDot: 'bg-amber-500', colorActive: 'bg-amber-500 text-white shadow-amber-200' },
  { id: 4, title: 'เทศบาลให้บริการฉีดวัคซีนพิษสุนัขบ้า ฟรี!', startDate: '2026-03-22', endDate: '2026-03-22', category: 'ปศุสัตว์', icon: '🐕', colorCard: 'bg-blue-100 text-blue-700', colorDot: 'bg-blue-500', colorActive: 'bg-blue-500 text-white shadow-blue-200' },
  { id: 5, title: 'สงกรานต์ปากน้ำประแส สาดน้ำอุโมงค์ไฟ', startDate: '2026-04-13', endDate: '2026-04-15', category: 'เทศกาล', icon: '💦', colorCard: 'bg-indigo-100 text-indigo-700', colorDot: 'bg-indigo-500', colorActive: 'bg-indigo-500 text-white shadow-indigo-200' },
];

const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const weekDays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export default function NewsPage() {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1)); 
  const [activeEventId, setActiveEventId] = useState<number | null>(null);
  
  // 🌟 State ควบคุมการสไลด์ขึ้น/ลง ของ Widget ปฏิทิน 🌟
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    setActiveEventId(null);
  };
  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    setActiveEventId(null);
  };

  const monthEvents = useMemo(() => {
    return communityNews.filter(event => {
      const dStart = new Date(event.startDate);
      const dEnd = new Date(event.endDate);
      const vStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
      const vEnd = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
      return dStart <= vEnd && dEnd >= vStart;
    }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [viewDate]);

  const formatYYYYMMDD = (year: number, month: number, day: number) => 
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const firstDayOfWeek = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const blanks = Array.from({ length: firstDayOfWeek });
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getEventsForDay = (dayStr: string) => {
    return monthEvents.filter(e => dayStr >= e.startDate && dayStr <= e.endDate);
  };

  const handleDayClick = (dayStr: string) => {
    const evs = getEventsForDay(dayStr);
    if (evs.length > 0) {
      setActiveEventId(activeEventId === evs[0].id ? null : evs[0].id);
      // เมื่อกดเลือกวันที่มีงาน ให้สไลด์ปฏิทินเก็บลงอัตโนมัติ เพื่อให้เห็นรายละเอียดข่าว
      setIsCalendarOpen(false); 
    } else {
      setActiveEventId(null);
    }
  };

  // 🌟 คอมโพเนนต์ปฏิทิน 🌟
  const renderCalendar = () => (
    <div className="bg-white/95 backdrop-blur-xl rounded-[28px] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-white/50 relative overflow-hidden w-full h-full">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-full hover:bg-orange-50 text-gray-500 hover:text-orange-500 transition-colors shadow-sm">❮</button>
        <h2 className="text-sm font-black text-gray-800 flex items-center gap-2">
          📅 {monthNames[viewDate.getMonth()]} {viewDate.getFullYear() + 543}
        </h2>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-full hover:bg-orange-50 text-gray-500 hover:text-orange-500 transition-colors shadow-sm">❯</button>
      </div>

      <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center mb-1">
        {weekDays.map(day => (
          <div key={day} className="text-[10px] font-bold text-gray-400">{day}</div>
        ))}
        {blanks.map((_, i) => <div key={`blank-${i}`} />)}

        {days.map(day => {
          const dayStr = formatYYYYMMDD(viewDate.getFullYear(), viewDate.getMonth(), day);
          const dayEvents = getEventsForDay(dayStr);
          const isActiveEvent = activeEventId && dayEvents.some(e => e.id === activeEventId);
          const activeEvDetails = dayEvents.find(e => e.id === activeEventId);
          
          // เช็กว่าใช่วันนี้หรือไม่
          const isToday = today.getDate() === day && today.getMonth() === viewDate.getMonth() && today.getFullYear() === viewDate.getFullYear();

          return (
            <div key={day} 
                 onClick={() => handleDayClick(dayStr)}
                 className={`flex flex-col items-center justify-center h-10 cursor-pointer relative ${dayEvents.length > 0 ? 'group' : ''}`}>
              
              {/* 📍 หมุดเช็คอินบอก "วันนี้" */}
              {isToday && (
                <span className="absolute -top-3.5 text-sm z-20 drop-shadow-sm animate-bounce-short">
                  📍
                </span>
              )}

              <span className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold transition-all duration-300 z-10
                ${isToday && !isActiveEvent ? 'ring-2 ring-red-400 text-red-600' : ''} 
                ${isActiveEvent && activeEvDetails 
                  ? `${activeEvDetails.colorActive} scale-110 shadow-lg` 
                  : dayEvents.length > 0 
                    ? 'bg-gray-50 text-gray-800 group-hover:bg-gray-100' 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}>
                {day}
              </span>

              {dayEvents.length > 0 && !isActiveEvent && (
                <div className="absolute bottom-0 flex gap-0.5">
                  {dayEvents.slice(0, 2).map((ev, idx) => (
                    <span key={idx} className={`w-1.5 h-1.5 rounded-full ${ev.colorDot}`}></span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-24 relative" style={{ backgroundColor: themePalette.bgGray }}>
      
      {/* ── Header ── */}
      <header className="pt-10 pb-8 px-4 shadow-sm relative overflow-hidden rounded-b-[32px]"
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

      <main className="max-w-xl mx-auto px-3 relative z-20">
        
        {/* ── News Feed (กินพื้นที่เต็มจอ ไม่มีปฏิทินมาเกะกะด้านบนแล้ว) ── */}
        <section className="space-y-3 mt-4">
          <div className="flex justify-between items-end px-1">
            <h2 className="text-sm font-black text-gray-800">ประกาศเรียงตามวันที่</h2>
            <span className="text-[10px] text-gray-400">พบ {monthEvents.length} รายการ</span>
          </div>
          
          <div className="space-y-3">
            {monthEvents.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-200">
                <p className="text-xs text-gray-400">ไม่มีกิจกรรมในเดือนนี้</p>
              </div>
            ) : (
              monthEvents.map((news) => {
                const isActive = activeEventId === news.id;
                const startDay = parseInt(news.startDate.split('-')[2]);
                const endDay = parseInt(news.endDate.split('-')[2]);
                const dateDisplay = startDay === endDay ? `${startDay}` : `${startDay}-${endDay}`;
                
                return (
                  <div 
                    key={news.id} 
                    onClick={() => setActiveEventId(isActive ? null : news.id)}
                    className={`bg-white rounded-2xl p-4 shadow-sm border cursor-pointer transition-all duration-300 hover:shadow-md
                      ${isActive ? `border-transparent ring-2 ring-offset-1 ${news.colorCard.replace('bg-', 'ring-').split(' ')[0]} scale-[1.02] z-10 relative` : 'border-gray-100'}
                    `}
                  >
                    <div className="flex gap-4 items-start">
                      <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center text-2xl shadow-inner shrink-0 ${news.colorCard}`}>
                        {news.icon}
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex justify-between items-start">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded
                            ${isActive ? news.colorActive : 'bg-gray-100 text-gray-500'}`}>
                            {news.category}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                            {dateDisplay} {monthNames[viewDate.getMonth()].slice(0, 3)}.
                          </span>
                        </div>
                        <h3 className={`text-sm font-bold leading-snug transition-colors
                          ${isActive ? news.colorCard.split(' ')[1] : 'text-gray-800'}`}>
                          {news.title}
                        </h3>
                        {isActive && (
                          <div className="pt-2 border-t border-gray-50 mt-2 animate-fade-in-up space-y-2">
                            <p className="text-xs text-gray-500">
                              🕒 เวลา: 09:00 - 16:00 น.
                            </p>
                            <p className="text-xs text-gray-500">
                              📍 สถานที่: ลานอเนกประสงค์ปากน้ำประแส
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

      </main>

      {/* 🌟 Floating Calendar Widget (สไลด์ขึ้น-ลง จากมุมขวาล่าง) 🌟 */}
      {/* เอาระบบจอดำ (Overlay) ออกไปแล้ว ทำให้เลื่อนอ่านข่าวข้างหลังได้อิสระ */}
      <div 
        className={`fixed right-4 z-[90] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-bottom-right w-[90vw] max-w-[340px]
          ${isCalendarOpen 
            ? 'bottom-[88px] opacity-100 scale-100 translate-y-0' 
            : 'bottom-[88px] opacity-0 scale-50 translate-y-10 pointer-events-none' // ซ่อนและย่อลงไปที่ปุ่ม
          }`}
      >
        {renderCalendar()}
      </div>

      {/* 🌟 ปุ่มเปิด/ปิด ปฏิทินลอยตัว (Floating Action Button) 🌟 */}
      <button
        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
        className={`fixed bottom-[76px] right-4 z-[95] text-white w-14 h-14 rounded-full shadow-[0_8px_25px_rgba(240,93,64,0.4)] flex items-center justify-center text-2xl transition-all duration-300 border-2 border-white
          ${isCalendarOpen ? 'bg-gray-800 rotate-180 hover:bg-gray-700' : 'bg-[#F05D40] hover:scale-110 active:scale-95'}`}
        aria-label="Toggle Calendar"
      >
        {isCalendarOpen ? '↓' : '📅'}
      </button>

      {/* 🛠️ Bottom Nav 🛠️ */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 z-[100] shadow-[0_-5px_20px_rgba(0,0,0,0.05)] pb-safe">
        <Link href="/" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-orange-400 transition-colors">
          <span className="text-xl">🏠</span>
          <span className="text-[10px]">หน้าแรก</span>
        </Link>
        <Link href="/news" className="flex flex-col items-center gap-0.5 font-bold" style={{ color: themePalette.primaryOrange }}>
          <span className="text-xl">📰</span>
          <span className="text-[10px]">ข่าวสาร</span>
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

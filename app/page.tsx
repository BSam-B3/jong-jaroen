'use client';
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

export default function HomePage() {
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSearchDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isSearchDropdownOpen]);

  const handleSuggestionClick = (text: string) => {
    setSearchText(text);
    setIsSearchDropdownOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-24">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-x-hidden">
        
        {/* 🟠 Header ส้มจงเจริญ */}
        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-b-[2.5rem] p-6 pt-10 shadow-md relative z-20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm shadow-inner border border-white/30 overflow-hidden">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-white/80 text-[10px] font-bold tracking-wider">แพลตฟอร์มตลาดแรงงานชุมชน</span>
                <h1 className="text-white text-2xl font-black tracking-tight">จงเจริญ</h1>
              </div>
            </div>
            <div className="flex gap-2.5">
              <Link href="/notifications" className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-inner transition-transform active:scale-95">
                <span className="text-xl">🔔</span>
              </Link>
              <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 shrink-0 border-2 border-white/30 shadow-md">
                <img src="https://uidkyvqjwigzidxpwort.supabaseco/storage/v1/object/public/kyc-documents/user-kyc/cbe6014e-f823-455b-b462-89b52a55bd13/face_image.jpg" alt="Avatar" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          {/* 🔍 ช่องเสริช AI (จำกัดความกว้างและ z-index สูง) */}
          <div ref={wrapperRef} className="relative z-[100] mb-4 max-w-lg mx-auto">
            <form action="/services" method="GET" className="bg-white rounded-2xl p-1 flex items-center shadow-lg shadow-black/10">
              <div className="pl-3 pr-2 text-gray-400 text-base">🔍</div>
              <input
                type="text"
                name="q"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onFocus={() => setIsSearchDropdownOpen(true)}
                placeholder="ฉันต้องการจ้างงาน..."
                className="w-full bg-transparent text-xs py-2 outline-none font-bold text-gray-800 placeholder:text-gray-400"
              />
              <button type="submit" className="bg-[#EE4D2D] text-white px-4 py-2 rounded-xl text-[10px] font-black shadow-sm active:scale-95 transition-transform shrink-0">
                ค้นหา
              </button>
            </form>

            {isSearchDropdownOpen && (
              <div className="absolute top-[110%] left-0 right-0 bg-white rounded-[2rem] p-4 mt-2 shadow-2xl border border-gray-100 z-[110] animate-fade-in-up">
                <p className="font-black text-xs md:text-sm text-[#EE4D2D] mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#EE4D2D] rounded-full animate-pulse"></span>
                  ตัวช่วยค้นหาอัจฉริยะ
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <AISuggestion icon="🛠️" title="ซ่อมบำรุง" desc="จ้างช่างมา ซ่อมแอร์, ล้างตู้เย็น" onClick={() => handleSuggestionClick('ช่างแอร์')} />
                  <AISuggestion icon="🛵" title="ขนส่งด่วน" desc="เรียกรถไป ส่งของ, วินมอไซค์" onClick={() => handleSuggestionClick('วินส่งของ')} />
                  <AISuggestion icon="✨" title="ความสะอาด" desc="หาแม่บ้านมา ทำความสะอาดบ้าน" onClick={() => handleSuggestionClick('แม่บ้าน')} />
                  <AISuggestion icon="💻" title="งานดิจิทัล" desc="หาคนทำ เว็บไซต์, กราฟิกดีไซน์" onClick={() => handleSuggestionClick('ทำเว็บ')} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 📋 Main Content */}
        <main className="px-5 mt-2 flex-1 relative z-10 mb-6 space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            {/* Card: หาช่าง / บริการ */}
            <Link href="/services" className="bg-white rounded-[1.5rem] p-4 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100 active:scale-95 transition-transform">
              {/* 🌟 เปลี่ยนเป็นไอคอนเวกเตอร์ (Illustrative Icon) */}
              <div className="w-16 h-16 mb-2">
                <img src="/craftsmen_vector.svg" alt="Craftsmen Icon" className="w-full h-full object-contain" />
              </div>
              <h3 className="font-black text-gray-800 text-xs mb-0.5">หาช่าง / บริการ</h3>
              <p className="text-[9px] text-gray-400 font-bold leading-tight">ซ่อมแอร์ ท่อตัน<br/>แม่บ้าน งานเหมา</p>
            </Link>
            
            {/* Card: งานด่วน / เรียกรถ */}
            <Link href="/win-online" className="bg-white rounded-[1.5rem] p-4 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100 active:scale-95 transition-transform">
              {/* 🌟 เปลี่ยนเป็นไอคอนเวกเตอร์ (Illustrative Icon) */}
              <div className="w-16 h-16 mb-2">
                <img src="/delivery_vector.svg" alt="Delivery Icon" className="w-full h-full object-contain" />
              </div>
              <h3 className="font-black text-gray-800 text-xs mb-0.5">งานด่วน / เรียกรถ</h3>
              <p className="text-[9px] text-gray-400 font-bold leading-tight">ส่งของ ซื้อข้าว<br/>เรียกรถ วินมอไซค์</p>
            </Link>
          </div>

          <Link href="/job-board" className="bg-gradient-to-r from-[#0082FA] to-[#00A3FF] rounded-[1.5rem] p-6 flex items-center justify-between shadow-md active:scale-95 transition-transform overflow-hidden relative mt-2">
            <div className="absolute right-[-10px] top-[-10px] text-7xl opacity-20 transition-transform hover:scale-110">📋</div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-3xl backdrop-blur-md shadow-inner border border-white/30 transform -rotate-3">📋</div>
              <div>
                <h3 className="font-black text-white text-base mb-1 tracking-wide">บอร์ดประกาศหางาน</h3>
                <p className="text-[11px] text-white/90 font-bold">หางานประจำ พาร์ทไทม์ ในชุมชน</p>
              </div>
            </div>
            <div className="text-white relative z-10 bg-white/20 rounded-full p-2 backdrop-blur-sm hover:scale-110">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
            </div>
          </Link>

        </main>
      </div>
    </div>
  );
}

function AISuggestion({ icon, title, desc, onClick }: { icon: string, title: string, desc: string, onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="w-full text-left bg-gray-50 border border-gray-100 active:bg-orange-50 p-3 rounded-2xl flex items-start gap-3 active:scale-[0.98] transition-all">
      <span className="text-xl md:text-2xl shrink-0 mt-0.5">{icon}</span>
      <div>
        <p className="text-xs md:text-sm font-black text-gray-800">{title}</p>
        <p className="text-[9px] md:text-xs font-bold text-gray-500 mt-0.5 leading-snug line-clamp-2">{desc}</p>
      </div>
    </button>
  );
}

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
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-x-hidden">
        
        {/* 🟠 Header ส้มจงเจริญ */}
        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-b-[2.5rem] p-6 pt-10 shadow-md relative z-20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm shadow-inner border border-white/30">
                <span className="text-xl">🌟</span>
              </div>
              <div className="flex flex-col">
                <span className="text-white/80 text-[10px] font-bold tracking-wider">แพลตฟอร์มตลาดแรงงานชุมชน</span>
                <h1 className="text-white text-2xl font-black tracking-tight">จงเจริญ</h1>
              </div>
            </div>
            <div className="flex gap-2.5">
              <Link href="/notifications" className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm hover:bg-white/30 transition shadow-inner">
                <span className="text-xl">🔔</span>
              </Link>
              <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 shrink-0 border-2 border-white/30 shadow-md">
                <img src="https://uidkyvqjwigzidxpwort.supabase.co/storage/v1/object/public/kyc-documents/user-kyc/cbe6014e-f823-455b-b462-89b52a55bd13/face_image.jpg" alt="Avatar" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          {/* 🔍 ช่องเสริช AI */}
          <div ref={wrapperRef} className="relative z-30 mb-4">
            <div className="bg-white rounded-2xl p-1.5 flex items-center shadow-lg shadow-black/5">
              <div className="pl-3 pr-2 text-gray-400 text-lg">🔍</div>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onFocus={() => setIsSearchDropdownOpen(true)}
                placeholder="ค้นหา... (ใช้ AI ช่วยหาช่าง/หางาน)"
                className="w-full bg-transparent text-sm py-3 outline-none font-bold placeholder:text-gray-400 text-gray-800"
              />
              <button className="bg-[#EE4D2D] text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-sm active:scale-95 transition-transform">
                ค้นหา
              </button>
            </div>

            {isSearchDropdownOpen && (
              <div className="absolute top-full left-0 right-0 bg-white rounded-2xl p-5 mt-2 shadow-xl border border-gray-100 backdrop-blur-lg z-30">
                <p className="font-black text-xs text-gray-800 mb-3 flex items-center gap-1.5"><span className="text-[#EE4D2D]">💡</span> ตัวช่วยค้นหา AI สุดเจ๋ง!</p>
                <div className="space-y-2">
                  <AISuggestion icon="🛠️" text="จ้างช่างมาซ่อมแอร์ หรือทำความสะอาด" onClick={() => handleSuggestionClick('ช่างแอร์')} />
                  <AISuggestion icon="🛵" text="เรียกวินมอไซค์ หรือส่งของด่วน" onClick={() => handleSuggestionClick('เรียกวิน')} />
                  <AISuggestion icon="📋" text="หางานประจำ หรือพาร์ทไทม์" onClick={() => handleSuggestionClick('งานประจำ')} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 📋 3 หมวดตัวเลือกหลัก */}
        <main className="px-5 mt-2 flex-1 relative z-10 mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Link href="/services" className="bg-white rounded-[1.5rem] p-5 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100 active:scale-[0.98] transition-transform group hover:border-orange-200">
              <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform">🛠️</div>
              <h3 className="font-black text-gray-800 text-sm mb-1">หาช่าง / บริการ</h3>
              <p className="text-[10px] text-gray-400 font-bold leading-tight">ซ่อมแอร์ ท่อตัน<br/>แม่บ้าน งานเหมา</p>
            </Link>
            
            {/* ✅ แก้ไขลิงก์ให้ไป Win-online ตามบรีฟ */}
            <Link href="/win-online" className="bg-white rounded-[1.5rem] p-5 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100 active:scale-[0.98] transition-transform group hover:border-red-200">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform">🛵</div>
              <h3 className="font-black text-gray-800 text-sm mb-1">งานด่วน / เรียกรถ</h3>
              <p className="text-[10px] text-gray-400 font-bold leading-tight">ส่งของ ซื้อข้าว<br/>เรียกรถ วินมอไซค์</p>
            </Link>
          </div>

          <Link href="/job-board" className="bg-gradient-to-r from-[#0082FA] to-[#00A3FF] rounded-[1.5rem] p-6 flex items-center justify-between shadow-md active:scale-[0.98] transition-transform overflow-hidden relative group mt-2">
            <div className="absolute right-[-10px] top-[-10px] text-7xl opacity-20 transform group-hover:scale-110 transition-transform duration-500">📋</div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-3xl backdrop-blur-md shadow-inner border border-white/30">📋</div>
              <div>
                <h3 className="font-black text-white text-base mb-1 tracking-wide">บอร์ดประกาศหางาน</h3>
                <p className="text-[11px] text-white/90 font-bold">หางานประจำ พาร์ทไทม์ ในชุมชน</p>
              </div>
            </div>
            <div className="text-white bg-white/20 rounded-full p-2 backdrop-blur-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
            </div>
          </Link>
        </main>
      </div>
    </div>
  );
}

function AISuggestion({ icon, text, onClick }: { icon: string, text: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left bg-gray-50 border border-gray-100 hover:border-orange-200 hover:bg-orange-50 p-2.5 rounded-xl flex items-start gap-2.5 active:scale-[0.98] transition-all">
      <span className="text-xl shrink-0 mt-0.5">{icon}</span>
      <p className="text-xs font-bold text-gray-700 leading-snug">{text}</p>
    </button>
  );
}

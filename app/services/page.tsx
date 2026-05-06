'use client';

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  // 🌟 เพิ่ม State สำหรับเก็บรูปโปรไฟล์ของผู้ใช้งาน
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    // ฟังก์ชันดึงรูปโปรไฟล์จากฐานข้อมูล
    const fetchUserProfile = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', session.user.id)
          .single();
        if (data?.avatar_url) setUserAvatar(data.avatar_url);
      }
    };
    fetchUserProfile();

    // ระบบคลิกนอกกล่องแล้วปิด Dropdown ค้นหา
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
        
        {/* 🟠 Header ส้มจงเจริญ - จัดให้อยู่ตรงกลาง (Center) */}
        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-b-[2.5rem] p-6 pt-12 shadow-md relative z-20 flex flex-col items-center">
          
          {/* 🌟 รูปโปรไฟล์มุมขวาบน (ดึงข้อมูลอัตโนมัติ) */}
          <Link href="/profile" className="absolute top-6 right-6 w-11 h-11 rounded-full overflow-hidden bg-slate-200 border-2 border-white/40 shadow-lg active:scale-95 transition-transform flex items-center justify-center text-slate-400">
            {userAvatar ? (
              <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            )}
          </Link>

          {/* โลโก้ & ชื่อแอปตรงกลาง */}
          <div className="w-20 h-20 bg-white rounded-[1.5rem] flex items-center justify-center shadow-xl mb-4 p-2">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-white text-3xl font-black tracking-tight mb-1">จงเจริญ</h1>
          <span className="text-white/80 text-xs font-bold tracking-widest uppercase mb-8">แพลตฟอร์มตลาดแรงงานชุมชน</span>

          {/* 🔍 ช่องเสริช AI */}
          <div ref={wrapperRef} className="relative z-[100] mb-2 w-full max-w-lg mx-auto">
            <form action="/services" method="GET" className="bg-white rounded-2xl p-1.5 flex items-center shadow-lg shadow-black/10">
              <div className="pl-3 pr-2 text-gray-400 text-base">🔍</div>
              <input
                type="text"
                name="q"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onFocus={() => setIsSearchDropdownOpen(true)}
                placeholder="ฉันต้องการจ้างงาน..."
                className="w-full bg-transparent text-sm py-2.5 outline-none font-bold text-gray-800 placeholder:text-gray-400"
              />
              <button type="submit" className="bg-[#EE4D2D] text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-sm active:scale-95 transition-transform shrink-0">
                ค้นหา
              </button>
            </form>

            {isSearchDropdownOpen && (
              <div className="absolute top-[110%] left-0 right-0 bg-white rounded-[2rem] p-5 mt-2 shadow-2xl border border-gray-100 z-[110] animate-fade-in-up">
                <p className="font-black text-xs md:text-sm text-[#EE4D2D] mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#EE4D2D] rounded-full animate-pulse"></span>
                  ตัวช่วยค้นหาอัจฉริยะ
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <AISuggestion icon="❄️" title="ช่างแอร์" desc="ล้างแอร์, ซ่อมแอร์, เติมน้ำยา" onClick={() => handleSuggestionClick('ช่างแอร์')} />
                  <AISuggestion icon="💧" title="ช่างไฟ / ประปา" desc="ซ่อมไฟ, ท่อแตก, เดินสายไฟ" onClick={() => handleSuggestionClick('ช่างซ่อม')} />
                  <AISuggestion icon="✨" title="แม่บ้าน" desc="ทำความสะอาดบ้าน, ซักรีด" onClick={() => handleSuggestionClick('แม่บ้าน')} />
                  <AISuggestion icon="🚜" title="งานเกษตร" desc="ไถนา, พ่นยา, ตัดหญ้า" onClick={() => handleSuggestionClick('เกษตรกรรม')} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 📋 Main Content */}
        <main className="px-5 mt-4 flex-1 relative z-10 mb-6 space-y-5">
          
          <div className="grid grid-cols-2 gap-4">
            
            {/* 🌟 Card: หาช่าง / บริการ (กลับไปใช้ Icon Standard ออริจินัล) */}
            <Link href="/services" className="bg-white rounded-[1.5rem] p-5 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100 active:scale-95 transition-transform">
              <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center text-3xl mb-3">🛠️</div>
              <h3 className="font-black text-gray-800 text-sm mb-1">หาช่าง / บริการ</h3>
              <p className="text-[10px] text-gray-400 font-bold leading-tight">ซ่อมแอร์ ท่อตัน<br/>แม่บ้าน งานเหมา</p>
            </Link>
            
            {/* 🌟 Card: งานด่วน / เรียกรถ (กลับไปใช้ Icon Standard ออริจินัล) */}
            <Link href="/win-online" className="bg-white rounded-[1.5rem] p-5 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100 active:scale-95 transition-transform">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-3xl mb-3">🛵</div>
              <h3 className="font-black text-gray-800 text-sm mb-1">งานด่วน / เรียกรถ</h3>
              <p className="text-[10px] text-gray-400 font-bold leading-tight">ส่งของ ซื้อข้าว<br/>เรียกรถ วินมอไซค์</p>
            </Link>
            
          </div>

          <Link href="/job-board" className="bg-gradient-to-r from-[#0082FA] to-[#00A3FF] rounded-[2rem] p-7 md:p-8 flex items-center justify-between shadow-md active:scale-95 transition-transform overflow-hidden relative mt-4 group">
            <div className="absolute right-[-10px] top-[-10px] text-[100px] opacity-20 transition-transform group-hover:scale-110 group-hover:-rotate-12">📋</div>
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl backdrop-blur-md shadow-inner border border-white/30 transform -rotate-3">📋</div>
              <div>
                <h3 className="font-black text-white text-lg md:text-xl mb-1 tracking-wide">บอร์ดประกาศหางาน</h3>
                <p className="text-[11px] md:text-xs text-white/90 font-bold">หางานประจำ พาร์ทไทม์ ในชุมชน</p>
              </div>
            </div>
            <div className="text-white relative z-10 bg-white/20 rounded-full p-2.5 backdrop-blur-sm group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
            </div>
          </Link>

        </main>
      </div>
    </div>
  );
}

function AISuggestion({ icon, title, desc, onClick }: { icon: string, title: string, desc: string, onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="w-full text-left bg-gray-50 border border-gray-100 active:bg-orange-50 p-3.5 rounded-2xl flex items-start gap-3.5 active:scale-[0.98] transition-all hover:border-[#EE4D2D]/30 group">
      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl shadow-sm border border-gray-100 shrink-0 group-hover:scale-110 transition-transform">{icon}</div>
      <div className="mt-0.5">
        <p className="text-xs font-black text-gray-800">{title}</p>
        <p className="text-[10px] font-bold text-gray-500 mt-0.5 leading-snug line-clamp-2">{desc}</p>
      </div>
    </button>
  );
}

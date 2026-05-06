'use client';
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  // State สำหรับเก็บรูปโปรไฟล์ของผู้ใช้งาน
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', session.user.id)
          .single();
          
        if (!error && data?.avatar_url) {
          setUserAvatar(data.avatar_url);
        } else {
          console.log("ไม่พบรูปโปรไฟล์ในฐานข้อมูล หรือยังไม่ได้อัปโหลดรูปค่ะ");
        }
      } else {
        console.log("ผู้ใช้ยังไม่ได้ล็อกอินค่ะ");
      }
    };
    fetchUserProfile();

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
    // 🌟 ปรับพื้นหลังหลัก และปลดล็อก max-w ให้รองรับคอมพิวเตอร์ (lg:max-w-5xl xl:max-w-6xl)
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-24 md:pb-10">
      <div className="w-full lg:max-w-5xl xl:max-w-6xl bg-[#F4F6F8] min-h-screen relative flex flex-col md:shadow-2xl overflow-x-hidden md:border-x border-gray-200/50">
        
        {/* 🟠 Header ส้มจงเจริญ - ขยายสัดส่วนให้พอดีกับจอคอม (เพิ่ม Padding) */}
        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-b-[2.5rem] md:rounded-b-[4rem] p-6 md:p-12 pt-12 md:pt-16 shadow-md relative z-20 flex flex-col items-center">
          
          {/* รูปโปรไฟล์มุมขวาบน */}
          <Link href="/profile" className="absolute top-6 right-6 md:top-10 md:right-10 w-11 h-11 md:w-14 md:h-14 rounded-full overflow-hidden bg-white/20 border-2 border-white/40 shadow-lg active:scale-95 transition-transform flex items-center justify-center text-white hover:bg-white/30">
            {userAvatar ? (
              <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            )}
          </Link>

          {/* โลโก้ & ชื่อแอปตรงกลาง */}
          <div className="w-20 h-20 md:w-28 md:h-28 bg-white rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center shadow-xl mb-4 md:mb-6 p-2 md:p-4">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-white text-3xl md:text-5xl font-black tracking-tight mb-1 md:mb-2">จงเจริญ</h1>
          <span className="text-white/80 text-xs md:text-sm font-bold tracking-widest uppercase mb-8 md:mb-12">แพลตฟอร์มตลาดแรงงานชุมชน</span>

          {/* 🔍 ช่องเสริช AI - ขยายให้กว้างขึ้นบนจอคอม (md:max-w-2xl) */}
          <div ref={wrapperRef} className="relative z-[100] mb-2 w-full max-w-lg md:max-w-2xl mx-auto">
            <form action="/services" method="GET" className="bg-white rounded-2xl md:rounded-full p-1.5 md:p-2 flex items-center shadow-xl shadow-black/10">
              <div className="pl-4 pr-2 text-gray-400 text-lg md:text-xl">🔍</div>
              <input
                type="text"
                name="q"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onFocus={() => setIsSearchDropdownOpen(true)}
                placeholder="ฉันต้องการจ้างงาน..."
                className="w-full bg-transparent text-sm md:text-base py-3 md:py-4 outline-none font-bold text-gray-800 placeholder:text-gray-400"
              />
              <button type="submit" className="bg-[#EE4D2D] text-white px-6 md:px-10 py-3 md:py-4 rounded-xl md:rounded-full text-xs md:text-sm font-black shadow-sm active:scale-95 transition-transform shrink-0">
                ค้นหา
              </button>
            </form>

            {isSearchDropdownOpen && (
              <div className="absolute top-[110%] left-0 right-0 bg-white rounded-[2rem] p-5 md:p-8 mt-2 shadow-2xl border border-gray-100 z-[110] animate-fade-in-up">
                <p className="font-black text-xs md:text-sm text-[#EE4D2D] mb-4 md:mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#EE4D2D] rounded-full animate-pulse"></span>
                  ตัวช่วยค้นหาอัจฉริยะ
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <AISuggestion icon="❄️" title="ช่างแอร์" desc="ล้างแอร์, ซ่อมแอร์, เติมน้ำยา" onClick={() => handleSuggestionClick('ช่างแอร์')} />
                  <AISuggestion icon="💧" title="ช่างไฟ / ประปา" desc="ซ่อมไฟ, ท่อแตก, เดินสายไฟ" onClick={() => handleSuggestionClick('ช่างซ่อม')} />
                  <AISuggestion icon="✨" title="แม่บ้าน" desc="ทำความสะอาดบ้าน, ซักรีด" onClick={() => handleSuggestionClick('แม่บ้าน')} />
                  <AISuggestion icon="🚜" title="งานเกษตร" desc="ไถนา, พ่นยา, ตัดหญ้า" onClick={() => handleSuggestionClick('เกษตรกรรม')} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 📋 Main Content - จำกัดความกว้างเนื้อหาข้างในไม่ให้ยืดเกินไป (max-w-4xl) */}
        <main className="px-5 md:px-10 mt-4 md:mt-8 flex-1 relative z-10 mb-6 space-y-5 md:space-y-8 w-full max-w-4xl mx-auto">
          
          <div className="grid grid-cols-2 gap-4 md:gap-8">
            
            {/* Card: หาช่าง / บริการ (กลับมาใช้ไอคอนมาตรฐาน แต่ปรับขนาดตามหน้าจอ) */}
            <Link href="/services" className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-8 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md border border-gray-100 active:scale-95 transition-all group">
              <div className="w-14 h-14 md:w-20 md:h-20 bg-orange-50 rounded-full flex items-center justify-center text-3xl md:text-4xl mb-3 md:mb-5 group-hover:scale-110 transition-transform">🛠️</div>
              <h3 className="font-black text-gray-800 text-sm md:text-xl mb-1 md:mb-2">หาช่าง / บริการ</h3>
              <p className="text-[10px] md:text-sm text-gray-400 font-bold leading-tight">ซ่อมแอร์ ท่อตัน<br className="md:hidden"/> แม่บ้าน งานเหมา</p>
            </Link>
            
            {/* Card: งานด่วน / เรียกรถ */}
            <Link href="/win-online" className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-8 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md border border-gray-100 active:scale-95 transition-all group">
              <div className="w-14 h-14 md:w-20 md:h-20 bg-red-50 rounded-full flex items-center justify-center text-3xl md:text-4xl mb-3 md:mb-5 group-hover:scale-110 transition-transform">🛵</div>
              <h3 className="font-black text-gray-800 text-sm md:text-xl mb-1 md:mb-2">งานด่วน / เรียกรถ</h3>
              <p className="text-[10px] md:text-sm text-gray-400 font-bold leading-tight">ส่งของ ซื้อข้าว<br className="md:hidden"/> เรียกรถ วินมอไซค์</p>
            </Link>
            
          </div>

          <Link href="/job-board" className="bg-gradient-to-r from-[#0082FA] to-[#00A3FF] rounded-[2rem] md:rounded-[3rem] p-7 md:p-10 flex items-center justify-between shadow-md active:scale-95 transition-transform overflow-hidden relative mt-4 group hover:shadow-xl">
            <div className="absolute right-[-10px] top-[-10px] text-[100px] md:text-[180px] opacity-20 transition-transform group-hover:scale-110 group-hover:-rotate-12">📋</div>
            <div className="flex items-center gap-5 md:gap-8 relative z-10">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-white/20 rounded-2xl md:rounded-3xl flex items-center justify-center text-4xl md:text-5xl backdrop-blur-md shadow-inner border border-white/30 transform -rotate-3">📋</div>
              <div>
                <h3 className="font-black text-white text-lg md:text-3xl mb-1 md:mb-2 tracking-wide">บอร์ดประกาศหางาน</h3>
                <p className="text-[11px] md:text-sm text-white/90 font-bold uppercase tracking-wider">หางานประจำ พาร์ทไทม์ ในชุมชน</p>
              </div>
            </div>
            <div className="text-white relative z-10 bg-white/20 rounded-full p-2.5 md:p-4 backdrop-blur-sm group-hover:scale-110 transition-transform shadow-lg">
              <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
            </div>
          </Link>

        </main>
      </div>
    </div>
  );
}

function AISuggestion({ icon, title, desc, onClick }: { icon: string, title: string, desc: string, onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="w-full text-left bg-gray-50 border border-gray-100 active:bg-orange-50 hover:bg-orange-50 p-3.5 md:p-5 rounded-2xl md:rounded-3xl flex items-start gap-3.5 md:gap-5 active:scale-[0.98] transition-all hover:border-[#EE4D2D]/30 group">
      <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-white flex items-center justify-center text-xl md:text-2xl shadow-sm border border-gray-100 shrink-0 group-hover:scale-110 transition-transform">{icon}</div>
      <div className="mt-0.5 md:mt-1">
        <p className="text-xs md:text-base font-black text-gray-800">{title}</p>
        <p className="text-[10px] md:text-xs font-bold text-gray-500 mt-0.5 md:mt-1 leading-snug line-clamp-2">{desc}</p>
      </div>
    </button>
  );
}

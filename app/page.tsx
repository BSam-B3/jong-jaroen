'use client';
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

export default function HomePage() {
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  // ข้อมูลโปรไฟล์จำลอง (เดี๋ยวไปเชื่อม Auth จริงทีหลังค่ะ)
  const userProfile = {
    name: "บีสาม ผู้เชี่ยวชาญ",
    avatar: "https://uidkyvqjwigzidxpwort.supabase.co/storage/v1/object/public/kyc-documents/user-kyc/cbe6014e-f823-455b-b462-89b52a55bd13/face_image.jpg"
  };

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
    <div className="min-h-screen bg-[#F4F6F8] font-sans pb-24 selection:bg-orange-100">
      
      {/* 🟠 Premium Header - ขยายเต็มจอแต่เนื้อหาจำกัดความกว้าง */}
      <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] pb-28 md:pb-36 rounded-b-[2.5rem] md:rounded-b-[4rem] relative z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-5 pt-8 md:pt-12">
          
          {/* Navbar */}
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center shadow-lg overflow-hidden p-1">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-white/80 text-[10px] md:text-xs font-bold tracking-wider uppercase">แพลตฟอร์มตลาดแรงงานชุมชน</span>
                <h1 className="text-white text-2xl md:text-3xl font-black tracking-tight">จงเจริญ</h1>
              </div>
            </div>

            {/* 👤 Profile Pill (แทนที่กระดิ่ง) */}
            <Link href="/profile" className="flex items-center gap-2 md:gap-3 bg-white/10 hover:bg-white/20 p-1.5 md:pr-4 rounded-full backdrop-blur-md border border-white/20 transition-all active:scale-95 group">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border border-white/50 shadow-sm shrink-0">
                <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <span className="text-white text-xs md:text-sm font-black hidden md:block pr-2">{userProfile.name}</span>
            </Link>
          </div>

          {/* 🔍 ช่องเสริช AI อัจฉริยะ (Z-index สูงสุด) */}
          <div ref={wrapperRef} className="relative z-[100] max-w-3xl mx-auto">
            <form action="/services" method="GET" className="bg-white rounded-2xl md:rounded-full p-1.5 md:p-2 flex items-center shadow-2xl shadow-black/10 transition-all focus-within:ring-4 focus-within:ring-white/20">
              <div className="pl-4 pr-2 text-gray-400 hidden md:block text-xl">🔍</div>
              <input
                type="text"
                name="q"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onFocus={() => setIsSearchDropdownOpen(true)}
                placeholder="ฉันต้องการจ้างงาน..."
                className="w-full bg-transparent text-sm md:text-base py-3 md:py-4 px-3 outline-none font-bold text-gray-800 placeholder:text-gray-400"
              />
              <button type="submit" className="bg-[#EE4D2D] text-white px-6 md:px-10 py-3 md:py-4 rounded-xl md:rounded-full text-xs md:text-sm font-black shadow-md hover:bg-[#D73D22] active:scale-95 transition-all shrink-0">
                ค้นหา
              </button>
            </form>

            {/* Dropdown ระบบแนะนำแบบ Fastwork */}
            {isSearchDropdownOpen && (
              <div className="absolute top-[115%] left-0 right-0 bg-white rounded-2xl md:rounded-3xl p-5 md:p-7 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.3)] border border-gray-100 z-[110] animate-in fade-in slide-in-from-top-4 duration-200">
                <p className="font-black text-xs md:text-sm text-[#EE4D2D] mb-5 flex items-center gap-2 uppercase tracking-widest">
                  <span className="w-2 h-2 bg-[#EE4D2D] rounded-full animate-pulse"></span>
                  ตัวช่วยค้นหาอัจฉริยะ
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AISuggestion icon="🛠️" title="ซ่อมบำรุง" desc="จ้างช่างมา ซ่อมแอร์, ล้างตู้เย็น" onClick={() => handleSuggestionClick('ช่างแอร์')} />
                  <AISuggestion icon="🛵" title="ขนส่งด่วน" desc="เรียกรถไป ส่งของ, วินมอไซค์" onClick={() => handleSuggestionClick('วินส่งของ')} />
                  <AISuggestion icon="✨" title="ความสะอาด" desc="หาแม่บ้านมา ทำความสะอาดบ้าน" onClick={() => handleSuggestionClick('แม่บ้าน')} />
                  <AISuggestion icon="💻" title="งานดิจิทัล" desc="หาคนทำ เว็บไซต์, กราฟิกดีไซน์" onClick={() => handleSuggestionClick('ทำเว็บ')} />
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 📋 Main Content */}
      <main className="max-w-5xl mx-auto px-5 -mt-16 md:-mt-20 relative z-30 space-y-8">
        
        {/* Serious Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-10">
          
          {/* Card: หาช่าง / บริการ */}
          <Link href="/services" className="group bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-100 transition-all active:scale-[0.98] flex flex-col">
            <div className="h-44 md:h-64 w-full relative overflow-hidden bg-slate-100">
              <img 
                src="https://images.unsplash.com/photo-1581578731548-c64695cc6954?q=80&w=800&auto=format&fit=crop" 
                alt="Service" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-5 left-6 right-6 text-white">
                <span className="bg-[#EE4D2D] text-[10px] font-black px-2.5 py-1 rounded-md mb-2 inline-block shadow-sm">PRO SERVICE</span>
                <h3 className="font-black text-2xl md:text-3xl">หาช่าง / บริการ</h3>
              </div>
            </div>
            <div className="p-6 flex-1 flex items-center">
              <p className="text-xs md:text-sm text-gray-500 font-bold leading-relaxed">
                รวมช่างมืออาชีพที่ผ่านการยืนยันตัวตน ทั้งงานซ่อม งานเหมา และแม่บ้านดูแลบ้านคุณ
              </p>
            </div>
          </Link>
          
          {/* Card: งานด่วน / เรียกรถ */}
          <Link href="/win-online" className="group bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-100 transition-all active:scale-[0.98] flex flex-col">
            <div className="h-44 md:h-64 w-full relative overflow-hidden bg-slate-100">
              <img 
                src="https://images.unsplash.com/photo-1616423640778-28d1b53229bd?q=80&w=800&auto=format&fit=crop" 
                alt="Delivery" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-5 left-6 right-6 text-white">
                <span className="bg-blue-500 text-[10px] font-black px-2.5 py-1 rounded-md mb-2 inline-block shadow-sm">ON-DEMAND</span>
                <h3 className="font-black text-2xl md:text-3xl">งานด่วน / เรียกรถ</h3>
              </div>
            </div>
            <div className="p-6 flex-1 flex items-center">
              <p className="text-xs md:text-sm text-gray-500 font-bold leading-relaxed">
                ส่งพัสดุ ฝากซื้อของ หรือเรียกรถเดินทางด่วนในพื้นที่ ปลอดภัยด้วยระบบ GPS ติดตาม
              </p>
            </div>
          </Link>

        </div>

        {/* บอร์ดประกาศหางาน */}
        <Link href="/job-board" className="bg-gradient-to-r from-[#0082FA] to-[#00A3FF] rounded-[2.5rem] p-7 md:p-10 flex items-center justify-between shadow-xl hover:shadow-2xl active:scale-[0.99] transition-all overflow-hidden relative group">
          <div className="absolute right-[-10px] top-[-10px] text-9xl opacity-10 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">📋</div>
          <div className="flex items-center gap-6 md:gap-8 relative z-10">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 rounded-2xl flex items-center justify-center text-4xl backdrop-blur-md shadow-inner border border-white/30 transform -rotate-2">📋</div>
            <div>
              <h3 className="font-black text-white text-xl md:text-3xl mb-2 tracking-tight">บอร์ดประกาศหางาน</h3>
              <p className="text-[12px] md:text-sm text-white/90 font-bold uppercase tracking-widest">Community Job Board</p>
            </div>
          </div>
          <div className="text-[#0082FA] relative z-10 bg-white rounded-full p-3 md:p-4 shadow-lg group-hover:translate-x-2 transition-transform">
            <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M9 5l7 7-7 7" /></svg>
          </div>
        </Link>

      </main>
    </div>
  );
}

function AISuggestion({ icon, title, desc, onClick }: { icon: string, title: string, desc: string, onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="w-full text-left bg-gray-50 hover:bg-[#EE4D2D] hover:text-white group border border-gray-100 hover:border-transparent p-4 md:p-5 rounded-2xl flex items-start gap-4 active:scale-[0.98] transition-all">
      <span className="text-2xl md:text-3xl shrink-0 transition-transform group-hover:scale-110">{icon}</span>
      <div>
        <p className="text-xs md:text-sm font-black text-gray-800 group-hover:text-white transition-colors uppercase tracking-wider">{title}</p>
        <p className="text-[10px] md:text-xs font-bold text-gray-500 group-hover:text-white/80 transition-colors mt-1 leading-snug">{desc}</p>
      </div>
    </button>
  );
}

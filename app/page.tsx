'use client';
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

export default function HomePage() {
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  // ข้อมูลโปรไฟล์จำลอง (เดี๋ยวบีสามไปเชื่อมกับ Database จริง)
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
    <div className="min-h-screen bg-[#F8FAFC] flex justify-center font-sans pb-24 selection:bg-orange-100">
      {/* 📱 Container หลัก: ปรับ max-width ให้กว้างขึ้นสำหรับคอมพิวเตอร์ */}
      <div className="w-full lg:max-w-5xl xl:max-w-6xl bg-white min-h-screen relative flex flex-col shadow-2xl overflow-x-hidden border-x border-gray-100">
        
        {/* 🟠 Premium Header */}
        <div className="bg-gradient-to-r from-[#EE4D2D] to-[#FF7337] rounded-b-[3rem] p-6 md:p-10 pt-10 shadow-xl relative z-20">
          <div className="flex items-center justify-between mb-10 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 overflow-hidden p-1">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-white text-3xl font-black tracking-tighter">จงเจริญ</h1>
                <span className="text-white/70 text-[10px] font-bold uppercase tracking-[0.2em] leading-none mt-1">Professional Community</span>
              </div>
            </div>

            {/* 👤 Profile Pill (แทนที่กระดิ่ง) */}
            <Link href="/profile" className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 p-1 pr-4 rounded-full backdrop-blur-md border border-white/20 transition-all active:scale-95 group">
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/50 shadow-sm">
                <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <span className="text-white text-xs font-black hidden sm:block">{userProfile.name}</span>
            </Link>
          </div>

          {/* 🔍 AI Semantic Search (Fastwork Style) */}
          <div ref={wrapperRef} className="relative z-30 mb-6 max-w-3xl mx-auto">
            <div className="bg-white rounded-3xl p-2 flex items-center shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white">
              <div className="pl-4 pr-2 text-gray-400 hidden md:block">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onFocus={() => setIsSearchDropdownOpen(true)}
                placeholder="ฉันต้องการจ้างงาน..."
                className="w-full bg-transparent text-sm md:text-base py-4 px-2 outline-none font-bold text-gray-800 placeholder:text-gray-400 placeholder:font-medium"
              />
              <button className="bg-[#EE4D2D] text-white px-8 py-4 rounded-2xl text-sm font-black shadow-lg shadow-orange-200 hover:bg-[#D73D22] transition-all active:scale-95">
                ค้นหา
              </button>
            </div>

            {isSearchDropdownOpen && (
              <div className="absolute top-[110%] left-0 right-0 bg-white/95 backdrop-blur-xl rounded-[2rem] p-6 mt-2 shadow-2xl border border-gray-100 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                <p className="font-black text-[11px] text-[#EE4D2D] mb-4 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#EE4D2D] rounded-full animate-pulse"></span>
                  AI Smart Suggestions
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <AISuggestion icon="🛠️" title="ซ่อมบำรุง" desc="ฉันต้องการจ้างช่างมา ซ่อมแอร์, ล้างตู้เย็น" onClick={() => handleSuggestionClick('ช่างแอร์')} />
                  <AISuggestion icon="🛵" title="ขนส่งด่วน" desc="ฉันต้องการเรียกรถไป ส่งของ, วินมอไซค์" onClick={() => handleSuggestionClick('วินส่งของ')} />
                  <AISuggestion icon="✨" title="ความสะอาด" desc="ฉันต้องการหาแม่บ้านมา ทำความสะอาดบ้าน" onClick={() => handleSuggestionClick('แม่บ้าน')} />
                  <AISuggestion icon="💻" title="งานดิจิทัล" desc="ฉันต้องการคนช่วย ทำเว็บไซต์, กราฟิก" onClick={() => handleSuggestionClick('ทำเว็บ')} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 📋 Professional Menu Grid */}
        <main className="px-6 md:px-10 -mt-8 flex-1 relative z-30 mb-10 space-y-8 max-w-5xl mx-auto w-full">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card: Services - Serious Image */}
            <Link href="/services" className="group bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-100 transition-all hover:shadow-2xl active:scale-[0.98]">
              <div className="h-48 overflow-hidden relative">
                <img 
                  src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop" 
                  alt="Service" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-5 left-6 text-white">
                    <span className="bg-orange-500 text-[10px] font-black px-2 py-1 rounded-md mb-2 inline-block">PRO SERVICE</span>
                    <h3 className="font-black text-xl">หาช่าง / บริการ</h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-xs text-gray-500 font-bold leading-relaxed">
                  รวมช่างมืออาชีพที่ผ่านการยืนยันตัวตน (KYC) <br className="hidden lg:block"/> ทั้งงานซ่อม งานเหมา และแม่บ้านทำความสะอาด
                </p>
              </div>
            </Link>
            
            {/* Card: Win - Serious Image */}
            <Link href="/win-online" className="group bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-100 transition-all hover:shadow-2xl active:scale-[0.98]">
               <div className="h-48 overflow-hidden relative">
                <img 
                  src="https://images.unsplash.com/photo-1620455805821-742f39fdb6ca?q=80&w=1974&auto=format&fit=crop" 
                  alt="Delivery" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-5 left-6 text-white">
                    <span className="bg-red-500 text-[10px] font-black px-2 py-1 rounded-md mb-2 inline-block">ON-DEMAND</span>
                    <h3 className="font-black text-xl">งานด่วน / เรียกรถ</h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-xs text-gray-500 font-bold leading-relaxed">
                  เรียกรับบริการด่วนในพื้นที่ ส่งพัสดุ ฝากซื้อของ <br className="hidden lg:block"/> หรือเรียกรถเดินทาง ปลอดภัยด้วยระบบ GPS
                </p>
              </div>
            </Link>
          </div>

          {/* 🌟 Job Board Bar - คงไว้ตามบรีฟแต่ปรับ Padding ให้รับกับ Desktop */}
          <Link href="/job-board" className="bg-gradient-to-r from-[#0082FA] to-[#00A3FF] rounded-[2rem] p-8 flex items-center justify-between shadow-xl active:scale-95 transition-all overflow-hidden relative group">
            <div className="absolute right-[-20px] top-[-20px] text-9xl opacity-10 transition-transform group-hover:scale-110 group-hover:-rotate-12">📋</div>
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-md shadow-inner border border-white/30 transform rotate-3">📋</div>
              <div>
                <h3 className="font-black text-white text-xl mb-1 tracking-tight">บอร์ดประกาศหางาน</h3>
                <p className="text-xs text-white/80 font-bold uppercase tracking-widest">Community Job Board</p>
              </div>
            </div>
            <div className="text-[#0082FA] relative z-10 bg-white rounded-full p-3 shadow-lg transform group-hover:translate-x-2 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M9 5l7 7-7 7" /></svg>
            </div>
          </Link>

        </main>
      </div>
    </div>
  );
}

function AISuggestion({ icon, title, desc, onClick }: { icon: string, title: string, desc: string, onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="group w-full text-left bg-gray-50/50 hover:bg-[#EE4D2D] p-4 rounded-2xl flex items-start gap-4 transition-all active:scale-[0.98] border border-gray-100 hover:border-transparent">
      <span className="text-2xl shrink-0 transition-transform group-hover:scale-110">{icon}</span>
      <div>
        <h4 className="text-xs font-black text-gray-900 mb-0.5 group-hover:text-white transition-colors">{title}</h4>
        <p className="text-[10px] font-medium text-gray-500 group-hover:text-white/80 transition-colors leading-tight">{desc}</p>
      </div>
    </button>
  );
}

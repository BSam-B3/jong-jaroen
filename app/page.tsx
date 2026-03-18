'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Mock Data สำหรับหมวดหมู่บริการ
const CATEGORIES = [
  { id: '1', name: 'ล้างแอร์', icon: '❄️', color: 'bg-blue-50 text-blue-500' },
  { id: '2', name: 'ช่างไฟฟ้า', icon: '⚡', color: 'bg-yellow-50 text-yellow-500' },
  { id: '3', name: 'ประปา', icon: '🚰', color: 'bg-cyan-50 text-cyan-500' },
  { id: '4', name: 'ทำความสะอาด', icon: '🧹', color: 'bg-green-50 text-green-500' },
  { id: '5', name: 'ซ่อมรถ/จยย.', icon: '🛵', color: 'bg-orange-50 text-orange-500' },
  { id: '6', name: 'ไอที/คอมฯ', icon: '💻', color: 'bg-indigo-50 text-indigo-500' },
  { id: '7', name: 'รับส่งของ', icon: '📦', color: 'bg-rose-50 text-rose-500' },
  { id: '8', name: 'ดูทั้งหมด', icon: '➡️', color: 'bg-gray-100 text-gray-500' },
];

// Mock Data สำหรับช่างแนะนำ
const TOP_FREELANCERS = [
  { id: 'f1', name: 'ช่างสมหมาย', skill: 'ผู้เชี่ยวชาญระบบแอร์', rating: 4.9, reviews: 124, img: '👨‍🔧' },
  { id: 'f2', name: 'พี่วินัย', skill: 'ช่างไฟฟ้าระดับ 2', rating: 4.8, reviews: 89, img: '👷‍♂️' },
  { id: 'f3', name: 'ป้าศรี', skill: 'แม่บ้านมือโปร', rating: 5.0, reviews: 205, img: '👩‍🍳' },
];

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/services?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pb-24">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-x-hidden">
        
        {/* 🟠 Hero & Search Section */}
        <div className="bg-gradient-to-br from-[#EE4D2D] to-[#FF7337] rounded-b-[2.5rem] pt-12 pb-8 px-6 shadow-md relative z-10">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-white/80 text-[10px] font-bold tracking-wider uppercase mb-0.5">ชุมชนปากน้ำประแส</p>
              <h1 className="text-2xl font-black text-white leading-tight">จงเจริญ <span className="text-orange-200">แพลตฟอร์ม</span></h1>
            </div>
            <button 
              onClick={() => router.push('/profile')}
              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-lg border border-white/30 shadow-sm hover:bg-white/30 active:scale-95 transition-all"
            >
              🔔
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <span className="text-gray-400 text-lg">🔍</span>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาบริการ... เช่น ล้างแอร์, ช่างไฟ"
              className="w-full bg-white text-gray-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold shadow-lg outline-none focus:ring-4 focus:ring-white/30 transition-all placeholder:font-medium"
            />
          </form>
        </div>

        <main className="flex-1 relative z-20 -mt-4 space-y-6">
          
          {/* 📢 Banner โปรโมชั่น / ประชาสัมพันธ์ */}
          <div className="px-5 mt-2">
            <div className="bg-gradient-to-r from-orange-100 to-orange-50 rounded-2xl p-4 border border-orange-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="bg-[#EE4D2D] text-white text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wider mb-1 inline-block">ประกาศ</span>
                <h3 className="font-bold text-gray-800 text-sm leading-tight">ต้อนรับช่างใหม่! สมัครวันนี้</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">รับตราประทับ ยืนยันตัวตนฟรี 100%</p>
              </div>
              <div className="text-3xl drop-shadow-sm">🎉</div>
            </div>
          </div>

          {/* 🗂️ หมวดหมู่บริการ (Categories) */}
          <div className="px-5">
            <h2 className="text-sm font-black text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-[#EE4D2D] text-lg">📌</span> หมวดหมู่ยอดฮิต
            </h2>
            <div className="grid grid-cols-4 gap-x-3 gap-y-4">
              {CATEGORIES.map((cat) => (
                <button 
                  key={cat.id} 
                  onClick={() => router.push(cat.id === '8' ? '/services' : `/services?category=${cat.name}`)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className={`w-14 h-14 ${cat.color} rounded-[1.2rem] flex items-center justify-center text-2xl shadow-sm border border-black/5 group-hover:scale-105 group-active:scale-95 transition-transform`}>
                    {cat.icon}
                  </div>
                  <span className="text-[10px] font-bold text-gray-600 text-center leading-tight">
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ⭐ ช่างแนะนำ (Top Rated Freelancers) */}
          <div className="pl-5 pb-6">
            <div className="flex justify-between items-end pr-5 mb-3">
              <h2 className="text-sm font-black text-gray-800 flex items-center gap-2">
                <span className="text-[#EE4D2D] text-lg">⭐</span> ช่างฝีมือดีที่แนะนำ
              </h2>
              <button onClick={() => router.push('/services')} className="text-[10px] font-bold text-[#EE4D2D] hover:underline">
                ดูทั้งหมด
              </button>
            </div>
            
            {/* Horizontal Scroll */}
            <div className="flex gap-4 overflow-x-auto pb-4 pt-1 pr-5 snap-x hide-scrollbar">
              {TOP_FREELANCERS.map((freelance) => (
                <div 
                  key={freelance.id} 
                  className="bg-white min-w-[160px] p-4 rounded-2xl shadow-sm border border-gray-100 snap-start flex flex-col hover:border-[#EE4D2D]/30 transition-colors cursor-pointer"
                >
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-2xl mb-2 border border-gray-100">
                    {freelance.img}
                  </div>
                  <h3 className="font-bold text-gray-800 text-sm">{freelance.name}</h3>
                  <p className="text-[10px] text-gray-500 mb-2 truncate">{freelance.skill}</p>
                  
                  <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-50">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400 text-[10px]">★</span>
                      <span className="text-[11px] font-bold text-gray-700">{freelance.rating}</span>
                    </div>
                    <span className="text-[9px] text-gray-400">({freelance.reviews} งาน)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>

        {/* 🧭 Bottom Nav (อัปเดตสถานะ Active ที่หน้าแรก) */}
        <div className="fixed bottom-0 w-full sm:max-w-2xl md:max-w-3xl bg-white/95 backdrop-blur-md border-t border-gray-100 px-8 py-4 flex justify-between items-center shadow-[0_-4px_25px_rgba(0,0,0,0.06)] rounded-t-[2.5rem] z-50">
           {/* ✅ Active: หน้าแรก */}
           <div className="flex flex-col items-center gap-1 scale-110">
             <span className="text-xl">🏠</span>
             <span className="text-[10px] font-bold text-[#EE4D2D]">หน้าแรก</span>
             <div className="w-1.5 h-1.5 bg-[#EE4D2D] rounded-full shadow-sm"></div>
           </div>
           
           <button onClick={() => router.push('/services')} className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity"><span className="text-xl">🛠️</span><span className="text-[10px] font-bold text-gray-500">บริการ</span></button>
           <button onClick={() => router.push('/win-online')} className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity"><span className="text-xl">📋</span><span className="text-[10px] font-bold text-gray-500">ด่วนนน</span></button>
           <button onClick={() => router.push('/history')} className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity"><span className="text-xl">📜</span><span className="text-[10px] font-bold text-gray-500">ประวัติ</span></button>
           <button onClick={() => router.push('/profile/edit')} className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity"><span className="text-xl">👤</span><span className="text-[10px] font-bold text-gray-500">ฉัน</span></button>
        </div>

        <style dangerouslySetInnerHTML={{__html: `
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}} />
      </div>
    </div>
  );
}

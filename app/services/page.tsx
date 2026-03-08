'use client';

import { useState, Suspense, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// ── Soft Shopee Palette ─────────────────────────────────────────
const themePalette = {
  primaryOrange: '#F05D40', 
  lightOrange: '#FF8769',   
  bgGray: '#F9FAFB',        
};

// 🌟 หมวดหมู่บริการ 🌟
const categories = [
  { id: 'all', title: 'ทั้งหมด', icon: '🌟' },
  { id: 'aircon', title: 'ล้างแอร์/ซ่อมแอร์', icon: '❄️' },
  { id: 'cleaning', title: 'แม่บ้าน', icon: '🧹' },
  { id: 'transport', title: 'รถขนส่ง', icon: '🚚' },
  { id: 'others', title: 'ทั่วไป', icon: '✨' },
];

// 🌟 Mock Data: รายชื่อผู้เชี่ยวชาญ (ข้อมูลจำลอง) 🌟
const mockProviders = [
  { id: '1', name: 'ลุงชม ช่างแอร์/เครื่องใช้ไฟฟ้า', category: 'aircon', rating: 4.9, reviews: 120, price: 500, location: 'ปากน้ำประแส', avatar: '👨‍🔧', isVerified: true },
  { id: '2', name: 'ป้าศรี รับจ้างทำความสะอาดบ้าน', category: 'cleaning', rating: 4.8, reviews: 85, price: 300, location: 'ปากน้ำประแส', avatar: '👩‍🍳', isVerified: true },
  { id: '3', name: 'พี่เอก รถกระบะรับจ้างขนของ', category: 'transport', rating: 4.9, reviews: 200, price: 400, location: 'แกลง', avatar: '🚚', isVerified: true },
  { id: '4', name: 'น้องเมย์ รับสอนการบ้านเด็ก', category: 'others', rating: 4.7, reviews: 50, price: 150, location: 'ปากน้ำประแส', avatar: '👩‍🏫', isVerified: false },
];

function StarDisplay({ rating }: { rating: number }) {
  const r = Math.round(rating || 0);
  return (
    <span className="text-yellow-400 text-sm">
      {'★'.repeat(r)}{'☆'.repeat(5 - r)}
      <span className="text-gray-400 text-xs ml-1">{(rating || 0).toFixed(1)}</span>
    </span>
  );
}

function ServicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultCat = searchParams.get('cat') || 'all';
  
  const [activeCategory, setActiveCategory] = useState(defaultCat);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('rating');

  useEffect(() => {
    if (searchParams.get('cat')) {
      setActiveCategory(searchParams.get('cat') as string);
    }
  }, [searchParams]);

  // คัดกรองและเรียงลำดับข้อมูล
  const filteredProviders = useMemo(() => {
    let result = [...mockProviders];
    
    if (activeCategory !== 'all') {
      result = result.filter(p => p.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.location.toLowerCase().includes(q));
    }

    if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'reviews') {
      result.sort((a, b) => b.reviews - a.reviews);
    }

    return result;
  }, [activeCategory, searchQuery, sortBy]);

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: themePalette.bgGray }}>
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* ── Header ── */}
      <header className="pt-10 pb-6 px-4 shadow-sm relative overflow-hidden rounded-b-[32px]"
        style={{ background: `linear-gradient(180deg, ${themePalette.primaryOrange} 0%, ${themePalette.lightOrange} 100%)` }}>
        
        <div className="max-w-xl mx-auto space-y-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm hover:bg-white/30 transition-colors">
                ❮
              </button>
              <h1 className="text-white text-xl font-black drop-shadow-md tracking-tight flex items-center gap-2">
                จงเจริญ 🌟
              </h1>
            </div>
            <button 
              onClick={() => router.push('/services/new')}
              className="bg-white text-[#F05D40] text-xs font-bold px-3 py-2 rounded-full shadow-md active:scale-95 transition-transform"
            >
              + ลงประกาศ
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <span className="text-gray-400">🔍</span>
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหา ช่างไฟ, แม่บ้าน, บริเวณใกล้เคียง..." 
              className="w-full py-3 pl-12 pr-4 rounded-xl shadow-inner focus:outline-none text-gray-800 text-sm border-2 border-transparent focus:border-white bg-white/95 backdrop-blur-sm"
            />
          </div>

          {/* Promo Banner */}
          <p className="text-white/90 text-xs font-medium text-center bg-white/10 py-2 rounded-lg backdrop-blur-md border border-white/20">
            ✅ จ้างผ่านเรา ปลอดภัย 100% พร้อมลุ้นรางวัลทุกงวด!
          </p>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-3 mt-4 space-y-4">
        {/* ── Category Pills ── */}
        <div className="flex overflow-x-auto gap-2 pb-2 snap-x snap-mandatory scroll-smooth hide-scrollbar px-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap snap-start transition-all shadow-sm border
                ${activeCategory === cat.id 
                  ? 'bg-[#F05D40] text-white border-[#F05D40] shadow-orange-200' 
                  : 'bg-white text-gray-600 border-gray-100 hover:bg-orange-50 hover:text-orange-500'}`}
            >
              <span className="text-sm">{cat.icon}</span>
              {cat.title}
            </button>
          ))}
        </div>

        {/* ── Filter / Sort Bar ── */}
        <div className="flex justify-between items-center px-1">
          <span className="text-xs font-bold text-gray-500">พบ {filteredProviders.length} บริการ</span>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#F05D40] shadow-sm"
          >
            <option value="rating">⭐ คะแนนสูงสุด</option>
            <option value="reviews">🏆 รีวิวมากสุด</option>
            <option value="price_asc">฿ ราคาต่ำ-สูง</option>
            <option value="price_desc">฿ ราคาสูง-ต่ำ</option>
          </select>
        </div>

        {/* ── Providers List ── */}
        <div className="space-y-3">
          {filteredProviders.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100 mt-6">
              <span className="text-6xl mb-4 opacity-50">🔍</span>
              <h3 className="text-gray-800 font-bold mb-1">ไม่พบผู้ให้บริการ</h3>
              <p className="text-xs text-gray-400">ลองเปลี่ยนหมวดหมู่หรือคำค้นหาดูนะคะ</p>
            </div>
          ) : (
            filteredProviders.map((provider) => (
              <div 
                key={provider.id} 
                onClick={() => router.push(`/services/${provider.id}`)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4 hover:border-orange-300 hover:shadow-md transition-all group cursor-pointer"
              >
                {/* Avatar */}
                <div className="w-16 h-16 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center text-3xl border border-orange-200 shrink-0 relative">
                  {provider.avatar}
                  {provider.isVerified && (
                    <span className="absolute -bottom-1 -right-1 bg-green-500 text-white text-[8px] px-1 py-0.5 rounded-full border-2 border-white shadow-sm font-bold flex items-center gap-0.5">
                      ✓ ยืนยัน
                    </span>
                  )}
                </div>
                
                {/* Info */}
                <div className="flex-1 flex flex-col justify-center space-y-1.5">
                  <h3 className="text-sm font-bold text-gray-800 leading-tight group-hover:text-[#F05D40] transition-colors">
                    {provider.name}
                  </h3>
                  
                  <div className="flex items-center gap-3 text-[10px] font-medium text-gray-500">
                    <span className="flex items-center gap-0.5 text-amber-500">
                      ⭐ {provider.rating} <span className="text-gray-400">({provider.reviews})</span>
                    </span>
                    <span className="flex items-center gap-0.5">
                      📍 {provider.location}
                    </span>
                  </div>

                  {/* Rating & Action */}
                  <div className="mt-2">
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-black text-[#F05D40]">
                        เริ่มต้น ฿{provider.price.toLocaleString()}
                      </span>
                      <button className="bg-orange-50 text-[#F05D40] text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-[#F05D40] hover:text-white transition-colors">
                        จ้างงาน
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* 🛠️ Bottom Nav (อัปเดตใหม่ให้ตรงกับ Home Page) 🛠️ */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 z-[100] shadow-[0_-5px_20px_rgba(0,0,0,0.05)] pb-safe">
        <Link href="/" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-orange-400 transition-colors">
          <span className="text-xl">🏠</span>
          <span className="text-[10px]">หน้าแรก</span>
        </Link>
        <Link href="/news" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-orange-400 transition-colors">
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

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#F05D40] font-bold">กำลังโหลดข้อมูล...</div>}>
      <ServicesContent />
    </Suspense>
  );
}

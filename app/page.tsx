'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// ── Types ──────────────────────────────────────────────────────
interface ServiceCategory {
  id: string;
  title: string;
  icon: string;
  bgColor: string;
}

interface Professional {
  id: string;
  full_name: string;
  avatar_url?: string;
  service_type: string;
  rating: number;
  review_count: number;
  starting_price: number;
  is_verified: boolean;
}

// ── Soft Shopee Palette ─────────────────────────────────────────
const themePalette = {
  primaryOrange: '#F05D40', 
  lightOrange: '#FF8769',   
  bgGray: '#F9FAFB',        
  textDark: '#1F2937',      
};

const categories: ServiceCategory[] = [
  { id: 'electrician', title: 'ช่างไฟฟ้า', icon: '⚡', bgColor: 'bg-orange-50' },
  { id: 'cleaning', title: 'แม่บ้าน', icon: '🧹', bgColor: 'bg-orange-50' },
  { id: 'plumbing', title: 'ช่างประปา', icon: '💧', bgColor: 'bg-orange-50' },
  { id: 'mechanic', title: 'ช่างยนต์', icon: '🛠️', bgColor: 'bg-orange-50' },
  { id: 'construction', title: 'ก่อสร้าง', icon: '🏗️', bgColor: 'bg-orange-50' },
  { id: 'massage', title: 'นวดแผนไทย', icon: '💆', bgColor: 'bg-orange-50' },
];

export default function HomePage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchPros = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, mode, rating, review_count')
        .eq('mode', 'provider')
        .limit(4);
      
      if (data) {
        const mappedData = data.map(item => ({
          ...item,
          service_type: 'ผู้เชี่ยวชาญ',
          starting_price: 350,
          is_verified: true,
          rating: 4.8,
          review_count: 42
        }));
        setProfessionals(mappedData as any);
      }
      setLoading(false);
    };
    fetchPros();
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim().length < 3) return; 
    setIsSearching(true);
    console.log("AI กำลังวิเคราะห์คำว่า:", searchQuery);
    setTimeout(() => {
      setIsSearching(false);
    }, 2000); 
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: themePalette.bgGray }}>
      
      {/* ── Hero Section: Soft Shopee Orange Gradient ── */}
      <section className="pt-12 pb-20 px-4 shadow-sm relative overflow-hidden"
        style={{ background: `linear-gradient(180deg, ${themePalette.primaryOrange} 0%, ${themePalette.lightOrange} 100%)` }}>
        
        <div className="max-w-xl mx-auto text-center relative z-10 space-y-6">
          <div className="flex flex-col items-center justify-center space-y-3">
            {/* 🌟 แสดงรูปโลโก้แทนตัวหนังสือ 🌟 */}
            {/* เจมตั้งค่าให้ดึงรูป logo.png มาแสดงตรงนี้ค่ะ ปรับขนาดให้พอดีเด่นๆ เลย */}
            <div className="bg-white/90 p-3 rounded-[24px] shadow-lg inline-block backdrop-blur-sm border border-white/50">
               <img 
                 src="/logo.png" 
                 alt="จงเจริญ โลโก้" 
                 className="h-20 w-auto object-contain drop-shadow-sm" 
                 onError={(e) => {
                   // เผื่อบีสามอัปโหลดไฟล์เป็น .jpg เจมทำตัวดักไว้ให้มันเปลี่ยนนามสกุลอัตโนมัติค่ะ
                   e.currentTarget.src = "/logo.jpg";
                 }}
               />
            </div>
            <p className="text-white/95 text-sm font-bold tracking-wide">
              จงเจริญไปด้วยกัน • ผู้เชี่ยวชาญใกล้คุณ
            </p>
          </div>

          {/* 🌟 AI Search Agent Input 🌟 */}
          <div className="relative max-w-md mx-auto">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <span className="text-lg animate-pulse">✨</span>
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="บอก AI ว่าต้องการให้ช่วยอะไร..." 
              className="w-full py-4 pl-12 pr-24 rounded-lg shadow-inner focus:outline-none text-gray-800 text-sm border-2 border-transparent focus:border-white bg-white/95 backdrop-blur-sm"
            />
            <button 
              onClick={handleSearch}
              disabled={searchQuery.trim().length < 3 || isSearching}
              className={`absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-md text-white text-xs font-bold shadow-sm transition-all 
                ${searchQuery.trim().length < 3 || isSearching ? 'bg-orange-300/50 cursor-not-allowed' : 'bg-[#F05D40] hover:bg-[#D95339] hover:scale-105'}`}
            >
              {isSearching ? '⏳...' : 'ค้นหา'}
            </button>
          </div>
        </div>
      </section>

      <main className="max-w-xl mx-auto px-2 space-y-4 -mt-6 relative z-20">
        
        {/* ── Categories Grid ── */}
        <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="grid grid-cols-3 gap-y-6">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/services?cat=${cat.id}`} className="flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  {cat.icon}
                </div>
                <span className="text-[11px] font-medium text-gray-700">{cat.title}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Featured Professionals ── */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-2 bg-white py-3 border-b border-gray-100 rounded-t-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: themePalette.primaryOrange }}>
              ผู้เชี่ยวชาญยอดนิยม
            </h2>
            <Link href="/services" className="text-xs text-gray-400">ดูทั้งหมด {' >'}</Link>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {loading ? (
              [1,2,3,4].map(i => <div key={i} className="h-52 bg-white animate-pulse rounded-xl" />)
            ) : (
              professionals.map((pro) => (
                <div key={pro.id} className="bg-white shadow-sm hover:shadow-md transition-shadow border border-gray-100 hover:border-[#F05D40] rounded-xl overflow-hidden">
                  <div className="aspect-square bg-gray-50 relative">
                    {pro.avatar_url ? (
                      <img src={pro.avatar_url} alt={pro.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-200 text-5xl font-black">👤</div>
                    )}
                    {pro.is_verified && (
                      <div className="absolute top-0 left-0 text-white px-2 py-1 text-[9px] font-bold rounded-br-lg" style={{ backgroundColor: themePalette.primaryOrange }}>
                        Mall
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-[11px] text-gray-800 line-clamp-2 leading-snug font-medium">{pro.full_name}</p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm font-bold" style={{ color: themePalette.primaryOrange }}>฿{pro.starting_price}</span>
                      <span className="text-[9px] text-gray-400">⭐ {pro.rating}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* 🛠️ Bottom Nav (Shopee Style) + z-[100] 🛠️ */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 z-[100] shadow-[0_-5px_20px_rgba(0,0,0,0.05)] pb-safe">
        <Link href="/" className="flex flex-col items-center gap-0.5 font-bold" style={{ color: themePalette.primaryOrange }}>
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
        <Link href="/dashboard" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-orange-400 transition-colors">
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

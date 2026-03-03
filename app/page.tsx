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

// ── Shopee Inspired Palette ──────────────────────────────────────
const shopeePalette = {
  orange: '#EE4D2D',      // สีส้ม Shopee ของแท้ค๊ะ
  lightOrange: '#FF5722',  // ส้มสว่างสำหรับไล่เฉด
  bgGray: '#F5F5F5',      // เทาอ่อนพื้นหลังสไตล์แอปขายของ
  deepBlack: '#212121',   // ดำเข้มสำหรับตัวหนังสือ
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

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: shopeePalette.bgGray }}>
      
      {/* ── Hero Section: Shopee Orange Gradient ── */}
      <section className="pt-12 pb-20 px-4 shadow-md relative overflow-hidden"
        style={{ background: `linear-gradient(180deg, ${shopeePalette.orange} 0%, ${shopeePalette.lightOrange} 100%)` }}>
        
        <div className="max-w-xl mx-auto text-center relative z-10 space-y-6">
          <div className="space-y-1">
            {/* ตัวหนังสือ "จงเจริญ" มีมิติด้วย Drop Shadow */}
            <h1 className="text-white text-4xl font-black tracking-tighter drop-shadow-lg">
              จงเจริญ
            </h1>
            <p className="text-white/90 text-sm font-bold">
              จงเจริญไปด้วยกัน • ผู้เชี่ยวชาญใกล้คุณ
            </p>
          </div>

          {/* Search Bar สไตล์แอป Shopee */}
          <div className="relative max-w-md mx-auto">
            <input 
              type="text" 
              placeholder="ค้นหาช่าง หรือบริการที่คุณต้องการ..." 
              className="w-full py-3.5 px-6 rounded-sm shadow-inner focus:outline-none text-gray-800 text-sm border-2 border-transparent focus:border-[#EE4D2D]"
            />
            <button className="absolute right-1 top-1 text-white px-4 py-2 rounded-sm shadow-md transition-opacity hover:opacity-90"
               style={{ backgroundColor: shopeePalette.orange }}>
              🔍
            </button>
          </div>
        </div>
      </section>

      <main className="max-w-xl mx-auto px-2 space-y-4 -mt-4">
        
        {/* ── Categories Grid ── */}
        <section className="bg-white rounded-sm p-4 shadow-sm">
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
          <div className="flex items-center justify-between px-2 bg-white py-3 border-b border-gray-100">
            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: shopeePalette.orange }}>
              ผู้เชี่ยวชาญยอดนิยม
            </h2>
            {/* แก้ไขสัญลักษณ์ > เป็น {' >'} เพื่อไม่ให้ Error ค๊ะ */}
            <Link href="/services" className="text-xs text-gray-400">ดูทั้งหมด {' >'}</Link>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {loading ? (
              [1,2,3,4].map(i => <div key={i} className="h-52 bg-white animate-pulse" />)
            ) : (
              professionals.map((pro) => (
                <div key={pro.id} className="bg-white shadow-sm hover:shadow-md transition-shadow border border-transparent hover:border-[#EE4D2D]">
                  <div className="aspect-square bg-gray-50 relative">
                    {pro.avatar_url ? (
                      <img src={pro.avatar_url} alt={pro.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-200 text-5xl font-black">👤</div>
                    )}
                    {pro.is_verified && (
                      <div className="absolute top-0 left-0 bg-[#EE4D2D] text-white px-1.5 py-0.5 text-[9px] font-bold">
                        Mall
                      </div>
                    )}
                  </div>
                  <div className="p-2 space-y-1">
                    <p className="text-[11px] text-gray-800 line-clamp-2 leading-snug">{pro.full_name}</p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm font-bold" style={{ color: shopeePalette.orange }}>฿{pro.starting_price}</span>
                      <span className="text-[9px] text-gray-400">ขายแล้ว 1.2พัน</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Bottom Nav: Shopee Style */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 z-50 shadow-lg">
        <Link href="/" className="flex flex-col items-center gap-0.5 font-bold" style={{ color: shopeePalette.orange }}>
          <span className="text-xl">🏠</span>
          <span className="text-[10px]">หน้าแรก</span>
        </Link>
        <Link href="/services" className="flex flex-col items-center gap-0.5 text-gray-400">
          <span className="text-xl">🔍</span>
          <span className="text-[10px]">ค้นหา</span>
        </Link>
        <Link href="/coupons" className="flex flex-col items-center gap-0.5 text-gray-400">
          <span className="text-xl">🎟️</span>
          <span className="text-[10px]">รางวัล</span>
        </Link>
        <Link href="/dashboard" className="flex flex-col items-center gap-0.5 text-gray-400">
          <span className="text-xl">📋</span>
          <span className="text-[10px]">งาน</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-0.5 text-gray-400">
          <span className="text-xl">👤</span>
          <span className="text-[10px]">ฉัน</span>
        </Link>
      </nav>
    </div>
  );
}

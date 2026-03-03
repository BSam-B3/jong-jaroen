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

// ── Soft Shopee Palette (ส้ม Shopee ที่ปรับให้นุ่มนวล ไม่แสบตา) ──
const themePalette = {
  primaryOrange: '#F05D40', // ส้มที่ลดความจัดจ้านลง สบายตาขึ้น
  lightOrange: '#FF8769',   // ส้มสว่างสำหรับไล่เฉดให้ดูฟุ้งๆ
  bgGray: '#F9FAFB',        // พื้นหลังเทาอมขาวสะอาดตา
  textDark: '#1F2937',      // สีข้อความหลัก
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
    <div className="min-h-screen pb-24" style={{ backgroundColor: themePalette.bgGray }}>
      
      {/* ── Hero Section: Soft Shopee Orange Gradient ── */}
      <section className="pt-12 pb-20 px-4 shadow-sm relative overflow-hidden"
        style={{ background: `linear-gradient(180deg, ${themePalette.primaryOrange} 0%, ${themePalette.lightOrange} 100%)` }}>
        
        <div className="max-w-xl mx-auto text-center relative z-10 space-y-6">
          <div className="space-y-1">
            {/* ตัวหนังสือมีมิติด้วย drop-shadow */}
            <h1 className="text-white text-4xl font-black tracking-tighter drop-shadow-md">
              จงเจริญ
            </h1>
            <p className="text-white/95 text-sm font-bold">
              จงเจริญไปด้วยกัน • ผู้เชี่ยวชาญใกล้คุณ
            </p>
          </div>

          {/* Search Bar สไตล์แอป Shopee */}
          <div className="relative max-w-md mx-auto">
            <input 
              type="text" 
              placeholder="ค้นหาช่าง หรือบริการที่คุณต้องการ..." 
              className="w-full py-3.5 px-6 rounded-md shadow-inner focus:outline-none text-gray-800 text-sm border-2 border-transparent focus:border-[#F05D40]"
            />
            <button className="absolute right-1.5 top-1.5 text-white px-4 py-2 rounded-md shadow-sm transition-opacity hover:opacity-90"
               style={{ backgroundColor: themePalette.primaryOrange }}>
              🔍
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
            {/* แก้ปัญหา Vercel Error ที่เกิดจากสัญลักษณ์ > ด้วยการใช้ {' >'} */}
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

      {/* 🛠️ Bottom Nav (Shopee Style) + ใส่ z-[100] แก้ปัญหาโดนบัง 🛠️ */}
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

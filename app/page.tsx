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

// ── Golden Fortune Palette (ส้มทองพรีเมียมสไตล์ Fastwork) ──────────
const goldenPalette = {
  softGold: '#F8D397',     // ส้มทองอ่อน ไล่เฉดนุ่มนวล
  auspiciousGold: '#D9A056', // ส้มทองเข้มมงคล
  radiantGold: '#C89B3A',   // ทองอร่าม สำหรับจุดเน้น
  creamyGold: '#FFF9F0',    // ขาวครีมนวลทอง พื้นหลังสบายตา
  deepSlate: '#2D3A4F',    // เทาครามเข้ม สำหรับตัวอักษรให้ดูแพง
};

const categories: ServiceCategory[] = [
  { id: 'electrician', title: 'ช่างไฟฟ้า', icon: '⚡', bgColor: 'bg-orange-50' },
  { id: 'cleaning', title: 'แม่บ้าน', icon: '🧹', bgColor: 'bg-amber-50' },
  { id: 'plumbing', title: 'ช่างประปา', icon: '💧', bgColor: 'bg-yellow-50' },
  { id: 'mechanic', title: 'ช่างยนต์', icon: '🛠️', bgColor: 'bg-stone-50' },
  { id: 'construction', title: 'ก่อสร้าง', icon: '🏗️', bgColor: 'bg-orange-50' },
  { id: 'massage', title: 'นวดแผนไทย', icon: '💆', bgColor: 'bg-yellow-50' },
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
          service_type: 'ผู้เชี่ยวชาญระดับโปร',
          starting_price: 350,
          is_verified: true,
          rating: 5.0,
          review_count: 15
        }));
        setProfessionals(mappedData as any);
      }
      setLoading(false);
    };
    fetchPros();
  }, []);

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: goldenPalette.creamyGold }}>
      
      {/* ── Hero Section: Golden Fortune Gradient ── */}
      <section className="pt-16 pb-24 px-4 rounded-b-[50px] shadow-2xl relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${goldenPalette.softGold} 0%, ${goldenPalette.auspiciousGold} 100%)` }}>
        
        {/* ตกแต่งพื้นหลังให้ดูมีมิติแบบเว็บสมัยใหม่ */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        
        <div className="max-w-xl mx-auto text-center relative z-10 space-y-8">
          <div className="space-y-3">
            <h1 className="text-white text-4xl font-black tracking-tighter drop-shadow-lg">
              จงเจริญ
            </h1>
            <p className="text-white/90 text-sm font-bold tracking-wide uppercase">
              Professional Experts • Near You
            </p>
          </div>

          {/* Search Bar สไตล์ Fastwork ที่บีสามต้องการ */}
          <div className="relative max-w-md mx-auto group">
            <input 
              type="text" 
              placeholder="ค้นหาบริการหรือผู้ช่วยที่คุณต้องการ..." 
              className="w-full py-5 px-8 rounded-2xl shadow-2xl focus:outline-none text-gray-800 text-sm transition-all focus:ring-4 focus:ring-white/20"
            />
            <button className="absolute right-3 top-3 text-white p-2.5 rounded-xl shadow-lg hover:scale-105 transition-transform"
              style={{ backgroundColor: goldenPalette.radiantGold }}>
              🔍
            </button>
          </div>
        </div>
      </section>

      <main className="max-w-xl mx-auto px-4 -mt-12 space-y-10 relative z-20">
        
        {/* ── Categories Section ── */}
        <section className="bg-white/90 backdrop-blur-md rounded-[32px] p-8 shadow-xl border border-white/50">
          <div className="grid grid-cols-3 gap-y-8 gap-x-4">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/services?cat=${cat.id}`} className="flex flex-col items-center gap-3 group">
                <div className={`w-16 h-16 ${cat.bgColor} rounded-[22px] flex items-center justify-center text-3xl shadow-sm group-hover:bg-white group-hover:shadow-md transition-all group-hover:-translate-y-1 border border-transparent group-hover:border-amber-100`}>
                  {cat.icon}
                </div>
                <span className="text-[12px] font-black text-gray-700 group-hover:text-amber-600 transition-colors">{cat.title}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Featured Pros Section ── */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black flex items-center gap-2" style={{ color: goldenPalette.deepSlate }}>
              <span className="w-2 h-6 rounded-full" style={{ backgroundColor: goldenPalette.radiantGold }}></span>
              ผู้เชี่ยวชาญยอดนิยม
            </h2>
            <Link href="/services" className="text-xs font-black uppercase tracking-wider" style={{ color: goldenPalette.radiantGold }}>See All →</Link>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {loading ? (
              [1,2,3,4].map(i => <div key={i} className="h-56 bg-white/50 animate-pulse rounded-[32px]" />)
            ) : (
              professionals.map((pro) => (
                <div key={pro.id} className="bg-white rounded-[32px] overflow-hidden shadow-lg border border-white hover:shadow-2xl transition-all hover:-translate-y-1">
                  <div className="aspect-[4/5] bg-gray-100 relative">
                    {pro.avatar_url ? (
                      <img src={pro.avatar_url} alt={pro.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-5xl font-black">👤</div>
                    )}
                    {pro.is_verified && (
                      <div className="absolute top-3 right-3 text-white p-1.5 rounded-full text-[10px] shadow-lg backdrop-blur-md border border-white/20"
                        style={{ backgroundColor: goldenPalette.radiantGold }}>
                        ✓
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <p className="text-sm font-black text-gray-800 truncate">{pro.full_name}</p>
                    <div className="flex items-center justify-between items-end">
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Starting at</p>
                        <p className="text-sm font-black" style={{ color: goldenPalette.radiantGold }}>฿{pro.starting_price}</p>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-black text-amber-500">
                        ⭐ {pro.rating}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ── Global Vision Banner ── */}
        <section className="rounded-[32px] p-8 text-center space-y-4 border border-white shadow-inner"
          style={{ background: `linear-gradient(135deg, ${goldenPalette.creamyGold} 0%, #FFF 100%)` }}>
          <h3 className="text-lg font-black" style={{ color: goldenPalette.deepSlate }}>ร่วมเป็นส่วนหนึ่งของสังคมจงเจริญ</h3>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            ไม่ว่าคุณจะอยู่ที่ไหน เราพร้อมเชื่อมต่อคุณกับผู้เชี่ยวชาญที่ดีที่สุด <br/>เพื่อสร้างโอกาสและความสำเร็จให้ทุกคน
          </p>
          <button className="px-8 py-3 rounded-2xl text-white text-xs font-black shadow-xl hover:opacity-90 transition-opacity"
            style={{ backgroundColor: goldenPalette.radiantGold }}>
            สมัครสมาชิกเลย
          </button>
        </section>
      </main>

      {/* Bottom Nav: Clean & High-end */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-100 flex justify-around py-4 z-50 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <Link href="/" className="flex flex-col items-center gap-1 font-black transition-colors" style={{ color: goldenPalette.radiantGold }}>
          <span className="text-xl">🏠</span>
          <span className="text-[10px] uppercase tracking-tighter">Home</span>
        </Link>
        <Link href="/services" className="flex flex-col items-center gap-1 text-gray-300 font-black hover:text-amber-500 transition-colors">
          <span className="text-xl">🔍</span>
          <span className="text-[10px] uppercase tracking-tighter">Search</span>
        </Link>
        <Link href="/coupons" className="flex flex-col items-center gap-1 text-gray-300 font-black hover:text-amber-500 transition-colors">
          <span className="text-xl">🎟️</span>
          <span className="text-[10px] uppercase tracking-tighter">Rewards</span>
        </Link>
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-gray-300 font-black hover:text-amber-500 transition-colors">
          <span className="text-xl">📋</span>
          <span className="text-[10px] uppercase tracking-tighter">Jobs</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-1 text-gray-300 font-black hover:text-amber-500 transition-colors">
          <span className="text-xl">👤</span>
          <span className="text-[10px] uppercase tracking-tighter">Profile</span>
        </Link>
      </nav>
    </div>
  );
}

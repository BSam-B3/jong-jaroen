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
  iconColor: string;
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

// ── New Muted Color Palette (Twilight Style) เพื่อความสบายตา ──────────
const twilightColors = {
  mutedOrange: '#E9C4A6', // ส้มฝุ่นอ่อน นุ่มนวล
  indigoBlue: '#4F5D75',  // สีคราม สบายตา
  mistyCream: '#FFFDF9',  // ขาวครีมนวล ลดแสงสะท้อน
  deepIndigo: '#2D3A4F',  // เทาครามเข้ม สำหรับตัวอักษร
};

const categories: ServiceCategory[] = [
  { id: 'electrician', title: 'ช่างไฟฟ้า', icon: '⚡', bgColor: 'bg-orange-100/50', iconColor: 'text-orange-600' },
  { id: 'cleaning', title: 'แม่บ้าน', icon: '🧹', bgColor: 'bg-blue-100/50', iconColor: 'text-blue-600' },
  { id: 'plumbing', title: 'ช่างประปา', icon: '💧', bgColor: 'bg-cyan-100/50', iconColor: 'text-cyan-600' },
  { id: 'mechanic', title: 'ช่างยนต์', icon: '🛠️', bgColor: 'bg-slate-100/50', iconColor: 'text-slate-600' },
  { id: 'construction', title: 'ก่อสร้าง', icon: '🏗️', bgColor: 'bg-amber-100/50', iconColor: 'text-amber-700' },
  { id: 'massage', title: 'นวดแผนไทย', icon: '💆', bgColor: 'bg-teal-100/50', iconColor: 'text-teal-700' },
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
          rating: 4.9,
          review_count: 28
        }));
        setProfessionals(mappedData as any);
      }
      setLoading(false);
    };
    fetchPros();
  }, []);

  return (
    // เปลี่ยนพื้นหลังหลักให้เป็นขาวครีมนวล สบายตา ลดแสงสะท้อน
    <div className="min-h-screen pb-24" style={{ backgroundColor: twilightColors.mistyCream, color: twilightColors.deepIndigo }}>
      
      {/* ── Hero Section: New Smooth Twilight Gradient เพื่อความนุ่มนวล ── */}
      {/* ใช้การไล่ระดับจากส้มฝุ่นอ่อนไปหาคราม เพื่อความนุ่มนวลและมีมิติ เหมือน image_18.png */}
      <section className="pt-16 pb-24 px-4 rounded-b-[50px] shadow-lg relative overflow-hidden border-b border-indigo-100/30"
        style={{ background: `linear-gradient(160deg, ${twilightColors.mutedOrange} 0%, ${twilightColors.indigoBlue} 100%)` }}>
        
        {/* ตกแต่งพื้นหลังให้ดูมีมิติแบบ "Twilight" */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl opacity-60" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-300/10 rounded-full -ml-16 -mb-16 blur-2xl opacity-40" />
        
        <div className="max-w-xl mx-auto text-center relative z-10 space-y-8">
          <div className="space-y-3">
            {/* ตัวหนังสือ "จงเจริญ" มีมิติด้วย Drop Shadow */}
            <h1 className="text-white text-5xl font-black tracking-tighter drop-shadow-[0_4px_4px_rgba(0,0,0,0.15)] opacity-95">
              จงเจริญ
            </h1>
            <p className="text-white/80 text-sm font-medium">
              จงเจริญไปด้วยกัน • ผู้เชี่ยวชาญใกล้คุณ • Near You
            </p>
          </div>

          {/* Search Bar สไตล์ Fastwork ปรับสีให้เข้าธีม */}
          <div className="relative max-w-md mx-auto group">
            <input 
              type="text" 
              placeholder="ค้นหาบริการหรือผู้เชี่ยวชาญที่คุณต้องการ..." 
              className="w-full py-5 px-8 rounded-2xl shadow-xl focus:outline-none text-gray-800 text-sm placeholder:text-gray-400"
              style={{ backgroundColor: 'white' }}
            />
            <button className="absolute right-3 top-3 text-white p-2.5 rounded-xl shadow-lg transition-colors"
               style={{ backgroundColor: twilightColors.indigoBlue }}>
              🔍
            </button>
          </div>
        </div>
      </section>

      <main className="max-w-xl mx-auto px-4 -mt-12 space-y-10 relative z-20">
        
        {/* ── Categories Section ── */}
        <section className="bg-white/90 backdrop-blur-sm rounded-[32px] p-8 shadow-xl border border-indigo-50/50">
          <div className="grid grid-cols-3 gap-y-8 gap-x-4">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/services?cat=${cat.id}`} className="flex flex-col items-center gap-3 group">
                <div className={`w-16 h-16 ${cat.bgColor} rounded-[22px] flex items-center justify-center text-3xl shadow-sm group-hover:scale-110 transition-transform`}>
                  {cat.icon}
                </div>
                <span className="text-[12px] font-black text-gray-700 group-hover:text-gray-900 transition-colors">{cat.title}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Featured Pros Section ── */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black flex items-center gap-2" style={{ color: twilightPalette.deepIndigo }}>
              <span className="w-2 h-6 rounded-full" style={{ backgroundColor: twilightPalette.roseDust }}></span>
              ผู้เชี่ยวชาญยอดนิยม
            </h2>
            <Link href="/services" className="text-xs font-black transition-colors" style={{ color: twilightColors.indigoBlue }}>ดูทั้งหมด {' >'}</Link>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {loading ? (
              [1,2,3,4].map(i => <div key={i} className="h-56 bg-white/50 animate-pulse rounded-[32px]" />)
            ) : (
              professionals.map((pro) => (
                <div key={pro.id} className="bg-white/80 rounded-[32px] overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl transition-all hover:-translate-y-1">
                  <div className="aspect-[4/5] bg-gray-100 relative">
                    {pro.avatar_url ? (
                      <img src={pro.avatar_url} alt={pro.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-5xl font-black">👤</div>
                    )}
                    {pro.is_verified && (
                      <div className="absolute top-3 right-3 bg-blue-500 text-white p-1.5 rounded-full text-[10px] shadow-lg">
                        ✓
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-1">
                    <p className="text-sm font-black text-gray-800 truncate">{pro.full_name}</p>
                    <p className="text-[10px] text-gray-500">{pro.service_type}</p>
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                      <span className="text-[11px] font-black" style={{ color: twilightColors.indigoBlue }}>฿{pro.starting_price}+</span>
                      <div className="flex items-center gap-0.5 text-[10px] text-amber-500 font-medium">
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
        <section className="bg-indigo-50/50 rounded-[32px] p-8 text-center space-y-4 border border-indigo-100 shadow-inner">
          <h3 className="text-lg font-black text-gray-900">ร่วมเป็นส่วนหนึ่งของสังคมจงเจริญ</h3>
          <p className="text-xs text-gray-600 font-medium leading-relaxed">
            ไม่ว่าคุณจะอยู่ที่ไหน เราพร้อมเชื่อมต่อคุณกับผู้เชี่ยวชาญที่ดีที่สุด <br/>เพื่อสร้างโอกาสและความสำเร็จให้ทุกคน
          </p>
          <button className="px-8 py-3 rounded-2xl text-white text-xs font-black shadow-xl transition-opacity hover:opacity-90"
            style={{ backgroundColor: twilightColors.indigoBlue }}>
            สมัครสมาชิกเลย
          </button>
        </section>
      </main>

      {/* 🛠️ Bottom Nav (Shopee Style) ที่ได้รับการแก้ไขปัญหาเมนูถูกทับค๊ะ 🛠️ */}
      {/* เจมเพิ่ม z-[100] เพื่อบังคับให้เมนูลอยอยู่ชั้นบนสุดเสมอ แก้ Error จาก image_8690f0.jpg */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-indigo-100 flex justify-around py-3 z-[100] pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <Link href="/" className="flex flex-col items-center gap-1 font-black transition-colors" style={{ color: twilightColors.indigoBlue }}>
          <span className="text-xl">🏠</span>
          <span className="text-[10px] uppercase tracking-tighter">หน้าหลัก</span>
        </Link>
        <Link href="/services" className="flex flex-col items-center gap-1 text-gray-400 text-[10px] transition-colors hover:text-indigo-400">
          <span className="text-xl">🔍</span>
          <span className="text-[10px] uppercase tracking-tighter">ค้นหา</span>
        </Link>
        <Link href="/coupons" className="flex flex-col items-center gap-1 text-gray-400 text-[10px] transition-colors hover:text-indigo-400">
          <span className="text-xl">🎟️</span>
          <span className="text-[10px] uppercase tracking-tighter">รางวัล</span>
        </Link>
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-gray-400 text-[10px] transition-colors hover:text-indigo-400">
          <span className="text-lg leading-none">📋</span>
          <span className="text-[10px] uppercase tracking-tighter">งาน</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-1 text-gray-400 text-[10px] transition-colors hover:text-indigo-400">
          <span className="text-xl">👤</span>
          <span className="text-[10px] uppercase tracking-tighter">โปรไฟล์</span>
        </Link>
      </nav>
    </div>
  );
}

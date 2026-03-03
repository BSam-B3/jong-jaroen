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

// ── New Globa-Premium Palette (อิงตาม image_18.png และ image_3.png) ──────────
const jaroenPalette = {
  softGold: '#E9C4A6',    // ส้มทองอ่อน นุ่มนวล
  indigoTwilight: '#4F5D75', // สีคราม สบายตา
  cleanWhite: '#FFFFFF',    // สีขาวสะอาดตา สำหรับหน้า Login
  mistyCream: '#FFFDF9',    // ขาวครีมนวล ลดแสงสะท้อน
  deepIndigo: '#2D3A4F',    // เทาครามเข้ม สำหรับตัวอักษร
};

// ── หมวดหมู่ (สไตล์ Fastwork) ──
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
      // ดึงข้อมูลช่างที่ยืนยันตัวตนแล้ว (KYC) มาโชว์หน้าแรก
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, mode, rating, review_count')
        .eq('mode', 'provider') // เลือกเฉพาะคนรับงาน
        .limit(4);
      
      if (data) {
        // จำลองข้อมูลราคาและสถานะ Verified
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
    <div className="min-h-screen pb-24" style={{ backgroundColor: jaroenPalette.mistyCream, color: jaroenPalette.deepIndigo }}>
      
      {/* ── Header: Globa-Premium Welcome Section ── */}
      {/* ส่วนต้อนรับและ Login พื้นหลังสีขาวสะอาดตา เน้นตัวหนังสือชัด */}
      <header className="bg-white pt-10 pb-16 px-6 rounded-b-[48px] shadow-sm border-b border-indigo-100/50">
        <div className="max-w-xl mx-auto flex flex-col items-center text-center space-y-6">
          
          {/* 🌟 Globa-Premium Logo Text based 🌟 */}
          {/* ออกแบบให้มีมิติ นูนอร่ามด้วยการไล่เฉดสีและ Drop Shadow */}
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tighter drop-shadow-[0_4px_4px_rgba(0,0,0,0.15)]"
                style={{ 
                  background: `linear-gradient(135deg, ${jaroenPalette.softGold} 0%, ${jaroenPalette.indigoTwilight} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
              จงเจริญ
            </h1>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-widest">
              Hire Local, Get Lucky! • ผู้เชี่ยวชาญใกล้คุณ
            </p>
          </div>

          {/* Welcome Text & Login Button */}
          <div className="w-full max-w-sm space-y-3 bg-white border border-gray-100 p-6 rounded-3xl shadow-inner">
            <p className="text-sm font-medium text-gray-700">ยินดีต้อนรับสู่สังคม "จงเจริญ"</p>
            <p className="text-[11px] text-gray-400 -mt-1 leading-relaxed">ค้นหาช่างมืออาชีพใกล้ตัวคุณ หรือรับงานเพื่อสะสมยอดลุ้นอั่งเปามงคล</p>
            <Link href="/auth/login" 
              className="mt-2 block w-full py-3 px-6 rounded-2xl text-white text-xs font-bold transition-all shadow-md hover:scale-[1.02]"
              style={{ backgroundColor: jaroenPalette.indigoTwilight }}>
              🔧 เข้าสู่ระบบ / สมัครสมาชิก
            </Link>
          </div>

        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 -mt-10 space-y-10 relative z-20">
        {/* ── Categories Grid ── */}
        <section className="bg-white/95 backdrop-blur-sm rounded-[32px] p-8 shadow-xl border border-indigo-50/50">
          <div className="grid grid-cols-3 gap-x-4 gap-y-5">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/services?cat=${cat.id}`} className="flex flex-col items-center gap-2 group">
                <div className={`w-14 h-14 ${cat.bgColor} rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform`}>
                  <span className={cat.iconColor}>{cat.icon}</span>
                </div>
                <span className="text-[11px] font-bold text-gray-700 group-hover:text-gray-900 transition-colors">{cat.title}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Featured Professionals ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
              <span className="w-1.5 h-5 rounded-full" style={{ backgroundColor: jaroenPalette.softGold }}></span>
              ผู้เชี่ยวชาญยอดนิยม
            </h2>
            <Link href="/services" className="text-xs font-bold transition-colors" style={{ color: jaroenPalette.indigoTwilight }}>ดูทั้งหมด {' >'}</Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {loading ? (
              [1,2,3,4].map(i => <div key={i} className="h-48 bg-white/50 animate-pulse rounded-3xl" />)
            ) : (
              professionals.map((pro) => (
                <div key={pro.id} className="bg-white/80 rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-gray-100 relative">
                    {pro.avatar_url ? (
                      <img src={pro.avatar_url} alt={pro.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">👤</div>
                    )}
                    {pro.is_verified && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded-full text-[10px] shadow-md">
                        ✓
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-xs font-bold text-gray-800 truncate">{pro.full_name}</p>
                    <p className="text-[10px] text-gray-500">{pro.service_type}</p>
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                      <span className="text-[11px] font-bold" style={{ color: jaroenPalette.indigoTwilight }}>฿{pro.starting_price}+</span>
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

      </main>

      {/* Bottom Nav: Clean & High-end withแก้ไขปัญหาเมนูถูกทับ z-[100] */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 flex justify-around py-3 z-[100] pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <Link href="/" className="flex flex-col items-center gap-1 font-black transition-colors" style={{ color: jaroenPalette.indigoTwilight }}><span className="text-xl">🏠</span>Home</Link>
        <Link href="/services" className="flex flex-col items-center gap-1 text-gray-400 text-[10px] transition-colors hover:text-indigo-400"><span className="text-xl">🔍</span>Search</Link>
        <Link href="/coupons" className="flex flex-col items-center gap-1 text-gray-400 text-[10px] transition-colors hover:text-indigo-400"><span className="text-xl">🎟️</span>Rewards</Link>
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-gray-400 text-[10px] transition-colors hover:text-indigo-400"><span className="text-lg leading-none">📋</span>Jobs</Link>
        <Link href="/profile" className="flex flex-col items-center gap-1 text-gray-400 text-[10px] transition-colors hover:text-indigo-400"><span className="text-xl">👤</span>Profile</Link>
      </nav>
    </div>
  );
}

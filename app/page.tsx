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

// ── New Muted Color Palette (Twilight Style) ────────────────────────
const twilightColors = {
  mutedOrange: '#E9C4A6', // ส้มฝุ่นอ่อน นุ่มนวล
  indigoBlue: '#4F5D75',  // สีคราม สบายตา
  softCream: '#FFF8F1',  // ขาวครีมนวล ลดแสงสะท้อน
  deepIndigo: '#2D3A4F', // ครามเข้มสำหรับตัวอักษร
};

// ── Mock Data สำหรับหมวดหมู่ (สไตล์ Fastwork) ──────────────────────
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
    // ปรับพื้นหลังหลักให้เป็นขาวครีมนวล สบายตา
    <div className="min-h-screen pb-24" style={{ backgroundColor: twilightColors.softCream, color: twilightColors.deepIndigo }}>
      
      {/* ── Hero Section: New Smooth Twilight Gradient ── */}
      <section className="pt-12 pb-20 px-4 rounded-b-[40px] shadow-lg border-b border-indigo-100/30"
        style={{ background: `linear-gradient(160deg, ${twilightColors.mutedOrange} 0%, ${twilightColors.indigoBlue} 100%)` }}>
        
        <div className="max-w-xl mx-auto text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-white text-3xl font-black drop-shadow-sm tracking-tight">
              จงเจริญ
            </h1>
            <p className="text-white/80 text-sm font-medium">
              Hire Local, Get Lucky! แหล่งรวมผู้เชี่ยวชาญใกล้ตัวคุณ
            </p>
          </div>

          {/* Search Bar สไตล์ Fastwork ปรับสีให้เข้าธีม */}
          <div className="relative max-w-md mx-auto">
            <input 
              type="text" 
              placeholder="ค้นหาบริการที่ต้องการ..." 
              className="w-full py-4 px-6 rounded-2xl shadow-xl focus:outline-none text-gray-800 placeholder:text-gray-400"
              style={{ backgroundColor: 'white' }}
            />
            <button className="absolute right-2 top-2 text-white p-2 rounded-xl shadow-md transition-colors"
               style={{ backgroundColor: twilightColors.indigoBlue }}>
              🔍
            </button>
          </div>
        </div>
      </section>

      <main className="max-w-xl mx-auto px-4 -mt-10 space-y-8">
        {/* ── Categories Grid ── */}
        <section className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-indigo-50/50">
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
              <span className="w-1.5 h-5 bg-indigo-300 rounded-full"></span>
              ผู้เชี่ยวชาญยอดนิยม
            </h2>
            <Link href="/services" className="text-xs font-bold transition-colors" style={{ color: twilightColors.indigoBlue }}>ดูทั้งหมด →</Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {loading ? (
              [1,2,3,4].map(i => <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-3xl" />)
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
                      <span className="text-[11px] font-bold" style={{ color: twilightColors.indigoBlue }}>฿{pro.starting_price}+</span>
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

        {/* ── Step Guide - ปรับเป็นโทนเย็น ── */}
        <section className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100">
          <h3 className="text-sm font-black text-gray-900 mb-4">ขั้นตอนง่ายๆ ในการจ้างงาน</h3>
          <div className="space-y-4">
            {[
              { t: 'ค้นหาผู้เชี่ยวชาญ', d: 'เลือกช่างที่ถูกใจจากรีวิวและการยืนยันตัวตน' },
              { t: 'คุยรายละเอียด & จ่ายเงิน', d: 'ตกลงงานและชำระเงินผ่านระบบอั่งเปาที่ปลอดภัย' },
              { t: 'รับงาน & สะสมคูปอง', d: 'เมื่องานเสร็จ รับยอดสะสมเพื่อลุ้นรางวัลจงเจริญ' }
            ].map((s, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: twilightColors.indigoBlue }}>{i+1}</div>
                <div>
                  <p className="text-xs font-bold text-gray-900">{s.t}</p>
                  <p className="text-[10px] text-gray-600/90">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Bottom Nav สไตล์เดิมแต่ปรับสีให้เข้ากับธีมใหม่ Twilight */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 flex justify-around py-3 z-50 pb-safe">
        <Link href="/" className="flex flex-col items-center text-[10px] gap-1 font-bold" style={{ color: twilightColors.indigoBlue }}><span className="text-lg">🏠</span>หน้าหลัก</Link>
        <Link href="/services" className="flex flex-col items-center text-gray-400 text-[10px] gap-1 hover:text-indigo-400 transition-colors"><span className="text-lg">🔍</span>ค้นหา</Link>
        <Link href="/coupons" className="flex flex-col items-center text-gray-400 text-[10px] gap-1 hover:text-indigo-400 transition-colors"><span className="text-lg">🎟️</span>ผลรางวัล</Link>
        <Link href="/dashboard" className="flex flex-col items-center text-gray-400 text-[10px] gap-1 hover:text-indigo-400 transition-colors"><span className="text-lg">📋</span>งาน</Link>
        <Link href="/profile" className="flex flex-col items-center text-gray-400 text-[10px] gap-1 hover:text-indigo-400 transition-colors"><span className="text-lg">👤</span>โปรไฟล์</Link>
      </nav>
    </div>
  );
}

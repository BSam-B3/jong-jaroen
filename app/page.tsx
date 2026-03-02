'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// ── Types ──────────────────────────────────────────────────────
interface ServiceCategory {
  id: string;
  title: string;
  icon: string;
  color: string;
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

// ── Mock Data สำหรับหมวดหมู่ (สไตล์ Fastwork) ──────────────────────
const categories: ServiceCategory[] = [
  { id: 'electrician', title: 'ช่างไฟฟ้า', icon: '⚡', color: 'bg-yellow-100' },
  { id: 'cleaning', title: 'แม่บ้าน', icon: '🧹', color: 'bg-blue-100' },
  { id: 'plumbing', title: 'ช่างประปา', icon: '💧', color: 'bg-cyan-100' },
  { id: 'mechanic', title: 'ช่างยนต์', icon: '🛠️', color: 'bg-gray-100' },
  { id: 'construction', title: 'ก่อสร้าง', icon: '🏗️', color: 'bg-orange-100' },
  { id: 'massage', title: 'นวดแผนไทย', icon: '💆', color: 'bg-green-100' },
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
        // จำลองข้อมูลราคาและสถานะ Verified (ในอนาคตดึงจาก DB จริง)
        const mappedData = data.map(item => ({
          ...item,
          service_type: 'ช่างมืออาชีพ',
          starting_price: 350,
          is_verified: true,
          rating: 5.0,
          review_count: 12
        }));
        setProfessionals(mappedData as any);
      }
      setLoading(false);
    };
    fetchPros();
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFDF9] pb-24">
      {/* ── Hero Section: Search & Welcome ── */}
      <section className="bg-gradient-to-br from-[#F9A825] to-[#D4AF37] pt-12 pb-20 px-4 rounded-b-[40px] shadow-lg">
        <div className="max-w-xl mx-auto text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-white text-3xl font-black drop-shadow-md">
              จงเจริญ
            </h1>
            <p className="text-amber-100 text-sm font-medium">
              Hire Local, Get Lucky! แหล่งรวมผู้เชี่ยวชาญใกล้ตัวคุณ
            </p>
          </div>

          {/* Search Bar สไตล์ Fastwork */}
          <div className="relative max-w-md mx-auto">
            <input 
              type="text" 
              placeholder="ค้นหาบริการที่ต้องการ..." 
              className="w-full py-4 px-6 rounded-2xl shadow-xl focus:outline-none text-gray-800"
            />
            <button className="absolute right-2 top-2 bg-[#F9A825] text-white p-2 rounded-xl shadow-md">
              🔍
            </button>
          </div>
        </div>
      </section>

      <main className="max-w-xl mx-auto px-4 -mt-10 space-y-8">
        {/* ── Categories Grid ── */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-amber-50">
          <div className="grid grid-cols-3 gap-4">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/services?cat=${cat.id}`} className="flex flex-col items-center gap-2 group">
                <div className={`w-14 h-14 ${cat.color} rounded-2xl flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform`}>
                  {cat.icon}
                </div>
                <span className="text-[11px] font-bold text-gray-600">{cat.title}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Featured Professionals ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-[#F9A825] rounded-full"></span>
              ผู้เชี่ยวชาญยอดนิยม
            </h2>
            <Link href="/services" className="text-xs font-bold text-amber-600">ดูทั้งหมด →</Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {loading ? (
              [1,2,3,4].map(i => <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-3xl" />)
            ) : (
              professionals.map((pro) => (
                <div key={pro.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-gray-200 relative">
                    {pro.avatar_url ? (
                      <img src={pro.avatar_url} alt={pro.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">👤</div>
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
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-bold text-[#F9A825]">฿{pro.starting_price}+</span>
                      <div className="flex items-center gap-0.5 text-[10px] text-gray-400">
                        <span>⭐</span> {pro.rating}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ── Step Guide ── */}
        <section className="bg-amber-50 rounded-3xl p-6 border border-amber-100">
          <h3 className="text-sm font-black text-amber-900 mb-4">ขั้นตอนง่ายๆ ในการจ้างงาน</h3>
          <div className="space-y-4">
            {[
              { t: 'ค้นหาผู้เชี่ยวชาญ', d: 'เลือกช่างที่ถูกใจจากรีวิวและการยืนยันตัวตน' },
              { t: 'คุยรายละเอียด & จ่ายเงิน', d: 'ตกลงงานและชำระเงินผ่านระบบอั่งเปาที่ปลอดภัย' },
              { t: 'รับงาน & สะสมคูปอง', d: 'เมื่องานเสร็จ รับยอดสะสมเพื่อลุ้นรางวัลจงเจริญ' }
            ].map((s, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-6 h-6 bg-[#F9A825] rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">{i+1}</div>
                <div>
                  <p className="text-xs font-bold text-amber-900">{s.t}</p>
                  <p className="text-[10px] text-amber-700/70">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Bottom Nav สไตล์เดิมแต่ปรับสีให้เข้ากับธีมใหม่ */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-3 z-50 pb-safe">
        <Link href="/" className="flex flex-col items-center text-[10px] gap-1 font-bold" style={{ color: '#F9A825' }}><span className="text-lg">🏠</span>หน้าหลัก</Link>
        <Link href="/services" className="flex flex-col items-center text-gray-400 text-[10px] gap-1"><span className="text-lg">🔍</span>ค้นหา</Link>
        <Link href="/coupons" className="flex flex-col items-center text-gray-400 text-[10px] gap-1"><span className="text-lg">🎟️</span>ผลรางวัล</Link>
        <Link href="/dashboard" className="flex flex-col items-center text-gray-400 text-[10px] gap-1"><span className="text-lg">📋</span>งาน</Link>
        <Link href="/profile" className="flex flex-col items-center text-gray-400 text-[10px] gap-1"><span className="text-lg">👤</span>โปรไฟล์</Link>
      </nav>
    </div>
  );
}

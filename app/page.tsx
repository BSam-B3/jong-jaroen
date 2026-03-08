'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// 🌟 หมวดหมู่บริการ 🌟
const categories = [
  { id: 'aircon', title: 'ล้างแอร์', icon: '❄️' },
  { id: 'cleaning', title: 'แม่บ้าน', icon: '🧹' },
  { id: 'electrician', title: 'ช่างไฟ', icon: '⚡' },
  { id: 'plumbing', title: 'ประปา', icon: '💧' },
  { id: 'mechanic', title: 'ซ่อมรถ', icon: '🛠️' },
  { id: 'transport', title: 'ขนส่ง', icon: '🚚' },
  { id: 'moving', title: 'ย้ายบ้าน', icon: '📦' },
  { id: 'others', title: 'อื่นๆ', icon: '✨' },
];

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/services?q=${searchQuery}`);
    }
  };

  return (
    <div className="min-h-screen pb-28 max-w-md mx-auto bg-[#F4F6F8] relative selection:bg-orange-200">
      
      {/* ── Header & Hero Section ── */}
      <div className="bg-gradient-to-b from-[#F05D40] to-[#FF8769] px-5 pt-12 pb-7 rounded-b-[32px] shadow-sm relative z-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black text-white drop-shadow-sm tracking-wide">จงเจริญ 🌟</h1>
            <p className="text-white/90 text-sm font-medium mt-1">แอปพลิเคชันคู่ชุมชนปากน้ำประแส</p>
          </div>
          <button 
            onClick={() => router.push('/profile')} 
            className="w-11 h-11 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-xl backdrop-blur-md border border-white/30 transition-colors"
          >
            👤
          </button>
        </div>

        {/* Search Box */}
        <form onSubmit={handleSearch} className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="หาช่างแอร์, แม่บ้าน, คนช่วยยกของ..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl text-gray-800 text-sm font-medium focus:outline-none shadow-lg border-2 border-transparent focus:border-white bg-white/95 backdrop-blur-sm transition-all"
          />
        </form>
      </div>

      <main className="px-4 mt-6 space-y-5">
        
        {/* ── Quick Banners (ทางลัดหลัก) ── */}
        <div className="grid grid-cols-2 gap-3">
          <div
            onClick={() => router.push('/services')}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2 cursor-pointer active:scale-95 transition-transform hover:shadow-md hover:border-orange-200"
          >
            <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-xl mb-1">🛠️</div>
            <div>
              <h3 className="text-[15px] font-bold text-gray-800">จ้างช่าง/แม่บ้าน</h3>
              <p className="text-[11px] text-gray-500 font-medium">ค้นหาบริการมืออาชีพ</p>
            </div>
          </div>
          
          <div
            onClick={() => router.push('/jobs')}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2 cursor-pointer active:scale-95 transition-transform hover:shadow-md hover:border-blue-200"
          >
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-xl mb-1">🛵</div>
            <div>
              <h3 className="text-[15px] font-bold text-gray-800">งานด่วน/ฝากซื้อ</h3>
              <p className="text-[11px] text-gray-500 font-medium">หาคนช่วยวิ่งธุระ</p>
            </div>
          </div>
        </div>

        {/* ── Categories Grid ── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-[15px] font-bold text-gray-800 border-l-4 border-[#F05D40] pl-2">หมวดหมู่บริการ</h3>
            <span onClick={() => router.push('/services')} className="text-[11px] font-bold text-[#F05D40] cursor-pointer hover:underline">ดูทั้งหมด</span>
          </div>
          
          <div className="grid grid-cols-4 gap-y-5 gap-x-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => router.push(`/services?cat=${cat.id}`)}
                className="flex flex-col items-center gap-2 cursor-pointer group"
              >
                <div className="w-12 h-12 bg-gray-50 group-hover:bg-orange-50 rounded-2xl flex items-center justify-center text-2xl transition-colors shadow-sm border border-gray-100 group-hover:border-[#F05D40]">
                  <span className="group-hover:scale-110 transition-transform">{cat.icon}</span>
                </div>
                <span className="text-[11px] font-semibold text-gray-600 group-hover:text-[#F05D40] text-center">
                  {cat.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Banner Promo (ชวนคนมาสมัครรับงาน) ── */}
        <div 
          className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-5 shadow-sm text-white flex justify-between items-center cursor-pointer active:scale-95 transition-transform" 
          onClick={() => router.push('/services/new')}
        >
          <div>
            <h3 className="text-[15px] font-bold mb-1 drop-shadow-sm">มีฝีมือ? อยากรับงาน?</h3>
            <p className="text-xs text-blue-100 font-medium">ลงประกาศฟรี ไม่มีค่าใช้จ่าย</p>
          </div>
          <div className="bg-white text-blue-600 font-bold px-4 py-2 rounded-xl text-xs shadow-sm whitespace-nowrap">
            เริ่มเลย 🚀
          </div>
        </div>

      </main>

      {/* ── Bottom Navigation Bar ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] pb-safe">
        <Link href="/" className="flex flex-col items-center gap-1 text-[#F05D40]">
          <span className="text-[22px]">🏠</span>
          <span className="text-[10px] font-bold">หน้าแรก</span>
        </Link>
        <Link href="/services" className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#F05D40] transition-colors">
          <span className="text-[22px]">🛠️</span>
          <span className="text-[10px] font-medium">บริการ</span>
        </Link>
        <Link href="/jobs" className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#F05D40] transition-colors">
          <span className="text-[22px]">📋</span>
          <span className="text-[10px] font-medium">งานด่วน</span>
        </Link>
        <Link href="/history" className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#F05D40] transition-colors">
          <span className="text-[22px]">🧾</span>
          <span className="text-[10px] font-medium">ประวัติ</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#F05D40] transition-colors">
          <span className="text-[22px]">👤</span>
          <span className="text-[10px] font-medium">ฉัน</span>
        </Link>
      </nav>
    </div>
  );
}

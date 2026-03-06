'use client';
import { useState } from 'react';
import Link from 'next/link';

// ── Soft Shopee Palette ─────────────────────────────────────────
const themePalette = {
  primaryOrange: '#F05D40', 
  lightOrange: '#FF8769',   
  bgGray: '#F9FAFB',        
};

// 🌟 Mock Data สำหรับ User 🌟
const userData = {
  name: 'บีสาม',
  location: 'ปากน้ำประแส',
  stats: { totalJobs: 0, coupons: 0, spent: 0 },
  milestone: { current: 0, target: 3000 }
};

export default function DashboardPage() {
  const [isHiringMode, setIsHiringMode] = useState(true); // true = จ้างงาน, false = รับงาน

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: themePalette.bgGray }}>
      
      {/* ── Header ── */}
      <header className="pt-10 pb-4 px-4 bg-white shadow-sm flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-orange-50 p-1.5 rounded-lg">
             <img src="/logo.png" alt="โลโก้" className="h-6 w-auto object-contain" onError={(e) => e.currentTarget.src = "https://via.placeholder.com/24"} />
          </div>
          <span className="font-black text-gray-800 tracking-tight">จงเจริญ</span>
        </div>
        <div className="flex gap-3 text-xl">
          <button className="text-gray-400 hover:text-orange-500 relative">
            🔔
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 mt-4 space-y-5">
        
        {/* ── Mode Switcher ── */}
        <div className="bg-white p-1 rounded-full flex shadow-sm border border-gray-100 relative">
          <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-all duration-300 ease-in-out ${isHiringMode ? 'left-1 bg-[#F05D40] shadow-md' : 'left-[calc(50%+3px)] bg-gray-800 shadow-md'}`}></div>
          <button 
            onClick={() => setIsHiringMode(true)}
            className={`flex-1 py-2.5 text-xs font-bold z-10 transition-colors ${isHiringMode ? 'text-white' : 'text-gray-500'}`}
          >
            ผู้จ้างงาน
          </button>
          <button 
            onClick={() => setIsHiringMode(false)}
            className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-bold z-10 transition-colors ${!isHiringMode ? 'text-white' : 'text-gray-500'}`}
          >
            รับงาน <span className="text-[9px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded uppercase">ต้อง KYC</span>
          </button>
        </div>

        {/* ── User ID Card ── */}
        <section className="rounded-3xl p-5 shadow-lg text-white relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${themePalette.primaryOrange} 0%, ${themePalette.lightOrange} 100%)` }}>
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-medium text-white/80 mb-0.5">สวัสดี 👋</p>
              <h2 className="text-xl font-black drop-shadow-sm">{userData.name}</h2>
              <p className="text-[10px] flex items-center gap-1 mt-1 opacity-90">
                📍 {userData.location}
              </p>
            </div>
            <div className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm border border-white/30 text-xs font-bold">
              Level 1
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-black/10 rounded-2xl p-3 backdrop-blur-sm">
            <div className="text-center space-y-0.5 border-r border-white/10">
              <div className="text-lg font-black">{userData.stats.totalJobs}</div>
              <div className="text-[9px] text-white/80">งานทั้งหมด</div>
            </div>
            <div className="text-center space-y-0.5 border-r border-white/10">
              <div className="text-lg font-black">{userData.stats.coupons}</div>
              <div className="text-[9px] text-white/80">คูปองจงเจริญ</div>
            </div>
            <div className="text-center space-y-0.5">
              <div className="text-lg font-black">฿{userData.stats.spent.toLocaleString()}</div>
              <div className="text-[9px] text-white/80">ยอดใช้จ่าย</div>
            </div>
          </div>
        </section>

        {/* ── Milestone Progress ── */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-xs font-bold text-gray-800 mb-4 flex items-center gap-1.5">
            📊 Milestone Progress
          </h3>
          
          <div className="space-y-4">
            {/* ยอดใช้จ่าย */}
            <div>
              <div className="flex justify-between text-[10px] font-medium mb-1">
                <span className="text-gray-600">💸 ยอดใช้จ่ายสะสม (เป้า ฿3,000)</span>
                <span className="text-orange-500 font-bold">฿{userData.milestone.current} / ฿{userData.milestone.target}</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#FF8769] to-[#F05D40] rounded-full" style={{ width: `${(userData.milestone.current / userData.milestone.target) * 100}%` }}></div>
              </div>
              <p className="text-[9px] text-gray-400 mt-1.5 text-right">
                🎯 จ้างงานครบ ฿3,000 รับคูปองจงเจริญฟรี! ขาดอีก ฿{(userData.milestone.target - userData.milestone.current).toLocaleString()}
              </p>
            </div>
            
            {/* จำนวนงาน */}
            <div>
              <div className="flex justify-between text-[10px] font-medium mb-1">
                <span className="text-gray-600">📋 จำนวนงานที่จ้าง</span>
                <span className="text-gray-800 font-bold">0 / 10 งาน</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gray-400 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Job Status Cards ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm border border-gray-100 cursor-pointer hover:border-orange-300 transition-colors">
            <span className="text-2xl font-black text-gray-800 mb-1">0</span>
            <span className="text-[10px] text-gray-500 font-medium flex items-center gap-1">⏳ รอดำเนินการ</span>
          </div>
          <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm border border-gray-100 cursor-pointer hover:border-green-300 transition-colors">
            <span className="text-2xl font-black text-gray-800 mb-1">0</span>
            <span className="text-[10px] text-gray-500 font-medium flex items-center gap-1">✅ เสร็จสิ้น</span>
          </div>
        </div>

        {/* ── งานที่จ้าง (Empty State) ── */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 min-h-[150px] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">📋 งานที่จ้าง</h3>
            <button className="text-[10px] text-[#F05D40] font-bold hover:underline">+ จ้างงาน</button>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60 my-4">
            <span className="text-4xl mb-2">🛠️</span>
            <p className="text-xs font-bold text-gray-600">ยังไม่มีงาน</p>
            <p className="text-[10px] text-gray-400">มาเริ่มจ้างงานแรกของคุณกันเถอะ!</p>
          </div>
        </section>

      </main>

      {/* 🌟 Floating Action Button สำหรับสร้างงานใหม่ 🌟 */}
      <Link href="/services" className="fixed bottom-20 right-4 z-[90] bg-[#F05D40] text-white w-12 h-12 rounded-full shadow-[0_4px_20px_rgba(240,93,64,0.4)] flex items-center justify-center text-xl hover:scale-110 active:scale-95 transition-all">
        ➕
      </Link>

      {/* 🛠️ Bottom Nav 🛠️ */}
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
        <Link href="/dashboard" className="flex flex-col items-center gap-0.5 font-bold" style={{ color: themePalette.primaryOrange }}>
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

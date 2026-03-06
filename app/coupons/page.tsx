'use client';
import { useState } from 'react';
import Link from 'next/link';

// ── Soft Shopee Palette ─────────────────────────────────────────
const themePalette = {
  primaryOrange: '#F05D40', 
  lightOrange: '#FF8769',   
  bgGray: '#F9FAFB',        
};

// 🌟 Mock Data: ข้อมูลสะสมยอดและสลากของ User 🌟
const rewardData = {
  currentSpend: 2150,
  targetSpend: 3000,
  myTickets: ['JC-88291', 'JC-40128'],
  nextDrawDate: '16 มี.ค. 2569',
};

// 🌟 Mock Data: ของรางวัล 🌟
const prizes = [
  { id: 1, title: 'รางวัลที่ 1: อั่งเปาเงินสด', amount: '฿5,000', qty: 1, icon: '🧧' },
  { id: 2, title: 'รางวัลที่ 2: ส่วนลดจ้างงานฟรี', amount: '฿1,000', qty: 3, icon: '🛠️' },
  { id: 3, title: 'รางวัลเลขท้าย 2 ตัว', amount: '฿200', qty: 20, icon: '🎯' },
];

export default function CouponsPage() {
  const progressPercent = Math.min((rewardData.currentSpend / rewardData.targetSpend) * 100, 100);
  const remainingToTarget = rewardData.targetSpend - rewardData.currentSpend;

  return (
    <div className="min-h-screen pb-28 relative" style={{ backgroundColor: themePalette.bgGray }}>
      
      {/* ── Header ── */}
      <header className="pt-10 pb-16 px-4 relative overflow-hidden rounded-b-[40px]"
        style={{ background: `linear-gradient(135deg, ${themePalette.primaryOrange} 0%, ${themePalette.lightOrange} 100%)` }}>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
        <div className="absolute left-0 top-10 w-20 h-20 bg-yellow-300/20 rounded-full blur-2xl"></div>
        
        <div className="max-w-xl mx-auto flex items-center gap-4 relative z-10">
          <div className="space-y-1">
            <h1 className="text-white text-2xl font-black drop-shadow-md tracking-tight flex items-center gap-2">
              🎟️ อั่งเปาจงเจริญ
            </h1>
            <p className="text-white/90 text-[11px] font-medium">
              จ้างงานชุมชน ลุ้นรับโชคทุกงวดวันที่ 1 และ 16
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 -mt-10 relative z-20 space-y-5">
        
        {/* ── 1. Progress Bar (หลอดสะสมยอด) ── */}
        <section className="bg-white rounded-3xl p-5 shadow-lg border border-gray-100">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h2 className="text-xs font-bold text-gray-500 mb-1">ยอดจ้างงานสะสมรอบนี้</h2>
              <div className="text-2xl font-black leading-none" style={{ color: themePalette.primaryOrange }}>
                ฿{rewardData.currentSpend.toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-gray-400 font-bold">เป้าหมาย</div>
              <div className="text-sm font-black text-gray-800">฿{rewardData.targetSpend.toLocaleString()}</div>
            </div>
          </div>

          <div className="relative h-3 w-full bg-orange-50 rounded-full overflow-hidden mb-3 border border-orange-100">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#FF8769] to-[#F05D40] rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${progressPercent}%` }}
            >
              {/* Sparkle effect on the bar */}
              <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/30 skew-x-12 animate-pulse"></div>
            </div>
          </div>

          <p className="text-xs text-center font-bold text-gray-600 bg-gray-50 py-2 rounded-xl border border-gray-100">
            {remainingToTarget > 0 ? (
              <>จ้างงานเพิ่มอีก <span className="text-[#F05D40]">฿{remainingToTarget.toLocaleString()}</span> รับสลากลุ้นโชค 1 ใบ! 🚀</>
            ) : (
              <span className="text-green-600">ยินดีด้วย! คุณได้รับสลากลุ้นโชคแล้ว 1 ใบ 🎉</span>
            )}
          </p>
        </section>

        {/* ── 2. My Tickets (สลากของฉัน) ── */}
        <section>
          <div className="flex justify-between items-center mb-3 px-1">
            <h3 className="text-sm font-black text-gray-800">🎫 สลากของคุณงวดนี้</h3>
            <span className="text-[10px] bg-orange-100 text-[#F05D40] px-2 py-1 rounded-full font-bold">
              มี {rewardData.myTickets.length} สิทธิ์
            </span>
          </div>

          {rewardData.myTickets.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {rewardData.myTickets.map((ticket, idx) => (
                <div key={idx} className="relative bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-4 shadow-md border border-orange-300 overflow-hidden group hover:-translate-y-1 transition-transform">
                  {/* Decorative circles to look like a ticket */}
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-50 rounded-full border-r border-orange-300"></div>
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-50 rounded-full border-l border-orange-300"></div>
                  
                  <div className="text-center relative z-10">
                    <div className="text-[9px] text-white/80 font-bold uppercase tracking-widest mb-1">งวด {rewardData.nextDrawDate}</div>
                    <div className="text-lg font-black text-white drop-shadow-md tracking-wider">{ticket}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center opacity-70">
              <span className="text-4xl mb-2 grayscale">🎫</span>
              <p className="text-xs font-bold text-gray-600">คุณยังไม่มีสลากในงวดนี้</p>
              <p className="text-[10px] text-gray-400 mt-1">จ้างงานสะสมให้ครบเป้าเพื่อรับสลากเลย!</p>
            </div>
          )}
        </section>

        {/* ── 3. Prize Pool (กระดานของรางวัล) ── */}
        <section className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <span className="text-xl">🎁</span>
            <div>
              <h3 className="text-sm font-black text-gray-800">กระดานของรางวัล</h3>
              <p className="text-[10px] text-gray-500 font-medium">ประกาศผลวันที่ {rewardData.nextDrawDate}</p>
            </div>
          </div>

          <div className="space-y-3">
            {prizes.map((prize) => (
              <div key={prize.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-orange-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-xl">
                    {prize.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">{prize.title}</h4>
                    <p className="text-[9px] text-gray-500">แจกทั้งหมด {prize.qty} รางวัล</p>
                  </div>
                </div>
                <div className="text-sm font-black" style={{ color: themePalette.primaryOrange }}>
                  {prize.amount}
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-4 py-3 bg-orange-50 text-[#F05D40] text-xs font-bold rounded-xl hover:bg-orange-100 transition-colors border border-orange-100">
            📜 กติกาและเงื่อนไขการรับรางวัล
          </button>
        </section>

      </main>

      {/* 🛠️ Bottom Nav (หน้า รางวัล Active) 🛠️ */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 z-[100] shadow-[0_-5px_20px_rgba(0,0,0,0.05)] pb-safe">
        <Link href="/" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-orange-400 transition-colors">
          <span className="text-xl">🏠</span>
          <span className="text-[10px]">หน้าแรก</span>
        </Link>
        <Link href="/news" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-orange-400 transition-colors">
          <span className="text-xl">📰</span>
          <span className="text-[10px]">ข่าวสาร</span>
        </Link>
        <Link href="/coupons" className="flex flex-col items-center gap-0.5 font-bold" style={{ color: themePalette.primaryOrange }}>
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

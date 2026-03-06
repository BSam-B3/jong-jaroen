'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // 🌟 นำเข้า Image component เพื่อโหลดรูปแมวกวัก

// ── Soft Shopee Palette ─────────────────────────────────────────
const themePalette = {
  primaryOrange: '#F05D40', 
  lightOrange: '#FF8769',   
  bgGray: '#F9FAFB',        
};

// 🌟 Mock Data: ตัวเลขสลากของบีสาม 🌟
const rewardData = {
  myTickets: ['820866', '124068'], 
};

export default function CouponsPage() {
  return (
    <div className="min-h-screen pb-28 relative" style={{ backgroundColor: themePalette.bgGray }}>
      
      {/* ── Header ── */}
      <header className="pt-10 pb-16 px-4 relative overflow-hidden rounded-b-[40px]"
        style={{ background: `linear-gradient(135deg, ${themePalette.primaryOrange} 0%, ${themePalette.lightOrange} 100%)` }}>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
        <div className="max-w-xl mx-auto flex items-center gap-4 relative z-10">
          <div className="space-y-1">
            <h1 className="text-white text-2xl font-black drop-shadow-md tracking-tight flex items-center gap-2">
              🎟️ อั่งเปาจงเจริญ
            </h1>
            <p className="text-white/90 text-[11px] font-medium">
              จ้างงานชุมชน ลุ้นรับโชคสไตล์มินิมอล
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 -mt-10 relative z-20 space-y-6">
        
        {/* ── 🌟 การ์ดแมวกวัก + ตัวเลขทองมังกร 🌟 ── */}
        <section>
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="text-sm font-black text-gray-800 flex items-center gap-1.5">
              <span className="text-lg">🎫</span> เลขมังกรทองของคุณ
            </h3>
            <span className="text-[10px] bg-orange-100 text-[#F05D40] px-3 py-1.5 rounded-full font-bold">
              มี {rewardData.myTickets.length} สิทธิ์
            </span>
          </div>

          {/* 🌟 กรอบหลักของการ์ด (สัดส่วนแนวตั้ง) 🌟 */}
          <div className="relative w-full aspect-[3/5] max-w-sm mx-auto rounded-[32px] overflow-hidden shadow-2xl border-4 border-red-500/20 group bg-red-800">
            
            {/* 🌟 ดึงไฟล์รูป Lucky_Cat.png ของบีสามมาแสดง 🌟 */}
            <Image 
              src="/Lucky_Cat.png" 
              alt="แมวกวักนำโชค" 
              fill 
              className="object-cover" // ทำให้รูปเต็มกรอบพอดีโดยไม่เบี้ยว
              priority 
            />

            {/* 🌟 วางตัวเลขไว้ "ด้านล่าง" ของรูปแมว 🌟 */}
            <div className="absolute inset-x-0 bottom-[8%] flex flex-col items-center gap-5 z-10">
              {rewardData.myTickets.map((ticket, idx) => (
                <div key={idx} className="relative hover:scale-110 transition-transform cursor-pointer">
                  
                  {/* 🌟 สไตล์ตัวเลขสีทองมินิมอล นูน 3D ไม่มีกรอบ 🌟 */}
                  <div className="text-5xl font-black tracking-[0.15em] pl-[0.15em] uppercase 
                    bg-gradient-to-b from-yellow-100 via-yellow-300 to-yellow-600 bg-clip-text text-transparent
                    drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]
                    after:content-[attr(data-text)] after:absolute after:inset-0 after:z-[-1] after:text-yellow-100 after:blur-md after:opacity-50"
                    data-text={ticket}
                  >
                    {ticket}
                  </div>
                  
                </div>
              ))}
            </div>
            
            {/* Effect แสงสะท้อนวิ่งผ่านการ์ดเบาๆ เวลากดหรือเอาเมาส์ชี้ */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%]"></div>
          </div>
        </section>

      </main>

      {/* 🛠️ Bottom Nav ── */}
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

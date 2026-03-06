'use client';
import { useState } from 'react';
import Link from 'next/link';
// 🌟 1. ไม่ต้องนำเข้า Component 'Image' แล้ว เพราะเราจะเขียนโค้ดวาดตั๋วขึ้นมาเอง! 🌟

// ── Soft Shopee Palette ─────────────────────────────────────────
const themePalette = {
  primaryOrange: '#F05D40', 
  lightOrange: '#FF8769',   
  bgGray: '#F9FAFB',        
};

// 🌟 Mock Data: ข้อมูลสลากของบีสาม (ตัวเลข verbatim จากรูปเดิม) 🌟
const rewardData = {
  currentSpend: 2150,
  targetSpend: 3000,
  // 🌟 2. ตัวเลขสลากของบีสาม (verbatim จากรูปเดิม) 🌟
  myTickets: ['820866', '124068'], 
  ticketDate: '16 มีนาคม 2569',
  ticketSerial: 'JC-88291',
};

export default function CouponsPage() {
  const progressPercent = Math.min((rewardData.currentSpend / rewardData.targetSpend) * 100, 100);
  const remainingToTarget = rewardData.targetSpend - rewardData.currentSpend;

  // 🌟 3. คอมโพเนนต์สำหรับวาด "ตั๋วมังกรจงเจริญ" แบบ 2D (Flat Graphic) 🌟
  const DragonTicketFlat = ({ ticketNumber }: { ticketNumber: string }) => (
    <div className="relative aspect-[3/1] rounded-2xl overflow-hidden group hover:-translate-y-1 transition-transform cursor-pointer border-4 border-amber-300 shadow-xl"
      // 🌟 ใช้ Background สีแดงเข้ม เพื่อให้ดูพรีเมียมแบบอั่งเปา 🌟
      style={{ background: 'linear-gradient(135deg, #FFB787 0%, #F65D7B 100%)' }}>
      
      {/* 🌟 4. ลวดลายมังกรทองแบบ 2D (เดี๋ยวให้คุณ C ต่อฐานข้อมูลรูปภาพลายเส้นมาใส่ตรงนี้) 🌟 */}
      <div className="absolute inset-0 z-0 flex items-center justify-center text-8xl opacity-15 grayscale group-hover:grayscale-0 transition-all">
        🐉
      </div>

      {/* 🌟 5. ข้อความ Verbatim ทั้งหมด 🌟 */}
      <div className="absolute inset-0 z-10 flex flex-col p-3 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
        
        {/* ส่วนบน: Verbatim Thai Text */}
        <div className="flex justify-between items-start mb-2">
          <div className="text-left space-y-0.5">
            <div className="text-[12px] font-bold text-amber-200">สลากมงคล</div>
            <div className="text-[9px] font-medium text-white/90">จงเจริญ x ผลสลากกินแบ่งรัฐบาล</div>
          </div>
          <div className="text-right space-y-0.5">
            <div className="text-[10px] font-bold">งวดวันที่ {rewardData.ticketDate}</div>
            <div className="text-[8px] font-medium text-white/80">เลข {ticketNumber} • {rewardData.ticketSerial}</div>
          </div>
        </div>

        {/* ส่วนกลาง: Verbatim 'จงเจริญ' text & Verbatim lottery number */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          {/* ขยายขนาด 'จงเจริญ' ให้ใหญ่ tracking-widest และใช้ font-black เพื่อให้ดูมีน้ำหนัก */}
          <div className="text-4xl font-black text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)] tracking-widest pl-2">
            จงเจริญ
          </div>
          {/* ขยายขนาดตัวเลขหวย verbatim ให้ใหญ่และtracking-widest */}
          <div className="text-5xl font-black tracking-[0.25em] pl-[0.25em] text-white drop-shadow-[0_3px_5px_rgba(0,0,0,0.7)] animate-pulse-slow">
            {ticketNumber}
          </div>
        </div>
        
        {/* ส่วนล่าง: บาร์โค้ด verbatim */}
        <div className="flex justify-center mt-2 pt-1 border-t border-white/20">
          <div className="w-[100px] h-[15px] bg-white rounded-sm flex flex-col items-center justify-center p-0.5">
             <div className="text-[12px] font-medium text-black">█▌█▌█║▌║▌</div>
             <div className="text-[6px] text-black font-bold -mt-0.5">{rewardData.ticketSerial}</div>
          </div>
        </div>
      </div>
    </div>
  );

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
              จ้างงานชุมชน ลุ้นรับโชคสไตล์อั่งเปามังกร 2D
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-3 -mt-10 relative z-20 space-y-6">
        
        {/* ── 1. หลอดสะสมยอด (Progress) ── */}
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

          <div className="relative h-3 w-full bg-orange-50 rounded-full overflow-hidden mb-3">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#FF8769] to-[#F05D40] rounded-full transition-all duration-1000" 
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/30 skew-x-12 animate-pulse"></div>
            </div>
          </div>

          <p className="text-[11px] text-center font-bold text-gray-600 bg-gray-50 py-2 rounded-xl border border-gray-100">
            {remainingToTarget > 0 ? (
              <>จ้างงานเพิ่มอีก <span className="text-[#F05D40]">฿{remainingToTarget.toLocaleString()}</span> รับเลขเด็ดมังกรทอง! 🐉</>
            ) : (
              <span className="text-green-600">🎉 ยินดีด้วย! คุณได้รับสิทธิ์ลุ้นโชคแล้ว</span>
            )}
          </p>
        </section>

        {/* ── 🌟 2. ตัวเลขของคุณ (ใช้คอมโพเนนต์ตั๋วมังกร 2D ที่สร้างใหม่) 🌟 ── */}
        <section>
          <div className="flex justify-between items-center mb-3 px-1">
            <h3 className="text-sm font-black text-gray-800">🎫 เลขมังกรทองของคุณ (งวด {rewardData.ticketDate})</h3>
            <span className="text-[10px] bg-orange-100 text-[#F05D40] px-2 py-1 rounded-full font-bold">
              มี {rewardData.myTickets.length} สิทธิ์
            </span>
          </div>

          <div className="space-y-5">
            {rewardData.myTickets.map((ticket, idx) => (
              // 🌟 6. เรียกใช้คอมโพเนนต์ DragonTicketFlat เพื่อวาดตั๋วมังกร 2D 🌟
              <DragonTicketFlat key={idx} ticketNumber={ticket} />
            ))}
          </div>
        </section>

      </main>

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

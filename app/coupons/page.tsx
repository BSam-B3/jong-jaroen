'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// ── Soft Shopee Palette ─────────────────────────────────────────
const themePalette = {
  primaryOrange: '#F05D40', 
  lightOrange: '#FF8769',   
  bgGray: '#F9FAFB',        
};

// 🌟 Mock Data: ข้อมูลผู้ใช้ 🌟
const rewardData = {
  currentSpend: 2150,
  targetSpend: 3000,
  myTickets: ['820866', '124068'], 
  ticketDate: '16 มีนาคม 2569',
  ticketSerial: 'JC-88291',
};

// 🌟 Mock Data: ผลสลาก 🌟
const lottoResults = {
  date: '1 มีนาคม 2569',
  prize1: '820866',
  back2: '06',
};

export default function CouponsPage() {
  const progressPercent = Math.min((rewardData.currentSpend / rewardData.targetSpend) * 100, 100);
  const remainingToTarget = rewardData.targetSpend - rewardData.currentSpend;

  // 🌟 คอมโพเนนต์ ตั๋วมังกรทอง (อัปเดตใหม่: ไม่มีบาร์โค้ด + ข้อความสีทอง 3D) 🌟
  const DragonTicketFlat = ({ ticketNumber }: { ticketNumber: string }) => {
    const isPrize1 = ticketNumber === lottoResults.prize1;
    const isBack2 = ticketNumber.endsWith(lottoResults.back2);
    const won = isPrize1 || isBack2;

    return (
      <div className="relative w-full aspect-[2.2/1] rounded-lg shadow-2xl overflow-hidden group hover:-translate-y-1 transition-transform cursor-pointer border border-yellow-600/50">
        
        {/* 🌟 พื้นหลังสีแดงเข้ม (เผื่อรูปโหลดยังไม่ขึ้น) และใส่รูปภาพมังกร 🌟 */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-800 to-red-950">
          {/* บีสามสามารถเซฟรูปมังกรที่เจมเจนให้ ไปใส่ในโฟลเดอร์ public แล้วตั้งชื่อว่า dragon_bg.png ได้เลยค่ะ */}
          <Image 
            src="/dragon_bg.png" 
            alt="พื้นหลังมังกร" 
            fill 
            className="object-cover opacity-60 mix-blend-overlay"
            onError={(e) => {
              e.currentTarget.style.display = 'none'; // ถ้าไม่มีรูปให้โชว์สีแดงล้วน
            }}
          />
        </div>

        {/* 🌟 กรอบสีทองรอบตั๋ว 🌟 */}
        <div className="absolute inset-2 border border-yellow-500/40 rounded pointer-events-none"></div>

        {/* 🌟 เนื้อหาบนตั๋ว 🌟 */}
        <div className="absolute inset-0 z-10 flex flex-col justify-between p-3 sm:p-4">
          
          {/* ส่วนบน: ซ้าย (สลากมงคล) / ขวา (งวดวันที่) */}
          <div className="flex justify-between items-start">
            <div className="text-left">
              <div className="text-[10px] sm:text-xs font-bold text-yellow-400 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">สลากมงคล</div>
              <div className="text-[7px] sm:text-[9px] font-medium text-white/90 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] mt-0.5">จงเจริญ x ผลสลากกินแบ่งรัฐบาล</div>
            </div>
            <div className="text-right">
              <div className="text-[9px] sm:text-[11px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">งวดวันที่ {rewardData.ticketDate}</div>
              <div className="text-[7px] sm:text-[9px] font-medium text-white/80 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] mt-0.5">เลข {ticketNumber} • {rewardData.ticketSerial}</div>
            </div>
          </div>

          {/* ส่วนกลาง: จงเจริญ + ตัวเลข (สีทอง 3D นูนๆ) */}
          <div className="flex-1 flex flex-col items-center justify-center text-center -mt-1 sm:-mt-2">
            <div className="text-2xl sm:text-4xl font-black tracking-widest bg-gradient-to-b from-yellow-100 via-yellow-400 to-yellow-600 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              จงเจริญ
            </div>
            <div className="text-4xl sm:text-6xl font-black tracking-[0.15em] pl-[0.15em] mt-1 bg-gradient-to-b from-yellow-100 via-yellow-400 to-yellow-600 bg-clip-text text-transparent drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)]">
              {ticketNumber}
            </div>
          </div>

          {/* ป้ายถูกรางวัล (จะโชว์ก็ต่อเมื่อถูกรางวัลเท่านั้น) */}
          {won && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] sm:text-[12px] font-black text-green-900 bg-gradient-to-r from-green-300 to-green-500 px-4 py-1 rounded-full shadow-lg border border-green-200 animate-bounce">
              ถูกรางวัล! {isPrize1 ? 'รับอั่งเปา ฿5,000' : 'รับอั่งเปา ฿200'} 🎉
            </div>
          )}
        </div>
      </div>
    );
  };

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
              จ้างงานชุมชน ลุ้นรับโชคสไตล์อั่งเปามังกร
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 -mt-10 relative z-20 space-y-6">
        
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

        {/* ── 🌟 2. ตัวเลขของคุณ (ตั๋วมังกรแบบใหม่) 🌟 ── */}
        <section>
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="text-sm font-black text-gray-800 flex items-center gap-1.5">
              <span className="text-lg">🎫</span> เลขมังกรทองของคุณ
            </h3>
            <span className="text-[10px] bg-orange-100 text-[#F05D40] px-3 py-1.5 rounded-full font-bold">
              มี {rewardData.myTickets.length} สิทธิ์
            </span>
          </div>

          <div className="space-y-5">
            {rewardData.myTickets.map((ticket, idx) => (
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

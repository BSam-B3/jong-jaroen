'use client';
import { useState } from 'react';
import Link from 'next/link';

// ── Soft Shopee Palette ─────────────────────────────────────────
const themePalette = {
  primaryOrange: '#F05D40', 
  lightOrange: '#FF8769',   
  bgGray: '#F9FAFB',        
};

// 🌟 Mock Data 🌟
const rewardData = {
  currentSpend: 2150,
  targetSpend: 3000,
  nextDrawDate: '16 มี.ค. 69',
  myTickets: [
    { number: '820866', serial: 'JC-88291' }, // ตรงรางวัลที่ 1 (ได้ 50,000)
    { number: '124068', serial: 'JC-40128' }, // ลงท้ายด้วย 068 ตรงเลขท้าย 3 ตัว (ได้ 2,000)
    { number: '554321', serial: 'JC-99382' }, // ไม่ถูกรางวัล
    { number: '098706', serial: 'JC-10293' }  // ลงท้ายด้วย 06 ตรงเลขท้าย 2 ตัว (ได้ 1,000)
  ],
};

// 🌟 ผลสลาก 🌟
const lottoResults = {
  date: '1 มีนาคม 2569',
  prize1: '820866',
  front3: ['479', '054'],
  back3: ['068', '837'],
  back2: '06',
};

export default function CouponsPage() {
  const progressPercent = Math.min((rewardData.currentSpend / rewardData.targetSpend) * 100, 100);
  const remainingToTarget = rewardData.targetSpend - rewardData.currentSpend;

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
              เทียบเลขลุ้นโชค อิงผลสลากกินแบ่งรัฐบาล
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-3 -mt-10 relative z-20 space-y-5">
        
        {/* ── 1. หลอดสะสมยอด ── */}
        <section className="bg-white rounded-3xl p-4 shadow-lg border border-gray-100">
          <div className="flex justify-between items-end mb-3">
            <div>
              <h2 className="text-[10px] font-bold text-gray-500 mb-0.5">ยอดจ้างงานสะสม</h2>
              <div className="text-xl font-black leading-none" style={{ color: themePalette.primaryOrange }}>
                {rewardData.currentSpend.toLocaleString()} บาท
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] text-gray-400 font-bold">เป้าหมาย</div>
              <div className="text-xs font-black text-gray-800">{rewardData.targetSpend.toLocaleString()} บาท</div>
            </div>
          </div>

          <div className="relative h-2.5 w-full bg-orange-50 rounded-full overflow-hidden mb-2">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#FF8769] to-[#F05D40] rounded-full transition-all duration-1000" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          
          <p className="text-[9px] text-center font-bold text-gray-500">
            จ้างเพิ่มอีก <span className="text-[#F05D40]">{remainingToTarget.toLocaleString()} บาท</span> รับคูปองมงคล 1 สิทธิ์! 🚀
          </p>
        </section>

        {/* ── 2. กระดานผลสลากกินแบ่งรัฐบาล ── */}
        <section className="rounded-3xl p-4 shadow-md relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #FFB787 0%, #F65D7B 100%)' }}>
          
          <div className="mb-3 relative z-10 text-white flex justify-between items-end">
            <div>
              <h2 className="text-base font-black drop-shadow-sm leading-tight">ผลสลากกินแบ่งรัฐบาล</h2>
              <p className="text-[10px] font-medium opacity-90">งวดประจำวันที่ {lottoResults.date}</p>
            </div>
            <div className="text-[9px] bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">🔴 สด</div>
          </div>

          <div className="grid grid-cols-3 gap-2 relative z-10">
            <div className="col-span-2 bg-white rounded-2xl p-2 shadow-sm flex flex-col items-center justify-center">
              <div className="bg-gradient-to-r from-orange-400 to-pink-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full mb-0.5">รางวัลที่ 1</div>
              <div className="text-2xl font-black text-gray-900 tracking-widest">{lottoResults.prize1}</div>
            </div>
            <div className="col-span-1 bg-white rounded-2xl p-2 shadow-sm flex flex-col items-center justify-center">
              <div className="text-2xl font-black text-gray-900 tracking-tight">{lottoResults.back2}</div>
              <div className="bg-gradient-to-r from-orange-400 to-pink-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full mt-0.5">ท้าย 2 ตัว</div>
            </div>
            <div className="col-span-1 bg-white rounded-xl py-1.5 shadow-sm flex flex-col items-center justify-center mt-0.5">
              <div className="text-xs font-black text-gray-900 tracking-wider">{lottoResults.front3.join(' | ')}</div>
              <div className="text-[7px] text-gray-400 font-bold mt-0.5">เลขหน้า 3 ตัว</div>
            </div>
            <div className="col-span-2 bg-white rounded-xl py-1.5 shadow-sm flex flex-col items-center justify-center mt-0.5">
              <div className="text-xs font-black text-gray-900 tracking-wider">{lottoResults.back3.join(' | ')}</div>
              <div className="text-[7px] text-gray-400 font-bold mt-0.5">เลขท้าย 3 ตัว</div>
            </div>
          </div>
        </section>

        {/* ── 🌟 3. กติกาและเงินรางวัล (ใส่ให้ครบถ้วน 100%) 🌟 ── */}
        <section className="bg-white rounded-3xl p-4 shadow-sm border border-orange-100">
          <h3 className="text-xs font-black text-gray-800 mb-3 flex items-center gap-1.5">
            <span className="text-base">💰</span> เงินรางวัลคูปองมงคล
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center bg-orange-50 px-3 py-2 rounded-xl border border-orange-200">
              <span className="text-[11px] font-bold text-orange-800">🏆 รางวัลที่ 1 (ตรง 6 ตัว)</span>
              <span className="text-sm font-black text-[#F05D40]">50,000 บาท</span>
            </div>
            <div className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
              <span className="text-[11px] font-bold text-gray-700">🥈 เลขหน้า / เลขท้าย 3 ตัว</span>
              <span className="text-xs font-black text-gray-800">2,000 บาท</span>
            </div>
            <div className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
              <span className="text-[11px] font-bold text-gray-700">🥉 เลขท้าย 2 ตัว</span>
              <span className="text-xs font-black text-gray-800">1,000 บาท</span>
            </div>
          </div>
        </section>

        {/* ── 4. คูปองมงคลของคุณ ── */}
        <section>
          <div className="flex justify-between items-center mb-3 px-1">
            <h3 className="text-sm font-black text-gray-800 flex items-center gap-1.5">
              <span className="text-base">🎫</span> คูปองของคุณ
            </h3>
            <span className="text-[10px] bg-orange-100 text-[#F05D40] px-3 py-1 rounded-full font-bold">
              {rewardData.myTickets.length} สิทธิ์
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {rewardData.myTickets.map((ticket, idx) => {
              
              // 🌟 ตรรกะตรวจรางวัล 🌟
              const isPrize1 = ticket.number === lottoResults.prize1;
              const isFront3 = lottoResults.front3.some(num => ticket.number.startsWith(num));
              const isBack3 = lottoResults.back3.some(num => ticket.number.endsWith(num));
              const isBack2 = ticket.number.endsWith(lottoResults.back2);
              const won = isPrize1 || isFront3 || isBack3 || isBack2;

              // 🌟 โชว์จำนวนเงินรางวัลตามกติกาเป๊ะๆ 🌟
              let prizeText = '';
              if (isPrize1) prizeText = 'รับ 50,000 บาท';
              else if (isFront3 || isBack3) prizeText = 'รับ 2,000 บาท';
              else if (isBack2) prizeText = 'รับ 1,000 บาท';

              return (
                <div key={idx} className={`relative flex flex-col justify-between p-3 rounded-2xl shadow-md overflow-hidden transition-transform hover:-translate-y-1 cursor-pointer border
                  ${won ? 'bg-green-50 border-green-400' : 'bg-gradient-to-br from-red-800 to-red-950 border-yellow-500/80'}`}>
                  
                  {!won && <div className="absolute inset-1 border border-yellow-500/30 rounded-xl pointer-events-none"></div>}

                  <div className="w-full flex justify-between items-start z-10">
                    <div className={`text-[9px] font-bold ${won ? 'text-green-700' : 'text-yellow-400 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]'}`}>
                      คูปองมงคล
                    </div>
                    <div className="text-right">
                      <div className={`text-[7px] font-medium ${won ? 'text-green-600' : 'text-white/90 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]'}`}>
                        งวด {rewardData.nextDrawDate}
                      </div>
                      <div className={`text-[6px] font-medium tracking-wider ${won ? 'text-green-500' : 'text-white/60'}`}>
                        {ticket.serial}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center my-1 z-10">
                    <div className={`text-[11px] font-black tracking-[0.2em] pl-[0.2em] mb-0.5
                      ${won ? 'text-green-700' : 'bg-gradient-to-b from-yellow-100 via-yellow-300 to-yellow-600 bg-clip-text text-transparent drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'}`}
                    >
                      จงเจริญ
                    </div>
                    <div className={`text-2xl font-black tracking-[0.15em] pl-[0.15em] leading-none
                      ${won ? 'text-green-600 drop-shadow-sm' : 'bg-gradient-to-b from-yellow-100 via-yellow-300 to-yellow-600 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'}`}
                    >
                      {ticket.number}
                    </div>
                  </div>

                  <div className="w-full text-center h-[14px]">
                    {/* 🌟 แสดงยอดเงินที่ถูกรางวัลตรงนี้ 🌟 */}
                    {won && (
                      <span className="inline-block text-[7px] font-bold text-white bg-green-500 px-2 py-0.5 rounded-full shadow-sm animate-pulse z-10 relative">
                        🎉 {prizeText}
                      </span>
                    )}
                  </div>

                  {!won && (
                    <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-[0.05] grayscale pointer-events-none z-0">🐉</div>
                  )}
                </div>
              );
            })}
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

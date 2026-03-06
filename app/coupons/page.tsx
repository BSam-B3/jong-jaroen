'use client';
import { useState } from 'react';
import Link from 'next/link';

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
  myTickets: ['820866', '124068'], // เปลี่ยนจากตั๋วธรรมดาเป็น "สลากตัวเลข" ให้ตรงกับหวย
  nextDrawDate: '16 มี.ค. 2569',
};

// 🌟 Mock Data: ผลสลาก (เดี๋ยวอนาคตให้คุณ C ต่อ API มาแทนที่ตรงนี้) 🌟
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

  // ฟังก์ชันเช็กว่าถูกรางวัลไหม (ง่ายๆ สำหรับ Mock)
  const isWinner = rewardData.myTickets.includes(lottoResults.prize1) || 
                   rewardData.myTickets.some(t => t.endsWith(lottoResults.back2));

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
              จ้างงานชุมชน ลุ้นรับโชคอิงผลสลากกินแบ่งฯ
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-3 -mt-10 relative z-20 space-y-5">
        
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
              <>จ้างงานเพิ่มอีก <span className="text-[#F05D40]">฿{remainingToTarget.toLocaleString()}</span> รับเลขเด็ดลุ้นโชค 1 สิทธิ์! 🚀</>
            ) : (
              <span className="text-green-600">🎉 ยินดีด้วย! คุณได้รับสิทธิ์ลุ้นโชคแล้ว</span>
            )}
          </p>
        </section>

        {/* ── 🌟 2. กระดานผลสลากกินแบ่งรัฐบาล (ดีไซน์ตาม Ref) 🌟 ── */}
        <section className="rounded-3xl p-4 shadow-md relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #FFB787 0%, #F65D7B 100%)' }}>
          
          <div className="mb-4 relative z-10 text-white">
            <h2 className="text-lg font-black drop-shadow-sm">ผลสลากกินแบ่งรัฐบาล</h2>
            <p className="text-xs font-medium opacity-90">วันที่ {lottoResults.date}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 relative z-10">
            {/* รางวัลที่ 1 (กินพื้นที่ 2 คอลัมน์) */}
            <div className="col-span-2 bg-white rounded-2xl p-3 shadow-sm flex flex-col items-center justify-center">
              <div className="bg-gradient-to-r from-orange-400 to-pink-500 text-white text-[9px] font-bold px-3 py-0.5 rounded-full mb-1">
                รางวัลที่ 1
              </div>
              <div className="text-3xl font-black text-gray-900 tracking-widest my-1">{lottoResults.prize1}</div>
              <div className="text-[8px] text-gray-400">อั่งเปา ฿5,000</div>
            </div>

            {/* เลขท้าย 2 ตัว */}
            <div className="col-span-1 bg-white rounded-2xl p-3 shadow-sm flex flex-col items-center justify-center">
              <div className="text-4xl font-black text-gray-900 tracking-tight my-1">{lottoResults.back2}</div>
              <div className="bg-gradient-to-r from-orange-400 to-pink-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full mt-1">
                เลขท้าย 2 ตัว
              </div>
              <div className="text-[8px] text-gray-400 mt-1">อั่งเปา ฿200</div>
            </div>

            {/* เลขหน้า 3 ตัว */}
            <div className="col-span-1 bg-white rounded-xl p-2 shadow-sm flex flex-col items-center justify-center mt-1">
              <div className="text-sm font-black text-gray-900 tracking-wider">{lottoResults.front3.join(' | ')}</div>
              <div className="bg-gradient-to-r from-orange-400 to-pink-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full mt-1">
                เลขหน้า 3 ตัว
              </div>
            </div>

            {/* เลขท้าย 3 ตัว */}
            <div className="col-span-2 bg-white rounded-xl p-2 shadow-sm flex flex-col items-center justify-center mt-1">
              <div className="text-sm font-black text-gray-900 tracking-wider">{lottoResults.back3.join(' | ')}</div>
              <div className="bg-gradient-to-r from-orange-400 to-pink-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full mt-1">
                เลขท้าย 3 ตัว
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. สลากของฉัน (My Tickets) ── */}
        <section>
          <div className="flex justify-between items-center mb-3 px-1">
            <h3 className="text-sm font-black text-gray-800">🎫 ตัวเลขของคุณ (งวด {lottoResults.date})</h3>
            <span className="text-[10px] bg-orange-100 text-[#F05D40] px-2 py-1 rounded-full font-bold">
              มี {rewardData.myTickets.length} สิทธิ์
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {rewardData.myTickets.map((ticket, idx) => {
              const isPrize1 = ticket === lottoResults.prize1;
              const isBack2 = ticket.endsWith(lottoResults.back2);
              const won = isPrize1 || isBack2;

              return (
                <div key={idx} className={`relative rounded-2xl p-4 shadow-sm border-2 overflow-hidden transition-transform 
                  ${won ? 'bg-green-50 border-green-400' : 'bg-white border-gray-100'}`}>
                  
                  {won && (
                    <div className="absolute top-0 right-0 bg-green-500 text-white text-[8px] font-bold px-2 py-1 rounded-bl-lg">
                      ถูกรางวัล! 🎉
                    </div>
                  )}

                  <div className="text-center mt-2">
                    <div className={`text-xl font-black tracking-widest ${won ? 'text-green-600' : 'text-gray-800'}`}>
                      {ticket}
                    </div>
                    {won && (
                      <div className="text-[10px] font-bold text-green-600 mt-1">
                        {isPrize1 ? 'รับอั่งเปา ฿5,000' : 'รับอั่งเปา ฿200'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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

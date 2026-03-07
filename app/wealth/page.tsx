'use client';
import { useState } from 'react';
import Link from 'next/link';

// ── Soft Shopee Palette ─────────────────────────────────────────
const themePalette = {
  primaryOrange: '#F05D40', 
  lightOrange: '#FF8769',   
  bgGray: '#F9FAFB',        
};

// 🌟 Mock Data: ข้อมูลกองทุนชุมชน และ ข้อมูลของช่าง 🌟
const wealthData = {
  userName: 'บีสาม',
  myPoints: 4500, // 1 พอยต์ = 1 บาทที่แอปหักเข้ากองกลางจากการทำงานของบีสาม
  communityTotalFund: 1250000, // ยอดเงินกองกลางทั้งหมดของแอป
  expectedYield: 6.5, // % ผลตอบแทนคาดการณ์
  payoutDate: '25 ธันวาคม 2569',
  
  // พอร์ตการลงทุนของกองกลาง (เน้นหุ้นปันผลสูงเพื่อความมั่นคง)
  portfolio: [
    { symbol: 'SCB', name: 'ธนาคารไทยพาณิชย์', allocation: 50, yield: 6.8, color: '#4C2882' },
    { symbol: 'TISCO', name: 'ทิสโก้ไฟแนนเชียล', allocation: 50, yield: 7.2, color: '#005DAB' }
  ]
};

export default function WealthDashboardPage() {
  // คำนวณเงินโบนัสคาดการณ์ของบีสาม (เงินต้น + ดอกผล)
  const myBonusFromYield = (wealthData.myPoints * wealthData.expectedYield) / 100;
  const myTotalExpectedBonus = wealthData.myPoints + myBonusFromYield;

  return (
    <div className="min-h-screen pb-28 relative" style={{ backgroundColor: themePalette.bgGray }}>
      
      {/* ── Header ── */}
      <header className="pt-12 pb-20 px-4 relative overflow-hidden rounded-b-[40px]"
        style={{ background: `linear-gradient(135deg, ${themePalette.primaryOrange} 0%, ${themePalette.lightOrange} 100%)` }}>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
        <div className="max-w-xl mx-auto relative z-10">
          <h1 className="text-white text-2xl font-black drop-shadow-md tracking-tight flex items-center gap-2">
            🌱 กองทุนจงเจริญ
          </h1>
          <p className="text-white/90 text-xs font-medium mt-1">
            ยิ่งรับงาน ยิ่งมีเงินเก็บ แอปช่วยลงทุนให้คุณ
          </p>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 -mt-12 relative z-20 space-y-5">
        
        {/* ── 🌟 1. กระเป๋าเงินโบนัสของฉัน 🌟 ── */}
        <section className="bg-white rounded-3xl p-5 shadow-lg border border-orange-50 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl pointer-events-none">💰</div>
          
          <h2 className="text-xs font-bold text-gray-500 mb-1">โบนัสสิ้นปีคาดการณ์ของ {wealthData.userName}</h2>
          <div className="text-3xl font-black mb-1" style={{ color: themePalette.primaryOrange }}>
            ฿{myTotalExpectedBonus.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] font-medium text-gray-400 mb-4 flex items-center gap-1">
            รับเงินเข้าบัญชีวันที่ <span className="text-orange-500 font-bold">{wealthData.payoutDate}</span>
          </div>

          <div className="bg-orange-50 rounded-2xl p-3 border border-orange-100 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-600">🛠️ ยอดเงินสะสมจากการทำงาน</span>
              <span className="text-xs font-black text-gray-800">฿{wealthData.myPoints.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                📈 ดอกผลจากการลงทุน <span className="bg-green-100 text-[8px] px-1.5 py-0.5 rounded-full">+{wealthData.expectedYield}%</span>
              </span>
              <span className="text-xs font-black text-green-600">+฿{myBonusFromYield.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </section>

        {/* ── 🌟 2. ความโปร่งใส: เงินกองกลางอยู่ที่ไหน? 🌟 ── */}
        <section className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="text-sm font-black text-gray-800">📊 พอร์ตลงทุนของชุมชน</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">รวมเงินสะสมช่างปากน้ำประแสทั้งหมด: ฿{(wealthData.communityTotalFund / 1000000).toFixed(2)} ล้าน</p>
            </div>
          </div>

          {/* รายการสินทรัพย์ที่ลงทุน */}
          <div className="space-y-3">
            {wealthData.portfolio.map((asset, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-2xl border border-gray-50 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-xs shadow-inner" style={{ backgroundColor: asset.color }}>
                    {asset.symbol}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-800">{asset.symbol}</div>
                    <div className="text-[9px] text-gray-500">{asset.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-gray-800">{asset.allocation}% ของพอร์ต</div>
                  <div className="text-[10px] font-bold text-green-600 mt-0.5">ปันผลเฉลี่ย {asset.yield}%/ปี</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-xl flex gap-2 items-start border border-blue-100">
            <span className="text-blue-500 text-lg">💡</span>
            <p className="text-[10px] text-blue-800 leading-relaxed font-medium">
              **เรียนรู้การลงทุน:** เงินกองกลางถูกนำไปซื้อหุ้นของธนาคารขนาดใหญ่ที่มีความมั่นคงสูงและจ่ายเงินปันผลสม่ำเสมอ เพื่อนำกำไรมาแจกจ่ายเป็นโบนัสให้พี่ๆ ช่างทุกคนค่ะ
            </p>
          </div>
        </section>

      </main>

      {/* 🛠️ Bottom Nav (หน้า Dashboard Active) 🛠️ */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 z-[100] shadow-[0_-5px_20px_rgba(0,0,0,0.05)] pb-safe">
        <Link href="/" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-orange-400 transition-colors">
          <span className="text-xl">🏠</span>
          <span className="text-[10px]">หน้าแรก</span>
        </Link>
        <Link href="/news" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-orange-400 transition-colors">
          <span className="text-xl">📰</span>
          <span className="text-[10px]">ข่าวสาร</span>
        </Link>
        <Link href="/wealth" className="flex flex-col items-center gap-0.5 font-bold" style={{ color: themePalette.primaryOrange }}>
          <span className="text-xl">💰</span>
          <span className="text-[10px]">เงินสะสม</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-orange-400 transition-colors">
          <span className="text-xl">👤</span>
          <span className="text-[10px]">ฉัน</span>
        </Link>
      </nav>
    </div>
  );
}

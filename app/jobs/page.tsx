'use client';
import { useState } from 'react';
import Link from 'next/link';

// ── Soft Shopee Palette ─────────────────────────────────────────
const themePalette = {
  primaryOrange: '#F05D40', 
  lightOrange: '#FF8769',   
  bgGray: '#F9FAFB',        
  textDark: '#1F2937',      
};

// ── Mock Data: ข้อมูลประกาศงานจำลอง ───────────────────────────────
const mockJobs = [
  { 
    id: 1, 
    title: 'ต้องการช่างซ่อมหลังคารั่ว ด่วนมาก!', 
    category: 'ก่อสร้าง',
    location: 'ปากน้ำประแส', 
    budget: 800, 
    time: '15 นาทีที่แล้ว', 
    isUrgent: true 
  },
  { 
    id: 2, 
    title: 'หาแม่บ้านทำความสะอาดบ้าน 2 ชั้น', 
    category: 'แม่บ้าน',
    location: 'แกลง', 
    budget: 1200, 
    time: '2 ชั่วโมงที่แล้ว', 
    isUrgent: false 
  },
  { 
    id: 3, 
    title: 'แอร์ห้องนอนไม่เย็น มีน้ำหยด', 
    category: 'ช่างไฟฟ้า',
    location: 'ปากน้ำประแส', 
    budget: 500, 
    time: '5 ชั่วโมงที่แล้ว', 
    isUrgent: false 
  },
];

export default function JobBoardPage() {
  const [showLoginAlert, setShowLoginAlert] = useState(false);

  // ฟังก์ชันจำลองเมื่อกดปุ่มรับงาน (เช็กล็อกอิน)
  const handleAcceptJob = () => {
    // ในอนาคตเราจะเขียนเช็ก Session Supabase ตรงนี้ค่ะ
    // ถ้ายังไม่ล็อกอิน ให้แสดง Popup แจ้งเตือน
    setShowLoginAlert(true);
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: themePalette.bgGray }}>
      
      {/* ── Header: Job Board ── */}
      <header className="pt-12 pb-6 px-4 shadow-sm relative overflow-hidden rounded-b-[24px]"
        style={{ background: `linear-gradient(180deg, ${themePalette.primaryOrange} 0%, ${themePalette.lightOrange} 100%)` }}>
        <div className="max-w-xl mx-auto text-center relative z-10 space-y-2">
          <h1 className="text-white text-2xl font-black drop-shadow-md">
            📢 บอร์ดงานจงเจริญ
          </h1>
          <p className="text-white/90 text-sm font-medium">
            แหล่งรวมประกาศจ้างงานทั้งหมดในชุมชน
          </p>
        </div>
      </header>

      {/* ── Filter & Sort (สไตล์ Fastwork) ── */}
      <div className="max-w-xl mx-auto px-4 mt-4 flex items-center justify-between">
        <div className="flex gap-2">
          <button className="bg-white px-3 py-1.5 rounded-full text-xs font-bold text-gray-700 shadow-sm border border-gray-200">
            ล่าสุด
          </button>
          <button className="bg-white px-3 py-1.5 rounded-full text-xs font-bold text-gray-400 shadow-sm border border-gray-100">
            งบประมาณ
          </button>
        </div>
        <span className="text-xs text-gray-400 font-medium">พบ {mockJobs.length} งาน</span>
      </div>

      {/* ── Job List ── */}
      <main className="max-w-xl mx-auto px-4 mt-4 space-y-4 relative z-20">
        {mockJobs.map((job) => (
          <div key={job.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-[#F05D40] transition-colors group">
            <div className="flex justify-between items-start mb-2">
              <span className="bg-orange-50 text-[#F05D40] px-2 py-0.5 rounded text-[10px] font-bold">
                {job.category}
              </span>
              <span className="text-[10px] text-gray-400">{job.time}</span>
            </div>
            
            <h3 className="text-sm font-bold text-gray-800 mb-1 group-hover:text-[#F05D40] transition-colors">
              {job.title}
            </h3>
            
            <div className="flex items-center gap-1 text-[11px] text-gray-500 mb-4">
              <span>📍 {job.location}</span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-50">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 font-medium">งบประมาณเริ่มต้น</span>
                <span className="text-sm font-black" style={{ color: themePalette.primaryOrange }}>
                  ฿{job.budget.toLocaleString()}
                </span>
              </div>
              <button 
                onClick={handleAcceptJob}
                className="px-6 py-2 rounded-lg text-white text-xs font-bold shadow-md hover:scale-105 transition-transform"
                style={{ backgroundColor: themePalette.primaryOrange }}>
                สนใจรับงาน
              </button>
            </div>
          </div>
        ))}
      </main>

      {/* ── Popup แจ้งเตือนให้ Login (Private Action) ── */}
      {showLoginAlert && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] px-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-fade-in-up">
            <div className="text-5xl mb-2">🔐</div>
            <h3 className="text-lg font-black text-gray-800">เข้าสู่ระบบเพื่อรับงาน</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              ฟังก์ชันนี้สงวนสิทธิ์เฉพาะช่างที่ผ่านการยืนยันตัวตนในระบบ "จงเจริญ" แล้วเท่านั้นค่ะ <br/>มาสร้างรายได้ไปด้วยกันนะคะ!
            </p>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setShowLoginAlert(false)}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200 transition-colors">
                ยกเลิก
              </button>
              <Link href="/profile" 
                className="flex-1 py-3 rounded-xl text-white text-xs font-bold shadow-md hover:opacity-90 transition-opacity flex items-center justify-center"
                style={{ backgroundColor: themePalette.primaryOrange }}>
                สมัครสมาชิกเลย
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 🛠️ Bottom Nav (Shopee Style) 🛠️ */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 z-[100] shadow-[0_-5px_20px_rgba(0,0,0,0.05)] pb-safe">
        <Link href="/" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-orange-400 transition-colors">
          <span className="text-xl">🏠</span>
          <span className="text-[10px]">หน้าแรก</span>
        </Link>
        <Link href="/services" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-orange-400 transition-colors">
          <span className="text-xl">🔍</span>
          <span className="text-[10px]">ค้นหา</span>
        </Link>
        <Link href="/coupons" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-orange-400 transition-colors">
          <span className="text-xl">🎟️</span>
          <span className="text-[10px]">รางวัล</span>
        </Link>
        {/* ไฮไลต์เมนู "งาน" ให้เป็นสีส้มเพราะเราอยู่หน้านี้ค่ะ */}
        <Link href="/jobs" className="flex flex-col items-center gap-0.5 font-bold" style={{ color: themePalette.primaryOrange }}>
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

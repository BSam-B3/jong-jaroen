'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ── Soft Shopee Palette ─────────────────────────────────────────
const themePalette = {
  primaryOrange: '#F05D40', 
  bgGray: '#F4F6F8',        
};

// 🌟 Mock Data จำลองประวัติงาน 🌟
const mockRequests = [
  { id: 'REQ-102', title: 'ฝากซื้อข้าวผัดกะเพรา', person: 'พี่วิน หน้าตลาด', price: 60, status: 'in_progress', date: '08 มี.ค. 2026' },
  { id: 'REQ-101', title: 'จ้างซ่อมแอร์บ้าน', person: 'ลุงชม ช่างแอร์', price: 500, status: 'completed', date: '05 มี.ค. 2026' },
];

const mockTasks = [
  { id: 'TSK-055', title: 'รับสอนการบ้านเด็กประถม', person: 'แม่น้องเฟิร์น', price: 150, status: 'completed', date: '01 มี.ค. 2026' },
  { id: 'TSK-056', title: 'รับจ้างทำความสะอาด', person: 'ป้าศรี', price: 300, status: 'cancelled', date: '28 ก.พ. 2026' },
];

export default function HistoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'requests' | 'tasks'>('requests');

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'in_progress': return <span className="bg-blue-50 text-blue-600 text-[11px] font-bold px-2 py-1 rounded-md">กำลังดำเนินการ</span>;
      case 'completed': return <span className="bg-green-50 text-green-600 text-[11px] font-bold px-2 py-1 rounded-md">เสร็จสิ้นแล้ว</span>;
      case 'cancelled': return <span className="bg-red-50 text-red-600 text-[11px] font-bold px-2 py-1 rounded-md">ยกเลิก</span>;
      default: return null;
    }
  };

  const displayData = activeTab === 'requests' ? mockRequests : mockTasks;

  return (
    <div className="min-h-screen pb-28 max-w-md mx-auto relative selection:bg-orange-200" style={{ backgroundColor: themePalette.bgGray }}>
      
      {/* ── Header ── */}
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100 flex justify-between items-center shadow-sm">
        <h1 className="text-lg font-bold text-gray-800">ประวัติการใช้งาน 🧾</h1>
      </div>

      {/* ── Tabs (สลับหน้าจ้างงาน/รับงาน) ── */}
      <div className="bg-white px-4 pt-2 border-b border-gray-200 flex sticky top-[60px] z-10">
        <button 
          onClick={() => setActiveTab('requests')}
          className={`flex-1 pb-3 text-[14px] font-bold transition-colors ${activeTab === 'requests' ? 'text-[#F05D40] border-b-2 border-[#F05D40]' : 'text-gray-400'}`}
        >
          งานที่ฉันจ้าง
        </button>
        <button 
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 pb-3 text-[14px] font-bold transition-colors ${activeTab === 'tasks' ? 'text-[#F05D40] border-b-2 border-[#F05D40]' : 'text-gray-400'}`}
        >
          งานที่ฉันรับ
        </button>
      </div>

      <main className="px-3 mt-4 space-y-3">
        {displayData.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm mt-4">
            <span className="text-5xl opacity-50 mb-3 block">📭</span>
            <p className="text-gray-500 font-medium text-sm">ยังไม่มีประวัติการทำรายการ</p>
          </div>
        ) : (
          displayData.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer">
              <div className="flex justify-between items-center mb-3 border-b border-gray-50 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400">{item.id}</span>
                  <span className="text-gray-300 text-[10px]">•</span>
                  <span className="text-[11px] text-gray-500 font-medium">{item.date}</span>
                </div>
                {getStatusBadge(item.status)}
              </div>
              
              <h3 className="text-[15px] font-bold text-gray-800 mb-1">{item.title}</h3>
              <p className="text-[12px] text-gray-500 font-medium flex items-center gap-1.5 mb-4">
                <span className="text-gray-400">👤</span> {item.person}
              </p>
              
              <div className="flex justify-between items-end">
                <p className="text-xs text-gray-400 font-medium">ราคารวม</p>
                <p className="text-lg font-black text-[#F05D40]">฿{item.price}</p>
              </div>
            </div>
          ))
        )}
      </main>

      {/* ── Bottom Navigation Bar (เน้นปุ่มประวัติ) ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] pb-safe">
        <Link href="/" className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#F05D40] transition-colors">
          <span className="text-[22px]">🏠</span>
          <span className="text-[10px] font-medium">หน้าแรก</span>
        </Link>
        <Link href="/services" className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#F05D40] transition-colors">
          <span className="text-[22px]">🛠️</span>
          <span className="text-[10px] font-medium">บริการ</span>
        </Link>
        <Link href="/jobs" className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#F05D40] transition-colors">
          <span className="text-[22px]">📋</span>
          <span className="text-[10px] font-medium">งานด่วน</span>
        </Link>
        <Link href="/history" className="flex flex-col items-center gap-1 text-[#F05D40]">
          <span className="text-[22px]">🧾</span>
          <span className="text-[10px] font-bold">ประวัติ</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#F05D40] transition-colors">
          <span className="text-[22px]">👤</span>
          <span className="text-[10px] font-medium">ฉัน</span>
        </Link>
      </nav>
    </div>
  );
}

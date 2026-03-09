'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HistoryPage() {
  const router = useRouter();
  const [activeRole, setActiveRole] = useState('customer'); 
  const [statusFilter, setStatusFilter] = useState('all'); 
  
  // State สำหรับ Popup สรุปรายเดือน
  const [showSummary, setShowSummary] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('2026-03');

  // จำลองข้อมูลประวัติ
  const histories = [
    {
      id: 'JOB-2026-001',
      role: 'customer',
      type: 'delivery',
      title: 'Fast Delivery (มอเตอร์ไซค์)',
      person: 'พี่สมชาย สายซิ่ง',
      status: 'ongoing',
      statusText: 'กำลังเดินทางไปรับของ',
      date: 'วันนี้, 14:30 น.',
      price: 45,
      icon: '🛵',
    },
    {
      id: 'JOB-2026-002',
      role: 'customer',
      type: 'service',
      title: 'บริการแม่บ้านทำความสะอาด',
      person: 'พี่สมศรี คลีนนิ่ง',
      status: 'completed',
      statusText: 'งานเสร็จสิ้น',
      date: '3 มี.ค. 2026',
      price: 450,
      icon: '🧹',
    },
    {
      id: 'JOB-2026-003',
      role: 'provider',
      type: 'delivery',
      title: 'รับ-ส่งของ ด่วน',
      person: 'คุณวิชัย ใจดี',
      status: 'ongoing',
      statusText: 'กำลังดำเนินการจัดส่ง',
      date: 'วันนี้, 15:00 น.',
      price: 60,
      icon: '📦',
    },
    {
      id: 'JOB-2026-004',
      role: 'provider',
      type: 'service',
      title: 'รับล้างแอร์',
      person: 'คุณสมปอง บ้านริมน้ำ',
      status: 'completed',
      statusText: 'ส่งมอบงานแล้ว',
      date: 'เมื่อวาน, 11:00 น.',
      price: 500,
      icon: '❄️',
    }
  ];

  const filteredHistories = histories.filter(h => {
    const matchRole = h.role === activeRole;
    const matchStatus = statusFilter === 'all' ? true : h.status === statusFilter;
    return matchRole && matchStatus;
  });

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      {/* 🧩 ตัวแอป Container */}
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen pb-28 shadow-xl relative flex flex-col">
        
        {/* 🟠 Header */}
        <div className="bg-gradient-to-br from-[#EE4D2D] to-[#FF7337] rounded-b-[2.5rem] p-6 pt-12 shadow-sm relative z-10">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-black text-white tracking-tight">ประวัติ 📜</h1>
            
            {/* 📊 ปุ่มเปิด Popup สรุปยอด */}
            <button 
              onClick={() => setShowSummary(true)}
              className="bg-white/20 hover:bg-white/30 active:scale-95 transition-all backdrop-blur-md px-4 py-2 rounded-full border border-white/30 flex items-center gap-2"
            >
              <span className="text-white text-xs font-bold">📊 สรุปยอด</span>
            </button>
          </div>

          {/* 🗂️ แถบสลับหน้าหลัก (Tabs) */}
          <div className="flex bg-black/10 p-1.5 rounded-2xl backdrop-blur-sm relative z-10 mt-2">
            <button 
              onClick={() => { setActiveRole('customer'); setStatusFilter('all'); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeRole === 'customer' 
                ? 'bg-white text-[#EE4D2D] shadow-sm' 
                : 'text-white/80 hover:text-white'
              }`}
            >
              🛒 จ้างงาน
            </button>
            <button 
              onClick={() => { setActiveRole('provider'); setStatusFilter('all'); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeRole === 'provider' 
                ? 'bg-white text-[#EE4D2D] shadow-sm' 
                : 'text-white/80 hover:text-white'
              }`}
            >
              🛠️ รับงาน
            </button>
          </div>
        </div>

        {/* 🏷️ ตัวกรองสถานะ */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide shadow-sm sticky top-0 z-20">
          {[
            { id: 'all', label: 'ทั้งหมด' },
            { id: 'ongoing', label: 'กำลังดำเนินการ ⏳' },
            { id: 'completed', label: 'เสร็จสิ้นแล้ว ✅' }
          ].map((filter) => (
            <button 
              key={filter.id}
              onClick={() => setStatusFilter(filter.id)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                statusFilter === filter.id 
                ? 'bg-[#EE4D2D] text-white border-[#EE4D2D] shadow-sm' 
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* 📋 รายการประวัติ */}
        <div className="p-4 space-y-3 relative z-0 mt-2">
          {filteredHistories.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
              <div className="text-5xl mb-3 opacity-50">📭</div>
              <h3 className="text-gray-500 font-bold text-sm">ไม่พบรายการในหมวดหมู่นี้</h3>
            </div>
          ) : (
            filteredHistories.map((item) => (
              <div key={item.id} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100 cursor-pointer active:scale-[0.98] transition-all hover:shadow-md">
                <div className="flex justify-between items-start mb-3 border-b border-gray-50 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-xl shadow-inner border border-orange-100/50">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm leading-tight">{item.title}</h3>
                      <p className="text-[10px] text-gray-500 mt-0.5">{item.id}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {/* ✅ ปรับสีรายจ่ายเป็นสีดำ (gray-800) ตามสั่ง */}
                    <p className={`font-black text-sm ${activeRole === 'provider' ? 'text-green-600' : 'text-gray-800'}`}>
                      {activeRole === 'provider' ? '+' : '-'}฿{item.price}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[11px] font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <span className="text-gray-400">{activeRole === 'customer' ? 'บริการโดย:' : 'ลูกค้า:'}</span> 
                      {item.person}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium">🕒 {item.date}</p>
                  </div>
                  
                  <span className={`text-[9px] font-bold px-3 py-1.5 rounded-full ${
                    item.status === 'ongoing' 
                    ? 'bg-blue-50 text-blue-600 border border-blue-100 animate-pulse' 
                    : 'bg-green-50 text-green-600 border border-green-100'
                  }`}>
                    {item.statusText}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 🧭 Bottom Nav */}
        <div className="fixed bottom-0 w-full sm:max-w-2xl md:max-w-3xl bg-white/95 backdrop-blur-md border-t border-gray-100 px-8 py-4 flex justify-between items-center shadow-[0_-4px_25px_rgba(0,0,0,0.06)] rounded-t-[2.5rem] z-50">
           <button onClick={() => router.push('/')} className="flex flex-col items-center gap-1 opacity-40"><span className="text-xl">🏠</span><span className="text-[10px] font-bold text-gray-500">หน้าแรก</span></button>
           <button onClick={() => router.push('/services')} className="flex flex-col items-center gap-1 opacity-40"><span className="text-xl">🛠️</span><span className="text-[10px] font-bold text-gray-500">บริการ</span></button>
           <button onClick={() => router.push('/win-online')} className="flex flex-col items-center gap-1 opacity-40"><span className="text-xl">📋</span><span className="text-[10px] font-bold text-gray-500">ด่วนนน</span></button>
           <div className="flex flex-col items-center gap-1 scale-110"><span className="text-xl">📜</span><span className="text-[10px] font-bold text-[#EE4D2D]">ประวัติ</span><div className="w-1.5 h-1.5 bg-[#EE4D2D] rounded-full shadow-sm"></div></div>
           <button onClick={() => router.push('/profile')} className="flex flex-col items-center gap-1 opacity-40"><span className="text-xl">👤</span><span className="text-[10px] font-bold text-gray-500">ฉัน</span></button>
        </div>

      </div>

      {/* 📊 POPUP: สรุปยอดรายเดือน */}
      {showSummary && (
        <div className="fixed inset-0 z-[100] flex justify-center items-end sm:items-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-2xl transform transition-transform animate-slide-up">
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black text-gray-800">📊 สรุปยอดรายเดือน</h2>
              <button onClick={() => setShowSummary(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200">✕</button>
            </div>

            {/* 🗓️ เลือกเดือน */}
            <div className="mb-6">
              <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-widest">เลือกเดือนที่ต้องการดู</label>
              <input 
                type="month" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold text-[#EE4D2D] outline-none focus:border-[#EE4D2D]"
              />
            </div>

            {/* 💰 สรุปตัวเลข */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
                <p className="text-[10px] text-green-600 font-bold mb-1">รายรับทั้งหมด (🛠️ รับงาน)</p>
                <h3 className="text-xl font-black text-green-600">+฿5,250</h3>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                <p className="text-[10px] text-gray-600 font-bold mb-1">รายจ่ายทั้งหมด (🛒 จ้างงาน)</p>
                <h3 className="text-xl font-black text-gray-800">-฿1,420</h3>
              </div>
            </div>

            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 mb-6 flex justify-between items-center">
              <p className="text-xs text-blue-800 font-bold">ยอดสุทธิ (Net)</p>
              <h2 className="text-2xl font-black text-blue-700">฿3,830</h2>
            </div>

            {/* 📈 กราฟแท่ง (CSS) */}
            <div className="mb-4">
              <p className="text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-widest">สัดส่วน รับ / จ่าย</p>
              <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-green-500" style={{ width: '78%' }}></div>
                <div className="h-full bg-gray-400" style={{ width: '22%' }}></div>
              </div>
              <div className="flex justify-between mt-2 text-[9px] font-bold text-gray-500">
                <span>รับ 78%</span>
                <span>จ่าย 22%</span>
              </div>
            </div>

            <button onClick={() => setShowSummary(false)} className="w-full bg-[#EE4D2D] text-white font-black py-4 rounded-xl shadow-md active:scale-95 transition-all text-sm mt-2">
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

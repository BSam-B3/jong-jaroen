'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HistoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('ongoing'); // 'ongoing' หรือ 'completed'

  // จำลองข้อมูลประวัติ (ผสมทั้งเรียกวิน และ จ้างช่าง)
  const histories = [
    {
      id: 'JOB-2026-001',
      type: 'delivery',
      title: 'Fast Delivery (มอเตอร์ไซค์)',
      provider: 'พี่สมชาย สายซิ่ง',
      status: 'ongoing',
      statusText: 'กำลังเดินทางไปรับของ',
      date: 'วันนี้, 14:30 น.',
      price: 45,
      icon: '🛵',
    },
    {
      id: 'JOB-2026-002',
      type: 'service',
      title: 'บริการล้างแอร์บ้าน',
      provider: 'ช่างเอก ประแส',
      status: 'ongoing',
      statusText: 'นัดหมายพรุ่งนี้ 10:00 น.',
      date: 'พรุ่งนี้, 10:00 น.',
      price: 500,
      icon: '❄️',
    },
    {
      id: 'JOB-2026-003',
      type: 'delivery',
      title: 'Fast Delivery (รถเก๋ง)',
      provider: 'น้าจัน ใจดี',
      status: 'completed',
      statusText: 'จัดส่งสำเร็จ',
      date: 'เมื่อวาน, 09:15 น.',
      price: 120,
      icon: '🚗',
    },
    {
      id: 'JOB-2026-004',
      type: 'service',
      title: 'บริการแม่บ้านทำความสะอาด',
      provider: 'พี่สมศรี คลีนนิ่ง',
      status: 'completed',
      statusText: 'งานเสร็จสิ้น',
      date: '3 มี.ค. 2026',
      price: 450,
      icon: '🧹',
    }
  ];

  // กรองข้อมูลตาม Tab ที่เลือก
  const filteredHistories = histories.filter(h => h.status === activeTab);

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      {/* 🧩 ตัวแอป Container */}
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen pb-28 shadow-xl relative flex flex-col">
        
        {/* 🟠 Header (โทนส้มทอง Shopee) */}
        <div className="bg-gradient-to-br from-[#EE4D2D] to-[#FF7337] rounded-b-[2.5rem] p-6 pt-12 shadow-sm relative z-10">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-black text-white tracking-tight">ประวัติการใช้งาน 📜</h1>
            <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30">
              <span className="text-white text-[10px] font-bold">อัปเดตล่าสุด: สดๆ ร้อนๆ</span>
            </div>
          </div>

          {/* 🗂️ แถบสลับหน้า (Tabs) */}
          <div className="flex bg-black/10 p-1 rounded-2xl backdrop-blur-sm relative z-10 mt-2">
            <button 
              onClick={() => setActiveTab('ongoing')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'ongoing' 
                ? 'bg-white text-[#EE4D2D] shadow-sm' 
                : 'text-white/80 hover:text-white'
              }`}
            >
              กำลังดำเนินการ ⏳
            </button>
            <button 
              onClick={() => setActiveTab('completed')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'completed' 
                ? 'bg-white text-[#EE4D2D] shadow-sm' 
                : 'text-white/80 hover:text-white'
              }`}
            >
              เสร็จสิ้นแล้ว ✅
            </button>
          </div>
        </div>

        {/* 📋 รายการประวัติ */}
        <div className="p-4 space-y-3 relative z-0 mt-2">
          
          {filteredHistories.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-3 opacity-50">📭</div>
              <h3 className="text-gray-500 font-bold text-sm">ยังไม่มีรายการในหมวดหมู่นี้</h3>
              <p className="text-gray-400 text-xs mt-1">เรียกใช้บริการ Fast Delivery หรือจ้างช่างได้เลย!</p>
            </div>
          ) : (
            filteredHistories.map((item) => (
              <div 
                key={item.id} 
                className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100 cursor-pointer active:scale-[0.98] transition-all hover:shadow-md"
              >
                <div className="flex justify-between items-start mb-3 border-b border-gray-50 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-xl shadow-inner">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm leading-tight">{item.title}</h3>
                      <p className="text-[10px] text-gray-500 mt-0.5">{item.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[#EE4D2D] font-black text-sm">฿{item.price}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                      <span className="text-gray-400">ผู้ให้บริการ:</span> {item.provider}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium">🕒 {item.date}</p>
                  </div>
                  
                  {/* Status Badge */}
                  <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full ${
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
           <button onClick={() => router.push('/')} className="flex flex-col items-center gap-1 opacity-40">
             <span className="text-xl">🏠</span><span className="text-[10px] font-bold text-gray-500">หน้าแรก</span>
           </button>
           <button onClick={() => router.push('/services')} className="flex flex-col items-center gap-1 opacity-40">
             <span className="text-xl">🛠️</span><span className="text-[10px] font-bold text-gray-500">บริการ</span>
           </button>
           <button onClick={() => router.push('/win-online')} className="flex flex-col items-center gap-1 opacity-40">
             <span className="text-xl">📋</span><span className="text-[10px] font-bold text-gray-500">ด่วนนน</span>
           </button>
           
           {/* ✅ Active Tab "ประวัติ" */}
           <div className="flex flex-col items-center gap-1 scale-110">
             <span className="text-xl">📜</span>
             <span className="text-[10px] font-bold text-[#EE4D2D]">ประวัติ</span>
             <div className="w-1.5 h-1.5 bg-[#EE4D2D] rounded-full shadow-sm"></div>
           </div>

           <button onClick={() => router.push('/profile')} className="flex flex-col items-center gap-1 opacity-40">
             <span className="text-xl">👤</span><span className="text-[10px] font-bold text-gray-500">ฉัน</span>
           </button>
        </div>

      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JobsServicesPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('ทั้งหมด');

  // จำลองข้อมูลผู้รับจ้าง (สไตล์ Fastwork)
  const services = [
    {
      id: 1,
      providerName: 'ช่างเอก ประแส',
      avatar: 'https://via.placeholder.com/100',
      title: 'รับล้างแอร์บ้าน ซ่อมแอร์ เติมน้ำยาแอร์ (งานจบ งบไม่บาน)',
      category: 'ล้างแอร์',
      rating: 4.9,
      reviews: 34,
      startPrice: 500,
      coverImg: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=500'
    },
    {
      id: 2,
      providerName: 'พี่สมศรี คลีนนิ่ง',
      avatar: 'https://via.placeholder.com/100',
      title: 'บริการแม่บ้านทำความสะอาด รายวัน/รายสัปดาห์ สะอาดกริบ',
      category: 'แม่บ้าน',
      rating: 4.8,
      reviews: 56,
      startPrice: 450,
      coverImg: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=500'
    },
    {
      id: 3,
      providerName: 'ช่างดำ การไฟฟ้า',
      avatar: 'https://via.placeholder.com/100',
      title: 'เดินสายไฟ ซ่อมไฟช็อต ติดตั้งกล้องวงจรปิด',
      category: 'ช่างไฟ',
      rating: 5.0,
      reviews: 12,
      startPrice: 300,
      coverImg: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&q=80&w=500'
    }
  ];

  const categories = ['ทั้งหมด', 'ล้างแอร์', 'แม่บ้าน', 'ช่างไฟ', 'ประปา', 'ซ่อมรถ'];

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      {/* 🧩 ตัวแอป Container */}
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen pb-28 shadow-xl relative flex flex-col">
        
        {/* 🟠 Header */}
        <div className="bg-[#F05D40] rounded-b-[2.5rem] p-5 pt-12 shadow-sm relative z-10">
          <div className="flex justify-between items-center mb-4 px-2">
            <button onClick={() => router.push('/')} className="text-white text-sm font-bold flex items-center gap-1">
              ← กลับ
            </button>
            <h1 className="text-xl font-black text-white tracking-tight">บริการชุมชน 🛠️</h1>
            <div className="w-10"></div> {/* Spacer */}
          </div>

          {/* 🔍 Search Bar */}
          <div className="bg-white rounded-2xl p-3 flex items-center shadow-md mx-2 mb-2">
            <span className="text-xl mr-2">🔍</span>
            <input 
              type="text" 
              placeholder="ค้นหาบริการ, ชื่อช่าง..." 
              className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
            />
          </div>

          {/* 🏷️ Filter Categories (เลื่อนซ้ายขวาได้) */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide px-2 pb-2 pt-1 mt-3">
            {categories.map((cat) => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeCategory === cat 
                  ? 'bg-white text-[#F05D40] shadow-sm' 
                  : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 📋 รายการผู้ให้บริการ (Freelance Cards) */}
        <div className="p-4 space-y-4 relative z-0 mt-2">
          
          {/* 🚀 Banner สำหรับชวนคนมาลงรับงาน */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-400 rounded-2xl p-4 shadow-sm flex justify-between items-center text-white mb-2">
            <div>
              <h3 className="font-bold text-sm">มีฝีมือ? อยากรับงาน?</h3>
              <p className="text-[10px] text-blue-100 mt-0.5">ลงประกาศบริการของคุณฟรี ไม่มีค่าใช้จ่าย</p>
            </div>
            <button className="bg-white text-blue-500 text-[10px] font-black px-4 py-2 rounded-full shadow-sm hover:scale-105 transition-transform">
              ลงประกาศ 📝
            </button>
          </div>

          <div className="flex justify-between items-center px-1 mb-1">
            <h2 className="font-bold text-gray-800 text-sm">บริการแนะนำ</h2>
            <span className="text-[10px] text-gray-500">ทั้งหมด {services.length} รายการ</span>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {services.map((service) => (
              <div 
                key={service.id} 
                className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden cursor-pointer active:scale-[0.98] transition-all hover:shadow-md"
              >
                {/* Cover Image */}
                <div className="h-32 bg-gray-200 relative">
                  <img src={service.coverImg} alt={service.title} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[9px] font-bold text-gray-700 shadow-sm flex items-center gap-1">
                    <span>⭐ {service.rating}</span>
                    <span className="text-gray-400 font-medium">({service.reviews})</span>
                  </div>
                </div>

                <div className="p-4">
                  {/* Provider Info */}
                  <div className="flex items-center gap-2 mb-2 -mt-8 relative z-10">
                    <img src={service.avatar} alt="avatar" className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-white" />
                    <span className="text-xs font-bold text-gray-800 bg-white/90 px-2 py-0.5 rounded-full shadow-sm backdrop-blur-sm mt-4">
                      {service.providerName}
                    </span>
                  </div>

                  {/* Service Title */}
                  <h3 className="font-bold text-gray-800 text-sm leading-tight mb-3 line-clamp-2">
                    {service.title}
                  </h3>

                  {/* Price & Action */}
                  <div className="flex justify-between items-end border-t border-gray-50 pt-3">
                    <div>
                      <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">เริ่มต้นที่</p>
                      <p className="text-[#F05D40] font-black text-base">฿{service.startPrice}</p>
                    </div>
                    <button className="bg-gray-100 text-gray-800 text-[10px] font-black px-4 py-2 rounded-xl hover:bg-[#F05D40] hover:text-white transition-colors">
                      ดูรายละเอียด
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 🧭 Bottom Nav (จำลอง) */}
        <div className="fixed bottom-0 w-full sm:max-w-2xl md:max-w-3xl bg-white/95 backdrop-blur-md border-t border-gray-100 px-8 py-4 flex justify-between items-center shadow-[0_-4px_25px_rgba(0,0,0,0.06)] rounded-t-[2.5rem] z-50">
           <button onClick={() => router.push('/')} className="flex flex-col items-center gap-1 opacity-40">
             <span className="text-xl">🏠</span><span className="text-[10px] font-bold text-gray-500">หน้าแรก</span>
           </button>
           <div className="flex flex-col items-center gap-1 scale-110">
             <span className="text-xl">🛠️</span><span className="text-[10px] font-bold text-[#F05D40]">บริการ</span>
             <div className="w-1.5 h-1.5 bg-[#F05D40] rounded-full shadow-sm"></div>
           </div>
           <button onClick={() => router.push('/win-online')} className="flex flex-col items-center gap-1 opacity-40">
             <span className="text-xl">📋</span><span className="text-[10px] font-bold text-gray-500">ด่วนนน</span>
           </button>
           <button onClick={() => router.push('/history')} className="flex flex-col items-center gap-1 opacity-40">
             <span className="text-xl">📜</span><span className

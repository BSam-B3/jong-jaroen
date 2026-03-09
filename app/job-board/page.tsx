'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JobBoardPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('ทั้งหมด');

  // จำลองข้อมูลประกาศรับสมัครงาน
  const jobs = [
    {
      id: 1,
      title: 'พนักงานชงกาแฟ (Barista)',
      employer: 'คาเฟ่ริมน้ำประแส',
      type: 'งานประจำ',
      wage: '12,000 - 15,000 บาท/เดือน',
      location: 'ปากน้ำประแส',
      tags: ['รับด่วน', 'ยินดีรับเด็กจบใหม่'],
      postedAt: '2 ชั่วโมงที่แล้ว'
    },
    {
      id: 2,
      title: 'คนช่วยคัดและแพ็คผลไม้',
      employer: 'สวนผลไม้ลุงเจริญ',
      type: 'พาร์ทไทม์ (รายวัน)',
      wage: '400 บาท/วัน',
      location: 'แกลง, ระยอง',
      tags: ['จ่ายเงินจบรายวัน', 'เริ่มงานพรุ่งนี้'],
      postedAt: '5 ชั่วโมงที่แล้ว'
    },
    {
      id: 3,
      title: 'พนักงานขับรถส่งของ',
      employer: 'ร้านวัสดุก่อสร้างเฮียฮ้อ',
      type: 'งานประจำ',
      wage: '15,000 บาท/เดือน + เบี้ยขยัน',
      location: 'ปากน้ำประแส',
      tags: ['ต้องการใบขับขี่รถยนต์'],
      postedAt: '1 วันที่แล้ว'
    }
  ];

  const filters = ['ทั้งหมด', 'งานประจำ', 'พาร์ทไทม์', 'รายวัน', 'รับด่วน'];

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      {/* 🧩 ตัวแอป Container */}
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen pb-28 shadow-xl relative flex flex-col">
        
        {/* 🔵 Header (ธีมสีน้ำเงินให้เข้ากับ Banner หน้าแรก) */}
        <div className="bg-gradient-to-br from-[#0082FA] to-[#00A3FF] rounded-b-[2.5rem] p-5 pt-12 shadow-sm relative z-10 overflow-hidden">
          {/* ของตกแต่ง Header */}
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          
          <div className="flex justify-between items-center mb-4 px-2 relative z-10">
            <button onClick={() => router.push('/')} className="text-white text-sm font-bold flex items-center gap-1">
              ← กลับ
            </button>
            <h1 className="text-xl font-black text-white tracking-tight">กระดานหางาน 💼</h1>
            <div className="w-10"></div>
          </div>

          {/* 🔍 Search Bar */}
          <div className="bg-white rounded-2xl p-3 flex items-center shadow-md mx-2 mb-2 relative z-10">
            <span className="text-xl mr-2">🔍</span>
            <input 
              type="text" 
              placeholder="ค้นหาตำแหน่งงาน, ชื่อร้าน..." 
              className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
            />
          </div>

          {/* 🏷️ Filter Categories */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide px-2 pb-2 pt-1 mt-3 relative z-10">
            {filters.map((filter) => (
              <button 
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeFilter === filter 
                  ? 'bg-white text-[#0082FA] shadow-sm' 
                  : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* 📋 รายการประกาศงาน */}
        <div className="p-4 space-y-4 relative z-0 mt-2">
          
          {/* 🚀 Banner สำหรับนายจ้าง */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100 flex justify-between items-center mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-2xl">
                📢
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-sm">ต้องการหาคนช่วยงาน?</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">ลงประกาศรับสมัครงานในชุมชน</p>
              </div>
            </div>
            <button className="bg-[#0082FA] text-white text-[10px] font-black px-4 py-2.5 rounded-full shadow-md active:scale-95 transition-transform">
              ลงประกาศ 📝
            </button>
          </div>

          <div className="flex justify-between items-center px-1 mb-1">
            <h2 className="font-bold text-gray-800 text-sm">ตำแหน่งงานล่าสุด</h2>
            <span className="text-[10px] text-gray-500">{jobs.length} อัตรา</span>
          </div>

          {/* Job Cards */}
          <div className="space-y-3">
            {jobs.map((job) => (
              <div 
                key={job.id} 
                className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100 cursor-pointer active:scale-[0.98] transition-all hover:shadow-md"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-black text-gray-800 text-base leading-tight pr-4">
                    {job.title}
                  </h3>
                  <span className="bg-blue-50 text-blue-600 text-[9px] font-bold px-2 py-1 rounded-md whitespace-nowrap">
                    {job.type}
                  </span>
                </div>
                
                <p className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-1">
                  🏬 {job.employer}
                </p>

                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-[11px] text-gray-600 font-medium">
                    <span>📍</span> {job.location}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#F05D40] font-black">
                    <span>💰</span> {job.wage}
                  </div>
                </div>

                {/* Tags & Action */}
                <div className="flex justify-between items-center border-t border-gray-50 pt-3">
                  <div className="flex gap-1.5 flex-wrap">
                    {job.tags.map((tag, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-500 text-[9px] font-bold px-2 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-[9px] text-gray-400 font-medium">{job.postedAt}</span>
                </div>
              </div>
            ))}
          </div>
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
           <button onClick={() => router.push('/history')} className="flex flex-col items-center gap-1 opacity-40">
             <span className="text-xl">📜</span><span className="text-[10px] font-bold text-gray-500">ประวัติ</span>
           </button>
           <button onClick={() => router.push('/profile')} className="flex flex-col items-center gap-1 opacity-40">
             <span className="text-xl">👤</span><span className="text-[10px] font-bold text-gray-500">ฉัน</span>
           </button>
        </div>
      </div>
    </div>
  );
}

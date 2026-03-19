'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function WinOnlinePage() {
  const router = useRouter();
  const [taskType, setTaskType] = useState('ride'); // ride, buy, deliver
  
  // States สำหรับฟอร์ม
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [details, setDetails] = useState('');

  // 🚧 Mock Data สำหรับพี่วิน/รถที่กำลังออนไลน์ใกล้เคียง
  const NEARBY_RIDERS = [
    { id: 'r1', name: 'พี่วินัย', distance: '0.8 กม.', rating: 4.8, type: 'มอเตอร์ไซค์', icon: '🛵' },
    { id: 'r2', name: 'ลุงสมชาย', distance: '1.2 กม.', rating: 4.9, type: 'รถกระบะ', icon: '🛻' },
    { id: 'r3', name: 'เอกชัย', distance: '2.5 กม.', rating: 4.7, type: 'มอเตอร์ไซค์', icon: '🛵' },
    { id: 'r4', name: 'น้าเดช', distance: '3.1 กม.', rating: 5.0, type: 'รถพ่วงข้าง', icon: '🛺' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('ระบบกำลังส่งงานให้คนขับในรัศมี 5 กม.... (รอเชื่อม API)');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pb-24">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-x-hidden">
        
        {/* ✅ 🟠 Header ปรับเป็น "การ์ดลอย" สีส้ม-ทอง มุมมน 4 ด้าน */}
        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-[2.5rem] pt-8 pb-6 px-6 shadow-md relative z-10 m-3 mt-4">
          <div className="flex items-center gap-3 mb-2 px-2">
            <button onClick={() => router.push('/')} className="text-white font-bold text-lg active:scale-90 transition-transform">←</button>
            <h1 className="text-xl font-black text-white tracking-tight">วินออนไลน์ 🛵</h1>
          </div>
          <p className="text-white/90 text-xs font-medium pl-10">เรียกวิน ฝากซื้อของ ส่งพัสดุด่วนในชุมชน</p>
        </div>

        <main className="flex-1 relative z-20 space-y-4 px-5">
          
          {/* 🔘 เลือกประเภทงาน (เปลี่ยน Active เป็นสีส้ม #EE4D2D) */}
          <div className="bg-white rounded-[2rem] p-2 shadow-sm border border-gray-100 flex justify-between gap-2">
            <button 
              onClick={() => setTaskType('ride')}
              className={`flex-1 py-3.5 rounded-[1.5rem] text-xs font-bold transition-all flex flex-col items-center gap-1 ${taskType === 'ride' ? 'bg-[#EE4D2D] text-white shadow-md' : 'bg-transparent text-gray-500 hover:bg-gray-50'}`}
            >
              <span className="text-xl">🛵</span>
              รับ-ส่งคน
            </button>
            <button 
              onClick={() => setTaskType('buy')}
              className={`flex-1 py-3.5 rounded-[1.5rem] text-xs font-bold transition-all flex flex-col items-center gap-1 ${taskType === 'buy' ? 'bg-[#EE4D2D] text-white shadow-md' : 'bg-transparent text-gray-500 hover:bg-gray-50'}`}
            >
              <span className="text-xl">🥡</span>
              ฝากซื้อของ
            </button>
            <button 
              onClick={() => setTaskType('deliver')}
              className={`flex-1 py-3.5 rounded-[1.5rem] text-xs font-bold transition-all flex flex-col items-center gap-1 ${taskType === 'deliver' ? 'bg-[#EE4D2D] text-white shadow-md' : 'bg-transparent text-gray-500 hover:bg-gray-50'}`}
            >
              <span className="text-xl">📦</span>
              ส่งพัสดุ
            </button>
          </div>

          {/* 📍 สถานะรถใกล้เคียง */}
          <div className="pt-2">
            <h2 className="text-[11px] font-black text-gray-800 mb-3 px-1 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="text-[#EE4D2D] text-base animate-pulse">📍</span> รถที่พร้อมรับงานใกล้คุณ
              </span>
              <span className="text-gray-400 font-medium">รัศมี 5 กม.</span>
            </h2>
            
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x hide-scrollbar">
              {NEARBY_RIDERS.map((rider) => (
                <div key={rider.id} className="bg-white min-w-[130px] p-3 rounded-2xl shadow-sm border border-gray-100 snap-start flex flex-col hover:border-[#EE4D2D]/30 transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                     <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-xl border border-orange-100 shrink-0">
                       {rider.icon}
                     </div>
                     <span className="bg-green-100 text-green-600 text-[8px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm border border-green-200">
                       <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> ว่าง
                     </span>
                  </div>
                  <h3 className="font-bold text-gray-800 text-xs truncate">{rider.name}</h3>
                  <div className="flex items-center justify-between mt-1">
                     <span className="text-[10px] font-black text-[#EE4D2D]">{rider.distance}</span>
                     <div className="flex items-center gap-0.5">
                       <span className="text-yellow-400 text-[9px]">★</span>
                       <span className="text-[9px] font-bold text-gray-600">{rider.rating}</span>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 📝 ฟอร์มเรียกวิน/โพสต์งาน */}
          <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 space-y-5">
            <h3 className="font-black text-gray-800 text-sm border-b border-gray-100 pb-3">ระบุรายละเอียดเพื่อเรียกใช้งาน</h3>
            <div className="relative">
              {/* เส้นประเชื่อมจุด A ไป B */}
              <div className="absolute left-3.5 top-8 bottom-8 w-0.5 border-l-2 border-dashed border-gray-200 z-0"></div>

              {/* จุดรับ */}
              <div className="relative z-10 flex items-start gap-3 mb-4">
                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-1 border-2 border-white shadow-sm">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                </div>
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl p-3 focus-within:border-[#EE4D2D] focus-within:ring-1 focus-within:ring-[#EE4D2D]/30 transition-all">
                  <label className="text-[10px] font-bold text-gray-500 block mb-0.5">
                    {taskType === 'buy' ? 'ซื้อที่ไหน (ร้านค้า)' : 'จุดรับ'}
                  </label>
                  <input 
                    type="text" 
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    placeholder={taskType === 'buy' ? 'เช่น ตลาดประแส, เซเว่นหน้าปากซอย' : 'ระบุตำแหน่งปัจจุบัน หรือชื่อสถานที่'}
                    className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none placeholder:font-medium placeholder:text-gray-400"
                    required
                  />
                </div>
              </div>

              {/* จุดส่ง */}
              <div className="relative z-10 flex items-start gap-3">
                <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center shrink-0 mt-1 border-2 border-white shadow-sm">
                  <span className="text-red-500 text-[10px]">📍</span>
                </div>
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl p-3 focus-within:border-[#EE4D2D] focus-within:ring-1 focus-within:ring-[#EE4D2D]/30 transition-all">
                  <label className="text-[10px] font-bold text-gray-500 block mb-0.5">
                    {taskType === 'buy' ? 'มาส่งที่ (จุดส่ง)' : 'จุดหมายปลายทาง'}
                  </label>
                  <input 
                    type="text" 
                    value={dropoff}
                    onChange={(e) => setDropoff(e.target.value)}
                    placeholder="ระบุบ้านเลขที่, ซอย, หรือจุดสังเกต"
                    className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none placeholder:font-medium placeholder:text-gray-400"
                    required
                  />
                </div>
              </div>
            </div>

            {/* รายละเอียดเพิ่มเติม */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 focus-within:border-[#EE4D2D] focus-within:ring-1 focus-within:ring-[#EE4D2D]/30 transition-all mt-4">
              <label className="text-[10px] font-bold text-gray-500 block mb-1.5 flex items-center gap-1">
                <span>📝</span> รายละเอียดเพิ่มเติม (ถ้ามี)
              </label>
              <textarea 
                rows={2}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={taskType === 'buy' ? 'พิมพ์รายการของที่ต้องการซื้อ เช่น ข้าวมันไก่ 2 กล่อง ไม่เอาหนัง' : 'เบอร์โทรติดต่อ, จุดสังเกตให้พี่วินหาง่ายขึ้น'}
                className="w-full bg-transparent text-xs font-medium text-gray-800 outline-none resize-none placeholder:text-gray-400"
              />
            </div>

            {/* แจ้งเตือนเรื่องราคา */}
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-start gap-2">
              <span className="text-orange-500 text-sm">💡</span>
              <p className="text-[10px] text-gray-600 font-medium leading-relaxed mt-0.5">
                เมื่อกดส่งคำขอ ระบบจะกระจายงานให้ผู้ขับขี่ในรัศมี 1-5 กม. ราคาค่าบริการขึ้นอยู่กับการตกลงกับคนขับ
              </p>
            </div>

            <button 
              type="submit"
              className="w-full bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] text-white py-4 rounded-full font-black text-base shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
            >
              ประกาศหารถ / ส่งคำขอ 🚀
            </button>
          </form>

        </main>

        {/* ✅ Bottom Navigation อัปเดตให้มี 6 ไอคอน (Active: งานด่วน) */}
        <div className="fixed bottom-0 w-full sm:max-w-2xl md:max-w-3xl bg-white/95 backdrop-blur-md border-t border-gray-100 px-1 py-4 flex justify-between items-center shadow-[0_-4px_25px_rgba(0,0,0,0.06)] rounded-t-[2.5rem] z-50">
          <NavItem icon="🏠" label="หน้าแรก" active={false} onClick={() => router.push('/')} />
          <NavItem icon="🛠️" label="บริการ" active={false} onClick={() => router.push('/services')} />
          <NavItem icon="📋" label="งานด่วน" active={true} onClick={() => {}} />
          <NavItem icon="📰" label="ข่าวสาร" active={false} onClick={() => router.push('/news')} />
          <NavItem icon="🎟️" label="ปองเจริญ" active={false} onClick={() => router.push('/coupons')} />
          <NavItem icon="👤" label="ฉัน" active={false} onClick={() => router.push('/profile')} />
        </div>

        <style dangerouslySetInnerHTML={{__html: `
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}} />
      </div>
    </div>
  );
}

// คอมโพเนนต์เมนูด้านล่าง ปรับปรุงใหม่ใช้ flex-1
function NavItem({ icon, label, active, onClick }: any) {
  return (
    <div onClick={onClick} className={`flex flex-col items-center gap-1.5 cursor-pointer transition-all ${active ? 'scale-110' : 'opacity-40 hover:opacity-100'} flex-1`}>
      <span className="text-[22px]">{icon}</span>
      <span className={`text-[9px] font-bold ${active ? 'text-[#EE4D2D]' : 'text-gray-500'} whitespace-nowrap`}>{label}</span>
      {active && <div className="w-1.5 h-1.5 bg-[#EE4D2D] rounded-full shadow-sm mt-0.5"></div>}
    </div>
  );
}

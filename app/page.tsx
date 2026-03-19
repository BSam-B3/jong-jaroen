'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function WinOnlinePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('urgent');
  const [taskType, setTaskType] = useState('ride'); // ride, buy, deliver
  
  // States สำหรับฟอร์ม
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [details, setDetails] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('ระบบกำลังค้นหาวินมอเตอร์ไซค์ในพื้นที่... (รอเชื่อม API)');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pb-24">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-x-hidden">
        
        {/* 🔴 Header (ปรับโทนสีให้ดูด่วน/Active มากขึ้น) */}
        <div className="bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] rounded-b-[2.5rem] pt-12 pb-8 px-6 shadow-md relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => router.push('/')} className="text-white font-bold text-lg active:scale-90 transition-transform">←</button>
            <h1 className="text-xl font-black text-white tracking-tight">วินออนไลน์ 🛵</h1>
          </div>
          <p className="text-white/90 text-xs font-medium pl-8">เรียกวิน ฝากซื้อของ ส่งพัสดุด่วนในชุมชน</p>
        </div>

        <main className="flex-1 relative z-20 -mt-4 space-y-5 px-5">
          
          {/* 🔘 เลือกประเภทงาน */}
          <div className="bg-white rounded-[2rem] p-2 shadow-sm border border-gray-100 flex justify-between gap-2">
            <button 
              onClick={() => setTaskType('ride')}
              className={`flex-1 py-3.5 rounded-[1.5rem] text-xs font-bold transition-all flex flex-col items-center gap-1 ${taskType === 'ride' ? 'bg-[#FF416C] text-white shadow-md' : 'bg-transparent text-gray-500 hover:bg-gray-50'}`}
            >
              <span className="text-xl">🛵</span>
              รับ-ส่งคน
            </button>
            <button 
              onClick={() => setTaskType('buy')}
              className={`flex-1 py-3.5 rounded-[1.5rem] text-xs font-bold transition-all flex flex-col items-center gap-1 ${taskType === 'buy' ? 'bg-[#FF416C] text-white shadow-md' : 'bg-transparent text-gray-500 hover:bg-gray-50'}`}
            >
              <span className="text-xl">🥡</span>
              ฝากซื้อของ
            </button>
            <button 
              onClick={() => setTaskType('deliver')}
              className={`flex-1 py-3.5 rounded-[1.5rem] text-xs font-bold transition-all flex flex-col items-center gap-1 ${taskType === 'deliver' ? 'bg-[#FF416C] text-white shadow-md' : 'bg-transparent text-gray-500 hover:bg-gray-50'}`}
            >
              <span className="text-xl">📦</span>
              ส่งพัสดุ
            </button>
          </div>

          {/* 📝 ฟอร์มเรียกวิน */}
          <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 space-y-5">
            
            <div className="relative">
              {/* เส้นประเชื่อมจุด A ไป B */}
              <div className="absolute left-3.5 top-8 bottom-8 w-0.5 border-l-2 border-dashed border-gray-200 z-0"></div>

              {/* จุดรับ */}
              <div className="relative z-10 flex items-start gap-3 mb-4">
                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-1 border-2 border-white shadow-sm">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                </div>
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl p-3 focus-within:border-[#FF416C] focus-within:ring-1 focus-within:ring-[#FF416C]/30 transition-all">
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
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl p-3 focus-within:border-[#FF416C] focus-within:ring-1 focus-within:ring-[#FF416C]/30 transition-all">
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
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 focus-within:border-[#FF416C] focus-within:ring-1 focus-within:ring-[#FF416C]/30 transition-all mt-4">
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
                ราคาค่าบริการขึ้นอยู่กับการตกลงกับคนขับ ระบบจะทำการค้นหาวินที่อยู่ใกล้ที่สุดเพื่อประเมินราคาให้คุณค่ะ
              </p>
            </div>

            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-[#FF4B2B] to-[#FF416C] text-white py-4 rounded-full font-black text-base shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
            >
              ค้นหาคนขับรถ / วินว่าง 🔍
            </button>
          </form>

        </main>

        {/* 🧭 Bottom Nav (Active: งานด่วน) */}
        <div className="fixed bottom-0 w-full sm:max-w-2xl md:max-w-3xl bg-white/95 backdrop-blur-md border-t border-gray-100 px-8 py-4 flex justify-between items-center shadow-[0_-4px_25px_rgba(0,0,0,0.06)] rounded-t-[2.5rem] z-50">
           <button onClick={() => router.push('/')} className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity"><span className="text-xl">🏠</span><span className="text-[10px] font-bold text-gray-500">หน้าแรก</span></button>
           <button onClick={() => router.push('/services')} className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity"><span className="text-xl">🛠️</span><span className="text-[10px] font-bold text-gray-500">บริการ</span></button>
           
           {/* ✅ Active: งานด่วน */}
           <div className="flex flex-col items-center gap-1 scale-110">
             <span className="text-xl">📋</span>
             <span className="text-[10px] font-bold text-[#FF416C]">งานด่วน</span>
             <div className="w-1.5 h-1.5 bg-[#FF416C] rounded-full shadow-sm"></div>
           </div>

           <button onClick={() => router.push('/history')} className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity"><span className="text-xl">📜</span><span className="text-[10px] font-bold text-gray-500">ประวัติ</span></button>
           <button onClick={() => router.push('/profile/edit')} className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity"><span className="text-xl">👤</span><span className="text-[10px] font-bold text-gray-500">ฉัน</span></button>
        </div>

      </div>
    </div>
  );
}

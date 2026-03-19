'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HistoryPage() {
  const router = useRouter();
  const [roleTab, setRoleTab] = useState<'customer' | 'provider'>('customer');

  // 🚧 Mock Data (จำลองข้อมูลจาก get_job_history)
  const MOCK_HISTORY = {
    customer: [
      { id: 'req1', category: 'ฝากซื้อของ', status: 'completed', price: '40', date: '19 มี.ค. 2569 - 10:30', details: 'ข้าวมันไก่เจ๊หมวย 2 กล่อง', partnerName: 'พี่วินัย (ผู้รับงาน)' },
      { id: 'req2', category: 'ล้างแอร์', status: 'pending', price: '500', date: '19 มี.ค. 2569 - 11:45', details: 'แอร์ผนัง 1 ตัว', partnerName: 'กำลังหาช่าง...' },
      { id: 'req3', category: 'รับ-ส่งคน', status: 'cancelled', price: '30', date: '18 มี.ค. 2569 - 08:15', details: 'ไปคิวรถตู้', partnerName: '-' },
    ],
    provider: [
      { id: 'job1', category: 'ช่างไฟ', status: 'completed', price: '300', date: '17 มี.ค. 2569 - 14:00', details: 'ซ่อมปลั๊กไฟช็อต', partnerName: 'ป้าใจ (ผู้จ้าง)' },
      { id: 'job2', category: 'รับ-ส่งคน', status: 'accepted', price: '50', date: '19 มี.ค. 2569 - 11:50', details: 'ไปส่งที่วัดปากน้ำประแส', partnerName: 'น้องบี (ผู้จ้าง)' },
    ]
  };

  const currentData = MOCK_HISTORY[roleTab];

  // ฟังก์ชันแปลงสถานะเป็นสีและข้อความ
  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'pending': return { text: '⏳ กำลังหาคนรับงาน', color: 'bg-orange-100 text-orange-600 border-orange-200' };
      case 'accepted': return { text: '🏃‍♂️ กำลังดำเนินการ', color: 'bg-blue-100 text-blue-600 border-blue-200' };
      case 'completed': return { text: '✅ สำเร็จแล้ว', color: 'bg-green-100 text-green-600 border-green-200' };
      case 'cancelled': return { text: '❌ ยกเลิก', color: 'bg-gray-100 text-gray-500 border-gray-200' };
      default: return { text: status, color: 'bg-gray-100 text-gray-600 border-gray-200' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pb-24">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-x-hidden">
        
        {/* 🟠 Header */}
        <div className="bg-gradient-to-br from-[#EE4D2D] to-[#FF7337] rounded-b-[2.5rem] pt-12 pb-6 px-6 shadow-md relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => router.push('/')} className="text-white font-bold text-lg active:scale-90 transition-transform">←</button>
            <h1 className="text-xl font-black text-white tracking-tight">ประวัติการใช้งาน</h1>
          </div>

          {/* 🔄 Tabs: สลับบทบาท */}
          <div className="bg-white/20 p-1 rounded-2xl flex backdrop-blur-sm border border-white/30">
            <button 
              onClick={() => setRoleTab('customer')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${roleTab === 'customer' ? 'bg-white text-[#EE4D2D] shadow-sm' : 'text-white hover:bg-white/10'}`}
            >
              🛍️ งานที่ฉันจ้าง
            </button>
            <button 
              onClick={() => setRoleTab('provider')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${roleTab === 'provider' ? 'bg-white text-[#EE4D2D] shadow-sm' : 'text-white hover:bg-white/10'}`}
            >
              💼 งานที่ฉันรับ
            </button>
          </div>
        </div>

        <main className="flex-1 relative z-20 space-y-4 p-5 mt-2">
          
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-sm font-black text-gray-800 flex items-center gap-2">
              <span className="text-[#EE4D2D] text-lg">📜</span> รายการล่าสุด
            </h2>
            <span className="text-[10px] text-gray-500 font-bold">ทั้งหมด {currentData.length} รายการ</span>
          </div>

          <div className="space-y-3">
            {currentData.map((item) => {
              const statusInfo = getStatusDisplay(item.status);
              return (
                <div key={item.id} className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 cursor-pointer active:scale-[0.98] transition-all hover:border-[#EE4D2D]/30">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-black text-gray-800 text-sm">{item.category}</h3>
                      <p className="text-[9px] text-gray-400 font-medium mt-0.5">{item.date}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-3 py-1.5 rounded-full border ${statusInfo.color}`}>
                      {statusInfo.text}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3 mb-3 border border-gray-100">
                    <p className="text-[11px] text-gray-600 font-medium line-clamp-2">
                      <span className="font-bold text-gray-700">รายละเอียด:</span> {item.details}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 bg-orange-50 rounded-full flex items-center justify-center text-xs border border-orange-100 shrink-0">
                        {roleTab === 'customer' ? '👷' : '👤'}
                      </div>
                      <span className="text-[10px] font-bold text-gray-700 truncate max-w-[120px]">
                        {item.partnerName}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-gray-400 font-medium">ราคา</span>
                      <span className="text-sm font-black text-[#EE4D2D] ml-1">฿{item.price}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {currentData.length === 0 && (
              <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <div className="text-5xl mb-3 opacity-40">📭</div>
                <p className="font-bold text-gray-700 text-sm">ยังไม่มีประวัติการทำรายการ</p>
                <p className="text-[10px] text-gray-500 mt-1">เริ่มต้นใช้งานแอปเพื่อดูประวัติที่นี่นะคะ</p>
              </div>
            )}
          </div>

        </main>

        {/* 🧭 Bottom Nav (Active: ประวัติ) */}
        <div className="fixed bottom-0 w-full sm:max-w-2xl md:max-w-3xl bg-white/95 backdrop-blur-md border-t border-gray-100 px-8 py-4 flex justify-between items-center shadow-[0_-4px_25px_rgba(0,0,0,0.06)] rounded-t-[2.5rem] z-50">
           <button onClick={() => router.push('/')} className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity"><span className="text-xl">🏠</span><span className="text-[10px] font-bold text-gray-500">หน้าแรก</span></button>
           <button onClick={() => router.push('/services')} className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity"><span className="text-xl">🛠️</span><span className="text-[10px] font-bold text-gray-500">บริการ</span></button>
           <button onClick={() => router.push('/win-online')} className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity"><span className="text-xl">📋</span><span className="text-[10px] font-bold text-gray-500">งานด่วน</span></button>
           
           {/* ✅ Active: ประวัติ */}
           <div className="flex flex-col items-center gap-1 scale-110">
             <span className="text-xl">📜</span>
             <span className="text-[10px] font-bold text-[#EE4D2D]">ประวัติ</span>
             <div className="w-1.5 h-1.5 bg-[#EE4D2D] rounded-full shadow-sm"></div>
           </div>

           <button onClick={() => router.push('/profile/edit')} className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity"><span className="text-xl">👤</span><span className="text-[10px] font-bold text-gray-500">ฉัน</span></button>
        </div>

      </div>
    </div>
  );
}

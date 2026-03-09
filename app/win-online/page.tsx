'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function FastDeliveryPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    // จำลองข้อมูลผู้ขับขี่ที่มีการตรวจสอบใบขับขี่แล้ว
    setDrivers([
      { 
        id: 1, 
        name: 'พี่สมชาย', 
        type: 'มอเตอร์ไซค์', 
        img: 'https://via.placeholder.com/150', // รูปตัวอย่างรถ
        license: 'มีใบขับขี่รถจักรยานยนต์ส่วนบุคคล',
        distance: '0.3 กม.', 
        status: 'พร้อมรับงาน'
      },
      { 
        id: 2, 
        name: 'น้าจัน', 
        type: 'รถยนต์ (เก๋ง)', 
        img: 'https://via.placeholder.com/150',
        license: 'มีใบขับขี่รถยนต์ส่วนบุคคล',
        distance: '0.8 กม.', 
        status: 'พร้อมรับงาน'
      },
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      {/* 🧩 ตัวแอป (Responsive Container) */}
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen pb-28 shadow-xl relative flex flex-col">
        
        {/* 🟠 Header - Fast Delivery */}
        <div className="bg-[#F05D40] rounded-b-[2.5rem] p-6 pt-12 shadow-sm">
          <div className="flex justify-between items-center mb-4 px-2">
            <button onClick={() => router.push('/')} className="text-white text-sm font-bold flex items-center gap-1">
              ← กลับ
            </button>
            <h1 className="text-xl font-black text-white text-center flex-1 mr-8 tracking-tight">Fast Delivery รับ-ส่ง ด่วน 🚀</h1>
          </div>

          {/* 🔘 แถบแสดงสถานะ (เอาสวิตช์ออกแล้ว) */}
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20 mt-4 mx-2">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white text-[10px] font-medium opacity-80 uppercase tracking-widest">System Status</p>
                <h2 className="text-lg font-black text-green-300 flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  ระบบเปิดรับงานตามปกติ
                </h2>
              </div>
              <div className="text-right">
                <span className="text-white/60 text-[10px] block">อัปเดตล่าสุด</span>
                <span className="text-white font-bold text-xs">10:52 น.</span>
              </div>
            </div>
          </div>
        </div>

        {/* 📋 รายชื่อผู้ให้บริการ */}
        <div className="p-5 space-y-5">
          <div className="flex justify-between items-center px-2">
            <h2 className="font-bold text-gray-800 text-sm">ผู้ให้บริการในพื้นที่ (ระยะ 1 กม.)</h2>
            <span className="text-[10px] text-gray-400 font-medium">เรียงตามความใกล้</span>
          </div>

          <div className="space-y-4">
            {drivers.map((driver) => (
              <div 
                key={driver.id} 
                className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden active:scale-[0.98] transition-transform cursor-pointer"
                onClick={() => alert(`ดูข้อมูลเพิ่มเติมของ ${driver.name}`)}
              >
                <div className="p-4 flex gap-4">
                  {/* รูปภาพรถ/ผู้ขับ */}
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl flex-shrink-0 overflow-hidden border border-gray-50 shadow-inner">
                    <img src={driver.img} alt="Vehicle" className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-800 text-base">{driver.name}</h3>
                        <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">{driver.type}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                        📍 ห่างจากคุณ {driver.distance}
                      </p>
                    </div>
                    
                    {/* ข้อมูลใบขับขี่ */}
                    <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-lg w-fit mt-2">
                      <span className="text-[9px] font-black italic">✓ Verified License</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-5 py-3 flex justify-between items-center border-t border-gray-100">
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Click to view profile</span>
                  <button className="bg-[#0082FA] text-white text-[10px] font-black px-6 py-2 rounded-full shadow-md active:scale-90 transition-all">
                    เรียกใช้งานด่วน ⚡
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ข้อความแจ้งเตือนความปลอดภัย */}
          <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 mx-2">
            <p className="text-[10px] text-orange-700 leading-relaxed font-medium">
              ⚠️ **หมายเหตุ:** ผู้ขับขี่ทุกคนในระบบ **Fast Delivery** ต้องผ่านการยืนยันตัวตนและมีใบอนุญาตขับขี่ที่ถูกต้องตามประเภทรถเท่านั้น เพื่อความปลอดภัยสูงสุดของคุณในทุกการเดินทางและรับ-ส่งของค่ะ
            </p>
          </div>
        </div>

        {/* 🧭 Bottom Nav (เหมือนหน้าแรก) */}
        <div className="fixed bottom-0 w-full sm:max-w-2xl md:max-w-3xl bg-white/90 backdrop-blur-md border-t border-gray-100 px-8 py-4 flex justify-between items-center shadow-lg rounded-t-[2.5rem] z-50">
           <button onClick={() => router.push('/')} className="flex flex-col items-center gap-1 opacity-40">
             <span className="text-xl">🏠</span>
             <span className="text-[10px] font-bold text-gray-500">หน้าแรก</span>
           </button>
           <div className="flex flex-col items-center gap-1">
             <span className="text-xl">📋</span>
             <span className="text-[10px] font-bold text-[#F05D40]">คิวรถ</span>
             <div className="w-1.5 h-1.5 bg-[#F05D40] rounded-full"></div>
           </div>
           <button onClick={() => router.push('/history')} className="flex flex-col items-center gap-1 opacity-40">
             <span className="text-xl">📜</span>
             <span className="text-[10px] font-bold text-gray-500">ประวัติ</span>
           </button>
           <button onClick={() => router.push('/profile')} className="flex flex-col items-center gap-1 opacity-40">
             <span className="text-xl">👤</span>
             <span className="text-[10px] font-bold text-gray-500">ฉัน</span>
           </button>
        </div>
      </div>
    </div>
  );
}

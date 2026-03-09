'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function CarQueuePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
        // เช็คสถานะปัจจุบันของผู้ขับใน Database (ถ้ามี)
      }
    };
    checkUser();

    // จำลองข้อมูลคิวรถ (สเต็ปถัดไปเราจะดึงจาก Supabase จริงค่ะ)
    setDrivers([
      { id: 1, name: 'พี่สมชาย', type: 'มอเตอร์ไซค์', distance: '0.3 กม.', time: '10:00' },
      { id: 2, name: 'น้าจัน', type: 'รถยนต์', distance: '0.8 กม.', time: '10:05' },
    ]);
  }, [router]);

  const toggleOnline = () => {
    setIsOnline(!isOnline);
    // TODO: ส่งคำสั่งไปอัปเดตสถานะใน Supabase table 'driver_queue'
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen pb-28 shadow-xl relative flex flex-col">
        
        {/* 🟠 Header */}
        <div className="bg-[#F05D40] rounded-b-[2.5rem] p-6 pt-12 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => router.push('/')} className="text-white text-sm font-bold flex items-center gap-1">
              ← กลับ
            </button>
            <h1 className="text-xl font-black text-white text-center flex-1 mr-8">คิวรถออนไลน์ 🛵🚗</h1>
          </div>

          {/* 🔘 สวิตช์เปิดรับงาน (สำหรับผู้ขับ) */}
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20 mt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white text-xs font-medium">สถานะการรับงานของคุณ</p>
                <h2 className={`text-lg font-black ${isOnline ? 'text-green-300' : 'text-white/60'}`}>
                  {isOnline ? '● กำลังออนไลน์' : '○ ออฟไลน์'}
                </h2>
              </div>
              <button 
                onClick={toggleOnline}
                className={`w-16 h-8 rounded-full transition-all relative ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all ${isOnline ? 'left-9' : 'left-1'}`}></div>
              </button>
            </div>
          </div>
        </div>

        {/* 📋 รายชื่อคิวรถ (รัศมี 1 กม.) */}
        <div className="p-5 space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="font-bold text-gray-800">รถว่างพร้อมบริการ (ในระยะ 1 กม.)</h2>
            <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-bold">เรียงตามลำดับคิว</span>
          </div>

          <div className="space-y-3">
            {drivers.map((driver, index) => (
              <div key={driver.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-2xl">
                    {driver.type === 'มอเตอร์ไซค์' ? '🛵' : '🚗'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm">{driver.name} <span className="text-[10px] font-normal text-gray-400">#{index + 1}</span></h3>
                    <p className="text-[10px] text-gray-500 font-medium">ระยะห่าง: {driver.distance}</p>
                  </div>
                </div>
                <button className="bg-[#0082FA] text-white text-[10px] font-black px-5 py-2 rounded-full shadow-sm active:scale-95 transition-transform">
                  เรียกใช้ ⚡
                </button>
              </div>
            ))}

            {isOnline && (
              <div className="bg-green-50 p-4 rounded-3xl border border-green-200 flex items-center justify-center gap-2">
                <span className="animate-pulse">🟢</span>
                <p className="text-green-700 text-xs font-bold">คุณอยู่ในคิวอันดับที่ {drivers.length + 1}</p>
              </div>
            )}
          </div>
        </div>

        {/* 🧭 Bottom Nav (เหมือนหน้าแรก) */}
        <div className="fixed bottom-0 w-full sm:max-w-2xl md:max-w-3xl bg-white/90 backdrop-blur-md border-t border-gray-100 px-8 py-4 flex justify-between items-center shadow-lg rounded-t-[2.5rem]">
           {/* ใส่ NavItem เหมือนหน้าแรกค่ะ */}
           <button onClick={() => router.push('/')} className="flex flex-col items-center gap-1 opacity-40">
             <span className="text-xl">🏠</span>
             <span className="text-[10px] font-bold">หน้าแรก</span>
           </button>
           <div className="flex flex-col items-center gap-1">
             <span className="text-xl">📋</span>
             <span className="text-[10px] font-bold text-[#F05D40]">คิวรถ</span>
             <div className="w-1.5 h-1.5 bg-[#F05D40] rounded-full"></div>
           </div>
           {/* ... เมนูอื่นๆ ... */}
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/app/components/BottomNav';
import MapPinPicker from '@/app/components/MapPinPicker'; // ดึงระบบแผนที่มาใช้

export default function WinOnlinePage() {
  const router = useRouter();
  
  // States สำหรับเก็บข้อมูลฟอร์ม
  const [vehicleType, setVehicleType] = useState('motorcycle');
  const [taskDetail, setTaskDetail] = useState('');
  const [note, setNote] = useState('');
  
  // States สำหรับพิกัดแผนที่
  const [origin, setOrigin] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [destination, setDestination] = useState<{ address: string; lat: number; lng: number } | null>(null);
  
  // States สำหรับราคาและสถานะ
  const [fareData, setFareData] = useState<{ distance_km: number; final_price: number } | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ฟังก์ชันคำนวณราคาอัตโนมัติเมื่อเลือกสถานที่ครบ 2 จุด
  useEffect(() => {
    const calculateFare = async () => {
      if (origin && destination) {
        setIsCalculating(true);
        try {
          const { data, error } = await supabase.functions.invoke('calculate-fare', {
            body: { 
              originLat: origin.lat, 
              originLng: origin.lng, 
              destLat: destination.lat, 
              destLng: destination.lng 
            }
          });

          if (error) throw error;
          if (data) setFareData(data);
        } catch (error) {
          console.error('Error calculating fare:', error);
          // Fallback กรณี Edge Function มีปัญหา ให้คิดราคาคร่าวๆ ไปก่อน
          setFareData({ distance_km: 0, final_price: 35 }); 
        } finally {
          setIsCalculating(false);
        }
      }
    };

    calculateFare();
  }, [origin, destination]);

  // ฟังก์ชันกดยืนยันสร้างงาน
  const handleSubmitJob = async () => {
    if (!origin || !destination || !taskDetail) return alert('กรุณากรอกข้อมูลให้ครบถ้วนค่ะ');
    
    setIsSubmitting(true);
    try {
      // ดึง User ปัจจุบัน
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // บันทึกลงตาราง express_jobs
      const { error } = await supabase.from('express_jobs').insert({
        customer_id: user.id,
        vehicle_type: vehicleType,
        task_detail: taskDetail,
        note: note,
        origin_address: origin.address,
        origin_lat: origin.lat,
        origin_lng: origin.lng,
        dest_address: destination.address,
        dest_lat: destination.lat,
        dest_lng: destination.lng,
        distance_km: fareData?.distance_km || 0,
        price: fareData?.final_price || 0,
        status: 'searching'
      });

      if (error) throw error;
      
      alert('สร้างงานด่วนสำเร็จ! กำลังค้นหาคนขับ...');
      router.push('/'); // กลับหน้าแรกหรือไปหน้าติดตามสถานะ
    } catch (error) {
      console.error('Error submitting job:', error);
      alert('เกิดข้อผิดพลาดในการสร้างงาน กรุณาลองใหม่อีกครั้งค่ะ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-x-hidden">
        
        {/* Header */}
        <div className="bg-[#EE4D2D] text-white p-6 pt-10 rounded-b-[2.5rem] shadow-md z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all">
              ←
            </button>
            <h1 className="text-xl font-black">เรียกงานด่วน 🚀</h1>
          </div>
          <p className="text-white/80 text-xs mt-2 ml-11">เรียกวิน ส่งของ หรือฝากซื้อของในชุมชน</p>
        </div>

        {/* Content Wrapper (เว้นที่ให้ BottomNav) */}
        <div className="flex-1 overflow-y-auto px-5 py-6 pb-32 space-y-6">
          
          {/* ส่วนที่ 1: เลือกประเภทรถ */}
          <section className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-50">
            <h2 className="text-sm font-bold text-gray-800 mb-3">ประเภทรถ <span className="text-[#EE4D2D]">*</span></h2>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {['motorcycle', 'car', 'pickup'].map((type) => (
                <button 
                  key={type}
                  onClick={() => setVehicleType(type)}
                  className={`flex flex-col items-center justify-center min-w-[80px] p-3 rounded-2xl border-2 transition-all ${
                    vehicleType === type ? 'border-[#EE4D2D] bg-orange-50 text-[#EE4D2D]' : 'border-gray-100 bg-white text-gray-500'
                  }`}
                >
                  <span className="text-2xl mb-1">
                    {type === 'motorcycle' ? '🛵' : type === 'car' ? '🚗' : '🛻'}
                  </span>
                  <span className="text-[10px] font-bold">
                    {type === 'motorcycle' ? 'มอเตอร์ไซค์' : type === 'car' ? 'รถเก๋ง' : 'กระบะ'}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* ส่วนที่ 2: รายละเอียดงาน */}
          <section className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-50 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-gray-800 mb-2">ให้ทำอะไร? <span className="text-[#EE4D2D]">*</span></h2>
              <input 
                type="text" 
                value={taskDetail}
                onChange={(e) => setTaskDetail(e.target.value)}
                placeholder="เช่น ไปรับที่ บขส., ฝากซื้อข้าวผัด..." 
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]"
              />
            </div>
          </section>

          {/* ส่วนที่ 3: แผนที่และการคำนวณราคา */}
          <section className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-50 space-y-4">
            <h2 className="text-sm font-bold text-gray-800 mb-2">สถานที่ <span className="text-[#EE4D2D]">*</span></h2>
            
            <div className="space-y-4 relative">
              {/* เส้นประเชื่อมจุดเชื่อม */}
              <div className="absolute left-[19px] top-[40px] bottom-[40px] w-0.5 border-l-2 border-dashed border-gray-300"></div>
              
            <MapPinPicker 
  label="📍 จุดรับ / ร้านค้า / จุดเริ่มต้น" 
  placeholder="ค้นหาสถานที่ต้นทาง..." 
  onLocationSelect={(loc: any) => setOrigin(loc)} 
/>
<MapPinPicker 
  label="📍 จุดส่ง / ปลายทาง" 
  placeholder="ค้นหาสถานที่ปลายทาง..." 
  onLocationSelect={(loc: any) => setDestination(loc)} 
/>
            </div>

            {/* กล่องแสดงราคา */}
            {(isCalculating || fareData) && (
              <div className="mt-4 bg-orange-50 border border-orange-100 rounded-2xl p-4 flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-orange-600">ราคาประมาณการ (รวม GP 3%)</p>
                  <p className="text-xs text-gray-600">ระยะทาง: {isCalculating ? 'กำลังคำนวณ...' : `${fareData?.distance_km.toFixed(1)} กม.`}</p>
                </div>
                <div className="text-right">
                  {isCalculating ? (
                    <div className="w-16 h-6 bg-orange-200 animate-pulse rounded-md"></div>
                  ) : (
                    <p className="text-xl font-black text-[#EE4D2D]">฿{fareData?.final_price}</p>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* ปุ่มยืนยัน (Floating Button เหนือ BottomNav) */}
          <button 
            onClick={handleSubmitJob}
            disabled={!origin || !destination || !taskDetail || isSubmitting}
            className={`w-full py-4 rounded-2xl text-white font-bold text-sm shadow-lg transition-all ${
              (!origin || !destination || !taskDetail) ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#EE4D2D] active:scale-95'
            }`}
          >
            {isSubmitting ? 'กำลังสร้างงาน...' : 'ยืนยันเรียกงานด่วน'}
          </button>

        </div>

        {/* Global Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
}

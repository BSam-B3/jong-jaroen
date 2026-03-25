'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface ExpressJob {
  id: string;
  title: string;
  job_type: string;
  vehicle_type: string;
  pickup_location: string;
  dropoff_location: string;
  note: string | null;
  distance_km: number | null;
  goods_price: number | null;
  offered_price: number | null;
  status: string;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

export default function WinOnlinePage() {
  const router = useRouter();
  
  const [jobs, setJobs] = useState<ExpressJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [pickingType, setPickingType] = useState<'pickup' | 'dropoff'>('pickup');
  const [searchQuery, setSearchQuery] = useState('');

  // Form States
  const [jobType, setJobType] = useState<'ride' | 'buy' | 'deliver'>('ride');
  // 🚐 ถอดซาเล้ง เพิ่ม van (รถตู้)
  const [vehicleType, setVehicleType] = useState<'motorcycle' | 'car' | 'suv' | 'van' | 'pickup'>('motorcycle');
  const [title, setTitle] = useState('');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [goodsPrice, setGoodsPrice] = useState('');
  const [note, setNote] = useState('');
  
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [showFareDetails, setShowFareDetails] = useState(false);
  const [fareBreakdown, setFareBreakdown] = useState({ base: 0, distanceFee: 0, fuelSurge: 0, gpFee: 0, total: 0 });

  const mockPlaces = [
    { name: 'โรงพยาบาลแกลง', detail: 'ตำบลทางเกวียน อำเภอแกลง' },
    { name: 'ตลาดสามย่าน แกลง', detail: 'ตลาดสดเทศบาล' },
    { name: 'เซเว่นอีเลฟเว่น สาขาตลาดแกลง', detail: 'ใกล้สี่แยกไฟแดง' },
    { name: 'โลตัส แกลง', detail: 'ถนนสุขุมวิท' }
  ];

  // -----------------------------------------------------------------
  // 🧮 คำนวณราคากลางอัจฉริยะ 
  // -----------------------------------------------------------------
  useEffect(() => {
    if (pickup && (dropoff || jobType === 'buy')) {
      const mockDistance = Math.floor(Math.random() * 10) + 2; 
      setDistanceKm(mockDistance);
      
      let baseFare = 20;
      let ratePerKm = 8;

      if (vehicleType === 'motorcycle') {
        baseFare = 20;
        if (mockDistance > 6 && mockDistance <= 40) ratePerKm = 7;
        if (mockDistance > 40) ratePerKm = 10;
      } 
      else if (vehicleType === 'car') {
        baseFare = 40; 
        ratePerKm = 12;
        if (mockDistance > 6 && mockDistance <= 40) ratePerKm = 10;
        if (mockDistance > 40) ratePerKm = 12;
      } 
      else if (vehicleType === 'suv') {
        baseFare = 60; 
        ratePerKm = 15;
        if (mockDistance > 6 && mockDistance <= 40) ratePerKm = 12;
        if (mockDistance > 40) ratePerKm = 15;
      } 
      else if (vehicleType === 'van') {
        // 🚐 รถตู้ (เหมาคัน หรือไปหลายคน)
        if (jobType === 'deliver') {
          baseFare = 200; // ส่งของ/ย้ายของด้วยรถตู้แพงหน่อย
          ratePerKm = 20;
        } else {
          baseFare = 100; // โดยสารกลุ่มใหญ่
          ratePerKm = 15;
        }
      } 
      else if (vehicleType === 'pickup') {
        if (jobType === 'deliver') {
          baseFare = 150; 
          ratePerKm = 20;
          if (mockDistance > 6 && mockDistance <= 40) ratePerKm = 15;
          if (mockDistance > 40) ratePerKm = 18;
        } else {
          baseFare = 50; 
          ratePerKm = 12;
          if (mockDistance > 6 && mockDistance <= 40) ratePerKm = 10;
          if (mockDistance > 40) ratePerKm = 12;
        }
      }
      
      const distanceFee = mockDistance * ratePerKm;
      const fuelMultiplier = 1.0; 
      
      const rawBeforeFuel = baseFare + distanceFee;
      const fuelSurge = (rawBeforeFuel * fuelMultiplier) - rawBeforeFuel;
      
      const rawFare = rawBeforeFuel + fuelSurge;
      const gpFee = rawFare * 0.03; 
      const finalFare = Math.ceil(rawFare + gpFee); 

      setFareBreakdown({ base: baseFare, distanceFee: distanceFee, fuelSurge: fuelSurge, gpFee: gpFee, total: finalFare });
    } else {
      setDistanceKm(0);
      setFareBreakdown({ base: 0, distanceFee: 0, fuelSurge: 0, gpFee: 0, total: 0 });
      setShowFareDetails(false);
    }
  }, [pickup, dropoff, jobType, vehicleType]); 

  // -----------------------------------------------------------------
  // 🔄 ดึงข้อมูลและบันทึก
  // -----------------------------------------------------------------
  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('express_jobs')
        .select(`*, profiles:customer_id (first_name, last_name)`)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setCurrentUser(session?.user || null));
    fetchJobs();
  }, []);

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return router.push('/auth/login');
    if (fareBreakdown.total <= 0 && jobType !== 'buy') return alert('กรุณาระบุจุดรับ-ส่งให้ครบค่ะ 📍');

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('express_jobs').insert({
        customer_id: currentUser.id,
        title: title,
        job_type: jobType,
        vehicle_type: vehicleType,
        pickup_location: pickup,
        dropoff_location: dropoff || null,
        note: note || null,
        distance_km: distanceKm, 
        goods_price: jobType === 'buy' && goodsPrice ? parseFloat(goodsPrice) : null,
        offered_price: fareBreakdown.total, 
      });

      if (error) throw error;

      setIsModalOpen(false);
      setTitle(''); setPickup(''); setDropoff(''); setGoodsPrice(''); setNote('');
      fetchJobs(); 
      alert('โพสต์งานด่วนสำเร็จ! 🚀');
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openLocationPicker = (type: 'pickup' | 'dropoff') => {
    setPickingType(type);
    setSearchQuery('');
    setIsLocationPickerOpen(true);
  };

  const selectLocation = (locationName: string) => {
    if (pickingType === 'pickup') setPickup(locationName);
    else setDropoff(locationName);
    setIsLocationPickerOpen(false);
  };

  const getVehicleIcon = (type: string) => {
    if (type === 'car') return '🚗';
    if (type === 'suv') return '🚙';
    if (type === 'van') return '🚐';
    if (type === 'pickup') return '🛻';
    return '🛵';
  };

  const getVehicleName = (type: string) => {
    if (type === 'car') return 'รถเก๋ง';
    if (type === 'suv') return 'รถครอบครัว';
    if (type === 'van') return 'รถตู้';
    if (type === 'pickup') return 'กระบะ';
    return 'มอเตอร์ไซค์';
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pb-24">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-x-hidden">
        
        {/* 🟠 Header */}
        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-b-[2.5rem] p-6 pt-12 shadow-md relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-white text-2xl font-black tracking-tight flex items-center gap-2">
              <span className="text-3xl">🛵</span> งานด่วนชุมชน
            </h1>
          </div>
          <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/20 text-white text-xs font-medium">
            📍 <strong className="text-yellow-200">ระบบราคากลางอัจฉริยะ:</strong> คำนวณค่าส่งตามระยะทาง GPS และประเภทยานพาหนะ
          </div>
        </div>

        {/* 📋 ฟีดงานด่วน */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide pb-24 z-0">
          <div className="flex justify-between items-end mb-2 px-1">
            <h2 className="text-sm font-black text-gray-800 tracking-tight">🟢 งานที่รอคนรับ</h2>
            <button onClick={fetchJobs} className="text-[10px] text-gray-500 hover:text-[#EE4D2D] font-bold">🔄 รีเฟรช</button>
          </div>

          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-gray-100 animate-pulse h-32"></div>)
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-8 text-center shadow-sm border border-gray-100 mt-4">
              <div className="text-5xl mb-4 opacity-50">💨</div>
              <h3 className="text-sm font-bold text-gray-800 mb-1">ยังไม่มีงานด่วนในขณะนี้</h3>
            </div>
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-gray-50 relative overflow-hidden active:scale-[0.99] transition-transform">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-xl shadow-inner border border-orange-100">
                      {getVehicleIcon(job.vehicle_type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm leading-tight pr-2">{job.title}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] text-gray-500 font-medium">โดย: {job.profiles?.first_name || 'ไม่ระบุ'}</span>
                        <span className="text-[8px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-sm font-bold">
                          {job.job_type === 'buy' ? 'ฝากซื้อ' : job.job_type === 'deliver' ? 'ส่งของ' : 'เรียกรถ'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-black text-[#EE4D2D] leading-none">
                      {job.offered_price ? `฿${job.offered_price}` : 'รอเสนอราคา'}
                    </div>
                    <div className="text-[8px] text-gray-400 font-bold mt-1 uppercase tracking-wider">ระยะทาง {job.distance_km || '?'} กม.</div>
                  </div>
                </div>

                <div className="space-y-1.5 bg-gray-50 p-3 rounded-xl border border-gray-100 mb-3">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 text-[10px] mt-0.5">🟢</span>
                    <p className="text-xs text-gray-700 font-medium leading-tight"><span className="text-[9px] text-gray-400 font-bold block">จุดรับ</span>{job.pickup_location}</p>
                  </div>
                  {job.dropoff_location && (
                    <div className="flex items-start gap-2 pt-1.5 border-t border-gray-200/50">
                      <span className="text-red-500 text-[10px] mt-0.5">🔴</span>
                      <p className="text-xs text-gray-700 font-medium leading-tight"><span className="text-[9px] text-gray-400 font-bold block">จุดส่ง</span>{job.dropoff_location}</p>
                    </div>
                  )}
                </div>

                {job.note && (
                  <div className="mb-4 bg-orange-50/50 p-2.5 rounded-lg border border-orange-100/50 flex items-start gap-2">
                    <span className="text-sm">📌</span>
                    <p className="text-[10px] text-gray-600 font-medium leading-relaxed italic">"{job.note}"</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button className="flex-1 bg-[#EE4D2D] text-white py-2.5 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-transform">รับงานนี้ ⚡</button>
                  <button className="flex-1 bg-white text-[#EE4D2D] border border-[#EE4D2D] py-2.5 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-transform">💬 แชทต่อรอง</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ➕ Floating Action Button */}
        <button onClick={() => setIsModalOpen(true)} className="fixed bottom-24 right-4 sm:right-[calc(50%-18rem)] w-14 h-14 bg-gradient-to-br from-[#EE4D2D] to-[#FF7337] rounded-full shadow-lg shadow-[#EE4D2D]/30 flex items-center justify-center text-white text-3xl active:scale-90 z-40 border-2 border-white">
          +
        </button>

        {/* ----------------------------------------------------------------- */}
        {/* 🧩 Modal โพสต์งานด่วนหลัก */}
        {/* ----------------------------------------------------------------- */}
        {isModalOpen && !isLocationPickerOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-2xl animate-slide-up relative max-h-[90vh] overflow-y-auto scrollbar-hide">
              
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200">✕</button>
              <h2 className="text-lg font-black text-gray-800 mb-4">เรียกงานด่วน 🚀</h2>

              {/* 🎯 1. เลือกประเภทงาน */}
              <div className="flex gap-2 mb-4">
                <button type="button" onClick={() => setJobType('ride')} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${jobType === 'ride' ? 'bg-orange-50 border-[#EE4D2D] text-[#EE4D2D]' : 'bg-white border-gray-200 text-gray-500'}`}>🛵 เรียกรถ</button>
                <button type="button" onClick={() => setJobType('buy')} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${jobType === 'buy' ? 'bg-orange-50 border-[#EE4D2D] text-[#EE4D2D]' : 'bg-white border-gray-200 text-gray-500'}`}>🍜 ฝากซื้อ</button>
                <button type="button" onClick={() => setJobType('deliver')} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${jobType === 'deliver' ? 'bg-orange-50 border-[#EE4D2D] text-[#EE4D2D]' : 'bg-white border-gray-200 text-gray-500'}`}>📦 ส่งของ</button>
              </div>

              <form onSubmit={handlePostJob} className="space-y-4">
                
                {/* 🚙 2. เลือกประเภทรถ (อัปเดตใหม่) */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-600 pl-1">ประเภทรถที่ต้องการ <span className="text-red-500">*</span></label>
                  <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-hide">
                    <div onClick={() => setVehicleType('motorcycle')} className={`shrink-0 w-[4.5rem] cursor-pointer border rounded-xl py-2 flex flex-col items-center gap-1 transition-all ${vehicleType === 'motorcycle' ? 'border-[#EE4D2D] bg-orange-50 ring-1 ring-[#EE4D2D]' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                      <span className="text-xl">🛵</span><span className={`text-[9px] font-bold ${vehicleType === 'motorcycle' ? 'text-[#EE4D2D]' : 'text-gray-500'}`}>มอเตอร์ไซค์</span>
                    </div>
                    <div onClick={() => setVehicleType('car')} className={`shrink-0 w-[4.5rem] cursor-pointer border rounded-xl py-2 flex flex-col items-center gap-1 transition-all ${vehicleType === 'car' ? 'border-[#EE4D2D] bg-orange-50 ring-1 ring-[#EE4D2D]' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                      <span className="text-xl">🚗</span><span className={`text-[9px] font-bold ${vehicleType === 'car' ? 'text-[#EE4D2D]' : 'text-gray-500'}`}>รถเก๋ง</span>
                    </div>
                    <div onClick={() => setVehicleType('suv')} className={`shrink-0 w-[4.5rem] cursor-pointer border rounded-xl py-2 flex flex-col items-center gap-1 transition-all ${vehicleType === 'suv' ? 'border-[#EE4D2D] bg-orange-50 ring-1 ring-[#EE4D2D]' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                      <span className="text-xl">🚙</span><span className={`text-[9px] font-bold ${vehicleType === 'suv' ? 'text-[#EE4D2D]' : 'text-gray-500'}`}>รถ 7 ที่นั่ง</span>
                    </div>
                    <div onClick={() => setVehicleType('van')} className={`shrink-0 w-[4.5rem] cursor-pointer border rounded-xl py-2 flex flex-col items-center gap-1 transition-all ${vehicleType === 'van' ? 'border-[#EE4D2D] bg-orange-50 ring-1 ring-[#EE4D2D]' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                      <span className="text-xl">🚐</span><span className={`text-[9px] font-bold ${vehicleType === 'van' ? 'text-[#EE4D2D]' : 'text-gray-500'}`}>รถตู้</span>
                    </div>
                    <div onClick={() => setVehicleType('pickup')} className={`shrink-0 w-[4.5rem] cursor-pointer border rounded-xl py-2 flex flex-col items-center gap-1 transition-all ${vehicleType === 'pickup' ? 'border-[#EE4D2D] bg-orange-50 ring-1 ring-[#EE4D2D]' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                      <span className="text-xl">🛻</span><span className={`text-[9px] font-bold ${vehicleType === 'pickup' ? 'text-[#EE4D2D]' : 'text-gray-500'}`}>รถกระบะ</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-600 pl-1">ให้ทำอะไร? <span className="text-red-500">*</span></label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น ไปส่งที่ บขส." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#EE4D2D] outline-none" />
                </div>

                {jobType === 'buy' && (
                  <div className="space-y-1.5 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                    <label className="text-[11px] font-bold text-blue-700 pl-1">ค่าสินค้า (โดยประมาณ)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-gray-400 font-bold">฿</span>
                      <input type="number" value={goodsPrice} onChange={(e) => setGoodsPrice(e.target.value)} placeholder="เพื่อเตรียมเงินสดสำรอง" className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm font-bold outline-none focus:border-blue-500" />
                    </div>
                  </div>
                )}
                
                <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-600 pl-1">จุดรับ / ร้านค้า / เริ่มต้น <span className="text-red-500">*</span></label>
                    <div onClick={() => openLocationPicker('pickup')} className={`w-full border rounded-xl px-4 py-3 text-sm cursor-pointer flex items-center justify-between transition-colors ${pickup ? 'border-orange-300 bg-orange-50 text-gray-800 font-bold' : 'border-gray-200 bg-white text-gray-400 hover:border-orange-300'}`}>
                      <span className="truncate pr-4">{pickup || 'ค้นหาสถานที่ หรือ ปักหมุดแผนที่'}</span><span className="text-lg">📍</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-600 pl-1">จุดส่ง / ปลายทาง</label>
                    <div onClick={() => openLocationPicker('dropoff')} className={`w-full border rounded-xl px-4 py-3 text-sm cursor-pointer flex items-center justify-between transition-colors ${dropoff ? 'border-orange-300 bg-orange-50 text-gray-800 font-bold' : 'border-gray-200 bg-white text-gray-400 hover:border-orange-300'}`}>
                      <span className="truncate pr-4">{dropoff || 'ค้นหาสถานที่ หรือ ปักหมุดแผนที่'}</span><span className="text-lg">📍</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-600 pl-1 flex justify-between">
                    <span>หมายเหตุถึงคนขับ (ถ้ามี)</span>
                    <span className="text-gray-400 font-normal">เช่น จุดสังเกต, มีของใหญ่</span>
                  </label>
                  <textarea 
                    value={note} onChange={(e) => setNote(e.target.value)} 
                    placeholder="รายละเอียดเพิ่มเติมให้คนขับเห็น..." rows={2}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#EE4D2D] outline-none resize-none"
                  ></textarea>
                </div>

                {/* 🧮 สรุปราคา */}
                <div className="pt-2">
                  <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center justify-between relative overflow-hidden">
                    <div>
                      <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">ราคาอิงตามระยะทาง</p>
                      <p className="text-xs text-gray-700 font-medium mt-0.5 flex items-center gap-1.5">
                        {distanceKm > 0 ? `ประมาณ ${distanceKm} กม.` : 'ระบุสถานที่เพื่อคำนวณ'}
                        <span className="bg-white border border-orange-200 text-orange-500 text-[8px] px-1.5 py-0.5 rounded-md font-bold">
                          {getVehicleName(vehicleType)}
                        </span>
                      </p>
                    </div>
                    <div className="text-2xl font-black text-[#EE4D2D]">{fareBreakdown.total > 0 ? `฿${fareBreakdown.total}` : '-'}</div>
                  </div>

                  {/* 🛡️ คำเตือนดักลูกค้าหัวหมอ (แสดงเมื่อเลือกรถใหญ่ + เรียกรถ/ซื้อของ) */}
                  {(vehicleType === 'pickup' || vehicleType === 'van') && (jobType === 'ride' || jobType === 'buy') && distanceKm > 0 && (
                    <div className="mt-2 bg-red-50 text-red-600 text-[9px] p-2.5 rounded-xl border border-red-100 flex gap-1.5 items-start">
                      <span className="text-sm">⚠️</span>
                      <p className="leading-relaxed">ราคานี้สำหรับ <b>การโดยสาร/ฝากซื้อ</b> เท่านั้น หากนำไปใช้บรรทุกสัมภาระขนาดใหญ่หรือย้ายบ้าน คนขับมีสิทธิ์ขอปรับราคาผ่านแชท หรือยกเลิกงานได้ทันที</p>
                    </div>
                  )}

                  {distanceKm > 0 && (
                    <div className="mt-3">
                      <button type="button" onClick={() => setShowFareDetails(!showFareDetails)} className="w-full flex items-center justify-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-orange-500 transition-colors">
                        <span className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center text-[8px] font-black">i</span>
                        {showFareDetails ? 'ซ่อนรายละเอียด' : 'ความโปร่งใสของราคา (Fare Breakdown)'}
                      </button>

                      {showFareDetails && (
                        <div className="mt-3 bg-white border border-gray-100 p-4 rounded-xl shadow-sm text-[10px] font-medium text-gray-600 space-y-2 animate-fade-in relative overflow-hidden">
                          <div className="absolute left-0 top-0 w-1 h-full bg-orange-200"></div>
                          <div className="flex justify-between items-center pl-2">
                            <span>เริ่ม {fareBreakdown.base} บ. + ระยะทาง ({distanceKm} กม.)</span>
                            <span className="font-bold text-gray-800">฿{(fareBreakdown.base + fareBreakdown.distanceFee).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center pl-2">
                            <span>ค่าปรับฐานราคาน้ำมัน (x1.0)</span>
                            <span className="font-bold text-gray-800">฿{fareBreakdown.fuelSurge.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center pl-2 text-orange-600 font-bold pt-1.5 border-t border-gray-50">
                            <span>ค่าบำรุงแพลตฟอร์ม (3%)</span>
                            <span>฿{fareBreakdown.gpFee.toFixed(2)}</span>
                          </div>
                          <div className="pt-2 mt-2 border-t border-gray-100 text-[9px] text-gray-400 text-center leading-relaxed">
                            {vehicleType === 'pickup' && jobType === 'deliver' ? (
                              <span className="text-[#EE4D2D] font-bold">💡 ใช้เรทบรรทุกสินค้า/ย้ายของ (Heavy Load)</span>
                            ) : (vehicleType === 'pickup' || vehicleType === 'van') && (jobType === 'ride' || jobType === 'buy') ? (
                              <span className="text-[#EE4D2D] font-bold">💡 ใช้เรทโดยสารทั่วไป (Passenger Rate)</span>
                            ) : (
                              <span>แอปทั่วไปเก็บค่าบริการ 20-30% แต่ <strong className="text-orange-500">จงเจริญ</strong> เก็บเพียง 3%</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button type="submit" disabled={isSubmitting || (fareBreakdown.total <= 0 && jobType !== 'buy')} className="w-full bg-[#EE4D2D] text-white font-black py-4 rounded-xl text-sm mt-4 shadow-md active:scale-95 disabled:opacity-50 transition-all">
                  {isSubmitting ? 'กำลังประมวลผล...' : 'ยืนยันการเรียกรถ'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Location Picker Modal คงเดิม */}
        {isLocationPickerOpen && (
          <div className="fixed inset-0 z-[60] bg-white sm:max-w-md sm:mx-auto sm:h-screen flex flex-col animate-slide-up">
            <div className="p-4 border-b border-gray-100 shadow-sm bg-white sticky top-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setIsLocationPickerOpen(false)} className="p-2 text-gray-400 hover:text-gray-800 bg-gray-50 rounded-full">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-3 text-gray-400">🔍</span>
                  <input autoFocus type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={`ค้นหา ${pickingType === 'pickup' ? 'จุดรับ' : 'จุดส่ง'}...`} className="w-full bg-gray-100 border-none rounded-xl pl-9 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-[#EE4D2D] outline-none" />
                </div>
              </div>
            </div>
            <div className="p-4 border-b border-gray-100 bg-orange-50/50">
              <button onClick={() => { alert('จำลองการเปิด Google Maps เพื่อเลื่อนปักหมุด 🗺️'); selectLocation('ตำแหน่งจากแผนที่ (จำลอง)'); }} className="w-full bg-white border border-orange-200 text-[#EE4D2D] flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm shadow-sm active:scale-95 transition-transform">
                <span className="text-lg">📍</span> เลือกตำแหน่งบนแผนที่
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <p className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">สถานที่แนะนำ</p>
              {mockPlaces.filter(p => p.name.includes(searchQuery)).map((place, index) => (
                <div key={index} onClick={() => selectLocation(place.name)} className="flex items-center gap-4 p-4 hover:bg-gray-50 active:bg-gray-100 cursor-pointer border-b border-gray-50 last:border-none transition-colors">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 shrink-0">📍</div>
                  <div><h4 className="text-sm font-bold text-gray-800">{place.name}</h4><p className="text-[11px] text-gray-500 mt-0.5">{place.detail}</p></div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
      <style dangerouslySetInnerHTML={{__html: `.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; } .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; } @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}} />
    </div>
  );
}

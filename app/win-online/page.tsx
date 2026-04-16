'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/app/components/BottomNav';

interface ExpressJob {
  id: string;
  title: string;
  job_type: string;
  vehicle_type: string;
  pickup_location: string;
  dropoff_location: string;
  note: string | null;
  distance_km: number | null;
  offered_price: number | null;
  status: string;
  profiles?: { first_name: string; last_name: string; };
}

export default function WinOnlinePage() {
  const router = useRouter();

  // 🔐 โหมดจำลองสิทธิ์ผู้ใช้
  const [userRole, setUserRole] = useState<'customer' | 'provider'>('customer'); 

  const [jobs, setJobs] = useState<ExpressJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [pickingType, setPickingType] = useState<'pickup' | 'dropoff'>('pickup');
  const [searchQuery, setSearchQuery] = useState('');

  const [jobType, setJobType] = useState<'ride' | 'buy' | 'deliver'>('ride');
  const [vehicleType, setVehicleType] = useState<'motorcycle' | 'saleng' | 'car' | 'suv' | 'van' | 'pickup'>('motorcycle');
  const [title, setTitle] = useState('');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [goodsPrice, setGoodsPrice] = useState('');
  const [note, setNote] = useState('');

  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [showFareDetails, setShowFareDetails] = useState(false);
  const [fareBreakdown, setFareBreakdown] = useState({ base: 0, distanceFee: 0, fuelSurge: 0, total: 0 });

  const mockPlaces = [
    { name: 'โรงพยาบาลแกลง', detail: 'ตำบลทางเกวียน อำเภอแกลง' },
    { name: 'ตลาดสามย่าน แกลง', detail: 'ตลาดสดเทศบาล' },
    { name: 'เซเว่นอีเลฟเว่น สาขาตลาดแกลง', detail: 'ใกล้สี่แยกไฟแดง' },
    { name: 'โรงเรียนแกลง "วิทยสถาวร"', detail: 'อำเภอแกลง' },
  ];

  // 🧮 สมองกลคำนวณราคา (อิงแอปมาตรฐาน + ราคาน้ำมัน - โมเดลชุมชน)
  useEffect(() => {
    if (pickup && (dropoff || jobType === 'buy')) {
      const mockDistance = Math.floor(Math.random() * 10) + 2; 
      setDistanceKm(mockDistance);

      let baseFare = 0;
      let ratePerKm = 0;

      switch (vehicleType) {
        case 'motorcycle': baseFare = 20; ratePerKm = mockDistance > 5 ? 10 : 8; break;
        case 'saleng': baseFare = 30; ratePerKm = 10; break;
        case 'car': baseFare = 40; ratePerKm = 12; break;
        case 'suv': baseFare = 50; ratePerKm = 15; break;
        case 'van': baseFare = 100; ratePerKm = 20; break;
        case 'pickup': baseFare = 150; ratePerKm = 20; break;
      }

      const distanceFee = mockDistance * ratePerKm;
      const rawBeforeFuel = baseFare + distanceFee;
      
      const FUEL_MULTIPLIER = 1.05; // ดัชนีค่าน้ำมัน +5%
      const fuelSurge = (rawBeforeFuel * FUEL_MULTIPLIER) - rawBeforeFuel;

      const finalFare = Math.ceil(rawBeforeFuel + fuelSurge); 

      setFareBreakdown({ base: baseFare, distanceFee: distanceFee, fuelSurge: fuelSurge, total: finalFare });
    } else {
      setDistanceKm(0);
      setFareBreakdown({ base: 0, distanceFee: 0, fuelSurge: 0, total: 0 });
      setShowFareDetails(false);
    }
  }, [pickup, dropoff, jobType, vehicleType]);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('express_jobs').select(`*, profiles:customer_id (first_name, last_name)`).eq('status', 'open').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setJobs(data);
    } catch (error) { console.error('Error fetching jobs:', error); }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setCurrentUser(session?.user || null));
    fetchJobs();
  }, []);

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return router.push('/auth/login');
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('express_jobs').insert({
        customer_id: currentUser.id, title, job_type: jobType, vehicle_type: vehicleType, pickup_location: pickup, dropoff_location: dropoff || null, distance_km: distanceKm, note: note || null, offered_price: fareBreakdown.total, status: 'open'
      });
      if (error) throw error;
      setIsModalOpen(false);
      alert('โพสต์งานด่วนสำเร็จ! 🚀 ขอบคุณที่ร่วมสร้างรอยยิ้มให้ชุมชน');
      fetchJobs(); 
    } catch (error: any) { alert('เกิดข้อผิดพลาด: ' + error.message); } 
    finally { setIsSubmitting(false); }
  };

  const openLocationPicker = (type: 'pickup' | 'dropoff') => {
    setPickingType(type); setSearchQuery(''); setIsLocationPickerOpen(true);
  };

  const selectLocation = (locationName: string) => {
    if (pickingType === 'pickup') setPickup(locationName); else setDropoff(locationName);
    setIsLocationPickerOpen(false);
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'car': return '🚗';
      case 'suv': return '🚙';
      case 'van': return '🚐';
      case 'pickup': return '🛻';
      case 'saleng': return '🛺';
      default: return '🛵';
    }
  };

  const getVehicleName = (type: string) => {
    switch (type) {
      case 'car': return 'รถเก๋ง 4 ที่นั่ง';
      case 'suv': return 'รถครอบครัว 7 ที่นั่ง';
      case 'van': return 'รถตู้ (รับส่ง)';
      case 'pickup': return 'รถกระบะ';
      case 'saleng': return 'ซาเล้งพ่วงข้าง';
      default: return 'มอเตอร์ไซค์';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-x-hidden">

        {/* 🟠 Header พร้อมสโลแกนบวกเชิงบวก */}
        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-b-[2.5rem] p-6 pt-10 shadow-md relative z-10">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-white text-2xl font-black tracking-tight flex items-center gap-2">🛵 งานด่วนชุมชน</h1>
            <button onClick={() => setUserRole(userRole === 'customer' ? 'provider' : 'customer')} className="bg-white/20 px-3 py-1.5 rounded-full text-[10px] text-white font-bold backdrop-blur-sm border border-white/30">
              ทดสอบโหมด: {userRole === 'customer' ? 'ลูกค้า' : 'ไรเดอร์'}
            </button>
          </div>
          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/20 text-white text-[11px] leading-relaxed">
            <span className="font-bold text-yellow-200 text-xs">✨ บริการด้วยใจ ราคาเป็นธรรม ยั่งยืนทั้งชุมชน จงเจริญ</span><br/>
            ค่าบริการนี้ครอบคลุมต้นทุนพลังงานจริง เพื่อให้มีรายได้ในชุมชนอย่างยั่งยืน
          </div>
        </div>

        {/* 📋 พื้นที่แสดงเนื้อหา */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide pb-32">
          
          {userRole === 'customer' ? (
            <div className="mt-4">
              <div className="bg-white rounded-[2.5rem] p-8 text-center shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 text-6xl opacity-10">🚀</div>
                <div className="text-5xl mb-4">🏠</div>
                <h3 className="text-lg font-black text-gray-800 mb-2">เรียกรถ หรือ ส่งของ?</h3>
                <p className="text-xs text-gray-500 mb-6 leading-relaxed px-4">
                  ร่วมสนับสนุนไรเดอร์ในพื้นที่ด้วยราคากลางที่โปร่งใส<br/>เงินทุกบาทตกถึงมือคนในแกลงโดยตรง
                </p>
                <button onClick={() => setIsModalOpen(true)} className="bg-[#EE4D2D] text-white px-8 py-4 rounded-2xl font-bold shadow-md active:scale-95 transition-all w-full">
                  + โพสต์งานด่วนเลย
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center px-1">
                <h2 className="text-sm font-black text-gray-800">🟢 งานที่เปิดรับสมัคร</h2>
                <button onClick={fetchJobs} className="text-[10px] text-[#EE4D2D] font-bold">รีเฟรช 🔄</button>
              </div>
              {isLoading ? (
                 Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-white rounded-[1.5rem] p-4 h-32 animate-pulse border border-gray-100"></div>)
              ) : jobs.length === 0 ? (
                <div className="bg-white rounded-[2rem] p-8 text-center border border-gray-100">ย้อนกลับมาดูใหม่เร็วๆ นี้นะคะ ยังไม่มีงานค่ะ 💨</div>
              ) : (
                jobs.map((job) => (
                  <div key={job.id} className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-gray-50 active:scale-[0.99] transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-3">
                        <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-2xl">{getVehicleIcon(job.vehicle_type)}</div>
                        <div>
                          <h3 className="font-bold text-gray-800 text-sm leading-tight">{job.title}</h3>
                          <span className="text-[10px] text-gray-400 mt-1 block">จาก: {job.profiles?.first_name || 'เพื่อนบ้าน'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-[#EE4D2D]">฿{job.offered_price}</div>
                        <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">{job.distance_km} กม.</div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl mb-3 space-y-1.5 text-xs text-gray-600">
                      <p>🟢 <span className="font-bold">รับ:</span> {job.pickup_location}</p>
                      {job.dropoff_location && <p className="border-t border-gray-200/50 pt-1.5">🔴 <span className="font-bold">ส่ง:</span> {job.dropoff_location}</p>}
                    </div>
                    <button className="w-full bg-[#EE4D2D] text-white py-2.5 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all">รับงานนี้ ⚡</button>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* 🧩 Modal โพสต์งาน (z-[100] เพื่อซ่อนทุกอย่าง) */}
        {isModalOpen && !isLocationPickerOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full sm:max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-hide pb-10">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-all">✕</button>
              <h2 className="text-lg font-black text-gray-800 mb-5">เรียกงานด่วน 🚀</h2>

              <form onSubmit={handlePostJob} className="space-y-4">
                {/* เลือกประเภทบริการ */}
                <div className="flex gap-2 mb-4">
                  {['ride', 'buy', 'deliver'].map((t) => (
                    <button key={t} type="button" onClick={() => setJobType(t as any)} className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${jobType === t ? 'bg-orange-50 border-[#EE4D2D] text-[#EE4D2D]' : 'bg-white border-gray-200 text-gray-400'}`}>
                      {t === 'ride' ? '🛵 เรียกรถ' : t === 'buy' ? '🍜 ฝากซื้อ' : '📦 ส่งของ'}
                    </button>
                  ))}
                </div>

                {/* เลือกประเภทยานพาหนะ */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-600 pl-1">เลือกประเภทรถที่เหมาะสม <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-3 gap-2">
                    {['motorcycle', 'saleng', 'car', 'suv', 'van', 'pickup'].map((v) => (
                      <div key={v} onClick={() => setVehicleType(v as any)} className={`cursor-pointer border rounded-xl py-2.5 flex flex-col items-center gap-1 transition-all ${vehicleType === v ? 'border-[#EE4D2D] bg-orange-50 ring-1 ring-[#EE4D2D]' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                        <span className="text-xl">{getVehicleIcon(v)}</span>
                        <span className={`text-[8px] font-bold leading-tight ${vehicleType === v ? 'text-[#EE4D2D]' : 'text-gray-500'}`}>{getVehicleName(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-600 pl-1">รายละเอียดงาน *</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น ไปส่งหน้าตลาดแกลง" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#EE4D2D] outline-none" />
                </div>

                <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  <div onClick={() => openLocationPicker('pickup')} className={`w-full border rounded-xl px-4 py-3 text-sm cursor-pointer flex justify-between items-center transition-all ${pickup ? 'border-orange-200 bg-white text-gray-800 font-bold' : 'bg-white text-gray-400'}`}>
                    <span className="truncate pr-4">{pickup || '📍 เลือกจุดรับต้นทาง'}</span>
                    <span className="text-gray-300">›</span>
                  </div>
                  <div onClick={() => openLocationPicker('dropoff')} className={`w-full border rounded-xl px-4 py-3 text-sm cursor-pointer flex justify-between items-center transition-all ${dropoff ? 'border-orange-200 bg-white text-gray-800 font-bold' : 'bg-white text-gray-400'}`}>
                    <span className="truncate pr-4">{dropoff || '📍 เลือกจุดส่งปลายทาง'}</span>
                    <span className="text-gray-300">›</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="หมายเหตุถึงคนขับ (เช่น มีของใหญ่, พักกลางทาง)" rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#EE4D2D] outline-none resize-none"></textarea>
                </div>

                {/* ส่วนสรุปราคา */}
                <div className="pt-2">
                  <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex justify-between items-center shadow-inner">
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">ราคาประเมินตามระยะทาง</p>
                      <p className="text-[9px] text-gray-400 font-medium italic">ไม่มีค่าบริการแพลตฟอร์มเพิ่มเติม</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-[#EE4D2D]">{fareBreakdown.total > 0 ? `฿${fareBreakdown.total}` : '-'}</div>
                      {distanceKm > 0 && <div className="text-[8px] text-gray-400 font-bold mt-1 uppercase">~ {distanceKm} กม.</div>}
                    </div>
                  </div>

                  {distanceKm > 0 && (
                    <div className="mt-3">
                      <button type="button" onClick={() => setShowFareDetails(!showFareDetails)} className="w-full flex items-center justify-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-orange-500 transition-colors">
                        {showFareDetails ? 'ซ่อนรายละเอียด' : 'ความโปร่งใสของราคา (Fare Breakdown)'}
                      </button>

                      {showFareDetails && (
                        <div className="mt-3 bg-white border border-gray-100 p-4 rounded-xl shadow-sm text-[10px] font-medium text-gray-600 space-y-2 relative animate-fade-in">
                          <div className="absolute left-0 top-0 w-1 h-full bg-[#EE4D2D]"></div>
                          <div className="flex justify-between"><span>เริ่ม {fareBreakdown.base} บ. + ระยะทาง ({distanceKm} กม.)</span><span>฿{(fareBreakdown.base + fareBreakdown.distanceFee).toFixed(2)}</span></div>
                          <div className="flex justify-between text-orange-600"><span>ค่าความผันผวนของต้นทุนพลังงาน (+5%)</span><span>฿{fareBreakdown.fuelSurge.toFixed(2)}</span></div>
                          <div className="pt-2 mt-2 border-t border-gray-100 text-[9px] text-gray-500 text-center leading-relaxed">
                            ราคานี้ปรับตามต้นทุนพลังงานจริงเพื่อให้รายได้เป็นธรรมต่อผู้ให้บริการ <br/>
                            <span className="text-[#EE4D2D] font-bold">(หากใช้รถ EV รายได้ส่วนเกินนี้จะกลายเป็นกำไรของคนขับทันที ⚡)</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button type="submit" disabled={isSubmitting || fareBreakdown.total <= 0} className="w-full bg-[#EE4D2D] text-white font-black py-4 rounded-2xl text-sm mt-4 shadow-lg active:scale-95 disabled:opacity-50 transition-all">
                  {isSubmitting ? 'กำลังประมวลผล...' : 'ยืนยันการเรียกรถ'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 🗺️ Location Picker (z-[100]) */}
        {isLocationPickerOpen && (
          <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-slide-up">
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <button onClick={() => setIsLocationPickerOpen(false)} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">←</button>
              <input autoFocus type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={`ค้นหาจุด ${pickingType === 'pickup' ? 'รับ' : 'ส่ง'}...`} className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-[#EE4D2D] outline-none" />
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <div onClick={() => selectLocation('ปักหมุดบนแผนที่ (เร็วๆ นี้)')} className="p-4 border-b border-gray-50 text-[#EE4D2D] font-bold text-sm flex items-center gap-2">📍 เลือกพิกัดจากแผนที่</div>
              {mockPlaces.filter(p => p.name.includes(searchQuery)).map((place, i) => (
                <div key={i} onClick={() => selectLocation(place.name)} className="p-4 border-b border-gray-50 cursor-pointer active:bg-gray-50">
                  <h4 className="text-sm font-bold text-gray-800">{place.name}</h4>
                  <p className="text-[11px] text-gray-500">{place.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🌟 แสดง BottomNav เฉพาะตอนที่ไม่ได้เปิด Modal หรือแผนที่ 🌟 */}
        {!isModalOpen && !isLocationPickerOpen && <BottomNav />}
        
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        .animate-slide-up { animation: slideUp 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}} />
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/app/components/BottomNav';
// 🌟 นำเข้าอาวุธใหม่จาก Google Maps
import { useLoadScript } from '@react-google-maps/api';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';

// กำหนดให้ Google โหลดระบบ "ค้นหาสถานที่ (places)"
const libraries: ("places")[] = ["places"];

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
  created_at: string;
  profiles?: { first_name: string; last_name: string; };
}

export default function WinOnlinePage() {
  const router = useRouter();

  // 🌟 โหลด Google Maps API
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

  const [userRole, setUserRole] = useState<'customer' | 'provider'>('customer'); 
  const [jobs, setJobs] = useState<ExpressJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [pickingType, setPickingType] = useState<'pickup' | 'dropoff'>('pickup');

  // 🌟 ระบบค้นหาสถานที่อัจฉริยะ (แทนที่ searchQuery เดิม)
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      // จำกัดขอบเขตการค้นหาให้อยู่ในประเทศไทย
      componentRestrictions: { country: 'th' },
    },
    debounce: 300, // หน่วงเวลา 0.3 วิ ค่อยถาม Google (ประหยัดโควต้า API)
  });

  const [jobType, setJobType] = useState<'ride' | 'buy' | 'deliver'>('ride');
  const [vehicleType, setVehicleType] = useState<'motorcycle' | 'saleng' | 'car' | 'suv' | 'van' | 'pickup'>('motorcycle');
  const [title, setTitle] = useState('');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [note, setNote] = useState('');

  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [showFareDetails, setShowFareDetails] = useState(false);
  const [fareBreakdown, setFareBreakdown] = useState({ base: 0, distanceFee: 0, fuelSurge: 0, platformFee: 0, totalFare: 0 });

  // 🧮 คำนวณราคา (ตอนนี้ยังใช้ระยะทางจำลองอยู่ เดี๋ยวสเต็ปถัดไปจะดึงพิกัดจริงมาคำนวณ)
  useEffect(() => {
    if (pickup && (dropoff || jobType === 'buy')) {
      const mockDistance = Math.floor(Math.random() * 10) + 2; 
      setDistanceKm(mockDistance);

      let baseFare = 0; let ratePerKm = 0;
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
      const FUEL_MULTIPLIER = 1.05; 
      const fuelSurge = (rawBeforeFuel * FUEL_MULTIPLIER) - rawBeforeFuel;
      
      const totalDriverFare = rawBeforeFuel + fuelSurge; 
      const platformFee = totalDriverFare * 0.03; 
      const finalFare = Math.ceil(totalDriverFare + platformFee); 

      setFareBreakdown({ base: baseFare, distanceFee: distanceFee, fuelSurge: fuelSurge, platformFee: platformFee, totalFare: finalFare });
    } else {
      setDistanceKm(0);
      setFareBreakdown({ base: 0, distanceFee: 0, fuelSurge: 0, platformFee: 0, totalFare: 0 });
      setShowFareDetails(false);
    }
  }, [pickup, dropoff, jobType, vehicleType]);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('express_jobs').select(`*, profiles:customer_id (first_name, last_name)`).eq('status', 'open').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setJobs(data);
    } catch (error) { console.error(error); }
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
        customer_id: currentUser.id, title, job_type: jobType, vehicle_type: vehicleType, pickup_location: pickup, dropoff_location: dropoff || null, distance_km: distanceKm, note: note || null, offered_price: fareBreakdown.totalFare, status: 'open'
      });
      if (error) throw error;
      setIsModalOpen(false);
      alert('โพสต์งานด่วนสำเร็จ! 🚀 ขอบคุณที่ร่วมสนับสนุนรายได้ในชุมชนค่ะ');
      fetchJobs(); 
    } catch (error: any) { alert(error.message); } 
    finally { setIsSubmitting(false); }
  };

  // 🌟 ฟังก์ชันเมื่อลูกค้ากดเลือกสถานที่จาก Google Maps
  const handleSelectLocation = async (address: string) => {
    setValue(address, false); // เซ็ตชื่อสถานที่ลงในช่องค้นหา
    clearSuggestions(); // ล้างรายการแนะนำ

    if (pickingType === 'pickup') setPickup(address); 
    else setDropoff(address);
    
    setIsLocationPickerOpen(false);
  };

  const getVehicleIcon = (type: string) => {
    switch (type) { case 'car': return '🚗'; case 'suv': return '🚙'; case 'van': return '🚐'; case 'pickup': return '🛻'; case 'saleng': return '🛺'; default: return '🛵'; }
  };

  const getVehicleName = (type: string) => {
    switch (type) { case 'car': return 'รถเก๋ง'; case 'suv': return 'รถครอบครัว'; case 'van': return 'รถตู้'; case 'pickup': return 'กระบะ'; case 'saleng': return 'ซาเล้ง'; default: return 'มอเตอร์ไซค์'; }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-x-hidden">

        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-b-[2.5rem] p-6 pt-10 shadow-md relative z-10">
          <div className="flex justify-between items-center mb-4 px-1">
            <h1 className="text-white text-2xl font-black tracking-tight flex items-center gap-2">🛵 งานด่วนชุมชน</h1>
            <button onClick={() => setUserRole(userRole === 'customer' ? 'provider' : 'customer')} className="bg-white/20 px-3 py-1.5 rounded-full text-[10px] text-white font-bold backdrop-blur-sm border border-white/30 active:scale-95">
              โหมด: {userRole === 'customer' ? 'ลูกค้า' : 'ไรเดอร์'}
            </button>
          </div>
          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/20 text-white text-[11px] leading-relaxed">
            <span className="font-bold text-yellow-200 text-xs">✨ บริการด้วยใจ ราคาเป็นธรรม ยั่งยืนทั้งชุมชน จงเจริญ</span><br/>
            แพลตฟอร์มที่ให้คนขับรับรายได้เต็ม 100% ไม่มีหักเปอร์เซ็นต์
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide pb-32">
          {userRole === 'customer' ? (
            <div className="mt-6">
              <div className="bg-white rounded-[2.5rem] p-10 text-center shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="text-6xl mb-4">🏠</div>
                <h3 className="text-lg font-black text-gray-800 mb-2">เรียกวิน หรือ ส่งของ?</h3>
                <p className="text-xs text-gray-500 mb-8 leading-relaxed px-4">
                  สนับสนุนไรเดอร์ในบ้านเราด้วยราคากลางที่โปร่งใส<br/>เงินค่าเดินทางตกถึงมือคนขับ 100% เต็ม ❤️
                </p>
                <button onClick={() => setIsModalOpen(true)} className="bg-[#EE4D2D] text-white px-8 py-4 rounded-2xl font-bold shadow-md active:scale-95 transition-all w-full">
                  + โพสต์งานด่วนเลย
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center px-1">
                <h2 className="text-sm font-black text-gray-800">🟢 งานที่รอคนรับ</h2>
                <button onClick={fetchJobs} className="text-[10px] text-[#EE4D2D] font-bold">🔄 รีเฟรช</button>
              </div>
              {isLoading ? (
                 <div className="bg-white rounded-[1.5rem] p-4 h-32 animate-pulse border border-gray-100"></div>
              ) : jobs.length === 0 ? (
                <div className="bg-white rounded-[2rem] p-8 text-center border border-gray-100">ยังไม่มีงานในขณะนี้ค่ะ 💨</div>
              ) : (
                jobs.map((job) => (
                  <div key={job.id} className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-gray-50 mb-3">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-3">
                        <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-2xl">{getVehicleIcon(job.vehicle_type)}</div>
                        <div>
                          <h3 className="font-bold text-gray-800 text-sm leading-tight">{job.title}</h3>
                          <span className="text-[10px] text-gray-400 mt-1 block">ลูกค้า: {job.profiles?.first_name || 'เพื่อนบ้าน'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-[#EE4D2D]">฿{job.offered_price}</div>
                        <div className="text-[9px] text-gray-400 font-bold uppercase mt-1">{job.distance_km} กม.</div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl mb-3 space-y-1.5 text-xs text-gray-600">
                      <p>🟢 <span className="font-bold">รับ:</span> {job.pickup_location}</p>
                      {job.dropoff_location && <p className="border-t border-gray-200/50 pt-1.5">🔴 <span className="font-bold">ส่ง:</span> {job.dropoff_location}</p>}
                    </div>
                    <button className="w-full bg-[#EE4D2D] text-white py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-all">รับงานนี้ ⚡</button>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {isModalOpen && !isLocationPickerOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full sm:max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-hide pb-10">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-5 right-5 w-8 h-8 bg-gray-100 rounded-full text-gray-500 flex items-center justify-center">✕</button>
              <h2 className="text-lg font-black text-gray-800 mb-5">เรียกงานด่วน 🚀</h2>

              <form onSubmit={handlePostJob} className="space-y-4">
                <div className="flex gap-2 mb-4">
                  {['ride', 'buy', 'deliver'].map((t) => (
                    <button key={t} type="button" onClick={() => setJobType(t as any)} className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold border transition-all ${jobType === t ? 'bg-orange-50 border-[#EE4D2D] text-[#EE4D2D]' : 'bg-white border-gray-200 text-gray-400'}`}>
                      {t === 'ride' ? '🛵 เรียกรถ' : t === 'buy' ? '🍜 ฝากซื้อ' : '📦 ส่งของ'}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-600 pl-1">เลือกประเภทรถที่เหมาะสม <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-3 gap-2">
                    {['motorcycle', 'saleng', 'car', 'suv', 'van', 'pickup'].map((v) => (
                      <div key={v} onClick={() => setVehicleType(v as any)} className={`cursor-pointer border rounded-xl py-2.5 flex flex-col items-center gap-1 transition-all ${vehicleType === v ? 'border-[#EE4D2D] bg-orange-50 ring-1 ring-[#EE4D2D]' : 'border-gray-200 bg-white'}`}>
                        <span className="text-xl">{getVehicleIcon(v)}</span>
                        <span className={`text-[8px] font-bold ${vehicleType === v ? 'text-[#EE4D2D]' : 'text-gray-500'}`}>{getVehicleName(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-600 pl-1">รายละเอียดงาน *</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น ไปส่งหน้าตลาดแกลง" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#EE4D2D] outline-none" />
                </div>

                <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  <div onClick={() => { setPickingType('pickup'); setValue(pickup); setIsLocationPickerOpen(true); }} className={`w-full border rounded-xl px-4 py-3 text-sm cursor-pointer flex justify-between items-center bg-white ${pickup ? 'border-orange-200 text-gray-800 font-bold' : 'text-gray-400'}`}>
                    <span className="truncate pr-4">{pickup || '📍 เลือกจุดรับต้นทาง'}</span>
                    <span className="text-gray-300">›</span>
                  </div>
                  <div onClick={() => { setPickingType('dropoff'); setValue(dropoff); setIsLocationPickerOpen(true); }} className={`w-full border rounded-xl px-4 py-3 text-sm cursor-pointer flex justify-between items-center bg-white ${dropoff ? 'border-orange-200 text-gray-800 font-bold' : 'text-gray-400'}`}>
                    <span className="truncate pr-4">{dropoff || '📍 เลือกจุดส่งปลายทาง'}</span>
                    <span className="text-gray-300">›</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="หมายเหตุถึงคนขับ (ถ้ามี)" rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#EE4D2D] outline-none resize-none"></textarea>
                </div>

                <div className="pt-2">
                  <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex justify-between items-center shadow-inner relative">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">ราคาประเมินสุทธิ</p>
                        {distanceKm > 0 && (
                          <button type="button" onClick={() => setShowFareDetails(!showFareDetails)} className="w-4 h-4 rounded-full bg-orange-200 text-orange-700 flex items-center justify-center text-[10px] font-black hover:bg-orange-300 transition-colors shadow-sm">i</button>
                        )}
                      </div>
                      <p className="text-[9px] text-gray-400 font-medium italic">รวมค่าเรียกใช้งานระบบเรียบร้อยแล้ว</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-[#EE4D2D] leading-none">{fareBreakdown.totalFare > 0 ? `฿${fareBreakdown.totalFare}` : '-'}</div>
                      {distanceKm > 0 && <div className="text-[8px] text-gray-400 font-bold mt-1 uppercase">~ {distanceKm} กม.</div>}
                    </div>
                  </div>

                  {showFareDetails && distanceKm > 0 && (
                    <div className="mt-2 bg-white border border-gray-100 p-4 rounded-xl shadow-sm text-[10px] font-medium text-gray-600 space-y-2 relative animate-fade-in">
                      <div className="absolute left-0 top-0 w-1 h-full bg-[#EE4D2D] rounded-l-xl"></div>
                      <div className="flex justify-between">
                        <span>เริ่มต้น {(fareBreakdown.base + fareBreakdown.platformFee).toFixed(0)} บ. + ระยะทาง ({distanceKm} กม.)</span>
                        <span className="font-bold text-gray-800">฿{(fareBreakdown.base + fareBreakdown.distanceFee + fareBreakdown.platformFee).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-orange-600">
                        <span>ค่าความผันผวนต้นทุนพลังงาน</span>
                        <span>+ ฿{fareBreakdown.fuelSurge.toFixed(2)}</span>
                      </div>
                      <div className="pt-2 mt-2 border-t border-gray-100 text-[9px] text-gray-500 text-center leading-relaxed">
                        โครงสร้างราคานี้ปรับตามมาตรฐานเพื่อให้คนขับมีรายได้ที่ยั่งยืน <br/>
                        <span className="text-[#EE4D2D] font-bold">แอปพลิเคชันไม่หักเปอร์เซ็นต์ค่าเดินทางจากคนขับ ❤️</span>
                      </div>
                    </div>
                  )}
                </div>

                <button type="submit" disabled={isSubmitting || fareBreakdown.totalFare <= 0} className="w-full bg-[#EE4D2D] text-white font-black py-4 rounded-2xl text-sm mt-4 shadow-lg active:scale-95 disabled:opacity-50 transition-all">
                  {isSubmitting ? 'กำลังประมวลผล...' : 'ยืนยันการเรียกรถ'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 🗺️ Location Picker Modal แบบใหม่ (ดึงข้อมูล Google Places จริง) */}
        {isLocationPickerOpen && (
          <div className="fixed inset-0 z-[100] bg-white flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-white shadow-sm">
              <button onClick={() => setIsLocationPickerOpen(false)} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100">←</button>
              <input 
                autoFocus 
                type="text" 
                value={value} 
                onChange={(e) => setValue(e.target.value)} 
                disabled={!ready || !isLoaded}
                placeholder={!isLoaded ? "กำลังโหลดระบบแผนที่..." : `พิมพ์ค้นหาจุด ${pickingType === 'pickup' ? 'รับ' : 'ส่ง'}...`} 
                className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-[#EE4D2D] outline-none" 
              />
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 bg-gray-50">
              {/* รายการค้นหาที่ดึงมาจาก Google Maps ของจริง */}
              {status === "OK" && data.map(({ place_id, description, structured_formatting: { main_text, secondary_text } }) => (
                <div 
                  key={place_id} 
                  onClick={() => handleSelectLocation(description)} 
                  className="p-4 mb-2 bg-white rounded-xl shadow-sm cursor-pointer active:bg-orange-50 border border-gray-100 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center shrink-0">📍</div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">{main_text}</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{secondary_text}</p>
                  </div>
                </div>
              ))}

              {status !== "OK" && value.length > 0 && (
                <div className="p-8 text-center text-gray-400 text-sm font-medium">กำลังค้นหาสถานที่...</div>
              )}
            </div>
          </div>
        )}

        {!isModalOpen && !isLocationPickerOpen && <BottomNav />}
        
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}

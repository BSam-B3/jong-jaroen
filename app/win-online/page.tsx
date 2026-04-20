'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/app/components/BottomNav';
import { useLoadScript, GoogleMap, MarkerF } from '@react-google-maps/api';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';

const libraries: ("places")[] = ["places"];

// พิกัดเริ่มต้น (อำเภอแกลง) หากแอปหาตำแหน่งปัจจุบันไม่เจอ
const DEFAULT_CENTER = { lat: 12.7844, lng: 101.6500 };

export default function WinOnlinePage() {
  const router = useRouter();

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

  const [userRole, setUserRole] = useState<'customer' | 'provider'>('customer'); 
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 🌟 State สำหรับการเลือกตำแหน่ง
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [isMapMode, setIsMapMode] = useState(false); // สลับโหมด รายชื่อ <-> แผนที่
  const [pickingType, setPickingType] = useState<'pickup' | 'dropoff'>('pickup');
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [selectedPin, setSelectedPin] = useState<google.maps.LatLngLiteral | null>(null);

  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
    init
  } = usePlacesAutocomplete({
    initOnMount: false,
    requestOptions: { componentRestrictions: { country: 'th' } },
    debounce: 300,
  });

  useEffect(() => { if (isLoaded) init(); }, [isLoaded, init]);

  const [jobType, setJobType] = useState<'ride' | 'buy' | 'deliver'>('ride');
  const [vehicleType, setVehicleType] = useState<'motorcycle' | 'saleng' | 'car' | 'suv' | 'van' | 'pickup'>('motorcycle');
  const [title, setTitle] = useState('');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [note, setNote] = useState('');
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [showFareDetails, setShowFareDetails] = useState(false);
  const [fareBreakdown, setFareBreakdown] = useState({ base: 0, distanceFee: 0, fuelSurge: 0, platformFee: 0, totalFare: 0 });

  const popularPlaces = [
    { name: 'โรงพยาบาลแกลง', detail: 'ตำบลทางเกวียน อำเภอแกลง' },
    { name: 'ตลาดสามย่าน แกลง', detail: 'ตลาดสดเทศบาล' },
    { name: 'เซเว่นอีเลฟเว่น สาขาตลาดแกลง', detail: 'ใกล้สี่แยกไฟแดง' }
  ];

  // 🧮 คำนวณราคา
  useEffect(() => {
    if (pickup && (dropoff || jobType === 'buy')) {
      const mockDistance = Math.floor(Math.random() * 8) + 2; 
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
      const fuelSurge = (rawBeforeFuel * 1.05) - rawBeforeFuel;
      const totalDriverFare = rawBeforeFuel + fuelSurge; 
      const platformFee = totalDriverFare * 0.03; 
      setFareBreakdown({ base: baseFare, distanceFee: distanceFee, fuelSurge: fuelSurge, platformFee: platformFee, totalFare: Math.ceil(totalDriverFare + platformFee) });
    }
  }, [pickup, dropoff, jobType, vehicleType]);

  const fetchJobs = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('express_jobs').select(`*, profiles:customer_id (first_name)`).eq('status', 'open').order('created_at', { ascending: false });
    if (data) setJobs(data);
    setIsLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setCurrentUser(session?.user || null));
    fetchJobs();
  }, []);

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return router.push('/auth/login');
    setIsSubmitting(true);
    const { error } = await supabase.from('express_jobs').insert({
      customer_id: currentUser.id, title, job_type: jobType, vehicle_type: vehicleType, pickup_location: pickup, dropoff_location: dropoff || null, distance_km: distanceKm, note: note || null, offered_price: fareBreakdown.totalFare, status: 'open'
    });
    if (!error) { setIsModalOpen(false); alert('โพสต์งานเรียบร้อยค่ะ! 🚀'); fetchJobs(); }
    setIsSubmitting(false);
  };

  const handleSelectLocation = (address: string) => {
    setValue('', false);
    clearSuggestions();
    if (pickingType === 'pickup') setPickup(address); else setDropoff(address);
    setIsLocationPickerOpen(false);
    setIsMapMode(false);
  };

  // 🌟 ฟังก์ชันจัดการเมื่อคลิกบนแผนที่
  const onMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setSelectedPin({ lat, lng });

      // แปลงพิกัดเป็นที่อยู่ (Reverse Geocoding)
      try {
        const results = await getGeocode({ location: { lat, lng } });
        const address = results[0]?.formatted_address || `ตำแหน่งปักหมุด (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        
        // ถามยืนยันก่อนเลือก
        if (confirm(`ใช้ตำแหน่งนี้ใช่ไหมคะ?\n${address}`)) {
          handleSelectLocation(address);
        }
      } catch (error) {
        handleSelectLocation(`ตำแหน่งปักหมุดเอง (${lat.toFixed(3)}, ${lng.toFixed(3)})`);
      }
    }
  }, []);

  const getVehicleIcon = (type: string) => {
    switch (type) { case 'car': return '🚗'; case 'suv': return '🚙'; case 'van': return '🚐'; case 'pickup': return '🛻'; case 'saleng': return '🛺'; default: return '🛵'; }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl">

        {/* Header */}
        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-b-[2.5rem] p-6 pt-10 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-white text-2xl font-black">🛵 งานด่วนชุมชน</h1>
            <button onClick={() => setUserRole(userRole === 'customer' ? 'provider' : 'customer')} className="bg-white/20 px-3 py-1.5 rounded-full text-[10px] text-white font-bold">
              โหมด: {userRole === 'customer' ? 'ลูกค้า' : 'ไรเดอร์'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
          {userRole === 'customer' ? (
            <div className="mt-6 text-center bg-white rounded-[2.5rem] p-10 shadow-sm">
              <div className="text-6xl mb-4">🏠</div>
              <h3 className="text-lg font-black mb-2">เรียกรถ หรือ ส่งของ?</h3>
              <button onClick={() => setIsModalOpen(true)} className="bg-[#EE4D2D] text-white px-8 py-4 rounded-2xl font-bold w-full mt-4">
                + โพสต์งานด่วนเลย
              </button>
            </div>
          ) : (
             <div className="space-y-3">
               {jobs.map((job) => (
                 <div key={job.id} className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-gray-50">
                   <div className="flex justify-between items-start mb-3">
                     <div className="flex gap-3">
                       <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-2xl">{getVehicleIcon(job.vehicle_type)}</div>
                       <div><h3 className="font-bold text-sm">{job.title}</h3><span className="text-[10px] text-gray-400">ลูกค้า: {job.profiles?.first_name}</span></div>
                     </div>
                     <div className="text-right"><div className="text-lg font-black text-[#EE4D2D]">฿{job.offered_price}</div></div>
                   </div>
                   <button className="w-full bg-[#EE4D2D] text-white py-2.5 rounded-xl text-xs font-bold">รับงานนี้ ⚡</button>
                 </div>
               ))}
             </div>
          )}
        </div>

        {/* Modal: Post Job */}
        {isModalOpen && !isLocationPickerOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full sm:max-w-md rounded-t-[2.5rem] p-6 max-h-[90vh] overflow-y-auto pb-10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-black">เรียกงานด่วน 🚀</h2>
                <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 bg-gray-100 rounded-full">✕</button>
              </div>

              <form onSubmit={handlePostJob} className="space-y-4">
                <div className="flex gap-2">
                  {['ride', 'buy', 'deliver'].map((t) => (
                    <button key={t} type="button" onClick={() => setJobType(t as any)} className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold border ${jobType === t ? 'bg-orange-50 border-[#EE4D2D] text-[#EE4D2D]' : 'bg-white text-gray-400'}`}>
                      {t === 'ride' ? '🛵 เรียกรถ' : t === 'buy' ? '🍜 ฝากซื้อ' : '📦 ส่งของ'}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-600 pl-1">รายละเอียดงาน *</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น ไปส่งหน้าตลาดแกลง" className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-[#EE4D2D]" />
                </div>

                <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border">
                  <div onClick={() => { setPickingType('pickup'); setIsLocationPickerOpen(true); }} className="w-full bg-white border rounded-xl px-4 py-3 text-sm flex justify-between items-center">
                    <span className="truncate pr-4">{pickup || '📍 เลือกจุดรับต้นทาง'}</span>
                    <span className="text-gray-300">›</span>
                  </div>
                  <div onClick={() => { setPickingType('dropoff'); setIsLocationPickerOpen(true); }} className="w-full bg-white border rounded-xl px-4 py-3 text-sm flex justify-between items-center">
                    <span className="truncate pr-4">{dropoff || '📍 เลือกจุดส่งปลายทาง'}</span>
                    <span className="text-gray-300">›</span>
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-2xl flex justify-between items-center">
                   <div>
                     <p className="text-[10px] text-orange-600 font-bold">ราคาประเมินสุทธิ</p>
                     <p className="text-[9px] text-gray-400 italic">รวมค่าบริการระบบแล้ว</p>
                   </div>
                   <div className="text-2xl font-black text-[#EE4D2D]">{fareBreakdown.totalFare > 0 ? `฿${fareBreakdown.totalFare}` : '-'}</div>
                </div>

                <button type="submit" disabled={isSubmitting || fareBreakdown.totalFare <= 0} className="w-full bg-[#EE4D2D] text-white font-black py-4 rounded-2xl text-sm shadow-lg">
                  {isSubmitting ? 'กำลังส่งข้อมูล...' : 'ยืนยันการเรียกรถ'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 🗺️ Location Picker Modal (โหมดค้นหา + โหมดแผนที่) */}
        {isLocationPickerOpen && (
          <div className="fixed inset-0 z-[100] bg-white flex flex-col">
            <div className="p-4 border-b flex items-center gap-3 bg-white shadow-sm">
              <button onClick={() => { setIsLocationPickerOpen(false); setIsMapMode(false); }} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">←</button>
              {!isMapMode ? (
                <input autoFocus type="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder={`ค้นหาจุด ${pickingType === 'pickup' ? 'รับ' : 'ส่ง'}...`} className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none" />
              ) : (
                <div className="flex-1 font-bold text-sm">เลื่อนแผนที่เพื่อปักหมุด 📍</div>
              )}
            </div>

            <div className="flex-1 relative flex flex-col">
              {!isMapMode ? (
                <div className="flex-1 overflow-y-auto p-2 bg-gray-50">
                  {/* ปุ่มปักหมุดเอง */}
                  <div onClick={() => setIsMapMode(true)} className="p-4 mb-3 bg-white rounded-xl border-2 border-dashed border-orange-200 flex items-center gap-3 text-[#EE4D2D] font-bold text-sm shadow-sm cursor-pointer active:scale-95 transition-all">
                    <span className="text-xl">📍</span> ปักหมุดบนแผนที่เอง (บ้านลูกค้า/จุดไม่มีชื่อ)
                  </div>

                  {status === "OK" ? data.map(({ place_id, description, structured_formatting: { main_text, secondary_text } }) => (
                    <div key={place_id} onClick={() => handleSelectLocation(description)} className="p-4 mb-2 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">📍</div>
                      <div><h4 className="text-sm font-bold">{main_text}</h4><p className="text-[10px] text-gray-500 line-clamp-1">{secondary_text}</p></div>
                    </div>
                  )) : (
                    popularPlaces.map((p, i) => (
                      <div key={i} onClick={() => handleSelectLocation(p.name)} className="p-4 mb-2 bg-white rounded-xl shadow-sm border border-gray-50 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-400 flex items-center justify-center shrink-0">🕒</div>
                        <div><h4 className="text-sm font-bold">{p.name}</h4><p className="text-[10px] text-gray-400">{p.detail}</p></div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="flex-1 relative">
                  {isLoaded ? (
                    <GoogleMap
                      mapContainerStyle={{ width: '100%', height: '100%' }}
                      center={mapCenter}
                      zoom={15}
                      onClick={onMapClick}
                      options={{ disableDefaultUI: true, zoomControl: true }}
                    >
                      {selectedPin && <MarkerF position={selectedPin} />}
                    </GoogleMap>
                  ) : (
                    <div className="flex items-center justify-center h-full">กำลังโหลดแผนที่...</div>
                  )}
                  <div className="absolute bottom-10 left-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-orange-100 text-center">
                    <p className="text-[11px] font-bold text-gray-600 mb-2">จิ้มลงบนแผนที่เพื่อเลือกจุดที่ต้องการได้เลยค่ะ</p>
                    <button onClick={() => setIsMapMode(false)} className="text-[#EE4D2D] text-[10px] font-bold underline">กลับไปใช้การค้นหา</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!isModalOpen && !isLocationPickerOpen && <BottomNav />}
      </div>
      <style dangerouslySetInnerHTML={{__html: `.animate-fade-in { animation: fadeIn 0.3s ease-out; } @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }`}} />
    </div>
  );
}

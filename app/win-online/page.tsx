'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/app/components/BottomNav';
import { useLoadScript, GoogleMap, MarkerF } from '@react-google-maps/api';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';

const libraries: ("places")[] = ["places"];
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
  
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [isMapMode, setIsMapMode] = useState(false);
  const [pickingType, setPickingType] = useState<'pickup' | 'dropoff'>('pickup');
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [selectedPin, setSelectedPin] = useState<google.maps.LatLngLiteral | null>(null);
  const [isLocating, setIsLocating] = useState(false); // สถานะกำลังหาพิกัด GPS

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
  const [fareBreakdown, setFareBreakdown] = useState({ base: 0, distanceFee: 0, fuelSurge: 0, platformFee: 0, totalFare: 0 });

  const popularPlaces = [
    { name: 'โรงพยาบาลแกลง', detail: 'ตำบลทางเกวียน อำเภอแกลง' },
    { name: 'ตลาดสามย่าน แกลง', detail: 'ตลาดสดเทศบาล' },
    { name: 'เซเว่นอีเลฟเว่น สาขาตลาดแกลง', detail: 'ใกล้สี่แยกไฟแดง' }
  ];

  // 🧮 คำนวณราคา (Logic เดิม)
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
      const totalDriverFare = (baseFare + distanceFee) * 1.05; 
      const platformFee = totalDriverFare * 0.03; 
      setFareBreakdown({ base: baseFare, distanceFee: distanceFee, fuelSurge: totalDriverFare * 0.05, platformFee: platformFee, totalFare: Math.ceil(totalDriverFare + platformFee) });
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

  const handleSelectLocation = (address: string) => {
    setValue('', false);
    clearSuggestions();
    if (pickingType === 'pickup') setPickup(address); else setDropoff(address);
    setIsLocationPickerOpen(false);
    setIsMapMode(false);
    setSelectedPin(null);
  };

  // 🌟 ฟังก์ชันหาตำแหน่งปัจจุบัน (GPS)
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return alert("เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่งค่ะ");
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const currentPos = { lat: latitude, lng: longitude };
        
        setMapCenter(currentPos);
        setSelectedPin(currentPos);

        try {
          const results = await getGeocode({ location: currentPos });
          const address = results[0]?.formatted_address || `ตำแหน่งปัจจุบัน (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
          
          if (confirm(`พบตำแหน่งของคุณแล้ว!\nใช้ที่อยู่นี้ใช่ไหมคะ?\n${address}`)) {
            handleSelectLocation(address);
          }
        } catch (error) {
          handleSelectLocation(`ตำแหน่งปัจจุบัน (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`);
        }
        setIsLocating(false);
      },
      () => {
        alert("ไม่สามารถเข้าถึงตำแหน่งได้ โปรดอนุญาตการเข้าถึง GPS ค่ะ");
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const onMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      const pos = { lat, lng };
      setSelectedPin(pos);

      try {
        const results = await getGeocode({ location: pos });
        const address = results[0]?.formatted_address || `ตำแหน่งปักหมุด (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        if (confirm(`ใช้ตำแหน่งนี้ใช่ไหมคะ?\n${address}`)) handleSelectLocation(address);
      } catch (error) {
        handleSelectLocation(`ตำแหน่งปักหมุดเอง (${lat.toFixed(3)}, ${lng.toFixed(3)})`);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-b-[2.5rem] p-6 pt-10 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-white text-2xl font-black">🛵 งานด่วนชุมชน</h1>
            <button onClick={() => setUserRole(userRole === 'customer' ? 'provider' : 'customer')} className="bg-white/20 px-3 py-1.5 rounded-full text-[10px] text-white font-bold">
              โหมด: {userRole === 'customer' ? 'ลูกค้า' : 'ไรเดอร์'}
            </button>
          </div>
        </div>

        {/* Main Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
          {userRole === 'customer' ? (
            <div className="mt-6 text-center bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-50">
              <div className="text-6xl mb-4">🏠</div>
              <h3 className="text-lg font-black text-gray-800">ส่งของ หรือ เรียกรถ?</h3>
              <p className="text-[11px] text-gray-400 mt-2 mb-6">ระบุตำแหน่งที่แน่นอน เพื่อให้ไรเดอร์ไปหาถูกที่ค่ะ</p>
              <button onClick={() => setIsModalOpen(true)} className="bg-[#EE4D2D] text-white px-8 py-4 rounded-2xl font-bold w-full shadow-lg active:scale-95 transition-all">
                + โพสต์งานด่วนเลย
              </button>
            </div>
          ) : (
             <div className="space-y-3">
               {jobs.map((job) => (
                 <div key={job.id} className="bg-white rounded-[1.5rem] p-4 shadow-sm">
                   <div className="flex justify-between items-start mb-3">
                     <div className="flex gap-3">
                       <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-2xl">{getVehicleIcon(job.vehicle_type)}</div>
                       <div><h3 className="font-bold text-sm">{job.title}</h3><span className="text-[10px] text-gray-400">ลูกค้า: {job.profiles?.first_name}</span></div>
                     </div>
                     <div className="text-right"><div className="text-lg font-black text-[#EE4D2D]">฿{job.offered_price}</div></div>
                   </div>
                   <button className="w-full bg-[#EE4D2D] text-white py-2.5 rounded-xl text-xs font-bold active:scale-95">รับงานนี้ ⚡</button>
                 </div>
               ))}
             </div>
          )}
        </div>

        {/* Modal: Post Job Form */}
        {isModalOpen && !isLocationPickerOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full sm:max-w-md rounded-t-[2.5rem] p-6 max-h-[90vh] overflow-y-auto pb-10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-black">รายละเอียดงาน 🚀</h2>
                <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 bg-gray-100 rounded-full">✕</button>
              </div>

              <div className="space-y-4">
                <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border">
                  <div onClick={() => { setPickingType('pickup'); setIsLocationPickerOpen(true); }} className="w-full bg-white border rounded-xl px-4 py-3 text-sm flex justify-between items-center cursor-pointer">
                    <span className="truncate pr-4">{pickup || '📍 เลือกจุดรับต้นทาง'}</span>
                    <span className="text-gray-300">›</span>
                  </div>
                  <div onClick={() => { setPickingType('dropoff'); setIsLocationPickerOpen(true); }} className="w-full bg-white border rounded-xl px-4 py-3 text-sm flex justify-between items-center cursor-pointer">
                    <span className="truncate pr-4">{dropoff || '📍 เลือกจุดส่งปลายทาง'}</span>
                    <span className="text-gray-300">›</span>
                  </div>
                </div>

                <div className="bg-[#EE4D2D] p-4 rounded-2xl flex justify-between items-center text-white shadow-inner">
                   <div><p className="text-[10px] opacity-80 font-bold uppercase">ราคาประเมิน</p><p className="text-[9px] opacity-60 italic">รวมค่าเรียกใช้ระบบแล้ว</p></div>
                   <div className="text-2xl font-black">{fareBreakdown.totalFare > 0 ? `฿${fareBreakdown.totalFare}` : '-'}</div>
                </div>

                <button onClick={(e) => handlePostJob(e as any)} disabled={isSubmitting || fareBreakdown.totalFare <= 0} className="w-full bg-[#EE4D2D] text-white font-black py-4 rounded-2xl text-sm shadow-lg active:scale-95 disabled:opacity-50">
                  {isSubmitting ? 'กำลังส่งข้อมูล...' : 'โพสต์งานทันที'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🗺️ Location Picker Modal (เพิ่มปุ่มตำแหน่งปัจจุบัน) */}
        {isLocationPickerOpen && (
          <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-fade-in">
            <div className="p-4 border-b flex items-center gap-3 bg-white shadow-sm z-10">
              <button onClick={() => { setIsLocationPickerOpen(false); setIsMapMode(false); }} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">←</button>
              {!isMapMode ? (
                <input autoFocus type="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder={`ระบุจุด ${pickingType === 'pickup' ? 'รับ' : 'ส่ง'}...`} className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none" />
              ) : (
                <div className="flex-1 font-bold text-sm text-gray-800">เลื่อนแผนที่ปักหมุด 📍</div>
              )}
            </div>

            <div className="flex-1 relative flex flex-col">
              {!isMapMode ? (
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
                  {/* ปุ่มดึง GPS ปัจจุบัน */}
                  <div onClick={handleGetCurrentLocation} className="p-4 bg-white rounded-2xl border-2 border-orange-100 flex items-center justify-between text-[#EE4D2D] font-bold text-sm shadow-sm cursor-pointer active:bg-orange-50 transition-all">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🎯</span> 
                      <span>ใช้ตำแหน่งปัจจุบันของฉัน</span>
                    </div>
                    {isLocating && <div className="w-4 h-4 border-2 border-[#EE4D2D] border-t-transparent rounded-full animate-spin"></div>}
                  </div>

                  {/* ปุ่มปักหมุดเอง */}
                  <div onClick={() => setIsMapMode(true)} className="p-4 bg-white rounded-2xl border border-gray-100 flex items-center gap-3 text-gray-600 font-bold text-sm shadow-sm cursor-pointer">
                    <span className="text-xl">🗺️</span> เลือกตำแหน่งจากแผนที่เอง
                  </div>

                  <div className="pt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-2">สถานที่แนะนำ</div>
                  {status === "OK" ? data.map(({ place_id, description, structured_formatting: { main_text, secondary_text } }) => (
                    <div key={place_id} onClick={() => handleSelectLocation(description)} className="p-4 bg-white rounded-xl shadow-sm border border-gray-50 flex items-center gap-3 active:bg-orange-50">
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">📍</div>
                      <div><h4 className="text-sm font-bold text-gray-800">{main_text}</h4><p className="text-[10px] text-gray-500 line-clamp-1">{secondary_text}</p></div>
                    </div>
                  )) : (
                    popularPlaces.map((p, i) => (
                      <div key={i} onClick={() => handleSelectLocation(p.name)} className="p-4 bg-white rounded-xl shadow-sm border border-gray-50 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-400 flex items-center justify-center shrink-0">🕒</div>
                        <div><h4 className="text-sm font-bold text-gray-800">{p.name}</h4><p className="text-[10px] text-gray-400">{p.detail}</p></div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="flex-1 relative">
                  {isLoaded ? (
                    <>
                      <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={mapCenter}
                        zoom={16}
                        onClick={onMapClick}
                        options={{ disableDefaultUI: true, zoomControl: false }}
                      >
                        {selectedPin && <MarkerF position={selectedPin} />}
                      </GoogleMap>
                      
                      {/* ปุ่มลัดในหน้าแผนที่ */}
                      <div className="absolute top-4 right-4 flex flex-col gap-2">
                        <button onClick={handleGetCurrentLocation} className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-2xl border border-gray-100 active:bg-gray-100 transition-colors">
                          {isLocating ? <div className="w-5 h-5 border-2 border-[#EE4D2D] border-t-transparent rounded-full animate-spin"></div> : "🎯"}
                        </button>
                      </div>

                      <div className="absolute bottom-10 left-4 right-4">
                        <div className="bg-white/90 backdrop-blur-md p-5 rounded-[2rem] shadow-2xl border border-white text-center">
                          <p className="text-sm font-black text-gray-800 mb-1">ปักหมุดจุดรับ-ส่ง 📍</p>
                          <p className="text-[10px] text-gray-500 mb-4 px-6 italic">ลากแผนที่แล้วจิ้มลงบนจุดที่ต้องการเพื่อให้คนขับไปหาคุณได้แม่นยำที่สุด</p>
                          <button onClick={() => setIsMapMode(false)} className="text-[#EE4D2D] text-[11px] font-bold py-2 px-4 rounded-full border border-orange-100 hover:bg-orange-50 transition-all">กลับไปพิมพ์ค้นหา</button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                      <div className="w-10 h-10 border-4 border-orange-200 border-t-[#EE4D2D] rounded-full animate-spin"></div>
                      <p className="text-xs font-bold">กำลังโหลดแผนที่...</p>
                    </div>
                  )}
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

// ช่วยดึงไอคอนรถ
function getVehicleIcon(type: string) {
  switch (type) { case 'car': return '🚗'; case 'suv': return '🚙'; case 'van': return '🚐'; case 'pickup': return '🛻'; case 'saleng': return '🛺'; default: return '🛵'; }
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/app/components/BottomNav';
import { useLoadScript, GoogleMap, MarkerF } from '@react-google-maps/api';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';

const libraries: ("places")[] = ["places"];
const DEFAULT_CENTER = { lat: 12.7844, lng: 101.6500 }; // พิกัดแกลง ระยอง

export default function WinOnlinePage() {
  const router = useRouter();

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries,
    language: 'th', // 🌟 เน้นผลลัพธ์เป็นภาษาไทย
    region: 'TH'     // 🌟 เน้นผลลัพธ์ในประเทศไทย
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
  const [isLocating, setIsLocating] = useState(false);

  const [pickupCoords, setPickupCoords] = useState<google.maps.LatLngLiteral | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<google.maps.LatLngLiteral | null>(null);

  const {
    ready, value, suggestions: { status, data }, setValue, clearSuggestions, init
  } = usePlacesAutocomplete({
    initOnMount: false,
    requestOptions: { 
      componentRestrictions: { country: 'th' },
      language: 'th' // 🌟 บังคับการค้นหาเป็นภาษาไทย
    },
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
    { name: 'เซเว่นอีเลฟเว่น สาขาตลาดแกลง', detail: 'ใกล้สี่แยกไฟแดง' },
    { name: 'โลตัส แกลง', detail: 'ถนนสุขุมวิท' }
  ];

  const calculateRoute = useCallback(async (origin: google.maps.LatLngLiteral, destination: google.maps.LatLngLiteral) => {
    if (!isLoaded) return;
    const directionsService = new google.maps.DirectionsService();
    try {
      const result = await directionsService.route({
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
      });
      if (result.routes[0].legs[0].distance) {
        setDistanceKm(Number((result.routes[0].legs[0].distance.value / 1000).toFixed(1)));
      }
    } catch (error) { console.error("Route error:", error); }
  }, [isLoaded]);

  useEffect(() => {
    if (pickupCoords && (dropoffCoords || jobType === 'buy')) {
      if (dropoffCoords) calculateRoute(pickupCoords, dropoffCoords);
      
      let baseFare = 0; let ratePerKm = 0;
      switch (vehicleType) {
        case 'motorcycle': baseFare = 20; ratePerKm = distanceKm > 5 ? 10 : 8; break;
        case 'saleng': baseFare = 30; ratePerKm = 10; break;
        case 'car': baseFare = 40; ratePerKm = 12; break;
        case 'suv': baseFare = 50; ratePerKm = 15; break;
        case 'van': baseFare = 100; ratePerKm = 20; break;
        case 'pickup': baseFare = 150; ratePerKm = 20; break;
      }
      const distanceFee = distanceKm * ratePerKm;
      const rawBeforeFuel = baseFare + distanceFee;
      const fuelSurge = (rawBeforeFuel * 1.05) - rawBeforeFuel;
      const totalDriverFare = rawBeforeFuel + fuelSurge; 
      const platformFee = totalDriverFare * 0.03; 
      setFareBreakdown({ base: baseFare, distanceFee: distanceFee, fuelSurge: fuelSurge, platformFee: platformFee, totalFare: Math.ceil(totalDriverFare + platformFee) });
    }
  }, [pickupCoords, dropoffCoords, jobType, vehicleType, distanceKm, calculateRoute]);

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
    if (!error) { setIsModalOpen(false); alert('โพสต์งานเรียบร้อยค่ะ! 🚀 ขอบคุณที่ร่วมสร้างชุมชนจงเจริญนะคะ'); fetchJobs(); }
    setIsSubmitting(false);
  };

  const handleSelectLocation = async (address: string) => {
    setValue('', false);
    clearSuggestions();
    try {
      const results = await getGeocode({ address });
      const coords = await getLatLng(results[0]);
      if (pickingType === 'pickup') { setPickup(address); setPickupCoords(coords); } 
      else { setDropoff(address); setDropoffCoords(coords); }
    } catch { 
      if (pickingType === 'pickup') setPickup(address); else setDropoff(address);
    }
    setIsLocationPickerOpen(false);
    setIsMapMode(false);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return alert("เบราว์เซอร์ไม่รองรับ GPS");
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setMapCenter(coords);
      setSelectedPin(coords);
      try {
        const res = await getGeocode({ location: coords });
        const addr = res[0]?.formatted_address || "พิกัดปัจจุบัน";
        if (confirm(`พบตำแหน่งของคุณแล้ว!\nใช้ที่อยู่นี้ใช่ไหมคะ?\n${addr}`)) {
          if (pickingType === 'pickup') { setPickup(addr); setPickupCoords(coords); }
          else { setDropoff(addr); setDropoffCoords(coords); }
          setIsLocationPickerOpen(false);
          setIsMapMode(false);
        }
      } catch { alert("ระบุพิกัดสำเร็จ"); }
      setIsLocating(false);
    }, () => setIsLocating(false));
  };

  const onMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setSelectedPin(coords);
      try {
        const res = await getGeocode({ location: coords });
        const addr = res[0]?.formatted_address || "พิกัดที่เลือก";
        if (confirm(`ใช้ตำแหน่งนี้ใช่ไหมคะ?\n${addr}`)) {
          if (pickingType === 'pickup') { setPickup(addr); setPickupCoords(coords); }
          else { setDropoff(addr); setDropoffCoords(coords); }
          setIsLocationPickerOpen(false);
          setIsMapMode(false);
        }
      } catch { alert("ปักหมุดสำเร็จ"); }
    }
  }, [pickingType]);

  const getVehicleIcon = (type: string) => {
    switch (type) { case 'car': return '🚗'; case 'suv': return '🚙'; case 'van': return '🚐'; case 'pickup': return '🛻'; case 'saleng': return '🛺'; default: return '🛵'; }
  };

  const getVehicleName = (type: string) => {
    switch (type) { case 'car': return 'รถเก๋ง'; case 'suv': return 'รถครอบครัว'; case 'van': return 'รถตู้'; case 'pickup': return 'กระบะ'; case 'saleng': return 'ซาเล้ง'; default: return 'มอเตอร์ไซค์'; }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-hidden">
        
        {/* Header 🌟 กลับมาแล้ว: ข้อความจูงใจ */}
        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-b-[2.5rem] p-6 pt-10 shadow-md relative z-10">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-white text-2xl font-black tracking-tight">🛵 งานด่วนชุมชน</h1>
            <button onClick={() => setUserRole(userRole === 'customer' ? 'provider' : 'customer')} className="bg-white/20 px-3 py-1.5 rounded-full text-[10px] text-white font-bold backdrop-blur-sm border border-white/30 active:scale-95 transition-all">
              โหมด: {userRole === 'customer' ? 'ลูกค้า' : 'ไรเดอร์'}
            </button>
          </div>
          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/20 text-white text-[11px] leading-relaxed">
            <span className="font-bold text-yellow-200 text-xs">✨ บริการด้วยใจ ราคาเป็นธรรม ยั่งยืนทั้งชุมชน จงเจริญ</span><br/>
            แพลตฟอร์มที่ให้คนขับรับรายได้เต็ม 100% ไม่มีหักเปอร์เซ็นต์
          </div>
        </div>

        {/* Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32 scrollbar-hide">
          {userRole === 'customer' ? (
            <div className="mt-6 text-center bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-50 relative overflow-hidden">
              <div className="text-6xl mb-4">🏠</div>
              <h3 className="text-lg font-black text-gray-800 mb-2">เรียกวิน หรือ ส่งของ?</h3>
              {/* 🌟 กลับมาแล้ว: ข้อความอธิบายชวนใช้ */}
              <p className="text-xs text-gray-500 mb-8 leading-relaxed px-4">
                สนับสนุนไรเดอร์ในบ้านเราด้วยราคากลางที่โปร่งใส<br/>เงินค่าเดินทางตกถึงมือคนขับ 100% เต็ม ❤️
              </p>
              <button onClick={() => setIsModalOpen(true)} className="bg-[#EE4D2D] text-white px-8 py-4 rounded-2xl font-bold w-full shadow-md active:scale-95 transition-all">
                + โพสต์งานด่วนเลย
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <h2 className="text-sm font-black text-gray-800">🟢 งานที่รอคนรับ</h2>
                <button onClick={fetchJobs} className="text-[10px] text-[#EE4D2D] font-bold">🔄 รีเฟรช</button>
              </div>
              {isLoading ? (
                <div className="bg-white rounded-[1.5rem] p-4 h-32 animate-pulse"></div>
              ) : jobs.length === 0 ? (
                <div className="bg-white rounded-[2rem] p-8 text-center text-gray-500 text-sm italic">ตอนนี้ยังไม่มีงานเข้ามาค่ะ ลองแวะมาดูใหม่นะคะ 💨</div>
              ) : jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-2xl">{getVehicleIcon(job.vehicle_type)}</div>
                      <div><h3 className="font-bold text-sm text-gray-800">{job.title}</h3><span className="text-[10px] text-gray-400 mt-1 block">ลูกค้า: {job.profiles?.first_name || 'เพื่อนบ้าน'}</span></div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-[#EE4D2D]">฿{job.offered_price}</div>
                      <div className="text-[9px] text-gray-400 font-bold uppercase mt-1">{job.distance_km} กม.</div>
                    </div>
                  </div>
                  <button className="w-full bg-[#EE4D2D] text-white py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-all">รับงานนี้ ⚡</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal: Post Job */}
        {isModalOpen && !isLocationPickerOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full sm:max-w-md rounded-t-[2.5rem] p-6 max-h-[90vh] overflow-y-auto pb-10 scrollbar-hide">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-black text-gray-800">เรียกงานด่วน 🚀</h2>
                <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">✕</button>
              </div>

              <form onSubmit={handlePostJob} className="space-y-4">
                <div className="flex gap-2 mb-4">
                  {['ride', 'buy', 'deliver'].map((t) => (
                    <button key={t} type="button" onClick={() => setJobType(t as any)} className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold border transition-all ${jobType === t ? 'bg-orange-50 border-[#EE4D2D] text-[#EE4D2D]' : 'bg-white border-gray-200 text-gray-400'}`}>
                      {t === 'ride' ? '🛵 เรียกรถ' : t === 'buy' ? '🍜 ฝากซื้อ' : '📦 ส่งของ'}
                    </button>
                  ))}
                </div>

                {/* 🌟 กลับมาแล้ว: ระบบเลือกประเภทยานพาหนะ 6 ชนิด */}
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
                  <div onClick={() => { setPickingType('pickup'); setIsLocationPickerOpen(true); }} className={`w-full bg-white border rounded-xl px-4 py-3 text-sm flex justify-between items-center cursor-pointer ${pickup ? 'border-orange-200 text-gray-800 font-bold' : 'text-gray-400'}`}>
                    <span className="truncate pr-4">{pickup || '📍 เลือกจุดรับต้นทาง'}</span>
                    <span className="text-gray-300">›</span>
                  </div>
                  <div onClick={() => { setPickingType('dropoff'); setIsLocationPickerOpen(true); }} className={`w-full bg-white border rounded-xl px-4 py-3 text-sm flex justify-between items-center cursor-pointer ${dropoff ? 'border-orange-200 text-gray-800 font-bold' : 'text-gray-400'}`}>
                    <span className="truncate pr-4">{dropoff || '📍 เลือกจุดส่งปลายทาง'}</span>
                    <span className="text-gray-300">›</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="หมายเหตุถึงคนขับ (ถ้ามี)" rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#EE4D2D] outline-none resize-none"></textarea>
                </div>

                {/* 🌟 กลับมาแล้ว: ปุ่ม (i) แจกแจงราคาโปร่งใส */}
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
                        แอปพลิเคชันไม่หักเปอร์เซ็นต์ค่าเดินทางจากคนขับ ❤️
                      </div>
                    </div>
                  )}
                </div>

                <button type="submit" disabled={isSubmitting || fareBreakdown.totalFare <= 0} className="w-full bg-[#EE4D2D] text-white font-black py-4 rounded-2xl text-sm mt-4 shadow-lg active:scale-95 disabled:opacity-50 transition-all">
                  {isSubmitting ? 'กำลังส่งข้อมูล...' : 'ยืนยันการเรียกรถ'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Location Picker */}
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
                  <div onClick={handleGetCurrentLocation} className="p-4 bg-white rounded-2xl border-2 border-orange-100 flex items-center justify-between text-[#EE4D2D] font-bold text-sm shadow-sm cursor-pointer active:bg-orange-50 transition-all">
                    <div className="flex items-center gap-3"><span className="text-xl">🎯</span><span>ใช้ตำแหน่งปัจจุบันของฉัน</span></div>
                    {isLocating && <div className="w-4 h-4 border-2 border-[#EE4D2D] border-t-transparent rounded-full animate-spin"></div>}
                  </div>
                  <div onClick={() => setIsMapMode(true)} className="p-4 bg-white rounded-2xl border border-gray-100 flex items-center gap-3 text-gray-600 font-bold text-sm shadow-sm cursor-pointer">
                    <span className="text-xl">🗺️</span> เลือกตำแหน่งจากแผนที่เอง
                  </div>
                  
                  {/* 🌟 ใช้งาน Google Places เป็นภาษาไทย */}
                  {status === "OK" ? data.map(({ place_id, description, structured_formatting: { main_text, secondary_text } }) => (
                    <div key={place_id} onClick={() => handleSelectLocation(description)} className="p-4 bg-white rounded-xl shadow-sm border border-gray-50 flex items-center gap-3 cursor-pointer transition-colors active:bg-orange-50">
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 text-sm">📍</div>
                      <div><h4 className="text-sm font-bold text-gray-800">{main_text}</h4><p className="text-[10px] text-gray-500 line-clamp-1">{secondary_text}</p></div>
                    </div>
                  )) : (
                    popularPlaces.map((p, i) => (
                      <div key={i} onClick={() => handleSelectLocation(p.name)} className="p-4 bg-white rounded-xl shadow-sm border border-gray-50 flex items-center gap-3 cursor-pointer">
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
                      <GoogleMap mapContainerStyle={{ width: '100%', height: '100%' }} center={mapCenter} zoom={16} onClick={onMapClick} options={{ disableDefaultUI: true, zoomControl: false }}>
                        {selectedPin && <MarkerF position={selectedPin} />}
                      </GoogleMap>
                      <button onClick={handleGetCurrentLocation} className="absolute top-4 right-4 w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-2xl border border-gray-100 active:bg-gray-100 transition-colors">🎯</button>
                      <div className="absolute bottom-10 left-4 right-4">
                        <div className="bg-white/90 backdrop-blur-md p-5 rounded-[2rem] shadow-2xl border border-white text-center">
                          <p className="text-sm font-black text-gray-800 mb-4 px-6 italic">จิ้มลงบนแผนที่เพื่อปักหมุด 📍</p>
                          <button onClick={() => setIsMapMode(false)} className="text-[#EE4D2D] text-[11px] font-bold py-2 px-4 rounded-full border border-orange-100">กลับไปพิมพ์ค้นหา</button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">กำลังโหลดระบบแผนที่ภาษาไทย...</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {!isModalOpen && !isLocationPickerOpen && <BottomNav />}
      </div>
      <style dangerouslySetInnerHTML={{__html: `.scrollbar-hide::-webkit-scrollbar { display: none; } .animate-fade-in { animation: fadeIn 0.3s ease-out; } @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }`}} />
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLoadScript, GoogleMap, MarkerF } from '@react-google-maps/api';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';

const libraries: ("places")[] = ["places"];
const DEFAULT_CENTER = { lat: 12.7844, lng: 101.6500 };

const SAVED_PLACES = [
  { name: 'บ้าน', detail: 'ที่อยู่บ้านที่บันทึกไว้', icon: '🏠' },
  { name: 'ที่ทำงาน', detail: 'ออฟฟิศของฉัน', icon: '💼' },
];

const POPULAR_PLACES = [
  { name: 'โรงพยาบาลแกลง', detail: 'Klaeng Hospital', icon: '🏥' },
  { name: 'ตลาดสามย่าน แกลง', detail: 'Sam Yan Market', icon: '🏪' },
  { name: 'เทสโก้ โลตัส แกลง', detail: 'Tesco Lotus Klaeng', icon: '🛒' },
];

const JOB_TYPES_UI = [
  { key: 'ride', label: 'เรียกรถ', icon: '🛵', desc: 'รับ-ส่งคน' },
  { key: 'buy', label: 'ซื้อของ', icon: '🛒', desc: 'ฝากซื้อ' },
  { key: 'deliver', label: 'ส่งของ', icon: '📦', desc: 'รับ-ส่งพัสดุ' },
];

const VEHICLES_UI = [
  { key: 'motorcycle', label: 'มอไซค์', icon: '🛵' },
  { key: 'saleng', label: 'ซาเล้ง', icon: '🛺' },
  { key: 'car', label: 'รถเก๋ง', icon: '🚗' },
  { key: 'suv', label: 'ครอบครัว', icon: '🚙' },
  { key: 'van', label: 'รถตู้', icon: '🚐' },
  { key: 'pickup', label: 'กระบะ', icon: '🛻' }
];

export default function WinOnlinePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries,
    region: 'TH'
  });

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
  const [jobType, setJobType] = useState<'ride' | 'buy' | 'deliver'>('ride');
  const [vehicleType, setVehicleType] = useState<any>('motorcycle');
  const [title, setTitle] = useState('');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [fareBreakdown, setFareBreakdown] = useState({ base: 0, distanceFee: 0, fuelSurge: 0, totalFare: 0 });

  const { ready, value, suggestions: { status, data }, setValue, clearSuggestions, init } = usePlacesAutocomplete({
    initOnMount: false, requestOptions: { componentRestrictions: { country: 'th' } }, debounce: 300,
  });

  useEffect(() => { if (isLoaded) init(); }, [isLoaded, init]);

  const fetchMyActiveJobs = useCallback(async (userId: string, isSilent = false) => {
    if (!isSilent) setIsLoading(true); 
    const { data } = await supabase.from('jobs')
      .select(`*, worker:profiles!worker_id (full_name)`)
      .eq('employer_id', userId)
      .in('job_type', ['ride', 'buy', 'deliver']) 
      .in('status', ['open', 'in_progress', 'pending_payment']) // โชว์งานที่รอจ่ายเงินด้วย
      .order('created_at', { ascending: false });
    
    if (data) setJobs(data);
    if (!isSilent) setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    const initData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
        fetchMyActiveJobs(session.user.id);
      } else {
        setIsLoading(false);
      }
    };
    initData();
  }, [fetchMyActiveJobs, supabase]);

  useEffect(() => {
    if (!currentUser) return;
    const channel = supabase.channel('public-jobs-win-customer')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs', filter: `employer_id=eq.${currentUser.id}` }, () => {
        fetchMyActiveJobs(currentUser.id, true); 
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchMyActiveJobs, supabase, currentUser]);

  const calculateRoute = useCallback(async (origin: google.maps.LatLngLiteral, destination: google.maps.LatLngLiteral) => {
    if (!isLoaded) return;
    const directionsService = new google.maps.DirectionsService();
    try {
      const result = await directionsService.route({ origin, destination, travelMode: google.maps.TravelMode.DRIVING });
      if (result.routes[0].legs[0].distance) { setDistanceKm(Number((result.routes[0].legs[0].distance.value / 1000).toFixed(1))); }
    } catch (error) { console.error(error); }
  }, [isLoaded]);

  useEffect(() => {
    if (pickupCoords && (dropoffCoords || jobType === 'buy')) {
      if (dropoffCoords) calculateRoute(pickupCoords, dropoffCoords);
      let baseFare = 0; let ratePerKm = 0;
      switch (vehicleType) {
        case 'motorcycle': baseFare = 20; ratePerKm = distanceKm > 5 ? 10 : 8; break;
        case 'saleng': baseFare = 30; ratePerKm = 10; break;
        case 'car': baseFare = 45; ratePerKm = 10; break;
        case 'suv': baseFare = 60; ratePerKm = 14; break;
        case 'van': baseFare = 150; ratePerKm = 20; break;
        case 'pickup': baseFare = 250; ratePerKm = 20; break;
      }
      const distanceFee = distanceKm * ratePerKm;
      const fuelSurge = distanceKm > 0 ? (distanceKm * 1.5) : 0; 
      setFareBreakdown({ base: baseFare, distanceFee, fuelSurge, totalFare: Math.ceil(baseFare + distanceFee + fuelSurge) });
    }
  }, [pickupCoords, dropoffCoords, jobType, vehicleType, distanceKm, calculateRoute]);

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return router.push('/auth/login?next=/win-online');
    setIsSubmitting(true);
    
    // 🌟 สร้างงานด้วยสถานะ pending_payment เพื่อให้ลูกค้าไปจ่ายเงินก่อน
    const { data: newJob, error } = await supabase.from('jobs').insert({
      employer_id: currentUser.id, 
      title, 
      job_type: jobType, 
      vehicle_type: vehicleType, 
      pickup_location: pickup, 
      dropoff_location: dropoff || null, 
      distance_km: distanceKm, 
      budget: fareBreakdown.totalFare, 
      status: 'pending_payment' // ไรเดอร์จะยังไม่เห็นงานนี้
    }).select().single();

    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
      setIsSubmitting(false);
    } else {
      // 🌟 สร้างงานสำเร็จ พาไปหน้าจ่ายเงิน QR Code ทันที
      router.push(`/checkout/${newJob.id}`);
    }
  };

  const handleSelectLocation = async (address: string) => {
    setValue('', false); clearSuggestions();
    try {
      const res = await getGeocode({ address }); const coords = await getLatLng(res[0]);
      if (pickingType === 'pickup') { setPickup(address); setPickupCoords(coords); } else { setDropoff(address); setDropoffCoords(coords); }
    } catch { if (pickingType === 'pickup') setPickup(address); else setDropoff(address); }
    setIsLocationPickerOpen(false); setIsMapMode(false);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setMapCenter(coords); setSelectedPin(coords);
      try {
        const res = await getGeocode({ location: coords });
        const addr = res[0]?.formatted_address || "ตำแหน่งปัจจุบัน";
        if (confirm(`ใช้ตำแหน่งนี้ใช่ไหมคะ?\n${addr}`)) {
          if (pickingType === 'pickup') { setPickup(addr); setPickupCoords(coords); } else { setDropoff(addr); setDropoffCoords(coords); }
          setIsLocationPickerOpen(false); setIsMapMode(false);
        }
      } catch {}
      setIsLocating(false);
    });
  };

  const onMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() }; setSelectedPin(coords);
      try {
        const res = await getGeocode({ location: coords }); const addr = res[0]?.formatted_address || "ตำแหน่งที่เลือกบนแผนที่";
        if (confirm(`ใช้ตำแหน่งนี้ใช่ไหมคะ?\n${addr}`)) {
          if (pickingType === 'pickup') { setPickup(addr); setPickupCoords(coords); } else { setDropoff(addr); setDropoffCoords(coords); }
          setIsLocationPickerOpen(false); setIsMapMode(false);
        }
      } catch { alert("ปักหมุดสำเร็จค่ะ"); }
    }
  }, [pickingType]);

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-24 md:pb-10">
      <div className="w-full lg:max-w-5xl xl:max-w-6xl bg-[#F8FAFC] min-h-screen relative flex flex-col md:shadow-2xl overflow-x-hidden md:border-x border-gray-200/50">
        
        <header className="bg-gradient-to-br from-[#EE4D2D] to-[#FF7337] px-6 pt-12 pb-16 md:pb-20 rounded-b-[2.5rem] md:rounded-b-[4rem] text-white shadow-lg relative z-20">
          <div className="flex items-center gap-4 max-w-3xl mx-auto">
            <button onClick={() => router.back()} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 active:scale-95 transition-all backdrop-blur-md">←</button>
            <div>
              <h1 className="text-2xl md:text-4xl font-black tracking-tight">จงเจริญ วินออนไลน์ 🛵</h1>
              <p className="text-xs md:text-sm font-bold text-orange-100 opacity-90 mt-1 md:mt-2">สนับสนุนไรเดอร์ในบ้านเรา ด้วยราคาที่โปร่งใส</p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-5 md:px-10 -mt-8 relative z-30 w-full max-w-3xl mx-auto space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3 px-2"><h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">เลือกบริการที่ต้องการ</h2></div>
            <div className="grid grid-cols-3 gap-3 md:gap-5">
              {JOB_TYPES_UI.map((t) => (
                <button key={t.key} onClick={() => { if(!currentUser) return router.push('/auth/login'); setJobType(t.key as any); setIsModalOpen(true); }} className="bg-white rounded-[1.5rem] p-4 md:p-6 shadow-sm border border-gray-100 flex flex-col items-center gap-2 hover:border-[#EE4D2D] transition-all group active:scale-95">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-orange-50 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">{t.icon}</div>
                  <div className="text-center mt-1"><p className="text-sm md:text-base font-black text-gray-800">{t.label}</p><p className="text-[10px] md:text-xs text-gray-500 font-bold mt-0.5">{t.desc}</p></div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 mt-4">
             <div className="flex items-center justify-between mb-4"><h2 className="text-base font-black text-gray-800 flex items-center gap-2"><span className="text-blue-500">⏳</span> รายการเรียกวินของคุณ</h2></div>
             {isLoading ? ( <div className="animate-pulse space-y-3"><div className="h-20 bg-gray-100 rounded-2xl"></div></div> ) : jobs.length === 0 ? (
               <div className="text-center py-8 bg-gray-50 rounded-2xl border border-gray-100 border-dashed"><p className="text-sm font-bold text-gray-400">ไม่มีรายการเรียกวินค้างในระบบค่ะ</p></div>
             ) : (
               <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar pr-1">
                 {jobs.map((job) => (
                   <div key={job.id} onClick={() => {
                     // 🌟 ถ้างานยังไม่จ่ายเงิน ให้กดแล้วไปหน้าจ่ายเงิน
                     if (job.status === 'pending_payment') {
                       router.push(`/checkout/${job.id}`);
                     } else {
                       router.push(`/chat/${job.id}`);
                     }
                   }} className="p-4 rounded-2xl border border-gray-200 hover:border-[#EE4D2D] transition-all cursor-pointer group">
                     <div className="flex justify-between items-start mb-2">
                       <span className="text-sm font-black text-gray-800 group-hover:text-[#EE4D2D]">{job.title || 'เรียกงานด่วน'}</span>
                       <span className={`text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${job.status === 'open' ? 'bg-yellow-50 text-yellow-600' : job.status === 'pending_payment' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                         <span className={`w-1.5 h-1.5 rounded-full ${job.status === 'open' ? 'bg-yellow-400 animate-pulse' : job.status === 'pending_payment' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                         {job.status === 'open' ? 'รอคนขับรับงาน' : job.status === 'pending_payment' ? 'รอชำระเงิน' : 'คนขับกำลังไป'}
                       </span>
                     </div>
                     <p className="text-xs text-gray-500 font-medium line-clamp-1 mb-3">📍 {job.pickup_location}</p>
                     <div className="flex justify-between items-end border-t border-gray-100 pt-3"><span className="text-[10px] font-bold text-gray-400">{job.worker ? `คนขับ: ${job.worker.full_name}` : job.status === 'pending_payment' ? 'กรุณาชำระเงินก่อน' : 'กำลังหาคนขับ...'}</span><span className="text-base font-black text-[#00C300]">{job.budget} บาท</span></div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </main>

        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-xl rounded-t-[2.5rem] p-8 max-h-[90vh] overflow-y-auto pb-10 relative shadow-2xl">
              <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-black text-gray-800">รายละเอียดงานด่วน 🚀</h2><button onClick={() => setIsModalOpen(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">✕</button></div>
              <form onSubmit={handlePostJob} className="space-y-5">
                <div className="grid grid-cols-3 gap-2">{JOB_TYPES_UI.map((t) => ( <button key={t.key} type="button" onClick={() => setJobType(t.key as any)} className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center ${jobType === t.key ? 'border-[#EE4D2D] bg-orange-50' : 'border-gray-100 bg-white opacity-60'}`}><div className="text-2xl mb-1">{t.icon}</div><p className="font-black text-[11px]">{t.label}</p></button> ))}</div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">{VEHICLES_UI.map((v) => ( <button key={v.key} type="button" onClick={() => setVehicleType(v.key as any)} className={`p-2 rounded-xl border-2 transition-all flex flex-col items-center ${vehicleType === v.key ? 'border-[#EE4D2D] bg-orange-50 scale-105' : 'border-gray-50 opacity-40'}`}><span className="text-xl mb-1">{v.icon}</span><span className="text-[8px] font-black">{v.label}</span></button> ))}</div>
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="รายละเอียดสั้นๆ เช่น ไปส่งโรงพยาบาล..." className="w-full bg-gray-50 border border-gray-200 rounded-[1rem] px-4 py-4 text-sm font-bold focus:border-[#EE4D2D] outline-none" />
                <div className="bg-[#F8FAFC] p-5 rounded-[1.5rem] border border-gray-100 space-y-3">
                  <div onClick={() => { setPickingType('pickup'); setIsLocationPickerOpen(true); }} className="w-full bg-white border border-gray-200 rounded-[1rem] px-4 py-3.5 text-sm flex justify-between cursor-pointer"><div className="flex gap-3 items-center overflow-hidden font-bold text-gray-800"><span>📍</span><span className="truncate">{pickup || 'จุดรับต้นทาง'}</span></div><span>›</span></div>
                  <div onClick={() => { setPickingType('dropoff'); setIsLocationPickerOpen(true); }} className="w-full bg-white border border-gray-200 rounded-[1rem] px-4 py-3.5 text-sm flex justify-between cursor-pointer"><div className="flex gap-3 items-center overflow-hidden font-bold text-gray-800"><span>🚩</span><span className="truncate">{dropoff || 'จุดส่งปลายทาง'}</span></div><span>›</span></div>
                </div>
                <div className="bg-orange-50 border border-orange-100 rounded-[1.5rem] p-5 shadow-sm">
                  {fareBreakdown.totalFare > 0 && ( <div className="space-y-2 mb-3 pb-3 border-b border-orange-200/50 text-[11px] font-bold text-gray-600"><div className="flex justify-between"><span>ค่าเริ่มต้น</span><span>{fareBreakdown.base} บาท</span></div><div className="flex justify-between"><span>ค่าระยะทาง ({distanceKm} กม.)</span><span>{Math.round(fareBreakdown.distanceFee)} บาท</span></div><div className="flex justify-between text-[#EE4D2D]"><span>ค่าพลังงาน</span><span>{Math.ceil(fareBreakdown.fuelSurge)} บาท</span></div></div> )}
                  <div className="flex justify-between items-end"><div><p className="text-[11px] text-[#EE4D2D] font-black uppercase">ราคาประเมินสุทธิ</p><p className="text-[9px] text-orange-400 font-bold italic">พักเงินไว้ที่ระบบจงเจริญ</p></div><div className="text-right"><div className="text-3xl font-black text-[#EE4D2D] tracking-tighter">{fareBreakdown.totalFare > 0 ? `${fareBreakdown.totalFare} บาท` : '-'}</div></div></div>
                </div>
                <button type="submit" disabled={isSubmitting || fareBreakdown.totalFare <= 0} className="w-full bg-[#EE4D2D] text-white font-black py-5 rounded-[1.5rem] text-base shadow-lg active:scale-95 transition-all disabled:opacity-50">
                  {isSubmitting ? 'กำลังส่งคำขอ...' : 'ดำเนินการชำระเงิน 🚀'}
                </button>
              </form>
            </div>
          </div>
        )}

        {isLocationPickerOpen && (
          <div className="fixed inset-0 z-[110] bg-[#F4F6F8] flex flex-col animate-fade-in">
            <div className="p-4 border-b flex items-center gap-3 bg-white shadow-sm z-10 pt-safe">
              <button onClick={() => { setIsLocationPickerOpen(false); setIsMapMode(false); }} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center font-bold text-gray-500">←</button>
              {!isMapMode ? ( <input autoFocus type="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder="ค้นหาจุดรับ/ส่ง..." className="flex-1 bg-[#F4F6F8] rounded-[1rem] px-5 py-3 text-sm font-bold outline-none" /> ) : ( <div className="flex-1 font-black text-sm text-gray-800 text-center pr-10">เลื่อนแผนที่เพื่อปักหมุด 📍</div> )}
            </div>
            <div className="flex-1 relative overflow-y-auto p-4 space-y-3">
              {!isMapMode ? (
                <>
                  <div onClick={handleGetCurrentLocation} className="p-4 bg-white rounded-[1rem] border border-blue-100 flex items-center justify-between text-blue-600 font-bold text-sm shadow-sm cursor-pointer hover:bg-blue-50">
                    <div className="flex items-center gap-3"><span>🎯</span><span>ใช้ตำแหน่งปัจจุบัน (GPS)</span></div>{isLocating && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
                  </div>
                  <div onClick={() => setIsMapMode(true)} className="p-4 bg-white rounded-[1rem] border border-gray-200 flex items-center gap-3 text-gray-700 font-bold text-sm shadow-sm cursor-pointer hover:bg-gray-50"><span>🗺️</span>ปักหมุดบนแผนที่เอง</div>
                  <div className="flex gap-3 my-2">{SAVED_PLACES.map((p, i) => ( <div key={i} onClick={() => handleSelectLocation(p.name)} className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#EE4D2D]"><span className="text-2xl">{p.icon}</span><span className="text-xs font-black text-gray-800">{p.name}</span></div> ))}</div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mt-4 mb-2">สถานที่ยอดฮิต</p>
                  {status === "OK" ? data.map(({ place_id, description }) => ( <div key={place_id} onClick={() => handleSelectLocation(description)} className="p-4 bg-white rounded-[1rem] shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:border-[#EE4D2D]"><div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-lg">📍</div><h4 className="text-sm font-bold text-gray-800">{description}</h4></div> )) : ( POPULAR_PLACES.map((p, i) => ( <div key={i} onClick={() => handleSelectLocation(p.name)} className="p-4 bg-white rounded-[1rem] shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:border-[#EE4D2D]"><div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-lg">{p.icon}</div><div><h4 className="text-sm font-bold text-gray-800">{p.name}</h4><p className="text-[10px] text-gray-400 mt-0.5">{p.detail}</p></div></div> )) )}
                </>
              ) : (
                <div className="absolute inset-0">
                  {isLoaded && <GoogleMap mapContainerStyle={{ width: '100%', height: '100%' }} center={mapCenter} zoom={16} onClick={onMapClick} options={{ disableDefaultUI: true, zoomControl: false }}>{selectedPin && <MarkerF position={selectedPin} />}</GoogleMap>}
                  <button onClick={handleGetCurrentLocation} className="absolute top-4 right-4 w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center text-2xl text-blue-500">🎯</button>
                  <div className="absolute bottom-10 left-6 right-6 bg-white/95 backdrop-blur-xl p-6 rounded-[2rem] shadow-2xl text-center"><p className="text-sm font-black text-gray-800 mb-5">จิ้มที่แผนที่เพื่อปักหมุด 📍</p><button onClick={() => setIsMapMode(false)} className="bg-gray-100 text-gray-600 px-6 py-3 rounded-full text-xs font-bold">กลับไปค้นหา</button></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

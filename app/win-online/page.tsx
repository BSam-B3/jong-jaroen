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
    region: 'TH'
  });

  const [userRole, setUserRole] = useState<'customer' | 'provider'>('customer'); 
  const [activeTab, setActiveTab] = useState<'feed' | 'my_jobs'>('feed'); // 🌟 แถบเมนูย่อย
  
  const [jobs, setJobs] = useState<any[]>([]);
  const [myJobs, setMyJobs] = useState<any[]>([]); // 🌟 เก็บข้อมูลงานของตัวเอง
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
    { name: 'โรงพยาบาลแกลง', detail: 'Klaeng Hospital' },
    { name: 'ตลาดสามย่าน แกลง', detail: 'Sam Yan Market' },
    { name: 'เซเว่นอีเลฟเว่น ตลาดแกลง', detail: '7-Eleven Sam Yan' },
    { name: 'โลตัส แกลง', detail: 'Lotus\'s Klaeng' }
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

  // 🌟 ฟังก์ชันดึงข้อมูลแบบแยกประเภท (งานรวม vs งานของฉัน)
  const fetchJobs = useCallback(async (userId?: string) => {
    setIsLoading(true);
    
    // 1. ดึงกระดานงานที่รอคนรับ (สำหรับไรเดอร์)
    const { data: openData } = await supabase
      .from('express_jobs')
      .select(`*, profiles:customer_id (first_name)`)
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    if (openData) setJobs(openData);

    // 2. ดึงประวัติงานของฉัน (ลูกค้า: งานที่โพสต์ / ไรเดอร์: งานที่รับ)
    if (userId) {
      const myJobsQuery = supabase
        .from('express_jobs')
        .select(`*, profiles:customer_id (first_name)`)
        .order('created_at', { ascending: false });
      
      // ถ้าเป็นลูกค้า ดึงงานที่ตัวเองสร้าง / ถ้าเป็นไรเดอร์ ดึงงานที่ตัวเองรับไป
      const finalQuery = userRole === 'customer' 
        ? myJobsQuery.eq('customer_id', userId) 
        : myJobsQuery.eq('provider_id', userId);
        
      const { data: myData } = await finalQuery;
      if (myData) setMyJobs(myData);
    }
    
    setIsLoading(false);
  }, [userRole]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user || null);
      fetchJobs(session?.user?.id);
    });

    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'express_jobs' }, () => {
        if (currentUser) fetchJobs(currentUser.id);
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchJobs, currentUser?.id]);

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return router.push('/auth/login');
    setIsSubmitting(true);
    const { error } = await supabase.from('express_jobs').insert({
      customer_id: currentUser.id, title, job_type: jobType, vehicle_type: vehicleType, pickup_location: pickup, dropoff_location: dropoff || null, distance_km: distanceKm, note: note || null, offered_price: fareBreakdown.totalFare, status: 'open'
    });
    if (!error) { 
      setIsModalOpen(false); 
      alert('โพสต์งานเรียบร้อยค่ะ! 🚀'); 
      setActiveTab('my_jobs'); // เด้งไปหน้าติดตามงานอัตโนมัติ
      fetchJobs(currentUser.id); 
    }
    setIsSubmitting(false);
  };

  // 🌟 ฟังก์ชันจัดการวงจรชีวิตงาน (Lifecycle)
  const handleUpdateJobStatus = async (jobId: string, newStatus: 'accepted' | 'completed' | 'cancelled') => {
    if (!currentUser) return alert("กรุณาเข้าสู่ระบบค่ะ");
    
    const confirmMsg = newStatus === 'accepted' ? "รับงานนี้ใช่ไหมคะ?" 
                     : newStatus === 'completed' ? "ยืนยันว่าส่งลูกค้า/สิ่งของเรียบร้อยแล้ว?" 
                     : "ต้องการยกเลิกงานนี้ใช่ไหมคะ?";
                     
    if (!confirm(confirmMsg)) return;

    try {
      // โค้ดนี้สมมติว่าในฐานข้อมูลมีคอลัมน์ provider_id แล้ว
      const updatePayload: any = { status: newStatus };
      if (newStatus === 'accepted') updatePayload.provider_id = currentUser.id;

      const { error } = await supabase.from('express_jobs').update(updatePayload).eq('id', jobId);
      if (error) throw error;
      
      if (newStatus === 'accepted') {
        alert("🎉 รับงานสำเร็จ! ดูรายละเอียดที่ 'งานของฉัน'");
        setActiveTab('my_jobs');
      }
      fetchJobs(currentUser.id);
    } catch (error: any) { alert("Error: " + error.message); }
  };

  const handleSelectLocation = async (address: string) => {
    setValue('', false); clearSuggestions();
    try {
      const results = await getGeocode({ address }); const coords = await getLatLng(results[0]);
      if (pickingType === 'pickup') { setPickup(address); setPickupCoords(coords); } else { setDropoff(address); setDropoffCoords(coords); }
    } catch { if (pickingType === 'pickup') setPickup(address); else setDropoff(address); }
    setIsLocationPickerOpen(false); setIsMapMode(false);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return alert("GPS not supported");
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
      } catch { alert("ระบุพิกัดสำเร็จ"); }
      setIsLocating(false);
    }, () => setIsLocating(false));
  };

  const onMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() }; setSelectedPin(coords);
      try {
        const res = await getGeocode({ location: coords }); const addr = res[0]?.formatted_address || "Pinned Location";
        if (confirm(`ใช้ตำแหน่งนี้ใช่ไหมคะ?\n${addr}`)) {
          if (pickingType === 'pickup') { setPickup(addr); setPickupCoords(coords); } else { setDropoff(addr); setDropoffCoords(coords); }
          setIsLocationPickerOpen(false); setIsMapMode(false);
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

  // ตัวช่วยแปลสถานะงาน
  const translateStatus = (status: string) => {
    switch(status) {
      case 'open': return <span className="text-orange-500 bg-orange-50 px-2 py-1 rounded font-bold">รอคนรับงาน ⏳</span>;
      case 'accepted': return <span className="text-blue-500 bg-blue-50 px-2 py-1 rounded font-bold">กำลังไปหา 🛵</span>;
      case 'completed': return <span className="text-green-500 bg-green-50 px-2 py-1 rounded font-bold">เสร็จสิ้น ✅</span>;
      case 'cancelled': return <span className="text-red-500 bg-red-50 px-2 py-1 rounded font-bold">ยกเลิก ❌</span>;
      default: return status;
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-hidden">
        
        {/* Header & Tabs */}
        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-b-[2.5rem] p-6 pt-10 shadow-md relative z-10">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-white text-2xl font-black tracking-tight">🛵 งานด่วนชุมชน</h1>
            <button onClick={() => { setUserRole(userRole === 'customer' ? 'provider' : 'customer'); setActiveTab('feed'); }} className="bg-white/20 px-3 py-1.5 rounded-full text-[10px] text-white font-bold backdrop-blur-sm border border-white/30 active:scale-95 transition-all">
              โหมด: {userRole === 'customer' ? 'ลูกค้า' : 'ไรเดอร์'}
            </button>
          </div>
          
          {/* 🌟 Tab Navigation */}
          <div className="flex gap-2 bg-white/20 p-1 rounded-2xl backdrop-blur-md border border-white/30">
            <button onClick={() => setActiveTab('feed')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'feed' ? 'bg-white text-[#EE4D2D] shadow' : 'text-white/80 hover:bg-white/10'}`}>
              {userRole === 'customer' ? '🏠 เรียกวิน/ส่งของ' : '🔥 งานใหม่ (Live)'}
            </button>
            <button onClick={() => setActiveTab('my_jobs')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'my_jobs' ? 'bg-white text-[#EE4D2D] shadow' : 'text-white/80 hover:bg-white/10'}`}>
              📋 งานของฉัน
            </button>
          </div>
        </div>

        {/* Main Feed Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32 scrollbar-hide">
          
          {/* ---- แท็บ FEED ---- */}
          {activeTab === 'feed' && userRole === 'customer' && (
            <div className="mt-4 text-center bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100 relative overflow-hidden animate-fade-in">
              <div className="text-6xl mb-4">🏠</div>
              <h3 className="text-lg font-black text-gray-800 mb-2">เรียกวิน หรือ ส่งของ?</h3>
              <p className="text-xs text-gray-500 mb-8 leading-relaxed px-4">สนับสนุนไรเดอร์ในบ้านเราด้วยราคากลางที่โปร่งใส<br/>เงินตกถึงมือคนขับ 100% ❤️</p>
              <button onClick={() => setIsModalOpen(true)} className="bg-[#EE4D2D] text-white px-8 py-4 rounded-2xl font-bold w-full shadow-md active:scale-95 transition-all">
                + โพสต์งานด่วนเลย
              </button>
            </div>
          )}

          {activeTab === 'feed' && userRole === 'provider' && (
            <div className="space-y-3 animate-fade-in">
              {isLoading ? ( <div className="bg-white rounded-[1.5rem] p-4 h-32 animate-pulse"></div> ) : jobs.length === 0 ? (
                <div className="bg-white rounded-[2rem] p-8 text-center text-gray-500 text-sm italic border border-gray-100">ยังไม่มีงานเข้ามาค่ะ รอสักครู่นะคะ 💨</div>
              ) : jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-2xl">{getVehicleIcon(job.vehicle_type)}</div>
                      <div><h3 className="font-bold text-sm text-gray-800">{job.title}</h3><span className="text-[10px] text-gray-400 mt-1 block">ลูกค้า: {job.profiles?.first_name || 'เพื่อนบ้าน'}</span></div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-[#EE4D2D]">฿{job.offered_price}</div><div className="text-[9px] text-gray-400 font-bold uppercase mt-1">{job.distance_km} กม.</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl mb-3 space-y-1.5 text-xs text-gray-600">
                     <p>🟢 <span className="font-bold">รับ:</span> {job.pickup_location}</p>
                     {job.dropoff_location && <p className="border-t border-gray-200/50 pt-1.5">🔴 <span className="font-bold">ส่ง:</span> {job.dropoff_location}</p>}
                  </div>
                  <button onClick={() => handleUpdateJobStatus(job.id, 'accepted')} className="w-full bg-[#EE4D2D] text-white py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-all">รับงานนี้ ⚡</button>
                </div>
              ))}
            </div>
          )}

          {/* ---- แท็บ MY JOBS ---- */}
          {activeTab === 'my_jobs' && (
            <div className="space-y-3 animate-fade-in">
              {!currentUser ? (
                <div className="bg-white rounded-[2rem] p-8 text-center text-gray-500 text-sm border border-gray-100">กรุณาเข้าสู่ระบบเพื่อดูงานของคุณค่ะ 🔒</div>
              ) : isLoading ? (
                <div className="bg-white rounded-[1.5rem] p-4 h-32 animate-pulse"></div>
              ) : myJobs.length === 0 ? (
                <div className="bg-white rounded-[2rem] p-8 text-center text-gray-500 text-sm italic border border-gray-100">คุณยังไม่มีประวัติงานในระบบค่ะ 📭</div>
              ) : myJobs.map((job) => (
                <div key={job.id} className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-gray-50 relative overflow-hidden">
                  {/* Status Banner */}
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-3 text-[10px]">
                    <span className="text-gray-400 font-medium">{new Date(job.created_at).toLocaleString('th-TH')}</span>
                    {translateStatus(job.status)}
                  </div>

                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-xl">{getVehicleIcon(job.vehicle_type)}</div>
                      <div>
                        <h3 className="font-bold text-sm text-gray-800 line-clamp-1">{job.title}</h3>
                        <span className="text-[10px] text-gray-400">฿{job.offered_price} • {job.distance_km} กม.</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-xl mb-3 space-y-1.5 text-xs text-gray-600">
                     <p className="line-clamp-1">🟢 {job.pickup_location}</p>
                     {job.dropoff_location && <p className="border-t border-gray-200/50 pt-1.5 line-clamp-1">🔴 {job.dropoff_location}</p>}
                  </div>

                  {/* 🌟 ปุ่ม Action ตามสถานะงาน */}
                  <div className="flex gap-2">
                    {/* ปุ่มลูกค้ายกเลิกงาน (ทำได้เฉพาะตอนงานเพิ่งเปิด หรือ เพิ่งรับ) */}
                    {userRole === 'customer' && (job.status === 'open' || job.status === 'accepted') && (
                      <button onClick={() => handleUpdateJobStatus(job.id, 'cancelled')} className="flex-1 bg-red-50 text-red-600 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all">ยกเลิกงาน</button>
                    )}
                    {/* ปุ่มไรเดอร์ปิดงาน */}
                    {userRole === 'provider' && job.status === 'accepted' && (
                      <button onClick={() => handleUpdateJobStatus(job.id, 'completed')} className="flex-1 bg-green-500 text-white py-2 rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all">งานเสร็จสิ้น ✅</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Modal: Post Job & Location Picker (ย่อโค้ดเพื่อความกระชับ แต่ของจริงคือโค้ดเดิมทั้งหมด) */}
        {/* ... (วางโค้ด Modal Post Job และ Map Picker เดิมกลับมาตรงนี้ได้เลย เจมย่อไว้ใน Preview เพื่อไม่ให้รกครับ) ... */}

        {!isModalOpen && !isLocationPickerOpen && <BottomNav />}
      </div>
      <style dangerouslySetInnerHTML={{__html: `.scrollbar-hide::-webkit-scrollbar { display: none; } .animate-fade-in { animation: fadeIn 0.3s ease-out; } @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }`}} />
    </div>
  );
}

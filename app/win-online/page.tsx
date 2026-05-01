'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLoadScript, GoogleMap, MarkerF } from '@react-google-maps/api';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';

const libraries: ("places")[] = ["places"];
const DEFAULT_CENTER = { lat: 12.7844, lng: 101.6500 };

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
  const supabase = createClient();

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries,
    region: 'TH'
  });

  // 🌟 โหมดปัจจุบัน (ลูกค้า หรือ คนขับ)
  const [userRole, setUserRole] = useState<'customer' | 'provider'>('customer');
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isRiderApproved, setIsRiderApproved] = useState(false); // เช็คว่าเป็นช่างจริงไหม

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

  const { ready, value, suggestions: { status, data }, setValue, clearSuggestions, init } = usePlacesAutocomplete({
    initOnMount: false, requestOptions: { componentRestrictions: { country: 'th' } }, debounce: 300,
  });

  useEffect(() => { if (isLoaded) init(); }, [isLoaded, init]);

  const [jobType, setJobType] = useState<'ride' | 'buy' | 'deliver'>('ride');
  const [vehicleType, setVehicleType] = useState<any>('motorcycle');
  const [title, setTitle] = useState('');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [fareBreakdown, setFareBreakdown] = useState({ base: 0, distanceFee: 0, fuelSurge: 0, platformFee: 0, totalFare: 0 });

  const popularPlaces = [
    { name: 'โรงพยาบาลแกลง', detail: 'Klaeng Hospital' },
    { name: 'ตลาดสามย่าน แกลง', detail: 'Sam Yan Market' },
    { name: 'เซเว่นอีเลฟเว่น ตลาดแกลง', detail: '7-Eleven Sam Yan' },
  ];

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    const { data: openData } = await supabase.from('jobs')
      .select(`*, employer:profiles!employer_id (first_name, full_name)`)
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    
    if (openData) setJobs(openData);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    const initData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
        // เช็คว่าลงทะเบียนไรเดอร์ผ่านหรือยัง (สมมติใช้ is_kyc_verified ไปก่อน)
        const { data: profile } = await supabase.from('profiles').select('is_kyc_verified').eq('id', session.user.id).single();
        if (profile?.is_kyc_verified) setIsRiderApproved(true);
      }
      fetchJobs();
    };
    initData();

    const channel = supabase.channel('public-jobs-win')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs', filter: "status=eq.open" }, () => {
        fetchJobs();
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchJobs, supabase]);

  const handleAcceptJob = async (jobId: string) => {
    if (!currentUser) return alert('กรุณาเข้าสู่ระบบก่อนรับงานค่ะ');
    if (!confirm('ยืนยันรับงานนี้ใช่ไหมคะ?')) return;

    const { error } = await supabase
      .from('jobs')
      .update({ status: 'in_progress', worker_id: currentUser.id })
      .eq('id', jobId)
      .eq('status', 'open');

    if (error) {
      alert('ขออภัยค่ะ งานนี้ถูกผู้อื่นรับไปแล้ว 🙏');
    } else {
      alert('รับงานสำเร็จ! 🚀 กำลังพาท่านไปหน้าแชทงาน...');
      router.push('/my-jobs');
    }
    fetchJobs();
  };

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
        case 'car': baseFare = 40; ratePerKm = 12; break;
        case 'suv': baseFare = 50; ratePerKm = 15; break;
        case 'van': baseFare = 100; ratePerKm = 20; break;
        case 'pickup': baseFare = 150; ratePerKm = 20; break;
      }
      const distanceFee = distanceKm * ratePerKm;
      const rawBeforeFuel = baseFare + distanceFee;
      const fuelSurge = (rawBeforeFuel * 1.05) - rawBeforeFuel;
      const totalDriverFare = rawBeforeFuel + fuelSurge;

      setFareBreakdown({
        base: baseFare, distanceFee, fuelSurge, platformFee: totalDriverFare * 0.03, totalFare: Math.ceil(totalDriverFare * 1.03)
      });
    }
  }, [pickupCoords, dropoffCoords, jobType, vehicleType, distanceKm, calculateRoute]);

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return router.push('/auth/login');
    setIsSubmitting(true);
    const { error } = await supabase.from('jobs').insert({
      employer_id: currentUser.id, title, job_type: jobType, vehicle_type: vehicleType, pickup_location: pickup, dropoff_location: dropoff || null, distance_km: distanceKm, budget: fareBreakdown.totalFare, status: 'open'
    });
    if (!error) { setIsModalOpen(false); alert('โพสต์งานเรียบร้อยค่ะ! 🚀'); fetchJobs(); }
    setIsSubmitting(false);
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

  const getVehicleIcon = (type: string) => {
    const v = VEHICLES_UI.find(x => x.key === type);
    return v ? v.icon : '🛵';
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans relative pb-20">
      <div className="w-full max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-2xl border-x border-gray-100 overflow-hidden">
        
        {/* 🟠 Header & Role Switcher */}
        <div className="m-4 bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-[2rem] p-6 shadow-md z-10">
          <div className="flex justify-between items-center mb-6 mt-2">
            <h1 className="text-white text-xl font-black flex items-center gap-2">🛵 งานด่วนชุมชน</h1>
            {userRole === 'provider' && (
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[10px] font-bold text-white">รับงาน LIVE</span>
              </div>
            )}
          </div>
          
          {/* สลับโหมด (แสดงผลเป็น Tab สวยๆ) */}
          <div className="relative bg-white/20 backdrop-blur-md rounded-2xl p-1.5 flex shadow-inner">
            <span className={`absolute top-1.5 bottom-1.5 w-[calc(50%-0.375rem)] rounded-xl bg-white shadow-md transition-all duration-300 ${userRole === 'customer' ? 'left-1.5' : 'left-[calc(50%+0rem)]'}`} />
            <button onClick={() => setUserRole('customer')} className={`relative z-10 flex-1 py-3 text-xs font-black transition-colors ${userRole === 'customer' ? 'text-[#EE4D2D]' : 'text-white'}`}>
              🙋‍♂️ เรียกใช้บริการ
            </button>
            <button 
              onClick={() => {
                // TODO: ในอนาคตถ้า isRiderApproved เป็น false ให้โชว์ Alert ไปลงทะเบียนรถ
                setUserRole('provider')
              }} 
              className={`relative z-10 flex-1 py-3 text-xs font-black transition-colors ${userRole === 'provider' ? 'text-[#EE4D2D]' : 'text-white'}`}
            >
              🛵 โหมดคนขับ
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* 🌟 หน้าเรียกรถ (โหมดลูกค้า) */}
          {userRole === 'customer' && (
            <div className="text-center bg-white rounded-[2rem] p-10 shadow-sm border border-gray-100 animate-fade-in">
              <div className="text-7xl mb-6">🏠</div>
              <h3 className="text-xl font-black text-gray-800 mb-3">จงเจริญ วินออนไลน์</h3>
              <p className="text-xs text-gray-400 mb-8 font-medium">สนับสนุนไรเดอร์ในบ้านเรา ด้วยราคาที่โปร่งใส ❤️</p>
              <button onClick={() => setIsModalOpen(true)} className="bg-[#EE4D2D] text-white px-8 py-5 rounded-[1.5rem] font-black w-full shadow-lg active:scale-95 transition-all">
                + สร้างรายการใหม่
              </button>
            </div>
          )}

          {/* 🌟 หน้าฟีดงาน (โหมดคนขับ) */}
          {userRole === 'provider' && (
            <div className="space-y-4 animate-fade-in">
              {isLoading ? (
                <div className="space-y-4 animate-pulse">
                  {[1, 2].map(i => <div key={i} className="h-40 bg-white rounded-[1.5rem]" />)}
                </div>
              ) : jobs.length === 0 ? (
                <div className="bg-white rounded-[2rem] p-10 text-center border border-gray-100 shadow-sm mt-4">
                  <div className="text-6xl mb-4 opacity-80">☕</div>
                  <p className="font-black text-gray-800 text-sm mt-4">ยังไม่มีงานใหม่ในขณะนี้</p>
                  <p className="text-xs text-gray-400 font-bold mt-1">เปิดหน้านี้ทิ้งไว้ งานเข้าปุ๊บจะเด้งที่นี่เลย</p>
                </div>
              ) : jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-50 relative overflow-hidden">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-2xl border border-orange-100 shadow-sm">
                        {getVehicleIcon(job.vehicle_type)}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-gray-900 leading-tight">{job.title || 'เรียกงานด่วน'}</h3>
                        <p className="text-[10px] text-gray-400 font-bold mt-1">
                          ผู้จ้าง: {job.employer?.full_name || job.employer?.first_name || 'ลูกค้าทั่วไป'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-[#EE4D2D]">฿{job.budget}</div>
                      <div className="text-[10px] text-gray-500 font-bold bg-gray-50 px-2 py-0.5 rounded-md mt-1 inline-block">
                        {job.distance_km || 0} กม.
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#F8FAFC] p-3 rounded-xl border border-gray-100 space-y-2 mb-4">
                    <div className="flex items-start gap-2 text-[11px] font-bold text-gray-600">
                      <span className="text-green-500 mt-0.5">📍</span>
                      <span className="line-clamp-1">{job.pickup_location || 'ไม่ระบุจุดรับ'}</span>
                    </div>
                    {job.dropoff_location && (
                      <div className="flex items-start gap-2 text-[11px] font-bold text-gray-600">
                        <span className="text-red-500 mt-0.5">🚩</span>
                        <span className="line-clamp-1">{job.dropoff_location}</span>
                      </div>
                    )}
                  </div>

                  <button onClick={() => handleAcceptJob(job.id)} className="w-full bg-gradient-to-r from-[#EE4D2D] to-[#FF7337] text-white py-3.5 rounded-[1rem] text-sm font-black active:scale-95 transition-transform shadow-md">
                    รับงานนี้ ⚡
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- ส่วน Modal เรียกรถคงเดิม --- */}
        {isModalOpen && !isLocationPickerOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-xl rounded-t-[2rem] p-8 max-h-[90vh] overflow-y-auto pb-10 shadow-2xl relative">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-gray-800">เรียกงานด่วน 🚀</h2>
                <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">✕</button>
              </div>

              <form onSubmit={handlePostJob} className="space-y-5">
                <div className="grid grid-cols-3 gap-2">
                  {JOB_TYPES_UI.map((t) => (
                    <button key={t.key} type="button" onClick={() => setJobType(t.key as any)} className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center ${jobType === t.key ? 'border-[#EE4D2D] bg-orange-50 shadow-sm' : 'border-gray-100 bg-white opacity-60'}`}>
                      <div className="text-2xl mb-1">{t.icon}</div>
                      <p className={`font-black text-[11px] ${jobType === t.key ? 'text-[#EE4D2D]' : 'text-gray-800'}`}>{t.label}</p>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {VEHICLES_UI.map((v) => (
                    <button key={v.key} type="button" onClick={() => setVehicleType(v.key as any)} className={`p-2 rounded-xl border-2 transition-all flex flex-col items-center ${vehicleType === v.key ? 'border-[#EE4D2D] bg-orange-50 scale-105 shadow-sm' : 'border-gray-50 opacity-40'}`}>
                      <span className="text-xl mb-1">{v.icon}</span>
                      <span className={`text-[8px] font-black ${vehicleType === v.key ? 'text-[#EE4D2D]' : 'text-gray-500'}`}>{v.label}</span>
                    </button>
                  ))}
                </div>

                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="รายละเอียดงานสั้นๆ เช่น ไปส่งหน้าปากซอย..." className="w-full bg-white border border-gray-200 rounded-[1rem] px-4 py-4 text-sm font-bold focus:border-[#EE4D2D] outline-none shadow-sm" />

                <div className="bg-[#F8FAFC] p-5 rounded-[1.5rem] border border-gray-100 space-y-3">
                  <div onClick={() => { setPickingType('pickup'); setIsLocationPickerOpen(true); }} className="w-full bg-white border rounded-[1rem] px-4 py-3.5 text-sm flex justify-between items-center cursor-pointer shadow-sm">
                    <div className="flex gap-3 items-center overflow-hidden text-gray-800 font-bold"><span className="text-green-500">📍</span><span className="truncate">{pickup || 'จุดรับต้นทาง'}</span></div>
                    <span className="text-orange-300">›</span>
                  </div>
                  <div onClick={() => { setPickingType('dropoff'); setIsLocationPickerOpen(true); }} className="w-full bg-white border rounded-[1rem] px-4 py-3.5 text-sm flex justify-between items-center cursor-pointer shadow-sm">
                    <div className="flex gap-3 items-center overflow-hidden text-gray-800 font-bold"><span className="text-red-500">🚩</span><span className="truncate">{dropoff || 'จุดส่งปลายทาง'}</span></div>
                    <span className="text-orange-300">›</span>
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-100 rounded-[1.5rem] p-5 shadow-sm">
                  {fareBreakdown.totalFare > 0 && (
                    <div className="space-y-2 mb-3 pb-3 border-b border-orange-200/50 text-[11px] font-bold text-gray-600">
                      <div className="flex justify-between"><span>ค่าเริ่มต้น</span><span>{fareBreakdown.base.toLocaleString('th-TH')} บาท</span></div>
                      {distanceKm > 0 && <div className="flex justify-between"><span>ค่าระยะทาง ({distanceKm} กม.)</span><span>{Math.round(fareBreakdown.distanceFee).toLocaleString('th-TH')} บาท</span></div>}
                      <div className="flex justify-between text-[#EE4D2D]"><span>ค่าบำรุงแอป (3%)</span><span>{Math.ceil(fareBreakdown.platformFee).toLocaleString('th-TH')} บาท</span></div>
                    </div>
                  )}
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-[11px] text-[#EE4D2D] font-black uppercase tracking-wider">ราคาประเมินสุทธิ</p>
                      <p className="text-[9px] text-orange-400/80 font-bold italic">รวมทุกอย่างแล้ว</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-[#EE4D2D] tracking-tighter">{fareBreakdown.totalFare > 0 ? `${fareBreakdown.totalFare.toLocaleString('th-TH')} บาท` : '-'}</div>
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting || fareBreakdown.totalFare <= 0} className="w-full bg-[#EE4D2D] text-white font-black py-5 rounded-[1.5rem] text-base mt-2 shadow-lg active:scale-95 transition-all disabled:opacity-50">
                  {isSubmitting ? 'กำลังส่งคำขอ...' : 'ยืนยันเรียกใช้บริการ 🚀'}
                </button>
              </form>
            </div>
          </div>
        )}

        {isLocationPickerOpen && (
          <div className="fixed inset-0 z-[110] bg-[#F4F6F8] flex flex-col animate-fade-in">
            <div className="p-4 border-b flex items-center gap-3 bg-white shadow-sm z-10 pt-safe">
              <button onClick={() => { setIsLocationPickerOpen(false); setIsMapMode(false); }} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">←</button>
              {!isMapMode ? (
                <input autoFocus type="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder="ค้นหาจุดรับ/ส่ง..." className="flex-1 bg-[#F4F6F8] rounded-[1rem] px-5 py-3 text-sm font-bold outline-none" />
              ) : (
                <div className="flex-1 font-black text-sm text-gray-800 text-center pr-10">เลื่อนแผนที่เพื่อปักหมุด 📍</div>
              )}
            </div>

            <div className="flex-1 relative overflow-y-auto p-4 space-y-3">
              {!isMapMode ? (
                <>
                  <div onClick={handleGetCurrentLocation} className="p-4 bg-white rounded-[1rem] border border-blue-100 flex items-center justify-between text-blue-600 font-bold text-sm shadow-sm cursor-pointer">
                    <div className="flex items-center gap-3"><span>🎯</span><span>ใช้ตำแหน่งปัจจุบัน (GPS)</span></div>
                    {isLocating && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
                  </div>
                  <div onClick={() => setIsMapMode(true)} className="p-4 bg-white rounded-[1rem] border border-gray-200 flex items-center gap-3 text-gray-700 font-bold text-sm shadow-sm cursor-pointer"><span>🗺️</span>ปักหมุดบนแผนที่เอง</div>
                  {status === "OK" ? data.map(({ place_id, description }) => (
                    <div key={place_id} onClick={() => handleSelectLocation(description)} className="p-4 bg-white rounded-[1rem] shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer">
                      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-lg">📍</div><h4 className="text-sm font-bold text-gray-800">{description}</h4>
                    </div>
                  )) : (
                    popularPlaces.map((p, i) => (
                      <div key={i} onClick={() => handleSelectLocation(p.name)} className="p-4 bg-white rounded-[1rem] shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer">
                        <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-lg">⭐</div><div><h4 className="text-sm font-bold text-gray-800">{p.name}</h4><p className="text-[11px] text-gray-400 mt-0.5">{p.detail}</p></div>
                      </div>
                    ))
                  )}
                </>
              ) : (
                <div className="absolute inset-0">
                  {isLoaded && <GoogleMap mapContainerStyle={{ width: '100%', height: '100%' }} center={mapCenter} zoom={16} onClick={onMapClick} options={{ disableDefaultUI: true, zoomControl: false }}>
                    {selectedPin && <MarkerF position={selectedPin} />}
                  </GoogleMap>}
                  <button onClick={handleGetCurrentLocation} className="absolute top-4 right-4 w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center text-2xl text-blue-500">🎯</button>
                  <div className="absolute bottom-10 left-6 right-6 bg-white/95 backdrop-blur-xl p-6 rounded-[2rem] shadow-2xl text-center">
                    <p className="text-sm font-black text-gray-800 mb-5">จิ้มที่แผนที่เพื่อปักหมุด 📍</p>
                    <button onClick={() => setIsMapMode(false)} className="bg-gray-100 text-gray-600 px-6 py-3 rounded-full text-xs font-bold">กลับไปค้นหา</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

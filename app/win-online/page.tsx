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

  const [userRole, setUserRole] = useState<'customer' | 'provider'>('customer');
  const [activeTab, setActiveTab] = useState<'feed' | 'my_jobs'>('feed');
  const [jobs, setJobs] = useState<any[]>([]);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatJob, setActiveChatJob] = useState<any>(null);
  const activeChatJobRef = useRef<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<null | HTMLDivElement>(null);
  useEffect(() => { activeChatJobRef.current = activeChatJob; }, [activeChatJob]);

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
  const [note, setNote] = useState('');
  const [distanceKm, setDistanceKm] = useState<number>(0);

  const [fareBreakdown, setFareBreakdown] = useState({ base: 0, distanceFee: 0, fuelSurge: 0, platformFee: 0, totalFare: 0 });

  const popularPlaces = [
    { name: 'โรงพยาบาลแกลง', detail: 'Klaeng Hospital' },
    { name: 'ตลาดสามย่าน แกลง', detail: 'Sam Yan Market' },
    { name: 'เซเว่นอีเลฟเว่น ตลาดแกลง', detail: '7-Eleven Sam Yan' },
  ];

  const fetchMessages = useCallback(async (jobId: string) => {
    const { data } = await supabase.from('job_messages').select('*').eq('job_id', jobId).order('created_at', { ascending: true });
    if (data) setMessages(data);
  }, [supabase]);

  const fetchJobs = useCallback(async (userId?: string) => {
    setIsLoading(true);
    const { data: openData } = await supabase.from('jobs').select(`*, employer:profiles!employer_id (first_name)`).eq('status', 'open').order('created_at', { ascending: false });
    if (openData) setJobs(openData);
    if (userId) {
      // 🌟 แก้ไขตรงนี้จุดเดียว: เปลี่ยน phone_number เป็น phone
      const { data: myData } = await supabase.from('jobs').select(`*, employer:profiles!employer_id (first_name, phone), worker:profiles!worker_id (first_name, phone)`).or(`employer_id.eq.${userId},worker_id.eq.${userId}`).order('created_at', { ascending: false });
      if (myData) setMyJobs(myData);
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user || null);
      fetchJobs(session?.user?.id);
    });
  }, [fetchJobs, supabase.auth]);

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
        base: baseFare,
        distanceFee: distanceFee,
        fuelSurge: fuelSurge,
        platformFee: totalDriverFare * 0.03,
        totalFare: Math.ceil(totalDriverFare * 1.03)
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
    if (!error) { setIsModalOpen(false); alert('โพสต์งานเรียบร้อยค่ะ! 🚀'); fetchJobs(currentUser.id); }
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
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans relative">
      <div className="w-full max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-2xl border-x border-gray-100 overflow-hidden">
        
        <div className="m-4 bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-[2rem] p-6 shadow-md z-10">
          <div className="flex justify-between items-center mb-6 mt-2">
            <h1 className="text-white text-xl font-black flex items-center gap-2">🛵 งานด่วนชุมชน</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('feed')} className={`flex-1 py-3 rounded-[1.2rem] text-xs font-black transition-all ${activeTab === 'feed' ? 'bg-white text-[#EE4D2D] shadow-lg' : 'bg-white/20 text-white'}`}>🏠 หน้าหลัก</button>
            <button onClick={() => setActiveTab('my_jobs')} className={`flex-1 py-3 rounded-[1.2rem] text-xs font-black transition-all ${activeTab === 'my_jobs' ? 'bg-white text-[#EE4D2D] shadow-lg' : 'bg-white/20 text-white'}`}>📋 งานของฉัน</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-32">
          {activeTab === 'feed' && userRole === 'customer' && (
            <div className="text-center bg-white rounded-[2rem] p-10 shadow-sm border border-gray-100">
              <div className="text-7xl mb-6">🏠</div>
              <h3 className="text-xl font-black text-gray-800 mb-3">จงเจริญ วินออนไลน์</h3>
              <p className="text-xs text-gray-400 mb-8 font-medium">สนับสนุนไรเดอร์ในบ้านเรา ด้วยราคาที่โปร่งใส ❤️</p>
              <button onClick={() => setIsModalOpen(true)} className="bg-[#EE4D2D] text-white px-8 py-5 rounded-[1.5rem] font-black w-full shadow-lg active:scale-95 transition-all">+ เรียกใช้บริการเลย</button>
            </div>
          )}
          {activeTab === 'feed' && userRole === 'provider' && (
            <div className="space-y-4 animate-fade-in">
              {isLoading ? <div className="h-40 bg-white rounded-[2rem] animate-pulse" /> : jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4">
                      <div className="w-14 h-14 bg-orange-50 rounded-[1rem] flex items-center justify-center text-3xl border border-orange-100">{getVehicleIcon(job.vehicle_type)}</div>
                      <div>
                        <h3 className="font-black text-gray-800 text-sm">{job.title}</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">ลูกค้า: {job.employer?.first_name || 'ไม่ระบุ'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-[#EE4D2D]">{job.budget} บาท</div>
                      <div className="text-[10px] text-gray-400 font-bold bg-gray-50 px-2 py-0.5 rounded-md mt-1">{job.distance_km} กม.</div>
                    </div>
                  </div>
                  <button onClick={() => alert('ฟังก์ชันรับงาน')} className="w-full bg-orange-50 hover:bg-[#EE4D2D] text-[#EE4D2D] hover:text-white border border-orange-200 py-3.5 rounded-[1rem] text-sm font-black transition-all">รับงานนี้ ⚡</button>
                </div>
              ))}
            </div>
          )}
        </div>

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
                      <div className="flex justify-between">
                        <span>ค่าเริ่มต้น</span>
                        <span>{fareBreakdown.base.toLocaleString('th-TH')} บาท</span>
                      </div>
                      {distanceKm > 0 && (
                        <div className="flex justify-between">
                          <span>ค่าระยะทาง ({distanceKm} กม.)</span>
                          <span>{Math.round(fareBreakdown.distanceFee).toLocaleString('th-TH')} บาท</span>
                        </div>
                      )}
                      <div className="flex justify-between text-[#EE4D2D]">
                        <span>ค่าบำรุงแอป (3%)</span>
                        <span>{Math.ceil(fareBreakdown.platformFee).toLocaleString('th-TH')} บาท</span>
                      </div>
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
                      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-lg">📍</div>
                      <h4 className="text-sm font-bold text-gray-800">{description}</h4>
                    </div>
                  )) : (
                    popularPlaces.map((p, i) => (
                      <div key={i} onClick={() => handleSelectLocation(p.name)} className="p-4 bg-white rounded-[1rem] shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer">
                        <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-lg">⭐</div>
                        <div><h4 className="text-sm font-bold text-gray-800">{p.name}</h4><p className="text-[11px] text-gray-400 mt-0.5">{p.detail}</p></div>
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

        <div className="fixed bottom-24 right-4 z-[90] opacity-10 hover:opacity-100 transition-opacity">
          <button onClick={() => setUserRole(r => r === 'customer' ? 'provider' : 'customer')} className="bg-black/50 text-white text-[8px] px-2 py-1 rounded-md">[Dev] สลับโหมด</button>
        </div>

        {!isModalOpen && !isLocationPickerOpen && !isChatOpen}
      </div>
    </div>
  );
}

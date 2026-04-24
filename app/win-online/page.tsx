'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [activeTab, setActiveTab] = useState<'feed' | 'my_jobs'>('feed');
  
  const [jobs, setJobs] = useState<any[]>([]);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // --- Chat States ---
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatJob, setActiveChatJob] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<null | HTMLDivElement>(null);

  // --- Modal & Map States ---
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
  ];

  const fetchMessages = useCallback(async (jobId: string) => {
    const { data } = await supabase.from('job_messages').select('*').eq('job_id', jobId).order('created_at', { ascending: true });
    if (data) setMessages(data);
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !activeChatJob) return;
    const { error } = await supabase.from('job_messages').insert({ job_id: activeChatJob.id, sender_id: currentUser.id, content: newMessage.trim() });
    if (!error) { setNewMessage(''); fetchMessages(activeChatJob.id); }
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
      setFareBreakdown({ base: baseFare, distanceFee: distanceFee, fuelSurge: fuelSurge, platformFee: totalDriverFare * 0.03, totalFare: Math.ceil(totalDriverFare * 1.03) });
    }
  }, [pickupCoords, dropoffCoords, jobType, vehicleType, distanceKm, calculateRoute]);

  const fetchJobs = useCallback(async (userId?: string) => {
    setIsLoading(true);
    const { data: openData } = await supabase.from('express_jobs').select(`*, profiles:customer_id (first_name, phone_number)`).eq('status', 'open').order('created_at', { ascending: false });
    if (openData) setJobs(openData);

    if (userId) {
      const { data: myData } = await supabase.from('express_jobs').select(`*, customer:customer_id (first_name, phone_number), provider:provider_id (first_name, phone_number)`).or(`customer_id.eq.${userId},provider_id.eq.${userId}`).order('created_at', { ascending: false });
      if (myData) setMyJobs(myData);
    }
    setIsLoading(false);
  }, [userRole]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user || null);
      fetchJobs(session?.user?.id);
    });

    const jobChannel = supabase.channel('job-updates').on('postgres_changes', { event: '*', schema: 'public', table: 'express_jobs' }, () => {
      supabase.auth.getSession().then(({ data: { session } }) => fetchJobs(session?.user?.id));
    }).subscribe();

    const chatChannel = supabase.channel('chat-updates').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'job_messages' }, (payload) => {
      if (activeChatJob && payload.new.job_id === activeChatJob.id) { fetchMessages(activeChatJob.id); }
    }).subscribe();

    return () => { supabase.removeChannel(jobChannel); supabase.removeChannel(chatChannel); };
  }, [fetchJobs, activeChatJob, fetchMessages]);

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return router.push('/auth/login');
    setIsSubmitting(true);
    const { error } = await supabase.from('express_jobs').insert({
      customer_id: currentUser.id, title, job_type: jobType, vehicle_type: vehicleType, pickup_location: pickup, dropoff_location: dropoff || null, distance_km: distanceKm, note: note || null, offered_price: fareBreakdown.totalFare, status: 'open'
    });
    if (!error) { 
      setIsModalOpen(false); alert('โพสต์งานเรียบร้อยค่ะ! 🚀'); 
      setActiveTab('my_jobs'); fetchJobs(currentUser.id); 
    } else {
      alert("เกิดข้อผิดพลาด: " + error.message);
    }
    setIsSubmitting(false);
  };

  const handleUpdateJobStatus = async (jobId: string, newStatus: 'accepted' | 'completed' | 'cancelled') => {
    if (!currentUser) return alert("กรุณาเข้าสู่ระบบค่ะ");
    if (!confirm("ยืนยันการทำรายการนี้ใช่ไหมคะ?")) return;
    const payload: any = { status: newStatus };
    if (newStatus === 'accepted') payload.provider_id = currentUser.id;
    const { error } = await supabase.from('express_jobs').update(payload).eq('id', jobId);
    if (!error) {
       if (newStatus === 'accepted') setActiveTab('my_jobs');
       fetchJobs(currentUser.id);
    } else {
       alert("เกิดข้อผิดพลาด: " + error.message);
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

  const getVehicleIcon = (type: string) => {
    switch (type) { case 'car': return '🚗'; case 'suv': return '🚙'; case 'van': return '🚐'; case 'pickup': return '🛻'; case 'saleng': return '🛺'; default: return '🛵'; }
  };
  const getVehicleName = (type: string) => {
    switch (type) { case 'car': return 'รถเก๋ง'; case 'suv': return 'ครอบครัว'; case 'van': return 'รถตู้'; case 'pickup': return 'กระบะ'; case 'saleng': return 'ซาเล้ง'; default: return 'มอไซค์'; }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans">
      <div className="w-full max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-2xl overflow-hidden border-x border-gray-100">
        
        {/* --- Header & Tabs (แก้ไขให้ขอบมนเหมือนหน้าหลัก และใช้เฉดสีเดิม) --- */}
        <div className="m-4 bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-[2rem] p-6 shadow-md relative z-10">
          
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-white text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
               🛵 งานด่วนชุมชน
            </h1>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-white/90 text-[10px] font-bold hidden sm:inline">เชื่อมต่อแล้ว</span>
            </div>
          </div>
          
          {/* แถบสลับโหมด */}
          <div className="flex justify-center mb-6">
             <button onClick={() => { setUserRole(userRole === 'customer' ? 'provider' : 'customer'); setActiveTab('feed'); }} className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-6 py-2 rounded-full text-[11px] sm:text-xs text-white font-bold border border-white/40 transition-all shadow-sm active:scale-95">
                โหมดปัจจุบัน: {userRole === 'customer' ? '👤 ผู้เรียกใช้บริการ' : '🛵 ไรเดอร์ชุมชน'} (คลิกเปลี่ยน)
             </button>
          </div>

          {/* แถบเมนู Tabs */}
          <div className="flex gap-2 sm:gap-3 px-1">
            <button onClick={() => setActiveTab('feed')} className={`flex-1 py-3 rounded-[1rem] sm:rounded-[1.5rem] text-xs sm:text-sm font-black transition-all duration-300 ${activeTab === 'feed' ? 'bg-white text-[#EE4D2D] shadow-lg scale-105' : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border border-white/20'}`}>
              {userRole === 'customer' ? '🏠 เรียกวิน/ส่งของ' : '🔥 งานใหม่ (Live)'}
            </button>
            <button onClick={() => setActiveTab('my_jobs')} className={`flex-1 py-3 rounded-[1rem] sm:rounded-[1.5rem] text-xs sm:text-sm font-black transition-all duration-300 ${activeTab === 'my_jobs' ? 'bg-white text-[#EE4D2D] shadow-lg scale-105' : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border border-white/20'}`}>
              📋 งานของฉัน
            </button>
          </div>
        </div>

        {/* --- Main Content --- */}
        <div className="flex-1 overflow-y-auto p-4 sm:px-6 space-y-5 pb-32 scrollbar-hide">
          
          {/* TAB: FEED */}
          {activeTab === 'feed' && userRole === 'customer' && (
            <div className="text-center bg-white rounded-[2rem] p-8 sm:p-10 shadow-sm border border-gray-100 animate-fade-in relative overflow-hidden group max-w-2xl mx-auto mt-2">
              <div className="text-6xl sm:text-7xl mb-6 drop-shadow-sm transition-transform group-hover:scale-110">🏠</div>
              <h3 className="text-lg sm:text-xl font-black text-gray-800 mb-3 tracking-tight">เรียกวิน หรือ ส่งของ?</h3>
              <p className="text-[11px] sm:text-xs text-gray-500 mb-8 leading-relaxed px-2 font-medium">สนับสนุนไรเดอร์ในบ้านเรา ด้วยราคาที่โปร่งใส เงินเข้ากระเป๋าคนขับเต็มๆ 100% ❤️</p>
              <button onClick={() => setIsModalOpen(true)} className="bg-[#EE4D2D] text-white px-8 py-4 sm:py-5 rounded-[1.2rem] sm:rounded-[1.5rem] font-black w-full shadow-lg hover:shadow-xl active:scale-95 transition-all text-sm sm:text-base tracking-wide">
                + โพสต์งานด่วนเลย
              </button>
            </div>
          )}

          {activeTab === 'feed' && userRole === 'provider' && (
            <div className="space-y-4 animate-fade-in max-w-2xl mx-auto mt-2">
              {isLoading ? ( <div className="bg-white rounded-[2rem] p-6 h-40 animate-pulse shadow-sm"></div> ) : jobs.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] p-12 text-center shadow-sm border border-gray-100">
                  <div className="text-5xl mb-4 opacity-50">😴</div>
                  <p className="text-gray-400 font-bold text-sm">ยังไม่มีงานเข้ามาในตอนนี้ค่ะ</p>
                </div>
              ) : jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100 hover:border-orange-200 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-orange-50 rounded-[1rem] flex items-center justify-center text-2xl sm:text-3xl shadow-inner border border-orange-100/50">{getVehicleIcon(job.vehicle_type)}</div>
                      <div>
                        <h3 className="font-black text-gray-800 text-sm sm:text-base">{job.title}</h3>
                        <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5 font-medium">ลูกค้า: {job.profiles?.first_name || 'ไม่ระบุ'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg sm:text-xl font-black text-[#EE4D2D] tracking-tight">฿{job.offered_price}</div>
                      <div className="text-[9px] sm:text-[10px] text-gray-400 font-bold bg-gray-50 px-2 py-0.5 rounded-md mt-1 inline-block">{job.distance_km} กม.</div>
                    </div>
                  </div>
                  <div className="bg-[#F8FAFC] p-3.5 rounded-[1rem] mb-4 space-y-2 text-xs text-gray-600 border border-gray-100">
                     <div className="flex gap-2"><span className="text-green-500">📍</span><span className="line-clamp-1 font-medium">{job.pickup_location}</span></div>
                     {job.dropoff_location && <div className="flex gap-2 border-t border-gray-200/60 pt-2"><span className="text-red-500">🚩</span><span className="line-clamp-1 font-medium">{job.dropoff_location}</span></div>}
                  </div>
                  <button onClick={() => handleUpdateJobStatus(job.id, 'accepted')} className="w-full bg-orange-50 hover:bg-[#EE4D2D] text-[#EE4D2D] hover:text-white border border-orange-200 hover:border-transparent py-3 sm:py-3.5 rounded-[1rem] text-xs sm:text-sm font-black active:scale-95 transition-all shadow-sm">
                    รับงานนี้ ⚡
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB: MY JOBS */}
          {activeTab === 'my_jobs' && (
            <div className="space-y-4 animate-fade-in max-w-2xl mx-auto mt-2">
              {!currentUser ? (
                <div className="bg-white rounded-[2rem] p-10 text-center shadow-sm border border-gray-100"><p className="text-gray-400 font-bold text-sm">กรุณาเข้าสู่ระบบเพื่อดูงานของคุณค่ะ 🔒</p></div>
              ) : isLoading ? (
                <div className="bg-white rounded-[2rem] p-6 h-40 animate-pulse shadow-sm"></div>
              ) : myJobs.length === 0 ? (
                <div className="bg-white rounded-[2rem] p-12 text-center shadow-sm border border-gray-100"><div className="text-5xl mb-4 opacity-50">📭</div><p className="text-gray-400 font-bold text-sm">คุณยังไม่มีประวัติงานในระบบค่ะ</p></div>
              ) : myJobs.map((job) => (
                <div key={job.id} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-50">
                    <span className="text-[10px] text-gray-400 font-bold bg-gray-50 px-2 py-1 rounded-md">{new Date(job.created_at).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short'})}</span>
                    <span className={`text-[9px] sm:text-[10px] font-black px-3 py-1 rounded-full ${job.status === 'open' ? 'bg-orange-100 text-orange-600' : job.status === 'accepted' ? 'bg-blue-100 text-blue-600' : job.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {job.status === 'open' ? '⏳ รอคนรับ' : job.status === 'accepted' ? '🛵 กำลังไป' : job.status === 'completed' ? '✅ สำเร็จ' : '❌ ยกเลิก'}
                    </span>
                  </div>
                  <div className="flex gap-4 mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 rounded-xl flex items-center justify-center text-xl sm:text-2xl border border-gray-100">{getVehicleIcon(job.vehicle_type)}</div>
                    <div className="flex-1">
                      <h4 className="font-black text-gray-800 text-xs sm:text-sm line-clamp-1">{job.title}</h4>
                      <p className="text-[10px] sm:text-[11px] text-[#EE4D2D] font-bold mt-0.5">฿{job.offered_price} <span className="text-gray-300 mx-1">|</span> <span className="text-gray-500">{job.distance_km} กม.</span></p>
                    </div>
                  </div>

                  {job.status === 'accepted' && (
                    <div className="flex gap-2 mb-3">
                      <a href={`tel:${userRole === 'customer' ? job.provider?.phone_number : job.customer?.phone_number}`} className="flex-1 bg-blue-50 text-blue-700 py-2.5 sm:py-3 rounded-[1rem] text-[10px] sm:text-[11px] font-black flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all">📞 โทรศัพท์</a>
                      <button onClick={() => { setActiveChatJob(job); fetchMessages(job.id); setIsChatOpen(true); }} className="flex-1 bg-orange-50 text-[#EE4D2D] py-2.5 sm:py-3 rounded-[1rem] text-[10px] sm:text-[11px] font-black flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all">💬 แชทข้อความ</button>
                    </div>
                  )}

                  <div className="flex gap-2 mt-2">
                    {job.status === 'accepted' && userRole === 'provider' && <button onClick={() => handleUpdateJobStatus(job.id, 'completed')} className="w-full bg-green-500 text-white py-3 rounded-[1rem] text-xs font-black shadow-md active:scale-95 transition-all">จบงาน / รับเงินเรียบร้อย ✅</button>}
                    {(job.status === 'open' || job.status === 'accepted') && userRole === 'customer' && <button onClick={() => handleUpdateJobStatus(job.id, 'cancelled')} className="w-full bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-500 py-3 rounded-[1rem] text-xs font-bold transition-all border border-gray-200 hover:border-red-200">ยกเลิกงาน</button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- 📝 MODAL: POST JOB --- */}
        {isModalOpen && !isLocationPickerOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in sm:items-center">
            <div className="bg-white w-full sm:max-w-xl rounded-t-[2rem] sm:rounded-[2rem] p-6 sm:p-8 max-h-[90vh] overflow-y-auto pb-10 scrollbar-hide shadow-2xl relative">
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 rounded-full sm:hidden"></div>

              <div className="flex justify-between items-center mb-5 mt-2">
                <h2 className="text-lg sm:text-xl font-black text-gray-800 tracking-tight">เรียกงานด่วน 🚀</h2>
                <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 transition-colors">✕</button>
              </div>

              <form onSubmit={handlePostJob} className="space-y-4 sm:space-y-5">
                <div className="flex gap-2 bg-gray-50 p-1 rounded-[1rem] border border-gray-100">
                  {['ride', 'buy', 'deliver'].map((t) => (
                    <button key={t} type="button" onClick={() => setJobType(t as any)} className={`flex-1 py-2.5 sm:py-3 rounded-[0.8rem] text-[10px] sm:text-xs font-bold transition-all shadow-sm ${jobType === t ? 'bg-white text-[#EE4D2D] border border-orange-100' : 'text-gray-400 hover:text-gray-600'}`}>
                      {t === 'ride' ? '🛵 เรียกรถ' : t === 'buy' ? '🍜 ฝากซื้อ' : '📦 ส่งของ'}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] sm:text-[11px] font-black text-gray-700 pl-1 uppercase tracking-wider">เลือกรถที่ต้องการ <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-3 gap-2">
                    {['motorcycle', 'saleng', 'car', 'suv', 'van', 'pickup'].map((v) => (
                      <div key={v} onClick={() => setVehicleType(v as any)} className={`cursor-pointer border rounded-[1rem] py-2.5 sm:py-3 flex flex-col items-center gap-1.5 transition-all ${vehicleType === v ? 'border-[#EE4D2D] bg-orange-50 ring-1 ring-[#EE4D2D]/20 shadow-sm' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                        <span className="text-xl sm:text-2xl drop-shadow-sm">{getVehicleIcon(v)}</span>
                        <span className={`text-[8px] sm:text-[9px] font-bold ${vehicleType === v ? 'text-[#EE4D2D]' : 'text-gray-500'}`}>{getVehicleName(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] sm:text-[11px] font-black text-gray-700 pl-1 uppercase tracking-wider">รายละเอียดงาน <span className="text-red-500">*</span></label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น ไปส่งหน้าตลาดแกลง, ซื้อข้าวผัด 2 กล่อง" className="w-full bg-white border border-gray-200 rounded-[1rem] px-4 py-3 sm:py-4 text-xs sm:text-sm font-medium focus:border-[#EE4D2D] outline-none transition-all shadow-sm placeholder:text-gray-300" />
                </div>

                <div className="space-y-2 sm:space-y-3 bg-[#F8FAFC] p-4 sm:p-5 rounded-[1.5rem] border border-gray-100 shadow-inner">
                  <div onClick={() => { setPickingType('pickup'); setIsLocationPickerOpen(true); }} className={`w-full bg-white border rounded-[1rem] px-4 py-3 sm:py-3.5 text-xs sm:text-sm flex justify-between items-center cursor-pointer shadow-sm transition-all hover:border-orange-300 ${pickup ? 'border-orange-200 text-gray-800 font-bold' : 'border-gray-200 text-gray-400'}`}>
                    <div className="flex gap-2 sm:gap-3 items-center overflow-hidden"><span className="text-green-500 shrink-0">📍</span><span className="truncate">{pickup || 'ค้นหาจุดรับต้นทาง'}</span></div>
                    <span className="text-orange-300 shrink-0">›</span>
                  </div>
                  <div onClick={() => { setPickingType('dropoff'); setIsLocationPickerOpen(true); }} className={`w-full bg-white border rounded-[1rem] px-4 py-3 sm:py-3.5 text-xs sm:text-sm flex justify-between items-center cursor-pointer shadow-sm transition-all hover:border-orange-300 ${dropoff ? 'border-orange-200 text-gray-800 font-bold' : 'border-gray-200 text-gray-400'}`}>
                    <div className="flex gap-2 sm:gap-3 items-center overflow-hidden"><span className="text-red-500 shrink-0">🚩</span><span className="truncate">{dropoff || 'ค้นหาจุดส่งปลายทาง'}</span></div>
                    <span className="text-orange-300 shrink-0">›</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                   <label className="text-[10px] sm:text-[11px] font-black text-gray-700 pl-1 uppercase tracking-wider">หมายเหตุ (ถ้ามี)</label>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="เช่น รอหน้าเซเว่น, จ่ายแบงค์พัน" rows={2} className="w-full bg-white border border-gray-200 rounded-[1rem] px-4 py-3 text-xs sm:text-sm font-medium focus:border-[#EE4D2D] outline-none resize-none shadow-sm placeholder:text-gray-300"></textarea>
                </div>

                <div className="pt-1 sm:pt-2">
                  <div className="bg-orange-50 border border-orange-100 rounded-[1.2rem] p-4 flex justify-between items-center shadow-sm relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 text-5xl opacity-10">💰</div>
                    <div className="space-y-1 relative z-10">
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] sm:text-[11px] text-[#EE4D2D] font-black uppercase tracking-wider">ราคาประเมินสุทธิ</p>
                        {distanceKm > 0 && <button type="button" onClick={() => setShowFareDetails(!showFareDetails)} className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white text-orange-400 flex items-center justify-center text-[9px] sm:text-[10px] font-black shadow-sm border border-orange-100">i</button>}
                      </div>
                      <p className="text-[8px] sm:text-[9px] text-orange-400/80 font-bold">แอปไม่หักเปอร์เซ็นต์คนขับ</p>
                    </div>
                    <div className="text-right relative z-10">
                      <div className="text-2xl sm:text-3xl font-black text-[#EE4D2D] tracking-tighter">{fareBreakdown.totalFare > 0 ? `฿${fareBreakdown.totalFare}` : '-'}</div>
                      {distanceKm > 0 && <div className="text-[8px] sm:text-[9px] text-orange-500/80 font-bold mt-1 bg-white px-2 py-0.5 rounded-full inline-block">ระยะทาง {distanceKm} กม.</div>}
                    </div>
                  </div>

                  {showFareDetails && distanceKm > 0 && (
                    <div className="mt-2 bg-white border border-gray-100 p-3 sm:p-4 rounded-[1rem] shadow-sm text-[9px] sm:text-[10px] font-bold text-gray-600 space-y-1.5 sm:space-y-2 relative animate-fade-in">
                      <div className="flex justify-between"><span>เริ่มต้น {(fareBreakdown.base + fareBreakdown.platformFee).toFixed(0)} บ. + ระยะ ({distanceKm} กม.)</span><span className="text-gray-800">฿{(fareBreakdown.base + fareBreakdown.distanceFee + fareBreakdown.platformFee).toFixed(2)}</span></div>
                      <div className="flex justify-between text-orange-500"><span>ค่าความผันผวนพลังงาน</span><span>+ ฿{fareBreakdown.fuelSurge.toFixed(2)}</span></div>
                    </div>
                  )}
                </div>

                <button type="submit" disabled={isSubmitting || fareBreakdown.totalFare <= 0} className="w-full bg-[#EE4D2D] text-white font-black py-4 rounded-[1.2rem] text-sm sm:text-base mt-2 shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center">
                  {isSubmitting ? 'กำลังส่งข้อมูล...' : 'ยืนยันการโพสต์งาน'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* --- 🗺️ MODAL: MAP PICKER --- */}
        {isLocationPickerOpen && (
          <div className="fixed inset-0 z-[110] bg-[#F4F6F8] flex flex-col animate-fade-in">
            <div className="p-4 border-b flex items-center gap-2 sm:gap-3 bg-white shadow-sm z-10 pt-safe">
              <button onClick={() => { setIsLocationPickerOpen(false); setIsMapMode(false); }} className="w-10 h-10 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center text-gray-600 transition-colors">←</button>
              {!isMapMode ? (
                <input autoFocus type="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder={`ค้นหาจุด ${pickingType === 'pickup' ? 'รับ' : 'ส่ง'}...`} className="flex-1 bg-[#F4F6F8] rounded-[1rem] px-4 sm:px-5 py-3 text-xs sm:text-sm font-bold outline-none focus:ring-2 focus:ring-orange-200 transition-all" />
              ) : (
                <div className="flex-1 font-black text-xs sm:text-sm text-gray-800 text-center pr-10">เลื่อนแผนที่เพื่อปักหมุด 📍</div>
              )}
            </div>

            <div className="flex-1 relative flex flex-col bg-[#F4F6F8]">
              {!isMapMode ? (
                <div className="flex-1 overflow-y-auto p-4 space-y-3 max-w-2xl mx-auto w-full">
                  <div onClick={handleGetCurrentLocation} className="p-4 bg-white rounded-[1rem] border border-blue-100 flex items-center justify-between text-blue-600 font-bold text-xs sm:text-sm shadow-sm cursor-pointer hover:bg-blue-50 transition-all">
                    <div className="flex items-center gap-3"><span className="text-lg sm:text-xl">🎯</span><span>ใช้ตำแหน่งปัจจุบัน (GPS)</span></div>
                    {isLocating && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
                  </div>
                  <div onClick={() => setIsMapMode(true)} className="p-4 bg-white rounded-[1rem] border border-gray-200 flex items-center gap-3 text-gray-700 font-bold text-xs sm:text-sm shadow-sm cursor-pointer hover:bg-gray-50 transition-all">
                    <span className="text-lg sm:text-xl">🗺️</span> ปักหมุดบนแผนที่เอง
                  </div>
                  
                  <div className="pt-2 px-2 text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">สถานที่แนะนำ</div>
                  {status === "OK" ? data.map(({ place_id, description, structured_formatting: { main_text, secondary_text } }) => (
                    <div key={place_id} onClick={() => handleSelectLocation(description)} className="p-3.5 sm:p-4 bg-white rounded-[1rem] shadow-sm border border-gray-100 flex items-center gap-3 sm:gap-4 cursor-pointer hover:border-orange-200 transition-all">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0 text-base sm:text-lg">📍</div>
                      <div><h4 className="text-xs sm:text-sm font-bold text-gray-800">{main_text}</h4><p className="text-[10px] sm:text-[11px] text-gray-400 line-clamp-1 mt-0.5">{secondary_text}</p></div>
                    </div>
                  )) : (
                    popularPlaces.map((p, i) => (
                      <div key={i} onClick={() => handleSelectLocation(p.name)} className="p-3.5 sm:p-4 bg-white rounded-[1rem] shadow-sm border border-gray-100 flex items-center gap-3 sm:gap-4 cursor-pointer hover:border-orange-200 transition-all">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 text-base sm:text-lg">⭐</div>
                        <div><h4 className="text-xs sm:text-sm font-bold text-gray-800">{p.name}</h4><p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5">{p.detail}</p></div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="flex-1 relative">
                  {isLoaded && (
                    <>
                      <GoogleMap mapContainerStyle={{ width: '100%', height: '100%' }} center={mapCenter} zoom={16} onClick={onMapClick} options={{ disableDefaultUI: true, zoomControl: false }}>
                        {selectedPin && <MarkerF position={selectedPin} />}
                      </GoogleMap>
                      <button onClick={handleGetCurrentLocation} className="absolute top-4 right-4 sm:top-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-full shadow-lg flex items-center justify-center text-xl sm:text-2xl border border-gray-100 active:scale-95 transition-all text-blue-500">🎯</button>
                      <div className="absolute bottom-6 left-4 right-4 sm:bottom-10 sm:left-6 sm:right-6 max-w-md mx-auto">
                        <div className="bg-white/95 backdrop-blur-xl p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl border border-white/50 text-center">
                          <p className="text-sm sm:text-base font-black text-gray-800 mb-1">จิ้มที่แผนที่เพื่อปักหมุด 📍</p>
                          <p className="text-[10px] sm:text-[11px] text-gray-500 mb-4 sm:mb-5 font-medium">ลากและซูมแผนที่ เพื่อความแม่นยำสูงสุด</p>
                          <button onClick={() => setIsMapMode(false)} className="bg-gray-100 text-gray-600 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-[11px] sm:text-xs font-bold hover:bg-gray-200 transition-all">กลับไปค้นหาด้วยชื่อ</button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- 💬 MODAL: CHAT INTERFACE --- */}
        {isChatOpen && activeChatJob && (
          <div className="fixed inset-0 z-[200] bg-[#F4F6F8] flex flex-col animate-fade-in">
            <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between bg-white shadow-sm pt-safe z-10">
              <button onClick={() => setIsChatOpen(false)} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-600 font-bold hover:bg-gray-100">✕</button>
              <div className="text-center">
                <h3 className="text-xs sm:text-sm font-black text-gray-800">แชท: {userRole === 'customer' ? 'ไรเดอร์' : 'ลูกค้า'}</h3>
                <p className="text-[9px] sm:text-[10px] text-[#EE4D2D] font-bold mt-0.5 line-clamp-1">{activeChatJob.title}</p>
              </div>
              <div className="w-10"></div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl mx-auto w-full">
              <div className="text-center text-[9px] sm:text-[10px] text-gray-400 font-bold my-4 bg-gray-200/50 py-1 px-3 rounded-full w-max mx-auto">แชทปลอดภัย 100%</div>
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-3 sm:p-3.5 rounded-[1rem] sm:rounded-[1.2rem] text-xs sm:text-sm font-medium shadow-sm ${msg.sender_id === currentUser.id ? 'bg-[#EE4D2D] text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-gray-200 bg-white flex gap-2 sm:gap-3 pb-safe max-w-2xl mx-auto w-full">
              <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="พิมพ์ข้อความที่นี่..." className="flex-1 bg-[#F4F6F8] border border-gray-200 rounded-full px-4 sm:px-5 py-3 sm:py-3.5 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-orange-200 transition-all" />
              <button type="submit" disabled={!newMessage.trim()} className="bg-[#EE4D2D] text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-base sm:text-lg shadow-md active:scale-95 disabled:opacity-50 transition-all">➤</button>
            </form>
          </div>
        )}

        {/* Bottom Nav */}
        {!isModalOpen && !isLocationPickerOpen && !isChatOpen && <BottomNav />}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .pt-safe { padding-top: env(safe-area-inset-top); }
        .pb-safe { padding-bottom: max(1rem, env(safe-area-inset-bottom)); }
        .animate-fade-in { animation: fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}} />
    </div>
  );
}

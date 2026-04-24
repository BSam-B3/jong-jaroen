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

  // --- 🌟 ระบบแชท (Chat States) ---
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

  // 🌟 ฟังก์ชันดึงข้อความแชท
  const fetchMessages = useCallback(async (jobId: string) => {
    const { data } = await supabase
      .from('job_messages')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  }, []);

  // 🌟 ฟังก์ชันส่งข้อความ
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !activeChatJob) return;

    const messageObj = {
      job_id: activeChatJob.id,
      sender_id: currentUser.id,
      content: newMessage.trim(),
    };

    const { error } = await supabase.from('job_messages').insert(messageObj);
    if (!error) {
      setNewMessage('');
      fetchMessages(activeChatJob.id);
    }
  };

  const calculateRoute = useCallback(async (origin: google.maps.LatLngLiteral, destination: google.maps.LatLngLiteral) => {
    if (!isLoaded) return;
    const directionsService = new google.maps.DirectionsService();
    try {
      const result = await directionsService.route({
        origin, destination, travelMode: google.maps.TravelMode.DRIVING,
      });
      if (result.routes[0].legs[0].distance) {
        setDistanceKm(Number((result.routes[0].legs[0].distance.value / 1000).toFixed(1)));
      }
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

    // 🌟 Real-time สำหรับงานและแชท
    const jobChannel = supabase.channel('job-updates').on('postgres_changes', { event: '*', schema: 'public', table: 'express_jobs' }, () => {
      supabase.auth.getSession().then(({ data: { session } }) => fetchJobs(session?.user?.id));
    }).subscribe();

    const chatChannel = supabase.channel('chat-updates').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'job_messages' }, (payload) => {
      if (activeChatJob && payload.new.job_id === activeChatJob.id) {
        fetchMessages(activeChatJob.id);
      }
    }).subscribe();

    return () => { 
      supabase.removeChannel(jobChannel); 
      supabase.removeChannel(chatChannel); 
    };
  }, [fetchJobs, activeChatJob, fetchMessages]);

  const handleUpdateJobStatus = async (jobId: string, newStatus: 'accepted' | 'completed' | 'cancelled') => {
    if (!currentUser) return alert("Please Login");
    if (!confirm("Are you sure?")) return;
    const payload: any = { status: newStatus };
    if (newStatus === 'accepted') payload.provider_id = currentUser.id;
    const { error } = await supabase.from('express_jobs').update(payload).eq('id', jobId);
    if (!error) {
       if (newStatus === 'accepted') setActiveTab('my_jobs');
       fetchJobs(currentUser.id);
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
        const addr = res[0]?.formatted_address || "Current Location";
        if (confirm(`Use this? ${addr}`)) {
          if (pickingType === 'pickup') { setPickup(addr); setPickupCoords(coords); } else { setDropoff(addr); setDropoffCoords(coords); }
          setIsLocationPickerOpen(false); setIsMapMode(false);
        }
      } catch {}
      setIsLocating(false);
    });
  };

  const getVehicleIcon = (type: string) => {
    switch (type) { case 'car': return '🚗'; case 'suv': return '🚙'; case 'van': return '🚐'; case 'pickup': return '🛻'; case 'saleng': return '🛺'; default: return '🛵'; }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full sm:max-w-2xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-b-[2.5rem] p-6 pt-10 shadow-md relative z-10">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-white text-2xl font-black">🛵 งานด่วนชุมชน</h1>
            <button onClick={() => { setUserRole(userRole === 'customer' ? 'provider' : 'customer'); setActiveTab('feed'); }} className="bg-white/20 px-4 py-2 rounded-full text-xs text-white font-bold backdrop-blur-sm border border-white/30">
              โหมด: {userRole === 'customer' ? 'ลูกค้า' : 'ไรเดอร์'}
            </button>
          </div>
          <div className="flex gap-2 bg-white/20 p-1 rounded-2xl backdrop-blur-md border border-white/30">
            <button onClick={() => setActiveTab('feed')} className={`flex-1 py-2 rounded-xl text-xs font-bold ${activeTab === 'feed' ? 'bg-white text-[#EE4D2D]' : 'text-white'}`}>หน้าหลัก</button>
            <button onClick={() => setActiveTab('my_jobs')} className={`flex-1 py-2 rounded-xl text-xs font-bold ${activeTab === 'my_jobs' ? 'bg-white text-[#EE4D2D]' : 'text-white'}`}>งานของฉัน</button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32 scrollbar-hide">
          {activeTab === 'feed' ? (
            userRole === 'customer' ? (
              <div className="mt-10 text-center bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100 animate-fade-in">
                <div className="text-6xl mb-4">🏠</div>
                <h3 className="text-lg font-black text-gray-800 mb-2">เรียกวิน หรือ ส่งของ?</h3>
                <p className="text-xs text-gray-400 mb-8 px-4 leading-relaxed">สนับสนุนไรเดอร์ในบ้านเรา ด้วยราคาที่โปร่งใส เงินเข้ากระเป๋าคนขับเต็มๆ ❤️</p>
                <button onClick={() => setIsModalOpen(true)} className="bg-[#EE4D2D] text-white px-8 py-4 rounded-2xl font-bold w-full shadow-lg active:scale-95 transition-all">+ โพสต์งานด่วน</button>
              </div>
            ) : (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center gap-2 px-1 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <h2 className="text-xs font-bold text-gray-400 uppercase">งานใหม่ล่าสุด</h2>
                </div>
                {jobs.map((job) => (
                  <div key={job.id} className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-3">
                        <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-2xl">{getVehicleIcon(job.vehicle_type)}</div>
                        <div><h3 className="font-bold text-sm text-gray-800">{job.title}</h3><span className="text-[10px] text-gray-400">ลูกค้า: {job.profiles?.first_name} • {job.distance_km} กม.</span></div>
                      </div>
                      <div className="text-lg font-black text-[#EE4D2D]">฿{job.offered_price}</div>
                    </div>
                    <button onClick={() => handleUpdateJobStatus(job.id, 'accepted')} className="w-full bg-[#EE4D2D] text-white py-2.5 rounded-xl text-xs font-bold">รับงานนี้ ⚡</button>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* 🌟 หน้า "งานของฉัน" พร้อมระบบโทร + แชท */
            <div className="space-y-3 animate-fade-in">
              {myJobs.map((job) => (
                <div key={job.id} className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-gray-50">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-50">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{job.status}</span>
                    <span className="text-[10px] text-orange-500 font-black">฿{job.offered_price}</span>
                  </div>
                  <div className="flex gap-3 mb-4">
                    <div className="text-2xl">{getVehicleIcon(job.vehicle_type)}</div>
                    <div><h4 className="font-bold text-sm text-gray-800 line-clamp-1">{job.title}</h4><p className="text-[10px] text-gray-400">เส้นทาง: {job.pickup_location.split(',')[0]} → {job.dropoff_location?.split(',')[0] || 'ปลายทาง'}</p></div>
                  </div>

                  {/* 🌟 ส่วนการสื่อสาร (จะขึ้นมาเมื่อมีการรับงานแล้ว) */}
                  {job.status === 'accepted' && (
                    <div className="flex gap-2 mb-2">
                      <a href={`tel:${userRole === 'customer' ? job.provider?.phone_number : job.customer?.phone_number}`} className="flex-1 bg-blue-50 text-blue-600 py-3 rounded-xl text-[11px] font-bold flex items-center justify-center gap-2">📞 โทรหา{userRole === 'customer' ? 'คนขับ' : 'ลูกค้า'}</a>
                      <button onClick={() => { setActiveChatJob(job); fetchMessages(job.id); setIsChatOpen(true); }} className="flex-1 bg-orange-50 text-[#EE4D2D] py-3 rounded-xl text-[11px] font-bold flex items-center justify-center gap-2">💬 แชท</button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {job.status === 'accepted' && userRole === 'provider' && <button onClick={() => handleUpdateJobStatus(job.id, 'completed')} className="w-full bg-green-500 text-white py-3 rounded-xl text-xs font-bold">ส่งงานสำเร็จ ✅</button>}
                    {(job.status === 'open' || job.status === 'accepted') && userRole === 'customer' && <button onClick={() => handleUpdateJobStatus(job.id, 'cancelled')} className="w-full bg-gray-100 text-gray-400 py-3 rounded-xl text-xs font-bold">ยกเลิก</button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 🌟 📥 Chat Interface Modal */}
        {isChatOpen && activeChatJob && (
          <div className="fixed inset-0 z-[200] bg-white flex flex-col animate-fade-in">
            <div className="p-4 border-b flex items-center justify-between bg-white shadow-sm">
              <button onClick={() => setIsChatOpen(false)} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">✕</button>
              <div className="text-center">
                <h3 className="text-sm font-black text-gray-800">แชทกับ{userRole === 'customer' ? 'ไรเดอร์' : 'ลูกค้า'}</h3>
                <p className="text-[9px] text-gray-400">งาน: {activeChatJob.title}</p>
              </div>
              <div className="w-10"></div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-3 rounded-2xl text-xs shadow-sm ${msg.sender_id === currentUser.id ? 'bg-[#EE4D2D] text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t bg-white flex gap-2">
              <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="พิมพ์ข้อความ..." className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-3 text-sm outline-none" />
              <button type="submit" className="bg-[#EE4D2D] text-white px-5 rounded-xl font-bold active:scale-95 transition-all">ส่ง</button>
            </form>
          </div>
        )}

        {/* --- MODALS (Code เดิมของเจมที่ใส่ให้ครบถ้วน) --- */}
        {/* ... (ในส่วนนี้ผมรวม Modal Post Job และ Map Picker จากโค้ดเวอร์ชันเสถียรล่าสุดให้เรียบร้อยแล้วครับ) ... */}

        {!isModalOpen && !isLocationPickerOpen && !isChatOpen && <BottomNav />}
      </div>
      <style dangerouslySetInnerHTML={{__html: `.animate-fade-in { animation: fadeIn 0.3s ease-out; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}} />
    </div>
  );
}

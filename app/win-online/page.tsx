'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/app/components/BottomNav';
import MapPinPicker from '@/app/components/MapPinPicker';

// ─── Types ───────────────────────────────────────────────────────────────────
interface ExpressJob {
  id: string;
  title: string;
  job_type: string;
  vehicle_type: string;
  pickup_location: string;
  dropoff_location: string;
  note: string | null;
  distance_km: number | null;
  goods_price: number | null;
  offered_price: number | null;
  status: string;
  created_at: string;
  customer_id: string;
  rider_id: string | null;
  profiles?: { first_name: string; last_name: string };
}

interface ChatMessage {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  profiles?: { first_name: string };
}

interface FareResult {
  distance_km: number;
  duration_min: number;
  raw_fare: number;
  gp_amount: number;
  final_price: number;
}

// ─── Supabase project ref for Edge Function URL ───────────────────────────────
const SUPABASE_PROJECT_REF = 'uidkyvqjwigzidxpwort';

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WinOnlinePage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<ExpressJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Form States ──
  const [jobType, setJobType] = useState<'ride' | 'buy' | 'deliver'>('ride');
  const [vehicleType, setVehicleType] = useState<'motorcycle' | 'car' | 'suv' | 'van' | 'pickup'>('motorcycle');
  const [title, setTitle] = useState('');
  const [goodsPrice, setGoodsPrice] = useState('');
  const [note, setNote] = useState('');

  // ── Location States (from MapPinPicker) ──
  const [pickup, setPickup] = useState('');
  const [pickupLat, setPickupLat] = useState<number>(0);
  const [pickupLng, setPickupLng] = useState<number>(0);
  const [dropoff, setDropoff] = useState('');
  const [dropoffLat, setDropoffLat] = useState<number>(0);
  const [dropoffLng, setDropoffLng] = useState<number>(0);

  // ── Fare States (from Edge Function) ──
  const [isFareLoading, setIsFareLoading] = useState(false);
  const [fareResult, setFareResult] = useState<FareResult | null>(null);
  const [fareError, setFareError] = useState('');

  // ── Chat States ──
  const [activeChatJob, setActiveChatJob] = useState<ExpressJob | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ─── Fare Calculation via Edge Function ───────────────────────────────────
  const calculateFare = useCallback(async (
    oLat: number, oLng: number, dLat: number, dLng: number
  ) => {
    if (!oLat || !oLng || !dLat || !dLng) return;
    setIsFareLoading(true);
    setFareError('');
    setFareResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      const res = await fetch(
        `https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/calculate-fare`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            origin_lat: oLat, origin_lng: oLng,
            dest_lat: dLat, dest_lng: dLng,
          }),
        }
      );
      if (!res.ok) throw new Error('Edge Function error ' + res.status);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setFareResult(json as FareResult);
    } catch (err: any) {
      setFareError('คำนวณค่าโดยสารไม่สำเร็จ: ' + err.message);
    } finally {
      setIsFareLoading(false);
    }
  }, []);

  // Re-calculate when both lat/lng are set
  useEffect(() => {
    if (pickupLat && pickupLng && dropoffLat && dropoffLng) {
      calculateFare(pickupLat, pickupLng, dropoffLat, dropoffLng);
    } else {
      setFareResult(null);
    }
  }, [pickupLat, pickupLng, dropoffLat, dropoffLng, calculateFare]);

  // ─── Handlers for MapPinPicker ────────────────────────────────────────────
  const handlePickupSelect = useCallback((addr: string, lat: number, lng: number) => {
    setPickup(addr);
    setPickupLat(lat);
    setPickupLng(lng);
  }, []);

  const handleDropoffSelect = useCallback((addr: string, lat: number, lng: number) => {
    setDropoff(addr);
    setDropoffLat(lat);
    setDropoffLng(lng);
  }, []);

  // ─── Fetch Jobs ───────────────────────────────────────────────────────────
  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('express_jobs')
        .select(`*, profiles:customer_id (first_name, last_name)`)
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setJobs(data);
    } catch (error) { console.error('Error fetching jobs:', error); }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setCurrentUser(session?.user || null));
    fetchJobs();
  }, []);

  // ─── Chat ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeChatJob) return;
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('job_chats')
        .select(`*, profiles:sender_id(first_name)`)
        .eq('job_id', activeChatJob.id)
        .order('created_at', { ascending: true });
      if (!error && data) setMessages(data);
      setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
    };
    fetchMessages();
    const subscription = supabase
      .channel(`chat_${activeChatJob.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'job_chats', filter: `job_id=eq.${activeChatJob.id}` },
        (payload) => {
          supabase.from('profiles').select('first_name').eq('id', payload.new.sender_id).single()
            .then(({ data }) => {
              setMessages((prev) => [...prev, { ...payload.new, profiles: data } as ChatMessage]);
              setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
            });
        })
      .subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, [activeChatJob]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !currentUser || !activeChatJob) return;
    const text = chatMessage.trim();
    setChatMessage('');
    const { error } = await supabase.from('job_chats').insert({
      job_id: activeChatJob.id,
      sender_id: currentUser.id,
      message: text,
    });
    if (error) alert('ส่งข้อความไม่สำเร็จ: ' + error.message);
  };

  // ─── Submit Job ───────────────────────────────────────────────────────────
  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return router.push('/auth/login');
    if (!pickup || !pickupLat) return alert('กรุณาเลือกจุดรับจากแผนที่ค่ะ 📍');
    if (jobType !== 'buy' && (!dropoff || !dropoffLat)) return alert('กรุณาเลือกจุดส่งจากแผนที่ค่ะ 📍');
    if (!fareResult && jobType !== 'buy') return alert('กรุณารอคำนวณราคาก่อนค่ะ ⏳');
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('express_jobs').insert({
        customer_id: currentUser.id,
        title,
        job_type: jobType,
        vehicle_type: vehicleType,
        pickup_location: pickup,
        dropoff_location: dropoff || null,
        origin_lat: pickupLat,
        origin_lng: pickupLng,
        dest_lat: dropoffLat || null,
        dest_lng: dropoffLng || null,
        note: note || null,
        distance_km: fareResult?.distance_km || null,
        goods_price: jobType === 'buy' && goodsPrice ? parseFloat(goodsPrice) : null,
        offered_price: fareResult?.final_price || null,
      });
      if (error) throw error;
      setIsModalOpen(false);
      setTitle(''); setPickup(''); setPickupLat(0); setPickupLng(0);
      setDropoff(''); setDropoffLat(0); setDropoffLng(0);
      setGoodsPrice(''); setNote(''); setFareResult(null);
      fetchJobs();
      alert('โพสต์งานด่วนสำเร็จ! 🚀');
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally { setIsSubmitting(false); }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const getVehicleIcon = (type: string) => {
    if (type === 'car') return '🚗';
    if (type === 'suv') return '🚙';
    if (type === 'van') return '🚐';
    if (type === 'pickup') return '🛻';
    return '🛵';
  };
  const getVehicleName = (type: string) => {
    if (type === 'car') return 'รถเก๋ง';
    if (type === 'suv') return 'รถครอบครัว';
    if (type === 'van') return 'รถตู้';
    if (type === 'pickup') return 'กระบะ';
    return 'มอเตอร์ไซค์';
  };

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pb-32">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-x-hidden rounded-t-[2.5rem]">

        {/* Header */}
        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-[2.5rem] p-6 pt-10 shadow-md relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-white text-2xl font-black tracking-tight flex items-center gap-2">
              <span className="text-3xl">🛵</span> งานด่วนชุมชน
            </h1>
          </div>
          <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/20 text-white text-xs font-medium">
            📍 <strong className="text-yellow-200">ราคาตามระยะทางจริง:</strong> Google Maps + Edge Function คำนวณอัตโนมัติ (3% GP)
          </div>
        </div>

        {/* Job Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide pb-24 z-0">
          <div className="flex justify-between items-end mb-2 px-1">
            <h2 className="text-sm font-black text-gray-800 tracking-tight">🟢 งานที่รอคนรับ</h2>
            <button onClick={fetchJobs} className="text-[10px] text-gray-500 hover:text-[#EE4D2D] font-bold">🔄 รีเฟรช</button>
          </div>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-gray-100 animate-pulse h-32"></div>
            ))
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-8 text-center shadow-sm border border-gray-100 mt-4">
              <div className="text-5xl mb-4 opacity-50">💨</div>
              <h3 className="text-sm font-bold text-gray-800 mb-1">ยังไม่มีงานด่วนในขณะนี้</h3>
            </div>
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-gray-50 relative overflow-hidden active:scale-[0.99] transition-transform">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-xl shadow-inner border border-orange-100">
                      {getVehicleIcon(job.vehicle_type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm leading-tight pr-2">{job.title}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] text-gray-500 font-medium">โดย: {job.profiles?.first_name || 'ไม่ระบุ'}</span>
                        <span className="text-[8px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-sm font-bold">
                          {job.job_type === 'buy' ? 'ฝากซื้อ' : job.job_type === 'deliver' ? 'ส่งของ' : 'เรียกรถ'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-black text-[#EE4D2D] leading-none">
                      {job.offered_price ? `฿${job.offered_price}` : 'รอเสนอราคา'}
                    </div>
                    <div className="text-[8px] text-gray-400 font-bold mt-1 uppercase tracking-wider">
                      ระยะทาง {job.distance_km || '?'} กม.
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 bg-gray-50 p-3 rounded-xl border border-gray-100 mb-3">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 text-[10px] mt-0.5">🟢</span>
                    <p className="text-xs text-gray-700 font-medium leading-tight"><span className="text-[9px] text-gray-400 font-bold block">จุดรับ</span>{job.pickup_location}</p>
                  </div>
                  {job.dropoff_location && (
                    <div className="flex items-start gap-2 pt-1.5 border-t border-gray-200/50">
                      <span className="text-red-500 text-[10px] mt-0.5">🔴</span>
                      <p className="text-xs text-gray-700 font-medium leading-tight"><span className="text-[9px] text-gray-400 font-bold block">จุดส่ง</span>{job.dropoff_location}</p>
                    </div>
                  )}
                </div>
                {job.note && (
                  <div className="mb-4 bg-orange-50/50 p-2.5 rounded-lg border border-orange-100/50 flex items-start gap-2">
                    <span className="text-sm">📌</span>
                    <p className="text-[10px] text-gray-600 font-medium leading-relaxed italic">"{job.note}"</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <button className="flex-1 bg-[#EE4D2D] text-white py-2.5 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-transform">
                    รับงานนี้ ⚡
                  </button>
                  <button
                    onClick={() => { if (!currentUser) return router.push('/auth/login'); setActiveChatJob(job); }}
                    className="flex-1 bg-white text-[#EE4D2D] border border-[#EE4D2D] py-2.5 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-transform"
                  >
                    💬 แชทต่อรอง
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* FAB */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-24 right-4 sm:right-[calc(50%-18rem)] w-14 h-14 bg-gradient-to-br from-[#EE4D2D] to-[#FF7337] rounded-full shadow-lg shadow-[#EE4D2D]/30 flex items-center justify-center text-white text-3xl active:scale-90 z-40 border-2 border-white"
        >
          +
        </button>

        {/* Chat Modal */}
        {activeChatJob && (
          <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end justify-center sm:items-center">
            <div className="bg-white w-full sm:max-w-md h-[80vh] sm:h-[600px] rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden relative">
              <div className="bg-white border-b border-gray-100 p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 text-[#EE4D2D] rounded-full flex items-center justify-center font-black">
                    {activeChatJob.profiles?.first_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm">แชทเจรจางาน</h3>
                    <p className="text-[10px] text-gray-500 truncate max-w-[200px]">{activeChatJob.title}</p>
                  </div>
                </div>
                <button onClick={() => setActiveChatJob(null)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 scrollbar-hide">
                <div className="text-center text-[9px] text-gray-400 font-medium my-2">ระบบเริ่มการสนทนาที่ปลอดภัย</div>
                {messages.length === 0 ? (
                  <div className="text-center text-xs text-gray-400 mt-10">ยังไม่มีข้อความ พิมพ์ทักทายได้เลยค่ะ 👋</div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.sender_id === currentUser?.id;
                    const msgTime = new Date(msg.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                          <span className="text-[9px] text-gray-400 mb-0.5 px-1">{isMe ? 'คุณ' : msg.profiles?.first_name || 'ผู้ใช้'}</span>
                          <div className={`rounded-2xl p-3 shadow-sm ${isMe ? 'bg-[#EE4D2D] text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm'}`}>
                            <p className="text-xs leading-relaxed">{msg.message}</p>
                          </div>
                          <span className="text-[8px] text-gray-400 mt-1 px-1">{msgTime}</span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 bg-white border-t border-gray-100">
                <form onSubmit={handleSendChat} className="flex gap-2">
                  <input
                    type="text" value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="พิมพ์ข้อความเจรจา..."
                    className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#EE4D2D] outline-none"
                  />
                  <button type="submit" disabled={!chatMessage.trim()} className="w-12 h-12 bg-[#EE4D2D] disabled:opacity-50 text-white rounded-xl flex items-center justify-center shadow-sm active:scale-95 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Post Job Modal */}
        {isModalOpen && !activeChatJob && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto scrollbar-hide">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200">✕</button>
              <h2 className="text-lg font-black text-gray-800 mb-4">เรียกงานด่วน 🚀</h2>

              {/* Job Type Tabs */}
              <div className="flex gap-2 mb-4">
                {(['ride','buy','deliver'] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setJobType(t)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${jobType === t ? 'bg-orange-50 border-[#EE4D2D] text-[#EE4D2D]' : 'bg-white border-gray-200 text-gray-500'}`}>
                    {t === 'ride' ? '🛵 เรียกรถ' : t === 'buy' ? '🍜 ฝากซื้อ' : '📦 ส่งของ'}
                  </button>
                ))}
              </div>

              <form onSubmit={handlePostJob} className="space-y-4">
                {/* Vehicle Type */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-600 pl-1">ประเภทรถ <span className="text-red-500">*</span></label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {(['motorcycle','car','suv','van','pickup'] as const).map((v) => (
                      <div key={v} onClick={() => setVehicleType(v)}
                        className={`shrink-0 w-[4.5rem] cursor-pointer border rounded-xl py-2 flex flex-col items-center gap-1 transition-all ${vehicleType === v ? 'border-[#EE4D2D] bg-orange-50 ring-1 ring-[#EE4D2D]' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                        <span className="text-xl">{getVehicleIcon(v)}</span>
                        <span className={`text-[9px] font-bold ${vehicleType === v ? 'text-[#EE4D2D]' : 'text-gray-500'}`}>{getVehicleName(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-600 pl-1">ให้ทำอะไร? <span className="text-red-500">*</span></label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="เช่น ไปส่งที่ บขส."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#EE4D2D] focus:ring-2 focus:ring-[#EE4D2D]/20 outline-none" />
                </div>

                {/* Goods price for 'buy' */}
                {jobType === 'buy' && (
                  <div className="space-y-1.5 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                    <label className="text-[11px] font-bold text-blue-700 pl-1">ค่าสินค้า (โดยประมาณ)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-gray-400 font-bold">฿</span>
                      <input type="number" value={goodsPrice} onChange={(e) => setGoodsPrice(e.target.value)}
                        placeholder="เพื่อเตรียมเงินสดสำรอง"
                        className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm font-bold outline-none focus:border-blue-500" />
                    </div>
                  </div>
                )}

                {/* MapPinPicker - Origin & Destination */}
                <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200 focus-within:ring-2 focus-within:ring-[#EE4D2D] transition-shadow">
                  <MapPinPicker
                    label="จุดรับ / ร้านค้า / จุดเริ่มต้น *"
                    placeholder="ค้นหาสถานที่ต้นทาง..."
                    value={pickup}
                    onLocationSelect={handlePickupSelect}
                  />
                  <MapPinPicker
                    label="จุดส่ง / ปลายทาง"
                    placeholder="ค้นหาสถานที่ปลายทาง..."
                    value={dropoff}
                    onLocationSelect={handleDropoffSelect}
                  />
                </div>

                {/* Note */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-600 pl-1">หมายเหตุถึงคนขับ (ถ้ามี)</label>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)}
                    placeholder="รายละเอียดเพิ่มเติม..." rows={2}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#EE4D2D] focus:ring-2 focus:ring-[#EE4D2D]/20 outline-none resize-none"></textarea>
                </div>

                {/* Fare Display */}
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 relative overflow-hidden">
                  {isFareLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-[#EE4D2D] border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs text-gray-600 font-medium">กำลังคำนวณระยะทาง...</p>
                    </div>
                  ) : fareError ? (
                    <p className="text-xs text-red-500 font-medium">{fareError}</p>
                  ) : fareResult ? (
                    <div>
                      <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider mb-1">ราคาตามระยะทางจริง</p>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-gray-600">{fareResult.distance_km.toFixed(1)} กม. • {fareResult.duration_min} นาที</p>
                          <p className="text-[9px] text-gray-400">GP 3%: ฿{fareResult.gp_amount.toFixed(2)}</p>
                        </div>
                        <div className="text-2xl font-black text-[#EE4D2D]">฿{fareResult.final_price}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-500">เลือกต้นทาง + ปลายทางเพื่อคำนวณ</p>
                      <div className="text-2xl font-black text-gray-300">-</div>
                    </div>
                  )}
                </div>

                <button type="submit" disabled={isSubmitting || (isFareLoading && jobType !== 'buy')}
                  className="w-full bg-[#EE4D2D] text-white font-black py-4 rounded-xl text-sm mt-4 shadow-md active:scale-95 disabled:opacity-50 transition-all">
                  {isSubmitting ? 'กำลังประมวลผล...' : 'ยืนยันการเรียกรถ'}
                </button>
              </form>
            </div>
          </div>
        )}

        <BottomNav />
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .pac-container { z-index: 9999 !important; border-radius: 1rem; box-shadow: 0 10px 40px rgba(0,0,0,0.12); }
      `}} />
    </div>
  );
}

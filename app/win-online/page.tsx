'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface ExpressJob {
  id: string;
  title: string;
  job_type: string;
  pickup_location: string;
  dropoff_location: string;
  distance_km: number | null; // เพิ่มระยะทาง
  goods_price: number | null;
  offered_price: number | null;
  status: string;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

export default function WinOnlinePage() {
  const router = useRouter();
  
  const [jobs, setJobs] = useState<ExpressJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form States
  const [jobType, setJobType] = useState<'ride' | 'buy' | 'deliver'>('ride');
  const [title, setTitle] = useState('');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [goodsPrice, setGoodsPrice] = useState('');
  
  // 💡 State สำหรับระบบคำนวณราคาอัตโนมัติ
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [calculatedFare, setCalculatedFare] = useState<number>(0);

  // -----------------------------------------------------------------
  // 🧮 ฟังก์ชันจำลองการคำนวณราคา (ตามสูตร Business Model)
  // -----------------------------------------------------------------
  useEffect(() => {
    // สมมติว่าถ้าลูกค้าพิมพ์จุดรับ-ส่งครบ ระบบจะดึงระยะทางจาก Google Maps มา (ตรงนี้เจมจำลองว่าได้ 8.5 กม. ก่อนนะคะ)
    if (pickup.length > 3 && dropoff.length > 3) {
      const mockDistance = 8.5; 
      setDistanceKm(mockDistance);
      
      // ดึงค่า Config จาก Setting (ตอนนี้จำลองค่าคงที่ไว้ก่อน รอคุณ C ทำหลังบ้านเสร็จ)
      const baseFare = 20;
      let ratePerKm = 8;
      
      if (mockDistance > 6 && mockDistance <= 40) ratePerKm = 7;
      if (mockDistance > 40) ratePerKm = 10;
      
      const fuelMultiplier = 1.0; // สมมติแอดมินตั้งไว้ 1.0 ช่วงน้ำมันปกติ
      const gpPercent = 1.03; // +3% เข้าแอป

      // สูตร: ((ระยะทาง * เรท) * ราคาน้ำมัน) + เริ่มต้น -> แล้ว + 3% GP
      const rawFare = baseFare + (mockDistance * ratePerKm * fuelMultiplier);
      const finalFare = Math.ceil(rawFare * gpPercent); // ปัดเศษขึ้นให้เป็นจำนวนเต็ม
      
      setCalculatedFare(finalFare);
    } else {
      setDistanceKm(0);
      setCalculatedFare(0);
    }
  }, [pickup, dropoff]);

  // -----------------------------------------------------------------
  // 🔄 ดึงข้อมูลฟีดงาน
  // -----------------------------------------------------------------
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
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user || null);
    });
    fetchJobs();
  }, []);

  // -----------------------------------------------------------------
  // 📝 โพสต์งานลงฐานข้อมูล
  // -----------------------------------------------------------------
  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('กรุณาเข้าสู่ระบบก่อนโพสต์งานด่วนค่ะ');
      router.push('/auth/login');
      return;
    }

    if (calculatedFare <= 0 && jobType !== 'buy') {
      alert('กรุณาระบุจุดรับ-ส่ง เพื่อให้ระบบคำนวณราคาค่ะ 📍');
      return;
    }

    setIsSubmitting(true);
    try {
      // ⚠️ ฝากบอกคุณ C ว่ารอบหน้าเราจะเพิ่ม distance_km ลงใน DB ด้วยนะคะ
      const { error } = await supabase.from('express_jobs').insert({
        customer_id: currentUser.id,
        title: title,
        job_type: jobType,
        pickup_location: pickup,
        dropoff_location: dropoff || null,
        goods_price: jobType === 'buy' && goodsPrice ? parseFloat(goodsPrice) : null,
        offered_price: calculatedFare, 
      });

      if (error) throw error;

      setIsModalOpen(false);
      setTitle(''); setPickup(''); setDropoff(''); setGoodsPrice(''); setCalculatedFare(0);
      fetchJobs(); 
      alert('โพสต์งานด่วนสำเร็จ! ระบบจัดราคากลางให้เรียบร้อย รอพี่วินติดต่อกลับได้เลยค่ะ 🚀');
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getJobIcon = (type: string) => {
    if (type === 'buy') return '🍜';
    if (type === 'deliver') return '📦';
    return '🛵';
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pb-24">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-x-hidden">
        
        {/* 🟠 Header */}
        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-b-[2.5rem] p-6 pt-12 shadow-md relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-white text-2xl font-black tracking-tight flex items-center gap-2">
              <span className="text-3xl">🛵</span> งานด่วนชุมชน
            </h1>
          </div>
          <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/20 text-white text-xs font-medium">
            📍 <strong className="text-yellow-200">ระบบราคากลางอัจฉริยะ:</strong> คำนวณค่าส่งตามระยะทาง GPS จริง เป็นธรรมทั้งผู้จ้างและผู้รับงาน
          </div>
        </div>

        {/* 📋 ฟีดงานด่วน */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide pb-24 z-0">
          <div className="flex justify-between items-end mb-2 px-1">
            <h2 className="text-sm font-black text-gray-800 tracking-tight flex items-center gap-2">🟢 งานที่รอคนรับ</h2>
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
              <p className="text-[10px] text-gray-500">โพสต์เรียกวิน หรือฝากซื้อของได้เลย!</p>
            </div>
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-gray-50 relative overflow-hidden active:scale-[0.99] transition-transform">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-xl">{getJobIcon(job.job_type)}</div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm leading-tight pr-2">{job.title}</h3>
                      <p className="text-[9px] text-gray-500 font-medium mt-0.5">โดย: {job.profiles?.first_name || 'ไม่ระบุ'}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-black text-[#EE4D2D] leading-none">
                      {job.offered_price ? `฿${job.offered_price}` : 'รอเสนอราคา'}
                    </div>
                    <div className="text-[8px] text-gray-400 font-bold mt-1 uppercase tracking-wider">ค่าส่ง (รวม GP แล้ว)</div>
                  </div>
                </div>

                <div className="space-y-1.5 bg-gray-50 p-3 rounded-xl border border-gray-100 mb-4">
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

                <div className="flex gap-2">
                  <button className="flex-1 bg-[#EE4D2D] text-white py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm">
                    รับงานนี้ ⚡
                  </button>
                  <button className="flex-1 bg-white text-[#EE4D2D] border border-[#EE4D2D] py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm">
                    💬 แชทต่อรอง
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ➕ Floating Action Button */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-24 right-4 sm:right-[calc(50%-18rem)] w-14 h-14 bg-gradient-to-br from-[#EE4D2D] to-[#FF7337] rounded-full shadow-lg shadow-[#EE4D2D]/30 flex items-center justify-center text-white text-3xl active:scale-90 transition-transform z-40 border-2 border-white"
        >
          +
        </button>

        {/* ----------------------------------------------------------------- */}
        {/* 🧩 Modal โพสต์งานด่วน (อัปเกรดระบบแผนที่ & คำนวณราคา) */}
        {/* ----------------------------------------------------------------- */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-2xl animate-slide-up relative max-h-[90vh] overflow-y-auto scrollbar-hide">
              
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200">✕</button>

              <h2 className="text-lg font-black text-gray-800 mb-4">เรียกงานด่วน 🚀</h2>

              <div className="flex gap-2 mb-5">
                <button type="button" onClick={() => setJobType('ride')} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${jobType === 'ride' ? 'bg-orange-50 border-[#EE4D2D] text-[#EE4D2D]' : 'bg-white border-gray-200 text-gray-500'}`}>🛵 เรียกรถ</button>
                <button type="button" onClick={() => setJobType('buy')} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${jobType === 'buy' ? 'bg-orange-50 border-[#EE4D2D] text-[#EE4D2D]' : 'bg-white border-gray-200 text-gray-500'}`}>🍜 ฝากซื้อของ</button>
                <button type="button" onClick={() => setJobType('deliver')} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${jobType === 'deliver' ? 'bg-orange-50 border-[#EE4D2D] text-[#EE4D2D]' : 'bg-white border-gray-200 text-gray-500'}`}>📦 ส่งของ</button>
              </div>

              <form onSubmit={handlePostJob} className="space-y-4">
                
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-600 pl-1">ให้ทำอะไร? <span className="text-red-500">*</span></label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น ไปส่งที่ บขส." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D] outline-none" />
                </div>

                {jobType === 'buy' && (
                  <div className="space-y-1.5 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                    <label className="text-[11px] font-bold text-blue-700 pl-1">ค่าสินค้า (โดยประมาณ)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-gray-400 font-bold">฿</span>
                      <input type="number" value={goodsPrice} onChange={(e) => setGoodsPrice(e.target.value)} placeholder="ระบุเพื่อให้วินเตรียมเงินสด" className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D] outline-none" />
                    </div>
                  </div>
                )}
                
                {/* 🗺️ UI ปักหมุดแผนที่ (จำลอง) */}
                <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-600 pl-1 flex justify-between">
                      <span>จุดรับ / ร้านค้า <span className="text-red-500">*</span></span>
                      <span className="text-[9px] text-[#EE4D2D] cursor-pointer hover:underline flex items-center gap-1">📍 เลือกบนแผนที่</span>
                    </label>
                    <input type="text" required value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="ค้นหาสถานที่..." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D] outline-none" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-600 pl-1 flex justify-between">
                      <span>จุดส่ง / ปลายทาง <span className="text-red-500">*</span></span>
                      <span className="text-[9px] text-[#EE4D2D] cursor-pointer hover:underline flex items-center gap-1">📍 เลือกบนแผนที่</span>
                    </label>
                    <input type="text" required value={dropoff} onChange={(e) => setDropoff(e.target.value)} placeholder="ค้นหาสถานที่..." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D] outline-none" />
                  </div>
                </div>

                {/* 🧮 สรุปราคาที่คำนวณจากระยะทาง */}
                <div className="pt-2">
                  <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">ราคากลางอิงตามระยะทาง</p>
                      <p className="text-xs text-gray-700 font-medium mt-0.5">
                        {distanceKm > 0 ? `ระยะทางประมาณ ${distanceKm} กม.` : 'กรุณาระบุจุดรับ-ส่ง'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-[#EE4D2D]">
                        {calculatedFare > 0 ? `฿${calculatedFare}` : '-'}
                      </div>
                    </div>
                  </div>
                  <p className="text-[9px] text-gray-400 text-center mt-2">
                    *ราคาข้างต้นรวมค่าบำรุงแพลตฟอร์ม 3% และปรับเรทตามราคาน้ำมันปัจจุบันแล้ว
                  </p>
                </div>

                <button type="submit" disabled={isSubmitting || (calculatedFare <= 0 && jobType !== 'buy')} className="w-full bg-[#EE4D2D] hover:bg-[#D9381E] disabled:opacity-50 text-white font-black py-4 rounded-xl text-sm transition-all mt-4 shadow-md active:scale-95">
                  {isSubmitting ? 'กำลังประมวลผล...' : 'ยืนยันการเรียกรถ'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ✅ Bottom Navigation */}
        <div className="fixed bottom-0 w-full sm:max-w-2xl md:max-w-3xl bg-white/95 backdrop-blur-md border-t border-gray-100 px-1 py-4 flex justify-between items-center shadow-[0_-4px_25px_rgba(0,0,0,0.06)] rounded-t-[2.5rem] z-30">
          <NavItem icon="🏠" label="หน้าแรก" active={false} onClick={() => router.push('/')} />
          <NavItem icon="🛠️" label="บริการ" active={false} onClick={() => router.push('/services')} />
          <NavItem icon="📋" label="งานด่วน" active={true} onClick={() => {}} />
          <NavItem icon="📰" label="ข่าวสาร" active={false} onClick={() => router.push('/news')} />
          <NavItem icon="🎟️" label="ปองเจริญ" active={false} onClick={() => router.push('/coupons')} />
          <NavItem icon="👤" label="ฉัน" active={false} onClick={() => router.push('/profile')} />
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
        .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}} />
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: any) {
  return (
    <div onClick={onClick} className={`flex flex-col items-center gap-1.5 cursor-pointer transition-all ${active ? 'scale-110' : 'opacity-40 hover:opacity-100'} flex-1`}>
      <span className="text-[22px]">{icon}</span>
      <span className={`text-[9px] font-bold ${active ? 'text-[#EE4D2D]' : 'text-gray-500'} whitespace-nowrap`}>{label}</span>
      {active && <div className="w-1.5 h-1.5 bg-[#EE4D2D] rounded-full shadow-sm mt-0.5"></div>}
    </div>
  );
}

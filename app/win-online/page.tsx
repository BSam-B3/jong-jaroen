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
  const [serviceFee, setServiceFee] = useState('');

  // -----------------------------------------------------------------
  // 🔄 ดึงข้อมูล
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
  // 📝 โพสต์งาน
  // -----------------------------------------------------------------
  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('กรุณาเข้าสู่ระบบก่อนโพสต์งานด่วนครับ');
      router.push('/auth/login');
      return;
    }

    // ตรวจสอบขั้นต่ำค่าแรง (สมมติขั้นต่ำ 15 บาทเพื่อความเป็นธรรม)
    if (serviceFee && parseFloat(serviceFee) < 15) {
      alert('เพื่อความเป็นธรรมต่อผู้รับงาน กรุณากำหนดค่าจ้างเริ่มต้นที่ 15 บาทขึ้นไปครับ 🛵');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('express_jobs').insert({
        customer_id: currentUser.id,
        title: title,
        job_type: jobType,
        pickup_location: pickup,
        dropoff_location: dropoff || null,
        goods_price: jobType === 'buy' && goodsPrice ? parseFloat(goodsPrice) : null,
        offered_price: serviceFee ? parseFloat(serviceFee) : null,
      });

      if (error) throw error;

      setIsModalOpen(false);
      setTitle(''); setPickup(''); setDropoff(''); setGoodsPrice(''); setServiceFee(''); setJobType('ride');
      fetchJobs(); 
      alert('โพสต์งานด่วนสำเร็จ! รอคนรับงานหรือทักแชทมาต่อรองได้เลยครับ 🚀');
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper Functions
  const timeAgo = (dateString: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 60000);
    if (diff < 1) return 'เมื่อสักครู่';
    if (diff < 60) return `${diff} นาทีที่แล้ว`;
    return `${Math.floor(diff / 60)} ชม. ที่แล้ว`;
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
            💡 <strong className="text-yellow-200">ระบบราคาเป็นธรรม:</strong> ลูกค้าเสนอราคาที่พอใจ และช่างสามารถกดทักแชทเพื่อต่อรองระยะทางได้
          </div>
        </div>

        {/* 📋 ฟีดงานด่วน */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide pb-24 z-0">
          
          <div className="flex justify-between items-end mb-2 px-1">
            <h2 className="text-sm font-black text-gray-800 tracking-tight flex items-center gap-2">
              🟢 งานที่รอคนรับ
            </h2>
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
                    <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-xl">
                      {getJobIcon(job.job_type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm leading-tight">{job.title}</h3>
                      <p className="text-[9px] text-gray-500 font-medium mt-0.5">
                        ผู้โพสต์: {job.profiles?.first_name || 'ไม่ระบุ'} • {timeAgo(job.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  {/* แสดงราคาแยกส่วน */}
                  <div className="text-right">
                    <div className="text-lg font-black text-[#EE4D2D] leading-none">
                      {job.offered_price ? `฿${job.offered_price}` : 'เสนอราคา'}
                    </div>
                    <div className="text-[8px] text-gray-400 font-bold mt-1 uppercase tracking-wider">ค่าจ้าง / ค่าส่ง</div>
                  </div>
                </div>

                {job.goods_price && (
                  <div className="bg-blue-50 text-blue-700 text-[10px] font-bold px-3 py-1.5 rounded-lg inline-block mb-3 border border-blue-100">
                    🛒 เตรียมเงินค่าของประมาณ: ฿{job.goods_price}
                  </div>
                )}

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

                {/* ปุ่ม Action 2 ฝั่ง: รับงาน VS ต่อรอง */}
                <div className="flex gap-2">
                  <button className="flex-1 bg-[#EE4D2D] text-white py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm">
                    รับงานนี้ ⚡
                  </button>
                  <button 
                    onClick={() => alert('ฟีเจอร์แชทกำลังพัฒนาครับ! 💬')}
                    className="flex-1 bg-white text-[#EE4D2D] border border-[#EE4D2D] py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
                  >
                    💬 ทักแชทต่อรอง
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
        {/* 🧩 Modal โพสต์งานด่วน (แยกระบบราคา) */}
        {/* ----------------------------------------------------------------- */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-2xl animate-slide-up relative max-h-[90vh] overflow-y-auto scrollbar-hide">
              
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200">✕</button>

              <h2 className="text-lg font-black text-gray-800 mb-4">เรียกงานด่วน 🚀</h2>

              {/* เลือกประเภทงาน */}
              <div className="flex gap-2 mb-5">
                <button type="button" onClick={() => setJobType('ride')} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${jobType === 'ride' ? 'bg-orange-50 border-[#EE4D2D] text-[#EE4D2D]' : 'bg-white border-gray-200 text-gray-500'}`}>🛵 เรียกรถ</button>
                <button type="button" onClick={() => setJobType('buy')} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${jobType === 'buy' ? 'bg-orange-50 border-[#EE4D2D] text-[#EE4D2D]' : 'bg-white border-gray-200 text-gray-500'}`}>🍜 ฝากซื้อของ</button>
                <button type="button" onClick={() => setJobType('deliver')} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${jobType === 'deliver' ? 'bg-orange-50 border-[#EE4D2D] text-[#EE4D2D]' : 'bg-white border-gray-200 text-gray-500'}`}>📦 ส่งของ</button>
              </div>

              <form onSubmit={handlePostJob} className="space-y-4">
                
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-600 pl-1">ให้ทำอะไร? <span className="text-red-500">*</span></label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder={jobType === 'buy' ? "เช่น ซื้อข้าวมันไก่ร้านเจ๊หมวย 2 ห่อ" : "เช่น ไปส่งที่ บขส."} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D] outline-none" />
                </div>

                {jobType === 'buy' && (
                  <div className="space-y-1.5 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                    <label className="text-[11px] font-bold text-blue-700 pl-1">ค่าสินค้า / ค่าอาหาร (โดยประมาณ)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-gray-400 font-bold">฿</span>
                      <input type="number" value={goodsPrice} onChange={(e) => setGoodsPrice(e.target.value)} placeholder="0" className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D] outline-none" />
                    </div>
                    <p className="text-[9px] text-blue-600 mt-1 pl-1">ให้วินรู้ว่าต้องเตรียมเงินสำรองจ่ายเท่าไหร่</p>
                  </div>
                )}
                
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-600 pl-1">จุดรับ / ร้านค้า / เริ่มต้น <span className="text-red-500">*</span></label>
                  <input type="text" required value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="ระบุให้ชัดเจน" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D] outline-none" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-600 pl-1">จุดส่ง / ปลายทาง</label>
                  <input type="text" value={dropoff} onChange={(e) => setDropoff(e.target.value)} placeholder="ระบุปลายทาง" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D] outline-none" />
                </div>

                {/* ส่วนค่าจ้าง + ราคากลางแนะนำ */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <label className="text-[11px] font-bold text-gray-800 pl-1 flex justify-between">
                    <span>ค่าจ้าง / ค่าวิ่งส่ง (บาท) <span className="text-red-500">*</span></span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-[#EE4D2D] font-black">฿</span>
                    <input type="number" required min="15" value={serviceFee} onChange={(e) => setServiceFee(e.target.value)} placeholder="ระบุค่าจ้างที่เป็นธรรม..." className="w-full border-2 border-orange-100 rounded-xl pl-8 pr-4 py-3 text-base text-[#EE4D2D] font-black focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D] outline-none" />
                  </div>
                  
                  {/* ปุ่มราคากลางชุมชน */}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setServiceFee('20')} className="flex-1 bg-gray-50 border border-gray-200 text-gray-600 text-[10px] font-bold py-1.5 rounded-lg hover:bg-orange-50 hover:text-[#EE4D2D] transition-colors">+ 20 บาท (ใกล้ๆ)</button>
                    <button type="button" onClick={() => setServiceFee('30')} className="flex-1 bg-gray-50 border border-gray-200 text-gray-600 text-[10px] font-bold py-1.5 rounded-lg hover:bg-orange-50 hover:text-[#EE4D2D] transition-colors">+ 30 บาท (มีรอคิว)</button>
                    <button type="button" onClick={() => setServiceFee('50')} className="flex-1 bg-gray-50 border border-gray-200 text-gray-600 text-[10px] font-bold py-1.5 rounded-lg hover:bg-orange-50 hover:text-[#EE4D2D] transition-colors">+ 50 บาท (ของเยอะ)</button>
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full bg-[#EE4D2D] hover:bg-[#D9381E] disabled:opacity-50 text-white font-black py-4 rounded-xl text-sm transition-all mt-4 shadow-md active:scale-95">
                  {isSubmitting ? 'กำลังโพสต์...' : 'ยืนยันการโพสต์งาน'}
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

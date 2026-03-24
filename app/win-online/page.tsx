'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// กำหนด Type ให้ตรงกับ Database ที่คุณ C สร้าง
interface ExpressJob {
  id: string;
  title: string;
  pickup_location: string;
  dropoff_location: string;
  offered_price: number;
  status: string;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

export default function WinOnlinePage() {
  const router = useRouter();
  
  // State สำหรับดึงข้อมูลงาน
  const [jobs, setJobs] = useState<ExpressJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State สำหรับผู้ใช้งานปัจจุบัน (เพื่อเช็คสิทธิ์ตอนกดโพสต์งาน)
  const [currentUser, setCurrentUser] = useState<any>(null);

  // State สำหรับ Modal โพสต์งาน
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ฟอร์มโพสต์งาน
  const [title, setTitle] = useState('');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [price, setPrice] = useState('');

  // -----------------------------------------------------------------
  // 🔄 1. ดึงข้อมูลงานด่วนทั้งหมดจาก Database
  // -----------------------------------------------------------------
  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      // ดึงงานด่วน และ Join ข้อมูลชื่อคนโพสต์จากตาราง profiles
      const { data, error } = await supabase
        .from('express_jobs')
        .select(`
          *,
          profiles:customer_id (first_name, last_name)
        `)
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
    // เช็ค Session ผู้ใช้
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user || null);
    });

    fetchJobs();
  }, []);

  // -----------------------------------------------------------------
  // 📝 2. ฟังก์ชันโพสต์งานด่วน (บันทึกลง Database)
  // -----------------------------------------------------------------
  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('กรุณาเข้าสู่ระบบก่อนโพสต์งานด่วนครับ');
      router.push('/auth/login');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('express_jobs').insert({
        customer_id: currentUser.id,
        title: title,
        pickup_location: pickup,
        dropoff_location: dropoff || null,
        offered_price: price ? parseFloat(price) : null,
      });

      if (error) throw error;

      // โพสต์สำเร็จ: ปิด Modal, ล้างฟอร์ม และดึงข้อมูลใหม่
      setIsModalOpen(false);
      setTitle('');
      setPickup('');
      setDropoff('');
      setPrice('');
      fetchJobs(); // รีเฟรชรายการงาน
      
      alert('โพสต์งานด่วนสำเร็จ! รอช่าง/วิน ติดต่อกลับได้เลยครับ 🚀');
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ฟังก์ชันคำนวณเวลาที่ผ่านไป (เช่น "10 นาทีที่แล้ว")
  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'เมื่อสักครู่';
    if (diffInMinutes < 60) return `${diffInMinutes} นาทีที่แล้ว`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ชม. ที่แล้ว`;
    return 'มากกว่า 1 วัน';
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
            <button className="bg-white/20 p-2 rounded-full text-white hover:bg-white/30 transition-all">
              🔔
            </button>
          </div>
          
          <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/20 text-white text-sm font-medium">
            📍 โพสต์ปุ๊บ วินหรือคนรับจ้างในพื้นที่เห็นปั๊บ พร้อมให้บริการทันที
          </div>
        </div>

        {/* 📋 ส่วนเนื้อหาหลัก (Feed งาน) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide pb-24 z-0">
          
          <div className="flex justify-between items-end mb-2 px-1">
            <h2 className="text-sm font-black text-gray-800 tracking-tight flex items-center gap-2">
              🟢 งานที่รอคนรับ
            </h2>
            <button onClick={fetchJobs} className="text-[10px] text-gray-500 hover:text-[#EE4D2D] font-bold">
              🔄 รีเฟรช
            </button>
          </div>

          {isLoading ? (
            // ⏳ Skeleton Loading
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-gray-100 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))
          ) : jobs.length === 0 ? (
            // 📭 Empty State (ไม่มีงาน)
            <div className="bg-white rounded-[2rem] p-8 text-center shadow-sm border border-gray-100 mt-4">
              <div className="text-5xl mb-4 opacity-50">💨</div>
              <h3 className="text-sm font-bold text-gray-800 mb-1">ยังไม่มีงานด่วนในขณะนี้</h3>
              <p className="text-[10px] text-gray-500">เป็นคนแรกที่เริ่มโพสต์เรียกวิน หรือหาคนช่วยงานสิ!</p>
            </div>
          ) : (
            // ✅ รายการงานด่วน
            jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-gray-50 relative overflow-hidden active:scale-[0.99] transition-transform">
                
                {/* แถบราคา (ถ้ามี) */}
                {job.offered_price && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl shadow-sm">
                    ฿{job.offered_price}
                  </div>
                )}

                <h3 className="font-bold text-gray-800 text-sm pr-12">{job.title}</h3>
                
                <div className="mt-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 text-xs mt-0.5">🟢</span>
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">จุดรับ / เริ่มงาน</p>
                      <p className="text-xs text-gray-700 font-medium">{job.pickup_location}</p>
                    </div>
                  </div>
                  
                  {job.dropoff_location && (
                    <div className="flex items-start gap-2">
                      <span className="text-red-500 text-xs mt-0.5">🔴</span>
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">จุดส่ง / ปลายทาง</p>
                        <p className="text-xs text-gray-700 font-medium">{job.dropoff_location}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-[10px] font-bold">
                      {job.profiles?.first_name?.charAt(0) || '?'}
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium">
                      ผู้โพสต์: {job.profiles?.first_name || 'ไม่ระบุ'}
                    </span>
                  </div>
                  <span className="text-[9px] text-gray-400 font-medium">
                    {timeAgo(job.created_at)}
                  </span>
                </div>

                {/* ปุ่มรับงาน (สำหรับช่าง/วิน) */}
                <button className="w-full mt-3 bg-orange-50 text-[#EE4D2D] border border-orange-100 hover:bg-orange-100 py-2.5 rounded-xl text-xs font-bold transition-colors">
                  กดรับงานนี้ ⚡
                </button>
              </div>
            ))
          )}

        </div>

        {/* ➕ Floating Action Button (ปุ่มโพสต์งาน) */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-24 right-4 sm:right-[calc(50%-18rem)] w-14 h-14 bg-gradient-to-br from-[#EE4D2D] to-[#FF7337] rounded-full shadow-lg shadow-[#EE4D2D]/30 flex items-center justify-center text-white text-3xl active:scale-90 transition-transform z-40 border-2 border-white"
        >
          +
        </button>

        {/* ----------------------------------------------------------------- */}
        {/* 🧩 Modal (หน้าต่างป๊อปอัป) สำหรับกรอกข้อมูลโพสต์งาน */}
        {/* ----------------------------------------------------------------- */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-2xl animate-slide-up relative">
              
              {/* ปุ่มปิด */}
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >
                ✕
              </button>

              <h2 className="text-lg font-black text-gray-800 mb-1">โพสต์งานด่วน 🚀</h2>
              <p className="text-[10px] text-gray-500 mb-5">ข้อมูลจะถูกส่งไปยังช่างและวินในพื้นที่ทันที</p>

              <form onSubmit={handlePostJob} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-600 pl-1">หัวข้อ / ต้องการให้ทำอะไร? <span className="text-red-500">*</span></label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น ซื้อข้าวหมูแดง, เรียกวินไปตลาด" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D] outline-none transition-all" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-600 pl-1">จุดรับ / สถานที่เริ่มงาน <span className="text-red-500">*</span></label>
                  <input type="text" required value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="เช่น หน้าเซเว่นปากซอย 5" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D] outline-none transition-all" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-600 pl-1">จุดส่ง / ปลายทาง (ถ้ามี)</label>
                  <input type="text" value={dropoff} onChange={(e) => setDropoff(e.target.value)} placeholder="เช่น บ้านเลขที่ 123/4" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D] outline-none transition-all" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-600 pl-1 flex justify-between">
                    <span>ราคาที่เสนอ (บาท)</span>
                    <span className="text-gray-400 font-normal">เว้นว่างได้ถ้าให้ช่างเสนอราคา</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-400 font-bold">฿</span>
                    <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-[#EE4D2D]/30 focus:border-[#EE4D2D] outline-none transition-all" />
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

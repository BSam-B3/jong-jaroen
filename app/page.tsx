'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase'; // 🔌 เสียบปลั๊ก Supabase

// กำหนดโครงสร้างข้อมูล (Type)
interface Service {
  id: string;
  title: string;
  icon: string;
  color: string;
}

export default function HomePage() {
  const router = useRouter();
  
  // States สำหรับเก็บข้อมูลที่ดึงมาจากฐานข้อมูล
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ฟังก์ชันดึงข้อมูลจาก Supabase
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .order('created_at', { ascending: true }); // เรียงตามลำดับที่สร้าง

        if (error) throw error;
        if (data) setServices(data);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pb-24">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-x-hidden">
        
        {/* ส่วนเนื้อหาที่ Scroll ได้ */}
        <div className="flex-1 overflow-y-auto pb-6 scrollbar-hide">
          
          {/* 🟠 Header ปรับเป็น "การ์ดลอย" สีส้ม-ทอง มุมมน 4 ด้าน */}
          <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-[2.5rem] p-6 pt-10 pb-8 shadow-md relative z-10 m-3 mt-4 overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-yellow-300/20 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex justify-between items-start relative z-10 px-2">
              <div className="space-y-1 text-left">
                <p className="text-white/90 text-[11px] font-bold tracking-widest uppercase">แพลตฟอร์มตลาดแรงงานชุมชน</p>
                <h1 className="text-white text-2xl font-black drop-shadow-md tracking-tight flex items-center gap-2">
                  🌟 จงเจริญ
                </h1>
              </div>
              
              {/* Profile / Notification */}
              <div className="flex gap-2">
                <button className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white relative shadow-sm border border-white/30 hover:bg-white/30 transition-all">
                  🔔
                  <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-[#EE4D2D] rounded-full"></span>
                </button>
              </div>
            </div>

            {/* แถบค้นหา (Search Bar) */}
            <div className="mt-6 px-2 relative z-10">
              <div className="bg-white rounded-2xl p-1.5 flex items-center shadow-lg shadow-black/5">
                <div className="pl-3 pr-2 text-gray-400">🔍</div>
                <input 
                  type="text" 
                  placeholder="ค้นหาช่าง, วิน, หรืองานด่วน..." 
                  className="w-full bg-transparent text-sm py-2 outline-none font-medium placeholder:text-gray-400"
                />
                <button className="bg-[#EE4D2D] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-transform">
                  ค้นหา
                </button>
              </div>
            </div>
          </div>

          <main className="px-5 mt-2 relative z-20 space-y-6">
            
            {/* 🛠️ หมวดหมู่บริการ (ดึงข้อมูลจาก Database) */}
            <section>
              <div className="flex justify-between items-end mb-4 px-1">
                <h2 className="text-sm font-black text-gray-800 tracking-tight flex items-center gap-2">
                  <span className="text-[#EE4D2D]">📌</span> บริการยอดฮิต
                </h2>
                <button onClick={() => router.push('/services')} className="text-[10px] font-bold text-[#EE4D2D] bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                  ดูทั้งหมด ›
                </button>
              </div>
              
              <div className="grid grid-cols-4 gap-3">
                {isLoading ? (
                  // ⏳ สถานะกำลังโหลด (Skeleton Loading)
                  Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-[1.5rem] p-3 flex flex-col items-center gap-2 shadow-sm border border-gray-50 animate-pulse">
                      <div className="w-12 h-12 bg-gray-200 rounded-2xl"></div>
                      <div className="w-10 h-3 bg-gray-200 rounded-full mt-1"></div>
                    </div>
                  ))
                ) : (
                  // ✅ แสดงข้อมูลจริงจาก Supabase
                  services.map((service) => (
                    <div key={service.id} className="bg-white rounded-[1.5rem] p-3 flex flex-col items-center gap-2 shadow-sm border border-gray-50 active:scale-95 transition-transform cursor-pointer hover:border-orange-100 hover:shadow-md">
                      <div className={`w-12 h-12 ${service.color} rounded-2xl flex items-center justify-center text-2xl shadow-inner`}>
                        {service.icon}
                      </div>
                      <span className="text-[10px] font-bold text-gray-700 whitespace-nowrap">{service.title}</span>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* 📋 งานด่วนล่าสุด (ใช้ UI เดิมไปก่อน) */}
            <section>
              <div className="flex justify-between items-end mb-4 px-1">
                <h2 className="text-sm font-black text-gray-800 tracking-tight flex items-center gap-2">
                  <span className="text-orange-500">⚡</span> งานด่วนชุมชน
                </h2>
                <button onClick={() => router.push('/win-online')} className="text-[10px] font-bold text-[#EE4D2D] bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                  รับงานด่วน ›
                </button>
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-[2rem] p-5 shadow-sm border border-orange-100/50 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 text-6xl opacity-20 transform rotate-12">🛵</div>
                <h3 className="font-black text-gray-800 text-sm">เรียกรถ / ส่งของด่วน</h3>
                <p className="text-[10px] text-gray-600 mt-1 font-medium w-3/4">โพสต์ปุ๊บ วินหรือคนรับจ้างในพื้นที่เห็นปั๊บ พร้อมให้บริการทันที</p>
                <button onClick={() => router.push('/win-online')} className="mt-4 bg-[#EE4D2D] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-transform w-full sm:w-auto text-center">
                  โพสต์งานด่วน 🚀
                </button>
              </div>
            </section>

          </main>
        </div>

        {/* ✅ Bottom Navigation */}
        <div className="fixed bottom-0 w-full sm:max-w-2xl md:max-w-3xl bg-white/95 backdrop-blur-md border-t border-gray-100 px-1 py-4 flex justify-between items-center shadow-[0_-4px_25px_rgba(0,0,0,0.06)] rounded-t-[2.5rem] z-50">
          <NavItem icon="🏠" label="หน้าแรก" active={true} onClick={() => {}} />
          <NavItem icon="🛠️" label="บริการ" active={false} onClick={() => router.push('/services')} />
          <NavItem icon="📋" label="งานด่วน" active={false} onClick={() => router.push('/win-online')} />
          <NavItem icon="📰" label="ข่าวสาร" active={false} onClick={() => router.push('/news')} />
          <NavItem icon="🎟️" label="ปองเจริญ" active={false} onClick={() => router.push('/coupons')} />
          <NavItem icon="👤" label="ฉัน" active={false} onClick={() => router.push('/profile')} />
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
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

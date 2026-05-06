'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

// กำหนด Interface ให้ตรงกับข้อมูลที่ดึงมา
interface ServiceCard {
  id: string;
  title: string;
  category: string;
  cover_image_url: string | null;
  starting_price: number;
  is_active: boolean;
  created_at: string;
}

export default function MyJobsCardsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceCard[]>([]);

  useEffect(() => {
    const fetchMyJobsCards = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push('/auth/login?next=/profile/jobs-cards');
        return;
      }

      // ดึงข้อมูลบริการเฉพาะของผู้ใช้คนนี้
      const { data, error } = await supabase
        .from('services')
        .select('id, title, category, cover_image_url, starting_price, is_active, created_at')
        .eq('provider_id', session.user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setServices(data);
      }
      setLoading(false);
    };

    fetchMyJobsCards();
  }, [router, supabase]);

  const formatPrice = (price: number) => {
    return Number(price).toLocaleString('th-TH');
  };

  return (
    <div className="min-h-screen bg-[#F0F4F0] flex justify-center font-sans pb-24">
      <div className="w-full max-w-4xl bg-white min-h-screen shadow-xl relative flex flex-col">
        
        {/* 🌟 Top Header: สไตล์ Creator Studio */}
        <header className="sticky top-0 z-[100] bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 md:px-8 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3 md:gap-5">
            <button type="button" onClick={() => router.push('/profile')} className="w-8 h-8 md:w-10 md:h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-black transition-colors">
              ←
            </button>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-[#00C300] rounded-lg p-1.5 shadow-inner flex items-center justify-center text-white text-xl">
                📇
              </div>
              <div>
                <h1 className="text-gray-800 font-black text-base md:text-lg leading-none tracking-tight">กระเป๋า Jobs-Card</h1>
                <span className="text-[9px] font-bold text-[#00C300] uppercase tracking-widest">My Services</span>
              </div>
            </div>
          </div>

          <Link 
            href="/jobs/create"
            className="px-4 py-2.5 md:px-6 md:py-3 rounded-full font-black text-xs md:text-sm transition-all flex items-center gap-2 shadow-md bg-gradient-to-r from-[#EE4D2D] to-[#FF7337] text-white hover:shadow-lg hover:shadow-orange-200 active:scale-95"
          >
            <span>+</span> <span className="hidden sm:inline">สร้างการ์ดใหม่</span>
          </Link>
        </header>

        <main className="flex-1 p-5 md:p-8 bg-gray-50">
          
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight">นามบัตรบริการของคุณ</h2>
              <p className="text-xs font-bold text-gray-500 mt-1">จัดการแก้ไข เปิด/ปิด การรับงานได้ที่นี่</p>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
              <span className="text-xs font-black text-gray-400 uppercase">ทั้งหมด </span>
              <span className="text-lg font-black text-[#00C300]">{services.length}</span>
            </div>
          </div>

          {loading ? (
            // Loading Skeleton
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm animate-pulse flex gap-4">
                  <div className="w-24 h-24 bg-gray-200 rounded-2xl shrink-0"></div>
                  <div className="flex-1 space-y-3 py-2">
                    <div className="h-4 bg-gray-200 rounded-full w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded-full w-1/2"></div>
                    <div className="h-6 bg-gray-200 rounded-xl w-1/3 mt-2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : services.length === 0 ? (
            // Empty State
            <div className="bg-white rounded-[2rem] border-2 border-dashed border-gray-200 p-10 flex flex-col items-center justify-center text-center mt-10">
              <div className="w-24 h-24 bg-green-50 text-[#00C300] rounded-full flex items-center justify-center text-5xl mb-4">
                💼
              </div>
              <h3 className="text-lg font-black text-gray-800 mb-2">คุณยังไม่มี Jobs-Card เลย</h3>
              <p className="text-sm font-bold text-gray-500 mb-6 max-w-sm leading-relaxed">
                สร้างนามบัตรบริการใบแรกของคุณ เพื่อให้ลูกค้าค้นหาเจอและเริ่มรับรายได้กับจงเจริญ
              </p>
              <Link 
                href="/jobs/create"
                className="px-8 py-4 bg-[#00C300] hover:bg-[#00A300] text-white rounded-2xl font-black text-sm shadow-xl shadow-green-200 active:scale-95 transition-all"
              >
                ✨ สร้าง Jobs-Card ฟรี
              </Link>
            </div>
          ) : (
            // Services List
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {services.map((service) => (
                <div key={service.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all group overflow-hidden flex flex-col">
                  <div className="p-4 flex gap-4 items-start relative">
                    
                    {/* Badge สถานะ */}
                    <div className="absolute top-6 left-6 z-10">
                      {service.is_active ? (
                        <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-sm">LIVE</span>
                      ) : (
                        <span className="bg-gray-400 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-sm">ปิดรับงาน</span>
                      )}
                    </div>

                    {/* รูปปก */}
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-100 rounded-2xl overflow-hidden shrink-0 relative">
                      {service.cover_image_url ? (
                        <img src={service.cover_image_url} alt={service.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">🖼️</div>
                      )}
                    </div>

                    {/* รายละเอียด */}
                    <div className="flex-1 pt-1">
                      <span className="text-[10px] font-black text-[#F59E0B] uppercase tracking-wider">{service.category}</span>
                      <h3 className="font-black text-gray-800 text-sm md:text-base leading-snug line-clamp-2 mt-0.5 group-hover:text-[#00C300] transition-colors">
                        {service.title}
                      </h3>
                      
                      <div className="mt-3">
                        <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">ราคาเริ่มต้น</span>
                        <div className="flex items-baseline gap-1">
                          <span className="font-black text-[#00C300] text-lg">฿{formatPrice(service.starting_price)}</span>
                          <span className="text-[10px] font-bold text-[#00C300]">บาท</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-100 mt-auto">
                    <span className="text-[10px] font-bold text-gray-400">
                      อัปเดต: {new Date(service.created_at).toLocaleDateString('th-TH')}
                    </span>
                    <div className="flex items-center gap-2">
                      <Link 
                        href={`/services/${service.id}`}
                        className="px-4 py-2 bg-white text-gray-600 border border-gray-200 rounded-xl text-xs font-black hover:text-[#00C300] hover:border-[#00C300] transition-colors shadow-sm"
                      >
                        ดูตัวอย่าง
                      </Link>
                      {/* ในอนาคตสามารถใส่ลิงก์ไปหน้า Edit ได้ */}
                      <button className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-[#F59E0B] transition-colors shadow-sm">
                        ✏️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

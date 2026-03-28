'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface ServiceCategory {
    id: string;
    title: string;
    icon: string;
    color: string;
}

export default function HomePage() {
    const router = useRouter();
    const [categories, setCategories] = useState<ServiceCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
        const fetchCategories = async () => {
                try {
                          const { data, error } = await supabase
                            .from('service_categories')
                            .select('*')
                            .order('created_at', { ascending: true });
                          if (error) throw error;
                          if (data) setCategories(data);
                } catch (error) {
                          console.error('Error fetching categories:', error);
                } finally {
                          setIsLoading(false);
                }
        };
        fetchCategories();
  }, []);

  return (
        <div className="min-h-screen bg-gray-100 flex justify-center">
              <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-x-hidden">
                      <div className="flex-1 overflow-y-auto pb-6 scrollbar-hide">
                                <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-[2.5rem] p-6 pt-10 pb-8 shadow-md relative z-10 m-3 mt-4 overflow-hidden">
                                            <div className="flex justify-between items-start relative z-10 px-2">
                                                          <div className="space-y-1 text-left">
                                                                          <p className="text-white/90 text-[11px] font-bold tracking-widest uppercase">แพลตฟอร์มตลาดแรงงานชุมชน</p>
                                                                          <h1 className="text-white text-2xl font-black drop-shadow-md tracking-tight flex items-center gap-2">🌟 จงเจริญ</h1>
                                                          </div>
                                                          <div className="flex gap-2">
                                                                          <button className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white relative shadow-sm border border-white/30">🔔</button>
                                                                          <button onClick={() => router.push('/profile')} className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white relative shadow-sm border border-white/30">👤</button>
                                                          </div>
                                            </div>
                                            <div className="mt-6 px-2 relative z-10">
                                                          <div className="bg-white rounded-2xl p-1.5 flex items-center shadow-lg shadow-black/5">
                                                                          <div className="pl-3 pr-2 text-gray-400">🔍</div>
                                                                          <input type="text" placeholder="ค้นหาช่าง, วิน, หรืองานด่วน..." className="w-full bg-transparent text-sm py-2 outline-none font-medium placeholder:text-gray-400" />
                                                                          <button className="bg-[#EE4D2D] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm">ค้นหา</button>
                                                          </div>
                                            </div>
                                </div>
                                <main className="px-5 mt-2 relative z-20 space-y-6">
                                            <section className="grid grid-cols-2 gap-3">
                                                          <div onClick={() => router.push('/services')} className="bg-white rounded-[2rem] p-4 flex flex-col items-center text-center shadow-sm border border-gray-100 cursor-pointer active:scale-95 transition-transform">
                                                                          <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center text-3xl mb-3">🛠️</div>
                                                                          <h3 className="font-black text-gray-800 text-sm">หาช่าง / บริการ</h3>
                                                                          <p className="text-[9px] text-gray-500 mt-1 font-medium leading-tight px-1">ซ่อมแอร์ ท่อตัน แม่บ้าน งานเหมา</p>
                                                          </div>
                                                          <div onClick={() => router.push('/win-online')} className="bg-white rounded-[2rem] p-4 flex flex-col items-center text-center shadow-sm border border-gray-100 cursor-pointer active:scale-95 transition-transform">
                                                                          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-3xl mb-3">🛵</div>
                                                                          <h3 className="font-black text-gray-800 text-sm">งานด่วน / เรียกรถ</h3>
                                                                          <p className="text-[9px] text-gray-500 mt-1 font-medium leading-tight px-1">ส่งของ ซื้อข้าว เรียกรถ วินมอไซค์</p>
                                                          </div>
                                                          <div onClick={() => router.push('/job-board')} className="col-span-2 bg-gradient-to-r from-[#EE4D2D]/10 to-[#FF7337]/5 rounded-[2rem] p-4 flex items-center justify-between shadow-sm border border-[#EE4D2D]/20 cursor-pointer">
                                                                          <div className="flex items-center gap-4">
                                                                                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm text-[#EE4D2D]">📋</div>
                                                                                            <div>
                                                                                                                <h3 className="font-black text-gray-800 text-sm">บอร์ดประกาศหางาน</h3>
                                                                                                                <p className="text-[10px] text-gray-600 mt-0.5 font-medium">หางานประจำ พาร์ทไทม์ ในชุมชน</p>
                                                                                              </div>
                                                                          </div>
                                                                          <span className="text-[#EE4D2D] font-bold text-lg">›</span>
                                                          </div>
                                            </section>
                                            <section>
                                                          <div className="flex justify-between items-end mb-4 px-1">
                                                                          <h2 className="text-sm font-black text-gray-800 tracking-tight">📌 บริการยอดฮิต</h2>
                                                                          <button onClick={() => router.push('/services')} className="text-[10px] font-bold text-[#EE4D2D] bg-orange-50 px-3 py-1 rounded-full border border-orange-100">ดูทั้งหมด ›</button>
                                                          </div>
                                                          <div className="grid grid-cols-4 gap-3">
                                                            {isLoading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                                  <div key={i} className="bg-white rounded-[1.5rem] p-3 flex flex-col items-center gap-2 shadow-sm border border-gray-50 animate-pulse">
                                                                        <div className="w-12 h-12 bg-gray-200 rounded-2xl"></div>
                                                                        <div className="w-10 h-3 bg-gray-200 rounded-full mt-1"></div>
                                                  </div>
                                                ))
                          ) : (
                            categories.slice(0, 4).map((category) => (
                                                  <div key={category.id} onClick={() => router.push('/services')} className="bg-white rounded-[1.5rem] p-3 flex flex-col items-center gap-2 shadow-sm border border-gray-50 active:scale-95 transition-transform cursor-pointer">
                                                                        <div className={`w-12 h-12 ${category.color} rounded-2xl flex items-center justify-center text-2xl shadow-inner`}>{category.icon}</div>
                                                                        <span className="text-[10px] font-bold text-gray-700 whitespace-nowrap">{category.title}</span>
                                                  </div>
                                                ))
                          )}
                                                          </div>
                                            </section>
                                            <section>
                                                          <div className="flex justify-between items-end mb-4 px-1">
                                                                          <h2 className="text-sm font-black text-gray-800 tracking-tight">⚡ งานด่วนชุมชน</h2>
                                                                          <button onClick={() => router.push('/win-online')} className="text-[10px] font-bold text-[#EE4D2D] bg-orange-50 px-3 py-1 rounded-full border border-orange-100">รับงานด่วน ›</button>
                                                          </div>
                                                          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-[2rem] p-5 shadow-sm border border-orange-100/50 relative overflow-hidden">
                                                                          <h3 className="font-black text-gray-800 text-sm">เรียกรถ / ส่งของด่วน</h3>
                                                                          <p className="text-[10px] text-gray-600 mt-1 font-medium w-3/4">โพสต์ปุ๊บ วินหรือคนรับจ้างในพื้นที่เห็นปั๊บ พร้อมให้บริการทันที</p>
                                                                          <button onClick={() => router.push('/win-online')} className="mt-4 bg-[#EE4D2D] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-transform w-full sm:w-auto text-center">โพสต์งานด่วน 🚀</button>
                                                          </div>
                                            </section>
                                </main>
                      </div>
              </div>
        </div>
      );
}/div>

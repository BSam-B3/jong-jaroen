'use client';

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Service {
  id: string;
  title: string;
  category: string;
  cover_image_url: string | null;
  starting_price: number;
  rating: number;
  review_count: number;
  created_at: string;
  provider_id: string;
  provider_name: string | null;
  provider_avatar: string | null;
  provider_kyc_status: string | null;
}

const CATEGORIES = [
  { key: "all", label: "ทั้งหมด", icon: "✨" },
  { key: "เกษตรกรรม", label: "เกษตรกรรม/พ่นยา", icon: "🚜" },
  { key: "งานใช้แรง", label: "งานใช้แรง/ทำสวน", icon: "🌴" },
  { key: "ช่างชุมชน", label: "ช่างเฉพาะทางชุมชน", icon: "🔧" },
  { key: "ปศุสัตว์", label: "ดูแลปศุสัตว์", icon: "🐂" },
  { key: "ขนส่ง", label: "ขนส่งท้องถิ่น", icon: "🚚" },
  { key: "รับเหมา", label: "รับเหมา/ต่อเติม", icon: "🛠️" },
  { key: "แม่บ้าน", label: "แม่บ้าน/ทำความสะอาด", icon: "🧹" },
  { key: "อื่นๆ", label: "อื่นๆ / จิปาถะ", icon: "📌" },
];

function formatPrice(n: number): string {
  return Number(n).toLocaleString("th-TH");
}

// 🌟 สร้าง Component ย่อยเพื่อใช้งานร่วมกับ Suspense (กฎของ Next.js เวลามีการดึง URL Params)
function ServicesContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const category = searchParams.get("category") || "all";
  const search = searchParams.get("q") || "";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  
  const [localSearch, setLocalSearch] = useState(search);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  // 🌟 ปรับให้แสดง 16 งานต่อหน้า ตามที่บีสามต้องการค่ะ
  const itemsPerPage = 16;
  const scrollRef = useRef<HTMLDivElement>(null);

  // ดึงข้อมูลจากฐานข้อมูลทันทีเมื่อ Category หรือ Search เปลี่ยน
  useEffect(() => {
    const fetchServices = async () => {
      setIsFetching(true);
      const { data, error } = await supabase.rpc("get_active_services", {
        p_category: category === "all" ? null : category,
        p_search: search || null,
      });

      if (!error && data) {
        setAllServices(data as Service[]);
      } else {
        setAllServices([]);
      }
      setIsFetching(false);
    };

    fetchServices();
  }, [category, search, supabase]);

  // ซิงค์ค่าช่องค้นหากับ URL (เผื่อถูกเคลียร์)
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // ฟังก์ชันสร้าง URL
  const buildUrl = (cat: string, query: string, pageNum: number) => {
    const p = new URLSearchParams();
    if (cat !== 'all') p.set('category', cat);
    if (query) p.set('q', query);
    if (pageNum > 1) p.set('page', pageNum.toString());
    return `${pathname}?${p.toString()}`;
  };

  // กดยืนยันการค้นหา
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildUrl(category, localSearch, 1));
  };

  // ฟังก์ชันเลื่อนปุ่มหมวดหมู่ซ้ายขวา (สำหรับคอมพิวเตอร์)
  const scrollCategory = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  // คำนวณตัดแบ่งหน้า Pagination
  const totalPages = Math.max(1, Math.ceil(allServices.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const servicesToShow = allServices.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-24 selection:bg-orange-100">
      
      {/* 🟠 Header */}
      <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] pb-10 md:pb-16 rounded-b-[2.5rem] md:rounded-b-[4rem] relative z-20 shadow-md">
        <div className="max-w-5xl mx-auto px-5 pt-8 md:pt-12">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h1 className="text-white text-2xl md:text-3xl font-black tracking-tight">ค้นหาช่าง / บริการ</h1>
            <Link href="/jobs/create" className="bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white px-5 py-2.5 md:py-3 rounded-full text-xs md:text-sm font-black shadow-sm active:scale-95 transition-all flex items-center gap-2">
              <span>📝</span> โพสต์หาช่าง
            </Link>
          </div>

          <form onSubmit={handleSearchSubmit} className="relative bg-white rounded-2xl md:rounded-full p-1.5 md:p-2 flex items-center shadow-xl mb-6">
            <div className="pl-4 pr-2 text-gray-400 hidden md:block">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="ค้นหาชื่อช่าง, บริการ..."
              className="w-full bg-transparent text-sm md:text-base py-3 px-2 outline-none font-bold text-gray-800 placeholder:text-gray-400"
            />
            <button type="submit" className="bg-[#EE4D2D] text-white px-6 md:px-8 py-3 rounded-xl md:rounded-full text-xs md:text-sm font-black shadow-sm active:scale-95 transition-transform shrink-0">
              ค้นหา
            </button>
          </form>

          {/* หมวดหมู่ (ปัดซ้ายขวาได้ พร้อมปุ่ม < > สำหรับคอมพิวเตอร์) */}
          <div className="relative flex items-center group/slider">
            {/* ปุ่มเลื่อนซ้าย (ซ่อนในมือถือ) */}
            <button onClick={() => scrollCategory('left')} className="hidden md:flex absolute -left-4 z-30 w-10 h-10 items-center justify-center bg-white text-[#EE4D2D] rounded-full shadow-lg opacity-0 group-hover/slider:opacity-100 transition-opacity hover:bg-orange-50 hover:scale-110">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
            </button>

            <div ref={scrollRef} className="-mx-5 px-5 md:mx-0 md:px-0 overflow-x-auto scrollbar-hide w-full scroll-smooth">
              <div className="flex gap-2.5 w-max pb-2">
                {CATEGORIES.map((c) => {
                  const active = category === c.key;
                  // กดปุ๊บ เคลียร์ช่องค้นหาด้วย (ส่ง query ว่าง)
                  const href = buildUrl(c.key, "", 1); 
                  return (
                    <Link
                      key={c.key}
                      href={href}
                      className={`shrink-0 flex items-center gap-2 px-4 py-2.5 md:py-3 rounded-full text-xs md:text-sm font-black transition-all shadow-sm border ${
                        active ? "bg-white text-[#EE4D2D] border-white" : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                      }`}
                    >
                      <span className="text-base md:text-lg">{c.icon}</span>
                      {c.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* ปุ่มเลื่อนขวา (ซ่อนในมือถือ) */}
            <button onClick={() => scrollCategory('right')} className="hidden md:flex absolute -right-4 z-30 w-10 h-10 items-center justify-center bg-white text-[#EE4D2D] rounded-full shadow-lg opacity-0 group-hover/slider:opacity-100 transition-opacity hover:bg-orange-50 hover:scale-110">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-5 pt-6 relative z-10">
        <div className="mb-4 flex justify-between items-end">
          <p className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider">
            พบ <span className="text-[#EE4D2D] text-sm md:text-base font-black">{allServices.length}</span> บริการ
            {search && (<span> สำหรับ "<span className="text-[#EE4D2D] font-black">{search}</span>"</span>)}
          </p>
          {allServices.length > 0 && (
            <span className="text-[10px] md:text-xs font-bold text-slate-400 bg-white px-3 py-1 rounded-full shadow-sm">
              หน้า {currentPage} / {totalPages}
            </span>
          )}
        </div>

        {/* แสดง Skeleton ตอนกำลังโหลด (เปลี่ยนหมวดหมู่) */}
        {isFetching ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm h-[260px] md:h-[300px] animate-pulse flex flex-col overflow-hidden">
                <div className="w-full aspect-[4/3] bg-slate-200"></div>
                <div className="p-4 flex-1 flex flex-col"><div className="w-full h-4 bg-slate-200 rounded-full mb-3"></div><div className="w-2/3 h-4 bg-slate-200 rounded-full"></div></div>
              </div>
            ))}
          </div>
        ) : allServices.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm mt-2">
            <div className="text-6xl mb-4 grayscale opacity-40">🛍️</div>
            <p className="text-lg font-black text-slate-800">ยังไม่มีแพ็กเกจบริการในหมวดนี้</p>
            <p className="text-sm font-bold text-slate-400 mt-2">ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่นดูนะคะ</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
            {servicesToShow.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        )}

        {/* ระบบแบ่งหน้า (Pagination UI) */}
        {!isFetching && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10 mb-6">
            <Link
              href={buildUrl(category, search, currentPage - 1)}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-black shadow-sm transition-all ${currentPage <= 1 ? 'bg-gray-100 text-gray-400 pointer-events-none' : 'bg-white text-[#EE4D2D] hover:bg-orange-50 border border-orange-100'}`}
            >
              ก่อนหน้า
            </Link>

            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide max-w-[200px] md:max-w-none px-1 py-1">
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                return (
                  <Link
                    key={p}
                    href={buildUrl(category, search, p)}
                    className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-sm font-black shadow-sm transition-all ${currentPage === p ? 'bg-[#EE4D2D] text-white shadow-orange-200 scale-110' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'}`}
                  >
                    {p}
                  </Link>
                );
              })}
            </div>

            <Link
              href={buildUrl(category, search, currentPage + 1)}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-black shadow-sm transition-all ${currentPage >= totalPages ? 'bg-gray-100 text-gray-400 pointer-events-none' : 'bg-white text-[#EE4D2D] hover:bg-orange-50 border border-orange-100'}`}
            >
              ถัดไป
            </Link>
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}

// ห่อด้วย Suspense เพื่อป้องกันปัญหา Build Error ใน Next.js
export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-bold text-gray-400">กำลังเตรียมหน้าร้านค้า...</div>}>
      <ServicesContent />
    </Suspense>
  );
}

function ServiceCard({ service }: { service: Service }) {
  const isVerified = service.provider_kyc_status === "approved";

  return (
    <Link href={`/services/${service.id}`} className="flex flex-col bg-white rounded-[1.5rem] overflow-hidden border border-slate-100 shadow-sm hover:border-[#EE4D2D]/30 hover:shadow-lg transition-all active:scale-[0.98] group">
      <div className="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden">
        {service.cover_image_url ? (
          <img src={service.cover_image_url} alt={service.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-slate-100 text-slate-300">🛠️</div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-slate-50">
            {service.provider_avatar ? (
              <img src={service.provider_avatar} alt="Provider" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-slate-500">
                {service.provider_name?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
          </div>
          <span className="text-[10px] md:text-xs font-bold text-slate-500 truncate flex-1">{service.provider_name || "ไม่ระบุชื่อช่าง"}</span>
          {isVerified && (
            <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center shadow-sm shrink-0">
              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={4} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </span>
          )}
        </div>
        <h3 className="text-xs md:text-sm font-black text-slate-800 line-clamp-2 leading-relaxed min-h-[36px] md:min-h-[42px] mb-2 group-hover:text-[#EE4D2D] transition-colors">
          {service.title}
        </h3>
        <div className="flex items-center gap-1 mb-3 mt-auto pt-2">
          <span className="text-yellow-400 text-xs md:text-sm">⭐</span>
          <span className="text-[11px] md:text-xs font-black text-slate-700">{Number(service.rating || 0).toFixed(1)}</span>
          <span className="text-[10px] md:text-[11px] font-bold text-slate-400">({service.review_count || 0})</span>
        </div>
        <div className="pt-3 border-t border-slate-50 flex flex-col">
          <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">เริ่มต้นที่</span>
          <div className="flex items-baseline gap-1">
            <span className="text-base md:text-lg font-black text-[#EE4D2D]">{formatPrice(service.starting_price)}</span>
            <span className="text-[10px] md:text-xs font-black text-[#EE4D2D]">บาท</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

import Link from "next/link";
import { sbServer } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

interface PageProps {
  searchParams: Promise<{ category?: string; q?: string }>;
}

// 🌟 อัปเดตหมวดหมู่ใหม่ สไตล์ตลาดแรงงานชุมชน
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

export default async function ServicesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const category = params.category || "all";
  const search = params.q || "";

  const supabase = sbServer();

  // ดึงข้อมูลบริการทั้งหมด
  const { data, error } = await supabase.rpc("get_active_services", {
    p_category: category === "all" ? null : category,
    p_search: search || null,
  });

  if (error) console.error("[services] rpc failed:", error.message);
  const services: Service[] = error ? [] : ((data ?? []) as Service[]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-24 selection:bg-orange-100">
      
      {/* 🟠 Header - ขยายให้กว้างและรองรับจอคอม */}
      <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] pb-10 md:pb-16 rounded-b-[2.5rem] md:rounded-b-[4rem] relative z-20 shadow-md">
        <div className="max-w-5xl mx-auto px-5 pt-8 md:pt-12">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h1 className="text-white text-2xl md:text-3xl font-black tracking-tight">ค้นหาช่าง / บริการ</h1>
            
            <Link
              href="/jobs/create"
              className="bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white px-5 py-2.5 md:py-3 rounded-full text-xs md:text-sm font-black shadow-sm active:scale-95 transition-all flex items-center gap-2"
            >
              <span>📝</span> โพสต์หาช่าง
            </Link>
          </div>

          <form action="/services" method="GET" className="relative bg-white rounded-2xl md:rounded-full p-1.5 md:p-2 flex items-center shadow-xl mb-6">
            {category !== "all" && <input type="hidden" name="category" value={category} />}
            <div className="pl-4 pr-2 text-gray-400 hidden md:block">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              key={category} // 🌟 บังคับรีเซ็ตช่องเสิร์ชเมื่อหมวดหมู่เปลี่ยน
              name="q"
              defaultValue={search}
              placeholder="ค้นหาชื่อช่าง, บริการ..."
              className="w-full bg-transparent text-sm md:text-base py-3 px-2 outline-none font-bold text-gray-800 placeholder:text-gray-400"
            />
            <button type="submit" className="bg-[#EE4D2D] text-white px-6 md:px-8 py-3 rounded-xl md:rounded-full text-xs md:text-sm font-black shadow-sm active:scale-95 transition-transform shrink-0">
              ค้นหา
            </button>
          </form>

          {/* หมวดหมู่ (ปัดซ้ายขวาได้) */}
          <div className="-mx-5 px-5 md:mx-0 md:px-0 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2.5 w-max pb-2">
              {CATEGORIES.map((c) => {
                const active = category === c.key;
                // 🌟 ลบการส่งค่า `q` ไปด้วย เพื่อให้กดหมวดหมู่แล้วล้างผลค้นหาเดิม
                const href = c.key === "all" ? "/services" : `/services?category=${encodeURIComponent(c.key)}`;
                return (
                  <Link
                    key={c.key}
                    href={href}
                    scroll={false}
                    className={`shrink-0 flex items-center gap-2 px-4 py-2.5 md:py-3 rounded-full text-xs md:text-sm font-black transition-all shadow-sm border ${
                      active
                        ? "bg-white text-[#EE4D2D] border-white"
                        : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                    }`}
                  >
                    <span className="text-base md:text-lg">{c.icon}</span>
                    {c.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 📋 Main Content - จำกัดความกว้างให้ตรงกลาง */}
      <main className="max-w-5xl mx-auto px-5 pt-6 relative z-10">
        <div className="mb-4">
          <p className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider">
            พบ <span className="text-[#EE4D2D] text-sm md:text-base font-black">{services.length}</span> บริการที่พร้อมดูแลคุณ
            {search && (<span> สำหรับ "<span className="text-[#EE4D2D] font-black">{search}</span>"</span>)}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold text-center border border-red-100 mb-4">เกิดข้อผิดพลาดในการดึงข้อมูล</div>
        )}

        {!error && services.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm mt-2">
            <div className="text-6xl mb-4 grayscale opacity-40">🛍️</div>
            <p className="text-lg font-black text-slate-800">ยังไม่มีแพ็กเกจบริการในหมวดนี้</p>
            <p className="text-sm font-bold text-slate-400 mt-2">ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่นดูนะคะ</p>
          </div>
        )}

        {/* 🌟 Grid Responsive: มือถือ=2 ช่อง, แท็บเล็ต=3 ช่อง, คอมพิวเตอร์=4 ช่อง */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
          {services.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}

function ServiceCard({ service }: { service: Service }) {
  const isVerified = service.provider_kyc_status === "approved";

  return (
    <Link
      href={`/services/${service.id}`}
      className="flex flex-col bg-white rounded-[1.5rem] overflow-hidden border border-slate-100 shadow-sm hover:border-[#EE4D2D]/30 hover:shadow-lg transition-all active:scale-[0.98] group"
    >
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
              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={4} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
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

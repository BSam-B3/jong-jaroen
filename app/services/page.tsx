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

const CATEGORIES = [
  { key: "all", label: "ทั้งหมด", icon: "✨" },
  { key: "แม่บ้าน", label: "ทำความสะอาด", icon: "🧹" },
  { key: "ช่างแอร์", label: "ช่างแอร์", icon: "❄️" },
  { key: "ช่างซ่อม", label: "ช่างไฟ/ประปา", icon: "🔧" },
  { key: "ขนย้าย", label: "รับจ้างขนย้าย", icon: "🚚" },
  { key: "วินส่งของ", label: "วิน/ส่งของ", icon: "🛵" },
  { key: "ทำสวน", label: "ดูแลสวน", icon: "🌿" },
  { key: "เอกสาร", label: "ทำเว็บ/กราฟิก", icon: "💻" },
  { key: "อื่นๆ", label: "จิปาถะ", icon: "📌" },
];

function formatPrice(n: number): string {
  return Number(n).toLocaleString("th-TH");
}

export default async function ServicesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const category = params.category || "all";
  const search = params.q || "";

  const supabase = sbServer();
  const { data, error } = await supabase.rpc("get_active_services", {
    p_category: category === "all" ? null : category,
    p_search: search || null,
  });

  if (error) console.error("[services] rpc failed:", error.message);
  const services: Service[] = error ? [] : ((data ?? []) as Service[]);

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center pb-24 font-sans">
      <div className="w-full sm:max-w-3xl bg-white min-h-screen relative flex flex-col shadow-xl overflow-x-hidden">
        
        {/* 🌟 Header Search & Filters (สไตล์ Marketplace) */}
        <div className="bg-white px-4 pt-8 pb-3 sticky top-0 z-30 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">เลือกจ้างฟรีแลนซ์ / ช่าง</h1>
          </div>

          <form action="/services" method="GET" className="relative bg-gray-100 rounded-xl p-1 flex items-center mb-4 border border-gray-200 focus-within:border-[#EE4D2D] focus-within:bg-white transition-colors">
            {category !== "all" && <input type="hidden" name="category" value={category} />}
            <div className="pl-3 pr-2 text-gray-400">🔍</div>
            <input
              name="q"
              defaultValue={search}
              placeholder="ค้นหาบริการ, ช่าง, แพ็กเกจ..."
              className="w-full bg-transparent text-sm py-2.5 outline-none font-bold placeholder:text-gray-400 text-gray-800"
            />
            <button type="submit" className="bg-[#EE4D2D] text-white px-4 py-2 rounded-lg text-xs font-black shadow-sm">ค้นหา</button>
          </form>

          {/* Categories Horizontal Scroll */}
          <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 w-max pb-2">
              {CATEGORIES.map((c) => {
                const active = category === c.key;
                const href = c.key === "all"
                    ? search ? `/services?q=${encodeURIComponent(search)}` : "/services"
                    : `/services?category=${encodeURIComponent(c.key)}${search ? `&q=${encodeURIComponent(search)}` : ""}`;
                return (
                  <Link
                    key={c.key}
                    href={href}
                    scroll={false}
                    className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-bold transition-all border ${
                      active
                        ? "bg-[#EE4D2D] text-white border-[#EE4D2D] shadow-md"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <span>{c.icon}</span>
                    {c.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* 🌟 Result Count & Sorting */}
        <div className="px-5 py-4 bg-gray-50 flex justify-between items-center border-b border-gray-100">
          <p className="text-xs font-bold text-gray-500">
            พบ <span className="text-gray-900">{services.length}</span> บริการ
            {search && (<span> สำหรับ "<span className="text-[#EE4D2D]">{search}</span>"</span>)}
          </p>
          <div className="text-[11px] font-bold text-gray-500 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-gray-200 cursor-pointer">
            <span>เรียงตาม: แนะนำ</span> <span>▼</span>
          </div>
        </div>

        <main className="px-4 py-5 bg-gray-50 flex-1">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold text-center border border-red-100">เกิดข้อผิดพลาดในการดึงข้อมูล</div>
          )}

          {!error && services.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
              <div className="text-6xl mb-4 grayscale opacity-40">🛍️</div>
              <p className="text-lg font-black text-gray-800">ยังไม่มีแพ็กเกจบริการในหมวดนี้</p>
              <p className="text-sm font-bold text-gray-400 mt-1">ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่นดูนะคะ</p>
            </div>
          )}

          {/* 🌟 Service Cards Grid (สไตล์ Fastwork) */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {services.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}

// 🌟 Component การ์ดบริการ (Fastwork Style)
function ServiceCard({ service }: { service: Service }) {
  const isVerified = service.provider_kyc_status === "approved";

  return (
    <Link
      href={`/services/${service.id}`}
      className="flex flex-col bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md hover:border-[#EE4D2D]/40 transition-all duration-200 group"
    >
      {/* 1. Header: ข้อมูลช่าง (อยู่บนรูป) */}
      <div className="p-2.5 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0 relative">
          {service.provider_avatar ? (
            <img src={service.provider_avatar} alt="Provider" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-gray-500">
              {service.provider_name?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
          {isVerified && (
            <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 rounded-full w-2.5 h-2.5 border border-white"></div>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-black text-gray-800 truncate max-w-[100px] sm:max-w-[140px]">
            {service.provider_name || "ไม่ระบุชื่อ"}
          </span>
          <span className="text-[8px] font-bold text-emerald-600">ตอบกลับไวมาก</span>
        </div>
      </div>

      {/* 2. รูปผลงาน / หน้าปกบริการ */}
      <div className="relative w-full aspect-video bg-gray-100 overflow-hidden">
        {service.cover_image_url ? (
          <img src={service.cover_image_url} alt={service.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl bg-gray-50 text-gray-300">🛠️</div>
        )}
        {/* ป้าย Category เล็กๆ บนรูป */}
        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[8px] font-bold px-2 py-0.5 rounded-sm">
          {service.category}
        </div>
      </div>

      {/* 3. เนื้อหาการ์ด */}
      <div className="p-3 flex flex-col flex-1">
        {/* ชื่องาน */}
        <h3 className="text-[12px] font-bold text-gray-900 line-clamp-2 leading-snug mb-2 min-h-[34px] group-hover:text-[#EE4D2D] transition-colors">
          {service.title}
        </h3>

        {/* เรตติ้ง */}
        <div className="flex items-center gap-1 mb-3">
          <span className="text-amber-400 text-xs">★</span>
          <span className="text-[11px] font-black text-gray-700">{Number(service.rating || 0).toFixed(1)}</span>
          <span className="text-[10px] font-medium text-gray-400">({service.review_count || 0})</span>
        </div>

        {/* ราคา */}
        <div className="mt-auto pt-2 border-t border-gray-100 flex flex-col items-end">
          <span className="text-[9px] font-bold text-gray-400">เริ่มต้น</span>
          <span className="text-sm font-black text-[#EE4D2D]">฿{formatPrice(service.starting_price)}</span>
        </div>
      </div>
    </Link>
  );
}

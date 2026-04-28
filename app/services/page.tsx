import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

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

// หมวดหมู่อาชีพใหม่สไตล์ Fastwork ชุมชน (Emoji ครบถ้วน)
const CATEGORIES = [
  { key: "all", label: "ทั้งหมด", icon: "✨" },
  { key: "แม่บ้าน", label: "แม่บ้าน/ทำความสะอาด", icon: "🧹" },
  { key: "ช่างแอร์", label: "ช่างล้างแอร์", icon: "❄️" },
  { key: "ช่างซ่อม", label: "ช่างไฟ/ประปา", icon: "🔧" },
  { key: "ขนย้าย", label: "รับจ้างขนย้าย", icon: "🚚" },
  { key: "วินส่งของ", label: "วิน/ส่งของ", icon: "🛵" },
  { key: "ทำสวน", label: "ดูแลสวน/ตัดหญ้า", icon: "🌿" },
  { key: "ผู้สูงอายุ", label: "ดูแลผู้สูงอายุ/เด็ก", icon: "👵" },
  { key: "นวด", label: "นวดแผนไทย", icon: "💆‍♀️" },
  { key: "ทำอาหาร", label: "ทำอาหาร/จัดเลี้ยง", icon: "🍳" },
  { key: "เอกสาร", label: "เอกสาร/แอดมิน", icon: "💻" },
];

function formatPrice(n: number): string {
  return Number(n).toLocaleString("th-TH");
}

export default async function ServicesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const category = params.category || "all";
  const search = params.q || "";

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_active_services", {
    p_category: category === "all" ? null : category,
    p_search: search || null,
  });

  const services: Service[] = (data || []) as Service[];

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center pb-24 font-sans">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-x-hidden">
        
        {/* 🟠 Header (ธีมส้มแดง จงเจริญ) */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-100 shadow-sm">
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">ค้นหาช่าง / บริการ</h1>
              <Link
                href="/notifications"
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition"
              >
                <span className="text-xl">🔔</span>
              </Link>
            </div>

            {/* ช่องค้นหาสไตล์พรีเมียม */}
            <form action="/services" method="GET" className="relative">
              {category !== "all" && <input type="hidden" name="category" value={category} />}
              <input
                name="q"
                defaultValue={search}
                placeholder="ค้นหาช่าง หรือ บริการ..."
                className="w-full pl-12 pr-4 py-3.5 bg-slate-100 rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]/30 focus:bg-white border border-transparent focus:border-[#EE4D2D]/30 transition-all shadow-inner"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-50">🔍</span>
            </form>
          </div>

          {/* 🔘 Categories Pills แบบเลื่อนได้ */}
          <div className="overflow-x-auto scrollbar-hide border-t border-slate-50">
            <div className="flex gap-2 px-4 py-3 w-max">
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
                    className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-black transition-all shadow-sm ${
                      active
                        ? "bg-[#EE4D2D] text-white shadow-orange-500/30"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-base">{c.icon}</span>
                    {c.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </header>

        {/* จำนวนผลลัพธ์ */}
        <div className="px-5 pt-4 pb-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            พบ <span className="text-[#EE4D2D]">{services.length}</span> บริการที่พร้อมดูแลคุณ
          </p>
        </div>

        {/* 🛍️ Grid รายการบริการ (2 คอลัมน์แบบ Fastwork) */}
        <main className="px-4 py-3">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold text-center border border-red-100">เกิดข้อผิดพลาดในการดึงข้อมูล</div>
          )}

          {!error && services.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🤷‍♂️</div>
              <p className="text-xl font-black text-slate-800">ยังไม่มีช่างในหมวดนี้</p>
              <p className="text-sm font-bold text-slate-400 mt-2">ลองเลือกหมวดหมู่อื่นดูนะคะ</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {services.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        </main>

        {/* ✅ Bottom Navigation (คืนชีพเมนู Emoji สีส้มแดงที่ถูกต้อง!) */}
        <div className="fixed bottom-0 w-full sm:max-w-2xl md:max-w-3xl bg-white/95 backdrop-blur-md border-t border-gray-100 px-1 py-4 flex justify-between items-center shadow-[0_-4px_25px_rgba(0,0,0,

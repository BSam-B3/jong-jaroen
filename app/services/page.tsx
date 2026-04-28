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

// หมวดหมู่อาชีพใหม่สไตล์ชุมชน (Emoji ครบถ้วน)
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
    <div className="min-h-screen bg-gray-100 flex justify-center pb-24 font-sans">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-x-hidden">
        
        {/* 🟠 Header (คืนชีพสีส้มไล่สีสุดพรีเมียมจากโค้ดเก่าของบีสาม) */}
        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-[2.5rem] p-6 pt-8 shadow-md relative z-20 m-3 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-white text-2xl font-black tracking-tight">ค้นหาช่าง / บริการ</h1>
            <Link
              href="/notifications"
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm hover:bg-white/30 transition"
              aria-label="แจ้งเตือน"
            >
              <span className="text-xl">🔔</span>
            </Link>
          </div>

          {/* ช่องค้นหาสไตล์โค้ดเก่าที่บีสามชอบ */}
          <form action="/services" method="GET" className="relative bg-white rounded-2xl p-1.5 flex items-center shadow-lg shadow-black/5 mb-4">
            {category !== "all" && <input type="hidden" name="category" value={category} />}
            <div className="pl-3 pr-2 text-gray-400">🔍</div>
            <input
              name="q"
              defaultValue={search}
              placeholder="ค้นหาชื่อช่าง, บริการ..."
              className="w-full bg-transparent text-sm py-2 outline-none font-medium placeholder:text-gray-400 text-gray-800"
            />
          </form>

          {/* 🔘 Categories Pills แบบเลื่อนได้ (ปรับให้เข้ากับพื้นหลังสีส้ม) */}
          <div className="-mx-6 px-6 overflow-x-auto scrollbar-hide">
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
                    className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-black transition-all shadow-sm ${
                      active
                        ? "bg-white text-[#EE4D2D]"
                        : "bg-white/20 text-white border border-white/30 hover:bg-white/30"
                    }`}
                  >
                    <span className="text-base">{c.icon}</span>
                    {c.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* จำนวนผลลัพธ์ */}
        <div className="px-6 pt-2 pb-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            พบ <span className="text-[#EE4D2D]">{services.length}</span> บริการที่พร้อมดูแลคุณ
            {search && (<span> สำหรับ "<span className="text-[#EE4D2D] font-bold">{search}</span>"</span>)}
          </p>
        </div>

        {/* 🛍️ Grid รายการบริการ (2 คอลัมน์) */}
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

        {/* ✅ Bottom Navigation (คืนชีพเมนู Emoji 6 อัน สีส้มแดง) */}
        <div className="fixed bottom-0 w-full sm:max-w-2xl md:max-w-3xl bg-white/95 backdrop-blur-md border-t border-gray-100 px-1 py-4 flex justify-between items-center shadow-[0_-4px_25px_rgba(0,0,0,0.06)] rounded-t-[2.5rem] z-50">
          <NavItem icon="🏠" label="หน้าหลัก" active={false} href="/" />
          <NavItem icon="🛠️" label="บริการ" active={true} href="/services" />
          <NavItem icon="📋" label="งานด่วน" active={false} href="/job-board" />
          <NavItem icon="📰" label="ข่าวสาร" active={false} href="/news" />
          <NavItem icon="🎟️" label="ปองเจริญ" active={false} href="/coupons" />
          <NavItem icon="👤" label="ฉัน" active={false} href="/profile" />
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}

// ---------------- Components ---------------- //

function ServiceCard({ service }: { service: Service }) {
  const isVerified = service.provider_kyc_status === "approved";

  return (
    <Link
      href={`/services/${service.id}`}
      className="flex flex-col bg-white rounded-[1.5rem] overflow-hidden border border-slate-100 shadow-sm hover:border-[#EE4D2D]/30 hover:shadow-md transition-all active:scale-[0.98] group"
    >
      {/* Cover Image (4:3) */}
      <div className="relative w-full aspect-[4/3] bg-slate-200 overflow-hidden">
        {service.cover_image_url ? (
          <img src={service.cover_image_url} alt={service.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-slate-100 text-slate-300">🛠️</div>
        )}
      </div>

      <div className="p-3.5 flex flex-col flex-1">
        {/* Provider Row */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-slate-50">
            {service.provider_avatar ? (
              <img src={service.provider_avatar} alt="Provider" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[8px] font-black text-slate-500">
                {service.provider_name?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
          </div>
          <span className="text-[10px] font-bold text-slate-500 truncate flex-1">{service.provider_name || "ไม่ระบุชื่อช่าง"}</span>
          {isVerified && (
            <span className="w-3.5 h-3.5 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={4} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-[13px] font-black text-slate-800 line-clamp-2 leading-relaxed min-h-[38px] mb-2">
          {service.title}
        </h3>

        {/* Rating Row */}
        <div className="flex items-center gap-1 mb-3">
          <span className="text-yellow-400 text-xs">⭐</span>
          <span className="text-[11px] font-black text-slate-700">{Number(service.rating || 0).toFixed(1)}</span>
          <span className="text-[10px] font-bold text-slate-400">({service.review_count || 0})</span>
        </div>

        {/* Price Row */}
        <div className="mt-auto pt-2.5 border-t border-slate-50 flex flex-col">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">เริ่มต้นที่</span>
          <div className="flex items-baseline gap-0.5">
            <span className="text-sm font-black text-[#EE4D2D]">{formatPrice(service.starting_price)}</span>
            <span className="text-[10px] font-black text-[#EE4D2D]">บาท</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function NavItem({ icon, label, active, href }: { icon: string, label: string, active: boolean, href: string }) {
  return (
    <Link href={href} className={`flex flex-col items-center gap-1.5 cursor-pointer transition-all ${active ? 'scale-110' : 'opacity-40 hover:opacity-100'} flex-1`}>
      <span className="text-[22px]">{icon}</span>
      <span className={`text-[9px] font-bold ${active ? 'text-[#EE4D2D]' : 'text-gray-500'} whitespace-nowrap`}>{label}</span>
      {active && <div className="w-1.5 h-1.5 bg-[#EE4D2D] rounded-full shadow-sm mt-0.5"></div>}
    </Link>
  );
}

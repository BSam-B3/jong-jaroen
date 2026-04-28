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
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center pb-24 font-sans rounded-t-[2.5rem]">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-x-hidden">
        
        {/* Header with Search */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-100 shadow-sm">
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">ค้นหาช่าง / บริการชุมชน</h1>
              <Link
                href="/notifications"
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition"
                aria-label="แจ้งเตือน"
              >
                <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </Link>
            </div>

            {/* ช่องค้นหาสไตล์พรีเมียม */}
            <form action="/services" method="GET" className="relative">
              {category !== "all" && <input type="hidden" name="category" value={category} />}
              <input
                name="q"
                defaultValue={search}
                placeholder="ค้นหาชื่อช่าง, บริการ..."
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
            พบ <span className="text-[#EE4D2D] font-bold">{services.length}</span> บริการที่พร้อมดูแลคุณ
            {search && (<span> สำหรับ "<span className="text-[#EE4D2D] font-bold">{search}</span>"</span>)}
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
              <p className="text-xl font-black text-slate-800">ไม่พบบริการที่ค้นหา</p>
              <p className="text-sm font-bold text-slate-400 mt-2">ลองเลือกหมวดหมู่อื่นดูนะคะ</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pb-20">
            {services.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        </main>

        {/* ✅ Bottom Navigation */}
        <nav className="fixed bottom-0 inset-x-0 z-30">
          <div className="max-w-md mx-auto bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] grid grid-cols-5 rounded-t-[2.5rem]">
              <NavItem icon="🏠" label="หน้าหลัก" active={false} href="/" />
              <NavItem icon="🛠️" label="บริการ" active={true} href="/services" />
              <NavItem icon="🛵" label="เรียกวิน" active={false} href="/job-board" />
              <NavItem icon="🎁" label="ลุ้นโชค" active={false} href="/coupons" />
              <NavItem icon="📋" label="งานของฉัน" active={false} href="/my-jobs" />
              <NavItem icon="👤" label="บัญชี" active={false} href="/profile" />
          </div>
          <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
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
      className="flex flex-col bg-white rounded-[1.5rem] overflow-hidden border border-slate-100 shadow-sm hover:border-orange-300 hover:shadow-md transition-all active:scale-[0.98] group"
    >
      {/* Cover Image (อัตราส่วน 4:3) */}
      <div className="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden">
        {service.cover_image_url ? (
          <img src={service.cover_image_url} alt={service.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-slate-50 text-slate-300">🛠️</div>
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
            <span title="ยืนยันตัวตนแล้ว" className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-green-500 shrink-0 shadow-sm">
              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-[13px] font-black text-slate-800 line-clamp-2 leading-relaxed min-h-[38px] mb-2 flex-1">
          {service.title}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 text-[10px] mb-2">
          <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.539 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="font-black text-slate-700">{Number(service.rating || 0).toFixed(1)}</span>
          <span className="font-medium text-slate-400">({service.review_count || 0})</span>
        </div>

        {/* Price Row */}
        <div className="mt-auto pt-2.5 border-t border-slate-100 flex flex-col">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">เริ่มต้นที่</span>
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
    <Link href={href} className={`flex flex-col items-center gap-1.5 cursor-pointer transition-all ${active ? 'scale-110' : 'opacity-40 hover:opacity-100'} flex-1 py-3`}>
      <span className="text-[22px]">{icon}</span>
      <span className={`text-[9px] font-bold ${active ? 'text-[#EE4D2D]' : 'text-gray-500'} whitespace-nowrap`}>{label}</span>
      {active && <div className="w-1.5 h-1.5 bg-[#EE4D2D] rounded-full shadow-sm mt-0.5"></div>}
    </Link>
  );
}

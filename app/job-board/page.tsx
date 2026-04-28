import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  location: string;
  status: string;
  is_urgent: boolean;
  created_at: string;
  employer_id: string;
  employer_name: string | null;
  employer_avatar: string | null;
}

interface PageProps {
  searchParams: Promise<{ filter?: "all" | "urgent" | "service" }>;
}

const FILTERS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "urgent", label: "ด่วนมาก" },
  { key: "service", label: "งานบริการ" },
] as const;

// ฟังก์ชันแปลงเวลา
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "เมื่อสักครู่";
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ชม.ที่แล้ว`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} วันที่แล้ว`;
  return new Date(dateStr).toLocaleDateString("th-TH");
}

// ฟังก์ชันจัดรูปแบบเงินบาท
function formatBudget(n: number): string {
  if (!n) return "เสนอราคา";
  return `${Number(n).toLocaleString("th-TH")} บาท`;
}

// ฟังก์ชันเลือกไอคอนตามหมวดหมู่
function getCategoryIcon(category: string) {
  const icons: any = {
    urgent: '🥡', ac: '❄️', cleaning: '🧹', 
    ride: '🛵', delivery: '📦', repair: '⚡'
  };
  return icons[category] || '✨';
}

export default async function JobBoardPage({ searchParams }: PageProps) {
  const { filter = "all" } = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_open_jobs");

  const jobs: Job[] = (data || []) as Job[];
  const filtered =
    filter === "urgent"
      ? jobs.filter((j) => j.is_urgent)
      : filter === "service"
      ? jobs.filter((j) => !j.is_urgent)
      : jobs;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pb-24 font-sans">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-x-hidden">
        
        {/* ส่วนเนื้อหาที่ Scroll ได้ */}
        <div className="flex-1 overflow-y-auto pb-6 scrollbar-hide">
          
          {/* 🔵 Header (การ์ดลอย โทนสีฟ้า สำหรับโหมดคนทำงาน) */}
          <div className="bg-gradient-to-b from-[#0082FA] to-[#00A3FF] rounded-[2.5rem] pt-8 pb-6 px-6 shadow-md relative z-10 m-3 mt-4 overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <Link href="/" className="text-white font-bold text-lg active:scale-90 transition-transform">←</Link>
                <h1 className="text-xl font-black text-white tracking-tight">กระดานหางาน</h1>
              </div>
              <div className="bg-white/20 px-3 py-1 rounded-full border border-white/30 backdrop-blur-sm">
                <span className="text-white text-[10px] font-bold flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div> พร้อมรับงาน
                </span>
              </div>
            </div>
            
            <p className="text-white/90 text-xs font-medium pl-8 relative z-10 mb-2">
              {filtered.length} งานที่เปิดรับในพื้นที่ของคุณ
            </p>

            {/* 🔘 Filter Tabs */}
            <div className="mt-4 flex gap-2 pl-2 relative z-10">
              {FILTERS.map((f) => {
                const active = filter === f.key;
                return (
                  <Link
                    key={f.key}
                    href={f.key === "all" ? "/job-board" : `/job-board?filter=${f.key}`}
                    scroll={false}
                    className={`px-5 py-2 rounded-full text-[11px] font-bold transition-all shadow-sm ${
                      active
                        ? "bg-white text-[#0082FA]"
                        : "bg-white/20 text-white border border-white/30 hover:bg-white/30"
                    }`}
                  >
                    {f.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* 📋 รายการงาน */}
          <main className="px-5 mt-2 relative z-20 space-y-4">
            <div className="flex justify-between items-end mb-2 px-1">
              <h2 className="text-xs font-black text-gray-800 flex items-center gap-2">
                <span className="text-[#0082FA] text-base">📍</span> งานที่เปิดรับอยู่ตอนนี้
              </h2>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold text-center border border-red-100">
                เกิดข้อผิดพลาดในการโหลดข้อมูล
              </div>
            )}

            {!error && filtered.length === 0 && (
              <div className="text-center py-10 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <div className="text-4xl mb-2 opacity-50">📭</div>
                <p className="font-bold text-gray-500 text-sm">ยังไม่มีงานในหมวดหมู่นี้</p>
              </div>
            )}

            <div className="space-y-4">
              {filtered.map((job) => (
                <Link
                  href={`/jobs/${job.id}`}
                  key={job.id}
                  className="block bg-white rounded-3xl p-5 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md hover:border-[#0082FA]/30 transition-all active:scale-[0.98]"
                >
                  {/* 🔴 ป้ายกำกับความด่วน */}
                  {job.is_urgent ? (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-[#FF4B2B] to-[#FF416C] text-white text-[9px] font-black px-4 py-1.5 rounded-bl-2xl shadow-sm z-10 flex items-center gap-1">
                      <span className="animate-pulse">🔥</span> ด่วนมาก
                    </div>
                  ) : (
                    <div className="absolute top-0 right-0 bg-blue-50 text-blue-600 text-[9px] font-black px-4 py-1.5 rounded-bl-2xl border-b border-l border-blue-100 z-10">
                      งานบริการ
                    </div>
                  )}

                  {/* ข้อมูลลูกค้าและประเภทงาน */}
                  <div className="flex items-center gap-3 mb-4 pr-16">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                      {job.employer_avatar ? (
                        <img src={job.employer_avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-lg font-black">
                          {job.employer_name?.charAt(0) || "?"}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-black text-gray-800 text-sm">{job.category ? `หมวด: ${job.category}` : job.title}</h3>
                      <p className="text-[10px] text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                        👤 {job.employer_name || 'ไม่ระบุชื่อ'} <span className="text-gray-300">•</span> <span className="text-[#0082FA] font-bold">{timeAgo(job.created_at)}</span>
                      </p>
                    </div>
                  </div>

                  {/* หัวข้องาน */}
                  <h4 className="font-bold text-slate-800 text-sm mb-2">{job.title}</h4>

                  {/* รายละเอียดเส้นทาง/ที่อยู่ */}
                  {job.is_urgent ? (
                    <div className="bg-gray-50 rounded-xl p-3 mb-3 border border-gray-100 relative">
                      <div className="absolute left-4 top-4 bottom-4 w-0.5 border-l-2 border-dashed border-gray-300"></div>
                      <div className="flex items-center gap-2.5 mb-2 relative z-10">
                        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white shadow-sm shrink-0"></div>
                        <span className="text-[10px] font-bold text-gray-700 truncate">{job.location || 'จุดรับของ/ผู้โดยสาร'}</span>
                      </div>
                      <div className="flex items-center gap-2.5 relative z-10">
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm shrink-0"></div>
                        <span className="text-[10px] font-bold text-gray-700 truncate">ดูพิกัดปลายทางในประกาศ</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-3 mb-3 border border-gray-100 flex items-start gap-2">
                      <span className="text-red-500 text-xs shrink-0 mt-0.5">📍</span>
                      <span className="text-[10px] font-bold text-gray-700 leading-relaxed">{job.location || 'ไม่ระบุสถานที่'}</span>
                    </div>
                  )}

                  {/* โน้ตเพิ่มเติม */}
                  <p className="text-[11px] text-gray-600 font-medium leading-relaxed mb-4 bg-yellow-50/50 p-2.5 rounded-lg border border-yellow-100/50 line-clamp-2">
                    <span className="font-bold text-gray-800">รายละเอียด:</span> {job.description}
                  </p>

                  {/* Footer: ราคาและปุ่มรับงาน */}
                  <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                    <div>
                      <span className="text-[9px] text-gray-400 block mb-0.5">ค่าตอบแทน</span>
                      <span className={`text-sm font-black ${!job.budget ? 'text-orange-500' : 'text-[#0082FA]'}`}>
                        {formatBudget(job.budget)}
                      </span>
                    </div>
                    <button className="bg-[#0082FA] text-white px-6 py-2.5 rounded-full text-xs font-black shadow-md hover:bg-[#0070D6] transition-all">
                      รับงานนี้ 🚀
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          </main>
        </div>

        {/* ✅ Bottom Navigation (ใช้เมนูเดิมที่สวยงามของบีสาม) */}
        <div className="fixed bottom-0 w-full sm:max-w-2xl md:max-w-3xl bg-white/95 backdrop-blur-md border-t border-gray-100 px-1 py-4 flex justify-between items-center shadow-[0_-4px_25px_rgba(0,0,0,0.06)] rounded-t-[2.5rem] z-50">
          <NavItem icon="🏠" label="หน้าแรก" active={false} href="/" />
          <NavItem icon="🛠️" label="บริการ" active={false} href="/services" />
          <NavItem icon="📋" label="งานด่วน" active={true} href="/job-board" />
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

// คอมโพเนนต์เมนูด้านล่าง (ปรับให้ใช้ Link เพื่อรองรับ Server Component)
function NavItem({ icon, label, active, href }: { icon: string, label: string, active: boolean, href: string }) {
  return (
    <Link href={href} className={`flex flex-col items-center gap-1.5 cursor-pointer transition-all ${active ? 'scale-110' : 'opacity-40 hover:opacity-100'} flex-1`}>
      <span className="text-[22px]">{icon}</span>
      <span className={`text-[9px] font-bold ${active ? 'text-[#EE4D2D]' : 'text-gray-500'} whitespace-nowrap`}>{label}</span>
      {active && <div className="w-1.5 h-1.5 bg-[#EE4D2D] rounded-full shadow-sm mt-0.5"></div>}
    </Link>
  );
}

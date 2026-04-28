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
  searchParams: Promise<{ category?: string }>;
}

const CATEGORIES = [
  { key: "all", label: "ทั้งหมด", icon: "🗂️" },
  { key: "urgent", label: "ด่วน", icon: "⚡" },
  { key: "ac", label: "ซ่อมแอร์", icon: "❄️" },
  { key: "cleaning", label: "ทำความสะอาด", icon: "🧹" },
  { key: "ride", label: "รับส่ง", icon: "🛵" },
  { key: "delivery", label: "ส่งของ", icon: "📦" },
  { key: "repair", label: "ซ่อมแซม", icon: "🔧" },
  { key: "other", label: "อื่นๆ", icon: "✨" },
];

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

export default async function JobsPage({ searchParams }: PageProps) {
  const { category = "all" } = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_open_jobs");

  const jobs: Job[] = (data || []) as Job[];
  const filtered =
    category === "all"
      ? jobs
      : category === "urgent"
      ? jobs.filter((j) => j.is_urgent)
      : jobs.filter((j) => j.category === category);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-sm relative">
        
        {/* Header & Categories */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-100 px-5 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">งานในชุมชน</h1>
              <p className="text-sm font-bold text-[#EE4D2D]">
                {filtered.length} งานที่เปิดรับตอนนี้
              </p>
            </div>
            <Link
              href="/"
              className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              aria-label="หน้าหลัก"
            >
              <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>
          </div>

          <div className="-mx-5 px-5 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 w-max pb-2">
              {CATEGORIES.map((c) => {
                const active = category === c.key;
                return (
                  <Link
                    key={c.key}
                    href={c.key === "all" ? "/jobs" : `/jobs?category=${c.key}`}
                    scroll={false}
                    className={`shrink-0 px-4 py-2 rounded-xl text-sm font-black border transition-all ${
                      active
                        ? "bg-[#EE4D2D] text-white border-[#EE4D2D] shadow-md shadow-orange-500/20"
                        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span className="mr-1.5">{c.icon}</span>
                    {c.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </header>

        {/* Job Feed */}
        <main className="px-5 py-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-bold rounded-2xl p-4 text-center">
              เกิดข้อผิดพลาดในการโหลดข้อมูลงาน
            </div>
          )}

          {!error && filtered.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-xl font-black text-slate-800">ยังไม่มีงานในหมวดนี้</p>
              <p className="text-sm font-medium text-slate-500 mt-2">ลองเลือกหมวดหมู่อื่น หรือลงประกาศงานของคุณเองสิ!</p>
            </div>
          )}

          {filtered.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </main>
      </div>

      {/* Floating Action Button (+ ลงประกาศงาน) */}
      <div className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
        <div className="max-w-md mx-auto relative h-24">
          <Link
            href="/jobs/new"
            className="pointer-events-auto absolute bottom-6 right-5 flex items-center gap-2 bg-gradient-to-r from-[#EE4D2D] to-[#FF7043] text-white font-black pl-5 pr-6 py-4 rounded-full shadow-lg shadow-orange-500/40 hover:shadow-xl hover:-translate-y-1 active:scale-95 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            ลงประกาศงาน
          </Link>
        </div>
      </div>
    </div>
  );
}

function JobCard({ job }: { job: Job }) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="block bg-white border border-slate-100 rounded-[1.5rem] p-5 shadow-sm hover:border-orange-300 hover:shadow-md transition-all active:scale-[0.98]"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
          {job.employer_avatar ? (
            <img src={job.employer_avatar} alt={job.employer_name || "employer"} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-lg font-black">
              {job.employer_name?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-slate-800 truncate">
            {job.employer_name || "ไม่ระบุชื่อผู้จ้าง"}
          </p>
          <p className="text-xs font-bold text-slate-400">{timeAgo(job.created_at)}</p>
        </div>
        {job.is_urgent && (
          <span className="text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-full animate-pulse">
            ⚡ ด่วน
          </span>
        )}
      </div>

      <h3 className="text-lg font-black text-slate-900 leading-tight mb-2 line-clamp-2">
        {job.title}
      </h3>
      <p className="text-sm font-medium text-slate-500 line-clamp-2 leading-relaxed mb-4">
        {job.description}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100/80">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 min-w-0">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{job.location || "ไม่ระบุพิกัด"}</span>
        </div>
        <span className="text-lg font-black text-[#EE4D2D] shrink-0 ml-2">
          {Number(job.budget).toLocaleString("th-TH")} บาท
        </span>
      </div>
    </Link>
  );
}

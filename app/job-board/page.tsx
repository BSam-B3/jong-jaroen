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
                        : "bg-white/20 text-white border border-

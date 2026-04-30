import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
// ✅ แก้ไข: เปลี่ยนกุญแจเป็น sbServer
import { sbServer } from "@/lib/supabase/server";
import StickyActionBar from "./StickyActionBar";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

// ----- SEO Metadata -----
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  // ✅ แก้ไข: เรียกใช้ sbServer() โดยไม่ต้องมี await
  const supabase = sbServer();
  const { data: profile } = await supabase.rpc("get_public_provider_profile", { p_id: id });

  if (!profile) return { title: "ไม่พบโปรไฟล์ | จงเจริญ" };
  return {
    title: `${profile.full_name || "ไม่ระบุชื่อ"} | จงเจริญ`,
    description: profile.bio?.slice(0, 150) || "ดูโปรไฟล์ผู้รับงานบนแอปจงเจริญ แพลตฟอร์มตลาดแรงงานชุมชน",
  };
}

// ----- Page -----
export default async function ProviderProfilePage({ params }: PageProps) {
  const { id } = await params;
  // ✅ แก้ไข: เรียกใช้ sbServer() โดยไม่ต้องมี await
  const supabase = sbServer();

  // ใช้ RPC ที่เราสร้าง เพื่อความปลอดภัยสูงสุด
  const { data: profile, error } = await supabase.rpc("get_public_provider_profile", { p_id: id });

  if (error || !profile) notFound();

  // ----- Mock Data สถิติ -----
  const stats = { rating: 4.8, reviewCount: 127, completedJobs: 234, responseRate: 98 };
  const skills: string[] = profile.skills && profile.skills.length > 0 ? profile.skills : ["ยังไม่ได้ระบุทักษะ"];
  const memberSince = profile.created_at ? new Date(profile.created_at).toLocaleDateString("th-TH", { year: "numeric", month: "long" }) : "ไม่ระบุ";

  return (
    <div className="min-h-screen bg-slate-50 pb-28 font-sans">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-sm relative">
        
        {/* ===== Top Nav Bar ===== */}
        <div className="absolute top-0 inset-x-0 z-20 bg-transparent px-4 py-4 flex items-center justify-between">
          <Link href="/" className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/40 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <button className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/40 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a3 3 0 10-5.367 2.684m5.367-2.684a3 3 0 11-5.367-2.684m0 0a3 3 0 105.367 2.684" /></svg>
          </button>
        </div>

        {/* ===== Hero / Header ===== */}
        <div className="relative bg-gradient-to-br from-[#EE4D2D] via-[#F06246] to-[#FF8C42] px-6 pt-20 pb-24 rounded-b-[2.5rem] shadow-md">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          
          <div className="relative flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="relative mb-4">
              <div className="w-28 h-28 rounded-full ring-4 ring-white/90 overflow-hidden bg-white shadow-xl flex items-center justify-center">
                {profile.avatar_url ? (
                  <Image src={profile.avatar_url} alt={profile.full_name || 'Avatar'} width={112} height={112} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-slate-300 text-5xl font-black">{profile.full_name?.charAt(0).toUpperCase() || "?"}</div>
                )}
              </div>
              <span className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 rounded-full ring-4 ring-white" />
            </div>

            {/* Name & Verified */}
            <div className="text-white w-full">
              <div className="flex items-center justify-center gap-2 mb-1">
                <h2 className="text-2xl font-black truncate">{profile.full_name || "ไม่ระบุชื่อ"}</h2>
                {profile.kyc_status === "approved" && (
                  <span title="ยืนยันตัวตนแล้ว" className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white text-[#EE4D2D] shadow-sm shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </span>
                )}
              </div>
              {profile.location && (
                <p className="text-white/90 text-sm font-medium flex items-center justify-center gap-1">
                  📍 {profile.location}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ===== Stats Bar (overlap hero) ===== */}
        <div className="px-5 -mt-10 relative z-10">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 grid grid-cols-3 divide-x divide-slate-100 py-2">
            <div className="py-3 px-2 text-center">
              <div className="text-xl font-black text-slate-800 flex items-center justify-center gap-1">
                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.539 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                {stats.rating.toFixed(1)}
              </div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-1">{stats.reviewCount} รีวิว</div>
            </div>
            <div className="py-3 px-2 text-center">
              <div className="text-xl font-black text-slate-800">{stats.completedJobs}</div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-1">งานสำเร็จ</div>
            </div>
            <div className="py-3 px-2 text-center">
              <div className="text-xl font-black text-slate-800">{stats.responseRate}%</div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-1">ตอบกลับ</div>
            </div>
          </div>
        </div>

        {/* ===== Trust Highlights ===== */}
        {profile.kyc_status === "approved" && (
          <div className="mx-5 mt-6 bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shrink-0 text-white shadow-md">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-green-800">ผู้รับงานยืนยันตัวตนแล้ว</p>
              <p className="text-xs font-medium text-green-700 mt-1 leading-relaxed">ตรวจสอบเอกสารโดยทีมงานจงเจริญ มั่นใจได้ว่าเป็นบุคคลจริงและมีประวัติชัดเจน</p>
            </div>
          </div>
        )}

        {/* ===== About / Bio ===== */}
        <section className="px-6 mt-8">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-3">เกี่ยวกับฉัน</h3>
          <p className="text-slate-700 font-medium text-sm leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-100">
            {profile.bio || "ผู้รับงานยังไม่ได้ระบุข้อมูลเกี่ยวกับตัวเอง"}
          </p>
        </section>

        {/* ===== Skills / Services ===== */}
        <section className="px-6 mt-8">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-3">บริการที่รับทำ</h3>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill: string, idx: number) => (
              <span key={idx} className="px-4 py-2 rounded-xl text-xs font-black bg-orange-50 text-[#EE4D2D] border border-orange-100 shadow-sm">
                {skill}
              </span>
            ))}
          </div>
        </section>

        <div className="px-6 mt-6 pb-6">
          <p className="text-xs text-center font-bold text-slate-400">เป็นสมาชิกตั้งแต่: {memberSince}</p>
        </div>
      </div>

      {/* ===== Sticky Action Bar (Bottom) ===== */}
      <StickyActionBar providerId={profile.id} providerName={profile.full_name || "ผู้รับงาน"} />
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function WinOnlinePage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [userId, setUserId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🌟 ฟังก์ชันดึงข้อมูลงาน (DATABASE SYNC: ใช้คอลัมน์ phone ให้ตรงกับฐานข้อมูล)
  const fetchJobs = useCallback(async (uid: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        employer:profiles!employer_id (first_name, full_name, phone, avatar_url),
        worker:profiles!worker_id (first_name, full_name, phone, avatar_url)
      `)
      .or(`employer_id.eq.${uid},worker_id.eq.${uid}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch Jobs Error:', error.message);
    }
    if (data) {
      setJobs(data);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserId(session.user.id);
        fetchJobs(session.user.id);
      } else {
        router.push('/auth/login');
      }
    });
  }, [fetchJobs, router, supabase.auth]);

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col font-sans">
      {/* Header */}
      <header className="px-5 pt-12 pb-6 bg-white border-b border-gray-100 flex justify-between items-center sticky top-0 z-20">
        <div>
          <h1 className="text-gray-900 text-3xl font-black italic tracking-tighter">
            WIN <span className="text-[#EE4D2D] not-italic">ONLINE</span>
          </h1>
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-1">
            เครือข่ายไรเดอร์ประแสร์
          </p>
        </div>
        <Link 
          href="/notifications" 
          className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-xl shadow-sm border border-gray-100 active:scale-95 transition"
        >
          🔔
        </Link>
      </header>

      <main className="flex-1 p-5 space-y-5 pb-10">
        
        {/* ส่วนบน: สรุปงานที่กำลังทำ (Red Card) */}
        <div className="bg-gradient-to-br from-[#EE4D2D] to-[#FF7337] rounded-[2.5rem] p-7 text-white shadow-xl relative overflow-hidden shadow-orange-200">
          <div className="absolute right-[-20px] top-[-20px] text-9xl opacity-10 rotate-12">🛵</div>
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">งานที่กำลังดำเนินการ</p>
            <div className="flex items-baseline gap-2 mt-2">
              <h2 className="text-5xl font-black">
                {jobs.filter(j => j.status === 'in_progress').length}
              </h2>
              <p className="text-sm font-bold opacity-80">รายการ</p>
            </div>
            <Link 
              href="/my-jobs" 
              className="mt-6 bg-white/20 backdrop-blur-md rounded-2xl py-3 px-5 inline-block text-[11px] font-black border border-white/30 hover:bg-white/30 transition-all active:scale-95"
            >
              ดูรายละเอียดงานทั้งหมด →
            </Link>
          </div>
        </div>

        {/* ปุ่มด่วนสำหรับจ้างงานใหม่ */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/win-online/create?type=ride" className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center gap-2 active:scale-95 transition">
            <span className="text-3xl">🛵</span>
            <span className="text-xs font-black text-gray-800">เรียกรถ</span>
          </Link>
          <Link href="/win-online/create?type=deliver" className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center gap-2 active:scale-95 transition">
            <span className="text-3xl">📦</span>
            <span className="text-xs font-black text-gray-800">ส่งของ</span>
          </Link>
        </div>

        {/* รายการประวัติล่าสุด (Standardized Currency: บาท) */}
        <div className="pt-4">
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">ประวัติล่าสุด</h3>
            <Link href="/my-jobs" className="text-[10px] font-black text-[#EE4D2D]">ดูทั้งหมด</Link>
          </div>
          
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-10 font-bold text-gray-300 animate-pulse">กำลังโหลดข้อมูล...</div>
            ) : jobs.length === 0 ? (
              <div className="bg-white rounded-[2rem] p-12 text-center border border-gray-50 shadow-sm">
                <p className="text-xs font-bold text-gray-400 italic">ยังไม่มีประวัติการใช้งานของคุณ</p>
              </div>
            ) : (
              jobs.slice(0, 5).map(job => (
                <div key={job.id} className="bg-white p-5 rounded-[1.5rem] flex justify-between items-center border border-gray-100 shadow-sm hover:border-orange-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-2xl border border-white shadow-inner">
                      {job.job_type === 'ride' ? '🛵' : job.job_type === 'buy' ? '🛒' : '📦'}
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-800">{job.title || 'บริการรับ-ส่งด่วน'}</p>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                        {new Date(job.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {/* 🌟 ปรับสกุลเงินเป็น "บาท" ตามสเปก Audit */}
                    <p className="text-sm font-black text-[#EE4D2D]">
                      {job.budget?.toLocaleString('th-TH')} บาท
                    </p>
                    <span className="text-[9px] font-bold text-gray-300 uppercase">{job.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* 🚩 เจมลบ BottomNav ออกจากที่นี่แล้ว เพราะบีสามใส่ไว้ใน layout.tsx เรียบร้อยแล้วค่ะ */}
    </div>
  );
}

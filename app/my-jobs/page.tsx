'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import BottomNav from '@/app/components/BottomNav';
import Link from 'next/link';

export default function MyJobsPage() {
  const supabase = createClient();
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        fetchJobs(session.user.id);
      }
    };
    init();

    // 🔔 ระบบ Real-time: ใครอัปเดตสถานะงานปุ๊บ หน้าจอบีสามเปลี่ยนปั๊บ
    const channel = supabase.channel('my-jobs-update')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
        if (user) fetchJobs(user.id);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  const fetchJobs = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .or(`employer_id.eq.${userId},worker_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (!error && data) setMyJobs(data);
    setLoading(false);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'open': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'in_progress': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-600 border-green-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return '⏳ รอคนรับงาน';
      case 'in_progress': return '🛵 กำลังดำเนินการ';
      case 'completed': return '✅ เสร็จสิ้น';
      case 'cancelled': return '❌ ยกเลิกแล้ว';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-24">
      <div className="w-full max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-2xl border-x border-gray-100">
        
        {/* Header */}
        <header className="px-6 pt-10 pb-6 bg-white border-b border-gray-100 shadow-sm rounded-b-[2.5rem] relative z-20">
          <h1 className="text-gray-900 text-2xl font-black tracking-tight">งานของฉัน</h1>
          <p className="text-xs text-gray-400 font-bold">ติดตามสถานะงานที่คุณโพสต์หรือรับงานไว้ที่นี่</p>
        </header>

        <main className="p-4 space-y-4 overflow-y-auto">
          {loading ? (
            <div className="text-center py-10 opacity-50">กำลังดึงข้อมูล...</div>
          ) : myJobs.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-10 text-center border border-gray-100 shadow-sm">
              <div className="text-6xl mb-4">📭</div>
              <p className="font-black text-gray-800 text-sm">ยังไม่มีประวัติการจ้างงาน</p>
              <Link href="/win-online" className="inline-block mt-4 text-[#EE4D2D] font-black text-xs border-b-2 border-[#EE4D2D]">
                เริ่มโพสต์งานครั้งแรกเลย →
              </Link>
            </div>
          ) : (
            myJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-50 active:scale-[0.98] transition-transform">
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${getStatusStyle(job.status)}`}>
                    {getStatusText(job.status)}
                  </span>
                  <span className="text-[10px] text-gray-300 font-bold">
                    {new Date(job.created_at).toLocaleDateString('th-TH')}
                  </span>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl border border-gray-100">
                    {job.job_type === 'ride' ? '🛵' : job.job_type === 'buy' ? '🍜' : '📦'}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-black text-gray-800 mb-1">{job.title}</h3>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 font-bold">
                      <span className="text-[#EE4D2D]">฿{job.budget}</span>
                      <span className="text-gray-200">|</span>
                      <span>{job.distance_km} กม.</span>
                    </div>
                  </div>
                </div>

                {job.status === 'in_progress' && (
                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 bg-orange-50 text-[#EE4D2D] py-3 rounded-xl text-[11px] font-black">💬 แชทหาคนขับ</button>
                    <button className="flex-1 bg-gray-50 text-gray-400 py-3 rounded-xl text-[11px] font-black">ดูรายละเอียด</button>
                  </div>
                )}
              </div>
            ))
          )}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ChatInboxPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [chatJobs, setChatJobs] = useState<any[]>([]);

  useEffect(() => {
    async function fetchChatList() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push('/auth/login?next=/chat');
        return;
      }
      const user = session.user;
      setCurrentUser(user);

      // ดึงรายชื่องานทั้งหมดที่ฉันเป็นคนจ้าง หรือ เป็นช่างรับงาน
      const { data } = await supabase
        .from('jobs')
        .select(`
          id, title, status, job_type, budget, updated_at,
          employer_id, worker_id,
          employer:profiles!employer_id(full_name, avatar_url),
          worker:profiles!worker_id(full_name, avatar_url)
        `)
        .or(`employer_id.eq.${user.id},worker_id.eq.${user.id}`)
        .order('updated_at', { ascending: false }); // เรียงจากที่มีการอัปเดตล่าสุด

      if (data) {
        setChatJobs(data);
      }
      setLoading(false);
    }

    fetchChatList();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center font-sans">
        <div className="w-10 h-10 border-4 border-[#EE4D2D] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans pb-24 md:pb-10">
      
      {/* 🟠 Header */}
      <header className="bg-gradient-to-br from-[#EE4D2D] to-[#FF7337] px-6 pt-12 pb-10 rounded-b-[2.5rem] shadow-md text-white sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button onClick={() => router.back()} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-black active:scale-95 transition-all backdrop-blur-md shrink-0">
            ←
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight">ข้อความ 💬</h1>
            <p className="text-xs font-bold text-orange-100 opacity-90 mt-0.5">รวมการสนทนาและงานทั้งหมดของคุณ</p>
          </div>
        </div>
      </header>

      {/* 📋 Chat List Area */}
      <main className="max-w-2xl mx-auto p-4 md:p-6 mt-2">
        {chatJobs.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-10 text-center shadow-sm border border-gray-100">
            <div className="text-6xl mb-4 grayscale opacity-40">📭</div>
            <h2 className="font-black text-gray-800 text-lg">ยังไม่มีกล่องข้อความ</h2>
            <p className="text-xs font-bold text-gray-400 mt-2">ประวัติการพูดคุยและดิลงานจะแสดงที่นี่ค่ะ</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {chatJobs.map((job) => {
              // เช็คว่าเราคุยกับใครอยู่
              const isEmployer = currentUser.id === job.employer_id;
              const partner = isEmployer ? job.worker : job.employer;
              const partnerRoleName = isEmployer ? 'ช่าง/ผู้รับจ้าง' : 'ผู้ว่าจ้าง';
              
              // Ref ID
              const shortRef = job.id.substring(0, 6).toUpperCase();
              const isJobOnsite = job.job_type === 'onsite';

              return (
                <Link 
                  href={`/chat/${job.id}`} 
                  key={job.id}
                  className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition-all active:scale-[0.98]"
                >
                  {/* Avatar & Icon */}
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 bg-gray-100 rounded-full overflow-hidden border-2 border-gray-50">
                      {partner?.avatar_url ? (
                        <img src={partner.avatar_url} className="w-full h-full object-cover" alt="avatar" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">👤</div>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm text-xs border border-gray-100">
                      {isJobOnsite ? '🛵' : '💻'}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <h3 className="font-black text-gray-800 text-sm truncate pr-2">
                        {partner?.full_name || `รอ${partnerRoleName}ตอบรับ`}
                      </h3>
                      <span className="text-[10px] font-bold text-gray-400 shrink-0">
                        {new Date(job.updated_at).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    
                    <p className="text-xs font-bold text-gray-600 truncate mb-1.5">
                      งาน: {job.title}
                    </p>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-black text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">
                        #{shortRef}
                      </span>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${job.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-[#EE4D2D] border-orange-100'}`}>
                        {job.status}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

    </div>
  );
}

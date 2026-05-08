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
    async function initInbox() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push('/auth/login?next=/chat');
        return;
      }
      const user = session.user;
      setCurrentUser(user);

      // ฟังก์ชันดึงรายชื่องานทั้งหมด และนับจำนวนข้อความที่ยังไม่ได้อ่าน (ข้อมูลจริง)
      const fetchChatList = async () => {
        const { data } = await supabase
          .from('jobs')
          .select(`
            id, title, status, job_type, budget, updated_at,
            employer_id, worker_id,
            employer:profiles!employer_id(full_name, avatar_url),
            worker:profiles!worker_id(full_name, avatar_url),
            unread_count:job_chat_messages(count)
          `)
          .or(`employer_id.eq.${user.id},worker_id.eq.${user.id}`)
          .eq('job_chat_messages.is_read', false)
          .neq('job_chat_messages.sender_id', user.id) // นับเฉพาะที่คนอื่นส่งมา
          .order('updated_at', { ascending: false });

        if (data) {
          setChatJobs(data);
        }
        setLoading(false);
      };

      fetchChatList();

      // 🌟 Subscribe Real-time เพื่อให้ตัวเลขแจ้งเตือนเด้งทันทีที่มีแชทเข้า
      const channel = supabase.channel('inbox_updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'job_chat_messages' }, () => {
          fetchChatList();
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }

    initInbox();
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
              const isEmployer = currentUser.id === job.employer_id;
              const partner = isEmployer ? job.worker : job.employer;
              const partnerRoleName = isEmployer ? 'ช่าง/ผู้รับจ้าง' : 'ผู้ว่าจ้าง';
              
              const unreadCount = job.unread_count?.[0]?.count || 0;
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
                    <div className="w-14 h-14 bg-gray-100 rounded-full overflow-hidden border-2 border-white shadow-sm">
                      {partner?.avatar_url ? (
                        <img src={partner.avatar_url} className="w-full h-full object-cover" alt="avatar" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">👤</div>
                      )}
                    </div>
                    {/* 🔴 วงกลมแจ้งเตือน Unread */}
                    {unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-[#EE4D2D] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow-sm">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm text-xs border border-gray-100">
                      {isJobOnsite ? '🛵' : '💻'}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <h3 className={`text-sm truncate pr-2 ${unreadCount > 0 ? 'font-black text-gray-900' : 'font-bold text-gray-700'}`}>
                        {partner?.full_name || `รอ${partnerRoleName}ตอบรับ`}
                      </h3>
                      <span className="text-[10px] font-bold text-gray-400 shrink-0">
                        {new Date(job.updated_at).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    
                    <p className={`text-xs truncate mb-1.5 ${unreadCount > 0 ? 'font-bold text-gray-800' : 'font-medium text-gray-500'}`}>
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

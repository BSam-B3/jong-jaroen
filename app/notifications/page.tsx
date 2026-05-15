'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import BottomNav from '@/app/components/BottomNav';

type NotifType = 'system' | 'job' | 'promo' | 'new_proposal';
type Tab = 'all' | 'unread';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string; // ใช้ message ตามฐานข้อมูล Supabase
  created_at: string;
  is_read: boolean;
  user_id: string | null;
}

const TYPE_META: Record<NotifType, { icon: string; label: string; bg: string; text: string; ring: string }> = {
  system: { icon: '✅', label: 'ระบบ', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  job: { icon: '🛵', label: 'งาน', bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200' },
  promo: { icon: '🎁', label: 'โปรโมชั่น', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
  new_proposal: { icon: '📝', label: 'ผู้รับงาน', bg: 'bg-[#0047FF]/10', text: 'text-[#0047FF]', ring: 'ring-[#0047FF]/20' }, 
};

const timeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'เมื่อสักครู่';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} นาทีที่แล้ว`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} ชม.ที่แล้ว`;
  return `${Math.floor(seconds / 86400)} วันที่แล้ว`;
};

export default function NotificationsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [tab, setTab] = useState<Tab>('all');
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef<string | null>(null);

  const fetchNotifs = useCallback(async () => {
    // ดึงทั้งแบบเจาะจงตัวบุคคล และแบบประกาศสาธารณะ (user_id is null)
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (!error && data) setNotifs(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchNotifs();

    // ดักฟัง Real-time สำหรับทุกคน
    const channel = supabase.channel('public-notifs')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const row = payload.new as Notification;
          setNotifs(prev => [row, ...prev]);
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, fetchNotifs]);

  const unreadCount = useMemo(() => notifs.filter((n) => !n.is_read).length, [notifs]);
  const visible = useMemo(() => (tab === 'unread' ? notifs.filter((n) => !n.is_read) : notifs), [notifs, tab]);

  const markAllRead = async () => {
    const targetIds = notifs.filter(n => !n.is_read).map(n => n.id);
    if (targetIds.length === 0) return;

    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    await supabase.from('notifications').update({ is_read: true }).in('id', targetIds);
  };

  const markOneRead = async (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-24">
      <div className="w-full max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-2xl border-x border-gray-100 overflow-hidden">
        
        <header className="px-5 pt-12 pb-4 bg-white border-b border-gray-100 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-lg active:scale-95 transition">←</Link>
              <div>
                <h1 className="text-gray-900 text-xl font-black tracking-tight">การแจ้งเตือน</h1>
                <p className="text-[11px] text-[#EE4D2D] font-bold">
                  {unreadCount > 0 ? `มีข้อความใหม่ ${unreadCount} รายการ` : 'อ่านครบทั้งหมดแล้ว'}
                </p>
              </div>
            </div>
            <button onClick={markAllRead} className={`text-xs font-black px-4 py-2.5 rounded-xl transition ${unreadCount === 0 ? 'bg-gray-100 text-gray-400' : 'bg-[#EE4D2D] text-white'}`}>
              อ่านทั้งหมด
            </button>
          </div>
        </header>

        <div className="px-5 pt-4">
          <div className="relative bg-white rounded-2xl p-1.5 flex shadow-sm border border-gray-100">
            <button onClick={() => setTab('all')} className={`relative z-10 flex-1 py-3 rounded-xl text-sm font-black transition-colors ${tab === 'all' ? 'bg-[#EE4D2D] text-white shadow-md' : 'text-gray-500'}`}>
              ทั้งหมด ({notifs.length})
            </button>
            <button onClick={() => setTab('unread')} className={`relative z-10 flex-1 py-3 rounded-xl text-sm font-black transition-colors ${tab === 'unread' ? 'bg-[#EE4D2D] text-white shadow-md' : 'text-gray-500'}`}>
              ยังไม่อ่าน ({unreadCount})
            </button>
          </div>
        </div>

        <main className="px-5 mt-5 flex-1 space-y-3 overflow-y-auto">
          {loading ? (
            <p className="text-center py-10 text-gray-400 font-bold">กำลังโหลดข้อความ...</p>
          ) : visible.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-12 text-center border border-gray-100 mt-4">
              <div className="text-6xl mb-4">🎉</div>
              <p className="font-black text-gray-800">ไม่มีรายการแจ้งเตือน</p>
            </div>
          ) : (
            visible.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.is_read && markOneRead(n.id)}
                className={`relative flex gap-4 p-5 rounded-[1.5rem] border transition-all shadow-sm ${
                  n.is_read ? 'bg-white border-gray-100' : 'bg-orange-50/50 border-orange-100'
                }`}
              >
                {!n.is_read && <span className="absolute top-4 right-4 w-3 h-3 rounded-full bg-[#EE4D2D]" />}
                <div className={`w-12 h-12 rounded-[1rem] ${TYPE_META[n.type || 'system'].bg} flex items-center justify-center text-2xl shrink-0`}>
                  {TYPE_META[n.type || 'system'].icon}
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-gray-400 font-bold">{timeAgo(n.created_at)}</span>
                  </div>
                  <p className={`text-sm leading-snug truncate ${n.is_read ? 'text-gray-600' : 'font-black text-gray-900'}`}>{n.title}</p>
                  <p className="text-[11px] text-gray-500 font-bold mt-1">{n.message}</p>
                </div>
              </div>
            ))
          )}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}

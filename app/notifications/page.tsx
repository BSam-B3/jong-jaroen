'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type NotifType = 'system' | 'job' | 'promo' | 'new_proposal';
type Tab = 'all' | 'unread';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  created_at: string;
  is_read: boolean;
  data?: any;
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
  // 🌟 สร้าง Supabase Client ให้คงที่
  const supabase = useMemo(() => createClient(), []);
  
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [tab, setTab] = useState<Tab>('all');
  const [userId, setUserId] = useState<string | null>(null);
  
  // 🌟 ใช้ useRef เก็บ ID เพื่อให้ Callback ฟังก์ชันเรียกใช้ได้โดยไม่ต้องรีโหลด
  const userIdRef = useRef<string | null>(null);

  const fetchNotifs = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(100); // ดึงมาแค่ 100 รายการล่าสุด
      
    if (!error && data) setNotifs(data);
  }, [supabase]);

  // 🌟 รอจนรู้ UID ก่อน ค่อยเปิดช่องสัญญาณดักฟังเฉพาะตัวเอง (ป้องกันแบนด์วิดท์ทะลุ)
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled || !session?.user) return;
      
      const uid = session.user.id;
      userIdRef.current = uid;
      setUserId(uid);
      await fetchNotifs(uid);

      channel = supabase.channel(`notifs:${uid}`)
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
          (payload) => {
            const row = payload.new as Notification;
            // ดันแจ้งเตือนใหม่เข้า state โดยไม่ต้อง Fetch ทั้งตารางใหม่
            setNotifs(prev => prev.some(n => n.id === row.id) ? prev : [row, ...prev]);
          })
        .subscribe();
    })();

    return () => { 
      cancelled = true; 
      if (channel) supabase.removeChannel(channel); 
    };
  }, [supabase, fetchNotifs]);

  const unreadCount = useMemo(() => notifs.filter((n) => !n.is_read).length, [notifs]);
  const visible = useMemo(() => (tab === 'unread' ? notifs.filter((n) => !n.is_read) : notifs), [notifs, tab]);

  // 🌟 อัปเกรดปุ่ม: อ่านแล้วแบบมี Rollback เผื่อเน็ตหลุด
  const markAllRead = useCallback(async () => {
    const uid = userIdRef.current;
    if (!uid) return;
    
    // ล็อกเป้าเฉพาะอันที่ยังไม่อ่าน
    const targetIds = notifs.filter(n => !n.is_read).map(n => n.id);
    if (targetIds.length === 0) return;
    
    const snapshot = notifs; // ถ่ายรูปเก็บไว้
    setNotifs(prev => prev.map(n => targetIds.includes(n.id) ? { ...n, is_read: true } : n));
    
    const { error } = await supabase.from('notifications')
      .update({ is_read: true })
      .in('id', targetIds); // อัปเดตเฉพาะ ID เป้าหมาย
      
    if (error) setNotifs(snapshot); // ถ้าเซิร์ฟเวอร์พัง ให้ดึงรูปเก่ามาโชว์ (Rollback)
  }, [supabase, notifs]);

  const markOneRead = useCallback(async (id: string) => {
    const snapshot = notifs;
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    
    const { error } = await supabase.from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', userIdRef.current); // ดัก RLS ซ้ำอีกชั้น
      
    if (error) setNotifs(snapshot);
  }, [supabase, notifs]);

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans relative">
      <div className="w-full max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-2xl border-x border-gray-100 overflow-hidden">
        
        <header className="px-5 pt-12 pb-4 bg-white border-b border-gray-100 z-10 sticky top-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/win-online" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-lg active:scale-95 transition">←</Link>
              <div>
                <h1 className="text-gray-900 text-xl font-black tracking-tight">การแจ้งเตือน</h1>
                <p className="text-[11px] text-[#EE4D2D] font-bold">
                  {unreadCount > 0 ? `มีข้อความใหม่ ${unreadCount} รายการ` : 'อ่านครบทั้งหมดแล้ว'}
                </p>
              </div>
            </div>
            <button onClick={markAllRead} disabled={unreadCount === 0} className={`text-xs font-black px-4 py-2.5 rounded-xl transition active:scale-95 ${unreadCount === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#EE4D2D] text-white shadow-sm'}`}>
              อ่านทั้งหมด
            </button>
          </div>
        </header>

        <div className="px-5 pt-4">
          <div className="relative bg-white rounded-2xl p-1.5 flex shadow-sm border border-gray-100">
            <span className={`absolute top-1.5 bottom-1.5 w-[calc(50%-0.375rem)] rounded-xl bg-gradient-to-r from-[#EE4D2D] to-[#FF7337] shadow-md transition-all duration-300 ease-out ${tab === 'all' ? 'left-1.5' : 'left-[calc(50%+0rem)]'}`} />
            <button onClick={() => setTab('all')} className={`relative z-10 flex-1 py-3 rounded-xl text-sm font-black transition-colors ${tab === 'all' ? 'text-white' : 'text-gray-500'}`}>
              ทั้งหมด <span className="ml-1 text-[10px] opacity-80">({notifs.length})</span>
            </button>
            <button onClick={() => setTab('unread')} className={`relative z-10 flex-1 py-3 rounded-xl text-sm font-black transition-colors ${tab === 'unread' ? 'text-white' : 'text-gray-500'}`}>
              ยังไม่อ่าน
              {unreadCount > 0 && (
                <span className={`ml-1.5 inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full text-[10px] font-black shadow-sm ${tab === 'unread' ? 'bg-white text-[#EE4D2D]' : 'bg-[#EE4D2D] text-white'}`}>{unreadCount}</span>
              )}
            </button>
          </div>
        </div>

        <main className="px-5 mt-5 flex-1 space-y-3 pb-32 overflow-y-auto">
          {visible.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-12 text-center border border-gray-100 shadow-sm mt-4">
              <div className="text-6xl mb-4">🎉</div>
              <p className="font-black text-gray-800 text-base">ไม่มีรายการที่ยังไม่อ่าน</p>
              <p className="text-xs text-gray-400 font-bold mt-2">คุณตามอ่านทุกข้อความแล้ว เยี่ยมมาก!</p>
            </div>
          ) : (
            visible.map((n) => <NotifItem key={n.id} notif={n} onRead={markOneRead} />)
          )}
        </main>
      </div>
    </div>
  );
}

function NotifItem({ notif, onRead }: { notif: Notification; onRead: (id: string) => void }) {
  const href = notif.data?.job_id ? `/my-jobs` : undefined; 
  const meta = TYPE_META[notif.type] || TYPE_META.system; 
  const Wrapper: React.ElementType = href ? Link : 'div';
  const wrapperProps = href ? { href } : {};

  return (
    <Wrapper
      {...wrapperProps}
      onClick={(e: React.MouseEvent) => {
        // ให้กดอ่านได้ถึงแม้จะมี Link
        if (!notif.is_read) onRead(notif.id);
      }}
      className={`relative flex gap-4 p-5 rounded-[1.5rem] border transition-all active:scale-[0.99] shadow-sm ${
        notif.is_read ? 'bg-white border-gray-100' : 'bg-orange-50/50 border-orange-100'
      } ${href ? 'cursor-pointer hover:border-gray-200' : ''}`}
    >
      {!notif.is_read && <span className="absolute top-4 right-4 w-3 h-3 rounded-full bg-[#EE4D2D] ring-4 ring-white shadow-sm" aria-label="ยังไม่อ่าน" />}

      <div className={`w-12 h-12 rounded-[1rem] ${meta.bg} flex items-center justify-center text-2xl shrink-0 border border-white shadow-inner`}>
        {meta.icon}
      </div>

      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${meta.bg} ${meta.text} border ${meta.ring}`}>{meta.label}</span>
          <span className="text-[10px] text-gray-400 font-bold">{timeAgo(notif.created_at)}</span>
        </div>
        <p className={`text-sm leading-snug truncate ${notif.is_read ? 'font-bold text-gray-700' : 'font-black text-gray-900'}`}>{notif.title}</p>
        <p className="text-[11px] text-gray-500 font-bold leading-relaxed line-clamp-2 mt-1">{notif.body}</p>
      </div>
    </Wrapper>
  );
}

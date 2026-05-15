"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      setNotifications(data || []);
      setLoading(false);
    };

    fetchNotifications();

    // ดักฟังแจ้งเตือนใหม่แบบ Real-time
    const channel = supabase.channel('realtime-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, 
      (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="bg-black min-h-screen text-white p-4 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#deff9a]">การแจ้งเตือน</h1>
        <button 
          onClick={() => setNotifications([])} // แบบง่ายๆ คือเคลียร์หน้าจอ
          className="text-xs text-gray-500"
        >
          ล้างทั้งหมด
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 mt-10">กำลังโหลด...</p>
      ) : notifications.length === 0 ? (
        <div className="text-center mt-20 text-gray-600">
          <i className="fa-regular fa-bell-slash text-4xl mb-4"></i>
          <p>ยังไม่มีการแจ้งเตือนในตอนนี้ค่ะ</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((note) => (
            <div 
              key={note.id} 
              className={`p-4 rounded-2xl border ${note.is_read ? 'bg-[#111] border-[#222]' : 'bg-[#1a1a1a] border-[#deff9a]/30'}`}
            >
              <div className="flex gap-3">
                <div className="bg-[#deff9a] w-2 h-2 rounded-full mt-2 shrink-0 animate-pulse"></div>
                <div>
                  <h3 className="font-bold text-[#deff9a]">{note.title}</h3>
                  <p className="text-sm text-gray-300 mt-1">{note.message}</p>
                  <p className="text-[10px] text-gray-500 mt-2">
                    {new Date(note.created_at).toLocaleTimeString('th-TH')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

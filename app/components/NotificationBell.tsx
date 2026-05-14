'use client';

import { useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function NotificationHandler({ userId }: { userId?: string }) {
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    // 1. ขออนุญาตแจ้งเตือนในเบราว์เซอร์
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    // 2. ฟังก์ชันเล่นเสียง
    const playSound = () => {
      // 🌟 ต้องมีไฟล์ ping.mp3 ในโฟลเดอร์ public/sounds/
      const audio = new Audio('/sounds/ping.mp3');
      audio.play().catch(e => console.log('Audio playback blocked by browser:', e));
    };

    // 3. ดักจับ Notification ใหม่ที่ถูกส่งมาหา User คนนี้
    if (userId) {
      const notifChannel = supabase.channel(`notifications-${userId}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        }, (payload) => {
          console.log('🔔 New Notification:', payload.new);
          playSound();
          
          if (Notification.permission === 'granted') {
            new Notification('การแจ้งเตือนใหม่', {
              body: payload.new.title,
              icon: '/favicon.ico' // สามารถเปลี่ยนเป็นโลโก้จงเจริญได้
            });
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(notifChannel);
      };
    }
  }, [supabase, userId]);

  return null; // เป็น Component ที่รันอยู่เบื้องหลัง ไม่แสดงอะไรบนหน้าจอ
}

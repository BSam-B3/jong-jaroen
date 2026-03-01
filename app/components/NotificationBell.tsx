'use client';

import { useState, useRef, useEffect } from 'react';
import { useNotifications, Notification } from '@/lib/useNotifications';

const TYPE_EMOJI: Record<string, string> = {
  new_job: '📋',
  job_accepted: '✅',
  job_completed: '🎉',
  payment: '💰',
  rating: '⭐',
  lottery: '🎟️',
  system: '📢',
};

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (id: string) => void;
}) {
  const emoji = TYPE_EMOJI[notification.type] || '🔔';
  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'เมื่อกี้';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} นาทีที่แล้ว`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ชั่วโมงที่แล้ว`;
    return `${Math.floor(seconds / 86400)} วันที่แล้ว`;
  };

  return (
    <button
      onClick={() => !notification.is_read && onRead(notification.id)}
      className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${
        !notification.is_read ? 'bg-blue-50/50' : ''
      }`}
    >
      <span className="text-xl mt-0.5 flex-shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${!notification.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{notification.body}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">{timeAgo(notification.created_at)}</p>
      </div>
      {!notification.is_read && (
        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
      )}
    </button>
  );
}

export function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications(userId);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Request browser notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (window.Notification.permission === 'default') {
        window.Notification.requestPermission();
      }
    }
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
        aria-label="การแจ้งเตือน"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-800">
              🔔 การแจ้งเตือน
              {unreadCount > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full">
                  {unreadCount} ใหม่
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                อ่านทั้งหมด
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-gray-400 text-sm">กำลังโหลด...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-3xl mb-2">📭</div>
                <p className="text-gray-400 text-sm">ยังไม่มีการแจ้งเตือน</p>
              </div>
            ) : (
              notifications.map(notif => (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  onRead={markRead}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

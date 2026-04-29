'use client';

import Link from "next/link";
import { useState } from "react";

// 📌 ข้อมูลจำลอง (Mock Data)
type NotificationType = 'job' | 'promo' | 'system';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  link?: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'job',
    title: 'ช่างสมชาย ตอบรับงานของคุณแล้ว',
    message: 'ซ่อมแอร์ห้องนอน 12,000 BTU ช่างกำลังเดินทางไปที่จุดหมาย',
    time: '10 นาทีที่แล้ว',
    isRead: false,
    link: '/my-jobs'
  },
  {
    id: '2',
    type: 'promo',
    title: 'แจกโค้ดส่งฟรี! ฉลองเปิดแอป 🎉',
    message: 'กรอกโค้ด JONGJAROEN รับส่วนลดค่าส่ง 50 บาท ทันที',
    time: '2 ชั่วโมงที่แล้ว',
    isRead: false,
    link: '/coupons'
  },
  {
    id: '3',
    type: 'system',
    title: 'ยืนยันตัวตนสำเร็จ',
    message: 'บัญชีของคุณได้รับการตรวจสอบและยืนยันตัวตน (KYC) เรียบร้อยแล้ว',
    time: 'เมื่อวาน 14:30 น.',
    isRead: true,
    link: '/profile'
  },
  {
    id: '4',
    type: 'job',
    title: 'รีวิวให้คะแนนวินมอไซค์',
    message: 'อย่าลืมให้คะแนน วินพี่เอก สำหรับการส่งของไปตลาดประแสร์',
    time: '2 วันที่แล้ว',
    isRead: true,
  }
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-24">
      <div className="w-full sm:max-w-2xl md:max-w-3xl min-h-screen relative flex flex-col shadow-xl bg-[#F4F6F8]">
        
        {/* 🟠 Header */}
        <header className="px-6 pt-10 pb-6 bg-white border-b border-gray-100 shadow-sm rounded-b-[2.5rem] relative z-20 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xl active:scale-95 transition-transform border border-gray-100 shadow-inner">
                ←
              </Link>
              <h1 className="text-gray-900 text-2xl font-black tracking-tight">การแจ้งเตือน</h1>
            </div>
            
            {/* Badge จำนวนที่ยังไม่อ่าน */}
            {unreadCount > 0 && (
              <span className="bg-[#EE4D2D] text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-sm animate-pulse">
                {unreadCount} ใหม่
              </span>
            )}
          </div>

          {/* ปุ่มอ่านทั้งหมด */}
          <div className="flex justify-end">
            <button 
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className={`text-xs font-bold transition-colors ${unreadCount > 0 ? 'text-[#0082FA] active:scale-95' : 'text-gray-400 cursor-not-allowed'}`}
            >
              ทำเครื่องหมายว่าอ่านแล้วทั้งหมด ✓
            </button>
          </div>
        </header>

        {/* 📋 Notification List */}
        <main className="px-4 mt-4 flex-1 space-y-3">
          {notifications.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-10 text-center border border-gray-100 shadow-sm mt-4">
              <div className="text-5xl mb-3 opacity-50">📭</div>
              <p className="font-black text-gray-700 text-sm">ไม่มีการแจ้งเตือนใหม่</p>
              <p className="text-[10px] text-gray-400 font-bold mt-1">คุณติดตามข่าวสารได้ครบถ้วนแล้ว</p>
            </div>
          ) : (
            notifications.map((note) => {
              const isUnread = !note.isRead;
              
              // กำหนดสีและไอคอนตามประเภท
              let icon = "🔔";
              let colorClass = "bg-gray-100 text-gray-500 border-gray-200";
              
              if (note.type === 'job') {
                icon = "💼";
                colorClass = "bg-blue-50 text-[#0082FA] border-blue-100";
              } else if (note.type === 'promo') {
                icon = "🎟️";
                colorClass = "bg-orange-50 text-[#EE4D2D] border-orange-100";
              } else if (note.type === 'system') {
                icon = "🛡️";
                colorClass = "bg-green-50 text-green-500 border-green-100";
              }

              const CardContent = (
                <article className={`relative bg-white rounded-[1.5rem] p-4 shadow-sm border transition-all active:scale-[0.98] ${isUnread ? 'border-orange-200 shadow-md' : 'border-gray-100 opacity-75'}`}>
                  {/* จุดแจ้งเตือนสีแดง */}
                  {isUnread && (
                    <div className="absolute top-4 right-4 w-2 h-2 bg-[#EE4D2D] rounded-full shadow-sm"></div>
                  )}

                  <div className="flex gap-3.5">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0 border shadow-inner ${colorClass}`}>
                      {icon}
                    </div>
                    <div className="flex-1 pr-4">
                      <h3 className={`text-[13px] font-black leading-tight mb-1 ${isUnread ? 'text-gray-900' : 'text-gray-600'}`}>
                        {note.title}
                      </h3>
                      <p className="text-[11px] text-gray-500 font-medium leading-relaxed line-clamp-2 mb-2">
                        {note.message}
                      </p>
                      <span className="text-[9px] font-bold text-gray-400 flex items-center gap-1">
                        🕒 {note.time}
                      </span>
                    </div>
                  </div>
                </article>
              );

              return note.link ? (
                <Link href={note.link} key={note.id} className="block group">
                  {CardContent}
                </Link>
              ) : (
                <div key={note.id}>
                  {CardContent}
                </div>
              );
            })
          )}
        </main>
      </div>
    </div>
  );
}

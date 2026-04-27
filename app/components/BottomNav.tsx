'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'หน้าหลัก', href: '/', icon: '🏠' },
    { name: 'เรียกวิน', href: '/win-online', icon: '🛵' },
    { name: 'ลุ้นโชค', href: '/rewards', icon: '🎁' }, // เพิ่มเมนูนี้เข้าไปค่ะ
    { name: 'งานของฉัน', href: '/my-jobs', icon: '📋' },
    { name: 'โปรไฟล์', href: '/profile', icon: '👤' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-100 px-2 py-2 z-50 flex justify-around items-center max-w-3xl mx-auto rounded-t-[1.5rem] shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link key={item.name} href={item.href} className="flex flex-col items-center p-2 transition-all active:scale-90">
            <span className={`text-xl mb-1 ${isActive ? 'scale-125' : 'opacity-50'}`}>
              {item.icon}
            </span>
            <span className={`text-[10px] font-black ${isActive ? 'text-[#EE4D2D]' : 'text-gray-400'}`}>
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

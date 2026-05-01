'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'หน้าหลัก', href: '/win-online', icon: '🏠' },
    { name: 'บริการ', href: '/services', icon: '🔍' },
    { name: 'แจ้งเตือน', href: '/notifications', icon: '🔔', hasBadge: true },
    { name: 'บัญชี', href: '/profile', icon: '👤' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <nav className="w-full sm:max-w-2xl md:max-w-3xl pb-6 px-5 pointer-events-auto">
        <div className="bg-gray-900/95 backdrop-blur-xl rounded-[2.2rem] py-3 px-4 flex justify-between items-center shadow-2xl border border-white/10">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`flex flex-col items-center gap-1 w-16 transition-all duration-300 relative ${
                  isActive ? 'scale-110' : 'opacity-60 hover:opacity-100'
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className={`text-[9px] font-black tracking-wide ${isActive ? 'text-[#EE4D2D]' : 'text-gray-400'}`}>
                  {item.name}
                </span>
                
                {/* 🔴 จุดแจ้งเตือนสำหรับเมนู Notifications */}
                {item.hasBadge && (
                  <div className="absolute top-0 right-4 w-2.5 h-2.5 bg-[#EE4D2D] rounded-full border-2 border-gray-900" />
                )}

                {/* 🟠 แถบขีดล่างสำหรับเมนูที่ Active */}
                {isActive && (
                  <div className="absolute -bottom-1 w-1.5 h-1.5 bg-[#EE4D2D] rounded-full shadow-[0_0_8px_#EE4D2D]" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

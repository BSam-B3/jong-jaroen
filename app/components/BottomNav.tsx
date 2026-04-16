'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface BottomNavProps {
  currentMode?: 'customer' | 'provider';
}

const BottomNav = ({ currentMode = 'customer' }: BottomNavProps) => {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;
  
  const navItems = [
    { label: 'หน้าแรก', icon: '🏠', path: currentMode === 'provider' ? '/provider' : '/' },
    { label: 'งานด่วน', icon: '🛵', path: '/win-online' },
    { label: 'บริการ', icon: '🛠️', path: '/services' },
    { label: 'โปรไฟล์', icon: '👤', path: '/profile' },
  ];

  return (
    // เติม left-0 right-0 mx-auto ตรงนี้แล้วค่ะ
    <div className="fixed bottom-0 left-0 right-0 mx-auto w-full sm:max-w-2xl md:max-w-3xl bg-white/95 backdrop-blur-md border-t border-gray-100 px-2 py-4 flex justify-between items-center shadow-[0_-4px_25px_rgba(0,0,0,0.06)] rounded-t-[2.5rem] z-50">
      {navItems.map((item) => {
        const active = isActive(item.path);
        
        return (
          <div 
            key={item.label}
            onClick={() => router.push(item.path)} 
            className={`flex flex-col items-center gap-1.5 cursor-pointer transition-all duration-300 ${
              active ? 'scale-110' : 'opacity-40 hover:opacity-100'
            } flex-1`}
          >
            <span className="text-[24px]">{item.icon}</span>
            <span className={`text-[10px] font-bold ${active ? 'text-[#EE4D2D]' : 'text-gray-500'} whitespace-nowrap`}>
              {item.label}
            </span>
            {active && <div className="w-1.5 h-1.5 bg-[#EE4D2D] rounded-full shadow-sm mt-0.5"></div>}
          </div>
        );
      })}
    </div>
  );
};

export default BottomNav;

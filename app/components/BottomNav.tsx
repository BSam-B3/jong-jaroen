'use client';

import React from 'react';
import { Home, MapPin, Briefcase, User } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

interface BottomNavProps {
  currentMode?: 'customer' | 'provider';
}

const BottomNav = ({ currentMode = 'customer' }: BottomNavProps) => {
  const router = useRouter();
  const pathname = usePathname();

  // Theme logic based on mode
  const isActive = (path: string) => pathname === path;
  
  // ปรับสีพื้นหลังให้ดูพรีเมียมขึ้น
  const navClasses = currentMode === 'provider' 
    ? 'bg-gray-900 text-white shadow-[0_-8px_30px_rgba(0,0,0,0.3)] border-gray-800' 
    : 'bg-white text-gray-500 shadow-[0_8px_30px_rgba(0,0,0,0.12)] border-gray-100';

  const navItems = [
    { label: 'หน้าแรก', icon: Home, path: currentMode === 'provider' ? '/provider' : '/' },
    { label: 'จ้างงาน', icon: MapPin, path: '/win-online' },
    { label: 'บริการ', icon: Briefcase, path: '/services' },
    { label: 'โปรไฟล์', icon: User, path: '/profile' },
  ];

  return (
    <div className={`fixed bottom-6 left-6 right-6 z-50 ${navClasses} border px-6 py-4 flex justify-between items-center rounded-[2.5rem] transition-all duration-300`}>
      {navItems.map((item) => {
        const active = isActive(item.path);
        return (
          <button
            key={item.label}
            onClick={() => router.push(item.path)}
            className={`flex flex-col items-center gap-1.5 min-w-[64px] transition-colors ${
              active ? 'text-[#EE4D2D]' : 'hover:text-gray-800'
            }`}
          >
            <item.icon size={24} strokeWidth={active ? 2.5 : 2} />
            <span className={`text-[10px] sm:text-xs ${active ? 'font-bold' : 'font-medium'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;

// app/page.tsx หรือไฟล์ Layout ที่ควบคุม Bottom Nav
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // 定義เมนูหลัก (เหลือ 4 อัน)
  const navItems = [
    { name: 'หน้าแรก', path: '/', icon: '🏠' },
    { name: 'บริการ', path: '/services', icon: '🛠️' },
    { name: 'งานด่วน', path: '/win-online', icon: '📋' },
    { name: 'ฉัน', path: '/profile', icon: '👤' }, // ✅ หน้า 'ฉัน' เป็นเมนูลำดับที่ 4
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ส่วนเนื้อหาหลัก */}
      <main className="flex-1 pb-20"> {/* pb-20 เพื่อไม่ให้เมนูบังเนื้อหา */}
        {children}
      </main>

      {/* ✅ Bottom Navigation (ปรับเหลือ 4 ไอคอน) */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] z-50">
        <nav className="flex justify-around items-center h-20 px-4">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link key={item.path} href={item.path} className="flex flex-col items-center gap-1.5 group">
                <span className={`text-2xl transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </span>
                <span className={`text-xs font-bold transition-colors ${isActive ? 'text-orange-600' : 'text-gray-500 group-hover:text-orange-500'}`}>
                  {item.name}
                </span>
                {/* ขีดล่างเมื่อ Active */}
                {isActive && (
                  <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-0.5"></div>
                )}
              </Link>
            );
          })}
        </nav>
      </footer>
    </div>
  );
}

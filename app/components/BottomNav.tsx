'use client';

import Link from "next/link";
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 w-full sm:max-w-2xl md:max-w-3xl left-1/2 -translate-x-1/2 z-50">
      <nav className="bg-white/95 backdrop-blur-md border-t border-gray-100 px-2 py-2 flex items-center shadow-[0_-4px_25px_rgba(0,0,0,0.06)] rounded-t-[2.5rem]">
        <NavItem icon="🏠" label="หน้าหลัก" href="/" pathname={pathname} />
        
        {/* ✅ เพิ่มปุ่มตลาดชุมชน */}
        <NavItem icon="🛒" label="ตลาดชุมชน" href="/marketplace/shops" pathname={pathname} />
        
        {/* ✅ ชี้ไปที่ app/notifications/page.tsx ตามที่คุณสั่ง */}
        <NavItem icon="🔔" label="แจ้งเตือน" href="/notifications" pathname={pathname} />
        
        <NavItem icon="👤" label="บัญชี" href="/profile" pathname={pathname} />
      </nav>
    </div>
  );
}

function NavItem({ icon, label, href, pathname, hasBadge }: { icon: string, label: string, href: string, pathname: string, hasBadge?: boolean }) {
  const active = href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <Link 
      href={href} 
      className={`relative flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${active ? 'scale-110' : 'opacity-40 hover:opacity-100'} flex-1 h-14`}
    >
      <span className="text-[26px] leading-none relative">
        {icon}
        {hasBadge && (
          <div className="absolute -top-1 -right-0.5 w-2.5 h-2.5 bg-[#EE4D2D] rounded-full border-2 border-white shadow-sm"></div>
        )}
      </span>
      <span className={`text-[10px] font-black tracking-wide ${active ? 'text-[#EE4D2D]' : 'text-gray-500'} whitespace-nowrap`}>
        {label}
      </span>
      {active && (
        <div className="absolute -bottom-0.5 w-1.5 h-1.5 bg-[#EE4D2D] rounded-full shadow-sm"></div>
      )}
    </Link>
  );
}

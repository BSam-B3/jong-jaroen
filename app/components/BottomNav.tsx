'use client'; // ✅ ต้องใช้ 'use client' เพราะเราใช้ usePathname ค่ะ
import Link from "next/link";
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 w-full sm:max-w-2xl md:max-w-3xl bg-white/95 backdrop-blur-md border-t border-gray-100 px-8 py-4 flex justify-between items-center shadow-[0_-4px_25px_rgba(0,0,0,0.06)] rounded-t-[2.5rem] z-50">
      <NavItem icon="🏠" label="หน้าหลัก" href="/" pathname={pathname} />
      <NavItem icon="💼" label="งานของฉัน" href="/my-jobs" pathname={pathname} />
      <NavItem icon="👤" label="บัญชี" href="/profile" pathname={pathname} />
    </nav>
  );
}

// คอมโพเนนต์เมนูด้านล่าง (เจมปรับระยะห่างให้สมดุลสำหรับ 3 ปุ่มค่ะ)
function NavItem({ icon, label, href, pathname }: { icon: string, label: string, href: string, pathname: string }) {
  // ตรวจสอบว่าลิงก์นี้กำลังเปิดอยู่หรือไม่ (Active State)
  const active = pathname === href;

  return (
    <Link href={href} className={`flex flex-col items-center gap-1.5 cursor-pointer transition-all ${active ? 'scale-110' : 'opacity-40 hover:opacity-100'} px-6`}>
      <span className="text-[26px]">{icon}</span>
      <span className={`text-[10px] font-black tracking-wide ${active ? 'text-[#EE4D2D]' : 'text-gray-500'} whitespace-nowrap`}>{label}</span>
      {active && <div className="w-1.5 h-1.5 bg-[#EE4D2D] rounded-full shadow-sm mt-0.5"></div>}
    </Link>
  );
}

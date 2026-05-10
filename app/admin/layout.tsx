'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();

  // ปิด Sidebar อัตโนมัติในมือถือ หรือเมื่อเปลี่ยนหน้า
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-[#F4F6F8] font-sans overflow-x-hidden relative">
      
      {/* 🌑 Overlay สีดำสำหรับมือถือ (คลิกเพื่อปิด) */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden animate-in fade-in" 
        />
      )}

      {/* ⬅️ Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 bg-white shadow-2xl transition-all duration-300 ease-in-out border-r border-gray-100 flex flex-col
        ${isSidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20'}`}
      >
         {/* โลโก้ */}
         <div className="p-6 h-24 flex items-center justify-center md:justify-start overflow-hidden whitespace-nowrap border-b border-gray-50">
            <h2 className="text-[#EE4D2D] font-black text-xl tracking-tighter">
              {isSidebarOpen ? 'JONG-JAROEN' : 'JJ'}
            </h2>
         </div>

         {/* เมนูต่างๆ */}
         <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto no-scrollbar">
           {[
             { icon: '📊', label: 'ภาพรวม', href: '/admin' },
             { icon: '👥', label: 'สมาชิก', href: '/admin/users' },
             { icon: '🛵', label: 'งานวิน', href: '/admin/jobs' },
             { icon: '🛡️', label: 'ตรวจ KYC', href: '/admin/kyc' },
           ].map((item) => (
             <Link key={item.label} href={item.href} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-orange-50 transition-colors group">
               <span className="text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
               <span className={`font-bold text-gray-600 group-hover:text-[#EE4D2D] transition-opacity duration-200 ${!isSidebarOpen && 'opacity-0 md:hidden'}`}>
                 {item.label}
               </span>
             </Link>
           ))}
         </nav>

         {/* 🔘 ปุ่มลูกศรพับเก็บ Sidebar (Desktop) */}
         <button
           onClick={() => setIsSidebarOpen(!isSidebarOpen)}
           className="hidden md:flex absolute top-10 -right-4 w-8 h-8 bg-[#EE4D2D] text-white rounded-full items-center justify-center shadow-lg hover:scale-110 transition-transform z-50 text-lg font-bold"
         >
           <span className={`transform transition-transform duration-300 ${!isSidebarOpen ? 'rotate-180' : ''}`}>‹</span>
         </button>
      </aside>

      {/* 📄 พื้นที่เนื้อหาหลัก (ดันหลบ Sidebar ตามขนาด) */}
      <main className={`flex-1 transition-all duration-300 ease-in-out w-full ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
        {children}
      </main>

      {/* 📱 ปุ่มลูกศรเปิด Sidebar (Mobile Floating Button) */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="md:hidden fixed bottom-6 left-6 w-12 h-12 bg-[#EE4D2D] text-white rounded-full shadow-2xl flex items-center justify-center text-2xl z-[60] font-black active:scale-95 transition-transform"
        >
          ›
        </button>
      )}

      <style dangerouslySetInnerHTML={{__html: `.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}} />
    </div>
  );
}

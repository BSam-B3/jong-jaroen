'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function BottomNav() {
  const pathname = usePathname();
  const [isProvider, setIsProvider] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('profiles').select('mode').eq('id', user.id).single()
        .then(({ data }) => {
          if (data?.mode === 'provider') setIsProvider(true);
        });
    });
  }, []);

  if (isProvider) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 shadow-lg">
        <div className="flex items-center justify-around px-2 py-3 max-w-2xl mx-auto">
          <Link href="/provider" className={pathname === '/provider' ? 'flex flex-col items-center text-orange-400' : 'flex flex-col items-center text-gray-400'}>
            <span className="text-[22px]">📋</span>
            <span className="text-[10px] font-bold">งาน</span>
          </Link>
          <Link href="/win-online" className={pathname === '/win-online' ? 'flex flex-col items-center text-orange-400' : 'flex flex-col items-center text-gray-400'}>
            <span className="text-[22px]">⚡</span>
            <span className="text-[10px] font-bold">รับงาน</span>
          </Link>
          <Link href="/profile" className={pathname === '/profile' ? 'flex flex-col items-center text-orange-400' : 'flex flex-col items-center text-gray-400'}>
            <span className="text-[22px]">👤</span>
            <span className="text-[10px] font-bold">โปรไฟล์</span>
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-lg">
      <div className="flex items-center justify-around px-2 py-3 max-w-2xl mx-auto">
        <Link href="/" className={pathname === '/' ? 'flex flex-col items-center text-[#EE4D2D]' : 'flex flex-col items-center text-gray-400'}>
          <span className="text-[22px]">🏠</span>
          <span className="text-[10px] font-bold">หน้าแรก</span>
        </Link>
        <Link href="/win-online" className={pathname === '/win-online' ? 'flex flex-col items-center text-[#EE4D2D]' : 'flex flex-col items-center text-gray-400'}>
          <span className="text-[22px]">⚡</span>
          <span className="text-[10px] font-bold">จ้างงาน</span>
        </Link>
        <Link href="/services" className={pathname === '/services' ? 'flex flex-col items-center text-[#EE4D2D]' : 'flex flex-col items-center text-gray-400'}>
          <span className="text-[22px]">🛠️</span>
          <span className="text-[10px] font-bold">บริการ</span>
        </Link>
        <Link href="/profile" className={pathname === '/profile' ? 'flex flex-col items-center text-[#EE4D2D]' : 'flex flex-col items-center text-gray-400'}>
          <span className="text-[22px]">👤</span>
          <span className="text-[10px] font-bold">โปรไฟล์</span>
        </Link>
      </div>
    </nav>
  );
}

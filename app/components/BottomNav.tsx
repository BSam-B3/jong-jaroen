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
                <nav className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-2xl">
                        <div className="bg-black/90 rounded-[2.5rem] shadow-lg shadow-black/20 border border-white/10 backdrop-blur-md">
                                  <div className="flex items-center justify-around px-2 py-3 max-w-2xl mx-auto">
                                              <Link href="/provider" className={pathname === '/provider' ? 'flex flex-col items-center text-[#EE4D2D]' : 'flex flex-col items-center text-gray-400'}>
                                                            <span className="text-[22px]">🔧</span>
                                                            <span className="text-[10px] font-bold">หน้า</span>
                                              </Link>
                                              <Link href="/win-online" className={pathname === '/win-online' ? 'flex flex-col items-center text-[#EE4D2D]' : 'flex flex-col items-center text-gray-400'}>
                                                            <span className="text-[22px]">⚡</span>
                                                            <span className="text-[10px] font-bold">รับงาน</span>
                                              </Link>
                                              <Link href="/profile" className={pathname === '/profile' ? 'flex flex-col items-center text-[#EE4D2D]' : 'flex flex-col items-center text-gray-400'}>
                                                            <span className="text-[22px]">👤</span>
                                                            <span className="text-[10px] font-bold">โปรไฟล์</span>
                                              </Link>
                                  </div>
                        </div>
                </nav>
              );
  }
  
    return (
          <nav className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-2xl">
                <div className="bg-white rounded-[2.5rem] shadow-lg shadow-black/10 border border-gray-100">
                        <div className="flex items-center justify-around px-2 py-3 max-w-2xl mx-auto">
                                  <Link href="/" className={pathname === '/' ? 'flex flex-col items-center text-[#EE4D2D]' : 'flex flex-col items-center text-gray-400'}>
                                              <span className="text-[22px]">🏠</span>
                                              <span className="text-[10px] font-bold">หน้าแรก</span>
                                  </Link>
                                  <Link href="/win-online" className={pathname === '/win-online' ? 'flex flex-col items-center text-[#EE4D2D]' : 'flex flex-col items-center text-gray-400'}>
                                              <span className="text-[22px]">⚡</span>
                                              <span className="text-[10px] font-bold">เรียกรถ</span>
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
                </div>
          </nav>
        );
}

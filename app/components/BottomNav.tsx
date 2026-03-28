'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const NAV_CUSTOMER = [
  { href: '/',           icon: '🏠', label: 'หน้าแรก' },
  { href: '/services',   icon: '🛠️', label: 'บริการ' },
  { href: '/win-online', icon: '📋', label: 'งานด่วน' },
  { href: '/news',       icon: '📰', label: 'ข่าวสาร' },
  { href: '/coupons',    icon: '🎟️', label: 'ปองเจริญ' },
  { href: '/profile',    icon: '👤', label: 'ฉัน' },
  ];

const NAV_PROVIDER = [
  { href: '/provider',   icon: '🏠', label: 'หน้าแรก' },
  { href: '/services',   icon: '🛠️', label: 'บริการ' },
  { href: '/win-online', icon: '📋', label: 'งานด่วน' },
  { href: '/news',       icon: '📰', label: 'ข่าวสาร' },
  { href: '/coupons',    icon: '🎟️', label: 'ปองเจริญ' },
  { href: '/profile',    icon: '👤', label: 'ฉัน' },
  ];

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

  const navItems = isProvider ? NAV_PROVIDER : NAV_CUSTOMER;

  return (
        <nav className="fixed bottom-0 w-full sm:max-w-2xl md:max-w-3xl bg-white/95 backdrop-blur-md border-t border-gray-100 px-1 py-4 flex justify-between items-center shadow-[0_-4px_25px_rgba(0,0,0,0.06)] rounded-t-[2.5rem] z-50">
          {navItems.map(({ href, icon, label }) => {
                  const active = pathname === href;
                  return (
                              <Link
                                            key={href}
                                            href={href}
                                            className={`flex flex-col items-center gap-0.5 flex-1 transition-all duration-200 ${
                                                            active
                                                              ? 'scale-110 text-[#EE4D2D]'
                                                              : 'opacity-40 hover:opacity-100 text-gray-500'
                                            }`}
                                          >
                                          <span className="text-[22px] leading-none">{icon}</span>
                                          <span className="text-[9px] font-bold tracking-tight">{label}</span>
                                {active && (
                                                          <div className="w-1.5 h-1.5 bg-[#EE4D2D] rounded-full shadow-sm mt-0.5" />
                                                        )}
                              </Link>
                            );
        })}
        </nav>
      );
}

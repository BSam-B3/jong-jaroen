'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type UserMode = 'customer' | 'provider';

interface NavItem {
  href: string;
  label: string;
  emoji: string;
}

const customerNav: NavItem[] = [
  { href: '/', label: 'หน้าแรก', emoji: '🏠' },
  { href: '/win-online', label: 'จ้างงาน', emoji: '⚡' },
  { href: '/services', label: 'บริการ', emoji: '🛠️' },
  { href: '/profile', label: 'โปรไฟล์', emoji: '👤' },
];

const providerNav: NavItem[] = [
  { href: '/provider', label: 'งาน', emoji: '📋' },
  { href: '/win-online', label: 'รับงาน', emoji: '⚡' },
  { href: '/profile', label: 'โปรไฟล์', emoji: '👤' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [mode, setMode] = useState<UserMode>('customer');

  useEffect(() => {
    const fetchMode = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('mode')
        .eq('id', user.id)
        .single();
      if (data?.mode === 'provider' || data?.mode === 'customer') {
        setMode(data.mode as UserMode);
      }
    };
    fetchMode();

    const channel = supabase
      .channel('profile-mode')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          const newMode = payload.new?.mode;
          if (newMode === 'provider' || newMode === 'customer') {
            setMode(newMode as UserMode);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const isProvider = mode === 'provider';
  const navItems = isProvider ? providerNav : customerNav;
  const bgClass = isProvider
    ? 'bg-gray-900 border-gray-700'
    : 'bg-white/95 border-gray-100';

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-50 ${bgClass} border-t shadow-lg backdrop-blur-md`}>
      <div className="flex items-center justify-around px-2 py-3 max-w-2xl mx-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          const activeColor = isProvider ? 'text-orange-400' : 'text-[#EE4D2D]';
          const inactiveColor = isProvider ? 'text-gray-400' : 'text-gray-400';
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${isActive ? activeColor : inactiveColor}`}
            >
              <span className="text-[22px]">{item.emoji}</span>
              <span className="text-[10px] font-bold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

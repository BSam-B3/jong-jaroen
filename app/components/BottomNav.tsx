'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Briefcase, MessageCircle, User, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type UserMode = 'customer' | 'provider';

interface NavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
}

const customerNav: NavItem[] = [
  { href: '/',           label: 'หน้าแรก',  icon: <Home size={22} /> },
  { href: '/win-online', label: 'จ้างงาน',  icon: <Zap size={22} /> },
  { href: '/services',   label: 'บริการ',   icon: <Briefcase size={22} /> },
  { href: '/profile',    label: 'โปรไฟล์', icon: <User size={22} /> },
  ];

const providerNav: NavItem[] = [
  { href: '/provider',   label: 'งาน',      icon: <Zap size={22} /> },
  { href: '/win-online', label: 'รับงาน',   icon: <Briefcase size={22} /> },
  { href: '/profile',    label: 'โปรไฟล์', icon: <User size={22} /> },
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

                // Subscribe to realtime changes on profiles.mode
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

  // Theme: Provider = dark/high-contrast, Customer = light/orange
  const bgClass    = isProvider ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100';
    const activeClass   = 'text-brand-primary';
    const inactiveClass = isProvider ? 'text-gray-400' : 'text-gray-500';

  return (
        <nav className={`fixed bottom-0 left-0 right-0 z-50 ${bgClass} border-t shadow-lg`}>
                <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                                  (item.href !== '/' && pathname.startsWith(item.href));
                    return (
                                  <Link
                                                  key={item.href}
                                                  href={item.href}
                                                  className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-brand-xs transition-colors
                                                                  ${isActive ? activeClass : inactiveClass}
                                                                                  ${isActive && !isProvider ? 'bg-brand-primary-light' : ''}
                                                                                                `}
                                                >
                                    {item.icon}
                                                <span className="text-[10px] font-medium">{item.label}</span>span>
                                  </Link>Link>
                                );
        })}
                </div>div>
        </nav>nav>
      );
}</div>

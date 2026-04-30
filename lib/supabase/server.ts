import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export const sbServer = () => {
  const c = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => c.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) => {
          try {
            c.set({ name, value, ...options });
          } catch (error) {
            // ดัก Error ไว้กรณีที่ Server Component พยายามแก้ไขคุกกี้
          }
        },
        remove: (name: string, options: CookieOptions) => {
          try {
            c.set({ name, value: '', ...options });
          } catch (error) {
            // ดัก Error ไว้กรณีที่ Server Component พยายามแก้ไขคุกกี้
          }
        }
      }
    }
  );
};

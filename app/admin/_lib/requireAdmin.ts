import 'server-only';
import { redirect } from 'next/navigation';
// ✅ แก้ไขการ Import ให้ตรงกับชื่อใหม่ที่เราเปลี่ยนใน server.ts
import { sbServer } from '@/lib/supabase/server';

export async function requireAdmin(currentPath: string) {
  // ✅ เปลี่ยนจาก createClient() เป็น sbServer()
  const supabase = sbServer();
  
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect(`/auth/login?next=${encodeURIComponent(currentPath)}`);
  }

  // ตรวจสอบสิทธิ์ Admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/');
  }

  return session;
}

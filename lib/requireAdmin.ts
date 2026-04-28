import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function requireAdmin(currentPath: string) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(currentPath)}`);
  const { data: isAdmin } = await sb.rpc('is_admin');
  if (!isAdmin) redirect('/');
  return { sb, user };
}

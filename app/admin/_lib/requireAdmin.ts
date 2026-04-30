import 'server-only';
import { redirect } from 'next/navigation';
import { sbServer } from '@/lib/supabase/server';

/**
 * Server-side admin gate.
 * - Validates the session against Supabase Auth (getUser → /auth/v1/user)
 * so a forged/expired cookie cannot pass.
 * - Verifies admin role via RPC `is_admin` (preferred) with profiles.role fallback.
 *
 * Returns the authenticated `user` so callers don't have to re-fetch it.
 * Callers should obtain a Supabase client separately:
 * const user = await requireAdmin('/admin');
 * const sb = sbServer();
 */
export async function requireAdmin(currentPath: string) {
  const supabase = sbServer();

  // 1) Network-validated user (replaces getSession)
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    redirect(`/auth/login?next=${encodeURIComponent(currentPath)}`);
  }

  // 2) Authorize via RPC, fallback to profiles.role
  const { data: isAdminRpc, error: rpcErr } = await supabase.rpc('is_admin');

  let isAdmin = isAdminRpc === true;
  if (rpcErr || isAdminRpc === null || isAdminRpc === undefined) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    isAdmin = profile?.role === 'admin';
  }

  if (!isAdmin) {
    redirect('/');
  }

  return user;
}

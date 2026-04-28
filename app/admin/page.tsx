import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminDashboardClient, {
  type DashboardStats,
} from './AdminDashboardClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboardPage() {
  const sb = await createClient();

  // 1) ตรวจสอบ session
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect('/auth/login?next=/admin');

  // 2) ตรวจสอบสิทธิ์แอดมิน (ก่อนยิง RPC เพื่อ UX ที่ดี)
  const { data: isAdmin, error: adminErr } = await sb.rpc('is_admin');
  if (adminErr || !isAdmin) redirect('/');

  // 3) ดึงสถิติทั้งหมดจาก RPC ตัวเดียว (atomic + ปลอดภัย)
  const { data: stats, error: statsErr } = await sb.rpc(
    'admin_dashboard_stats'
  );

  if (statsErr) {
    console.error('[admin dashboard] rpc error:', statsErr.message);
    throw new Error('ไม่สามารถโหลดข้อมูลแดชบอร์ดได้');
  }

  // 4) ป้องกันกรณี RPC คืนค่าผิดรูป
  const safeStats: DashboardStats = {
    total_users: stats?.total_users ?? 0,
    pending_kyc: stats?.pending_kyc ?? 0,
    active_jobs: stats?.active_jobs ?? 0,
    today_jobs: stats?.today_jobs ?? 0,
    recent_jobs: Array.isArray(stats?.recent_jobs) ? stats.recent_jobs : [],
  };

  return <AdminDashboardClient stats={safeStats} />;
}

import { requireAdmin } from '../../_lib/requireAdmin';
import KycReviewClient from './KycReviewClient';
import { sbServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminKycReviewPage({ params }: any) {
  const { id } = await params;
  
  // 1. ตรวจสอบสิทธิ์แอดมิน
  await requireAdmin(`/admin/kyc/${id}`);

  // 2. เรียกเครื่องมือเชื่อมต่อฐานข้อมูลโดยตรง
  const sb = sbServer();

  // 3. เรียกใช้ RPC ดึงข้อมูล
  const { data, error } = await sb.rpc('admin_get_kyc_data', { p_target_user_id: id });

  // 🚨 ถ้า Error ให้ "ฟ้องขึ้นหน้าจอ"
  if (error) {
    throw new Error(`ฐานข้อมูลเกิดปัญหา: ${error.message}`);
  }

  // ถ้าไม่ Error แต่หาข้อมูลคนนี้ไม่เจอ
  if (!data || !data.profile) {
    throw new Error(`ไม่พบข้อมูลผู้ใช้งานรหัส: ${id}`);
  }

  return <KycReviewClient profile={data.profile} />;
}

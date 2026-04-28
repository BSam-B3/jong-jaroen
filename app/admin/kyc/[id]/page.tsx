import { requireAdmin } from '../../_lib/requireAdmin';
import KycReviewClient from './KycReviewClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminKycReviewPage({ params }: any) {
  const { id } = await params;
  const { sb } = await requireAdmin(`/admin/kyc/${id}`);

  // เรียกใช้ RPC ดึงข้อมูล
  const { data, error } = await sb.rpc('admin_get_kyc_data', { p_target_user_id: id });

  // 🚨 แก้ไขจุดนี้: ถ้า Error ให้ "ฟ้องขึ้นหน้าจอ" แทนที่จะไปหน้า 404
  if (error) {
    throw new Error(`ฐานข้อมูลเกิดปัญหา: ${error.message}`);
  }

  // ถ้าไม่ Error แต่หาข้อมูลคนนี้ไม่เจอ
  if (!data || !data.profile) {
    throw new Error(`ไม่พบข้อมูลผู้ใช้งานรหัส: ${id}`);
  }

  return <KycReviewClient profile={data.profile} />;
}

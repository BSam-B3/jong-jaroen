import { notFound } from 'next/navigation';
import { requireAdmin } from '../../_lib/requireAdmin';
import KycReviewClient from './KycReviewClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminKycReviewPage({ params }: any) {
  const { id } = await params;
  const { sb } = await requireAdmin(`/admin/kyc/${id}`);

  // เรียกใช้ RPC ตัวใหม่ ทะลวงตู้เซฟดึง Email มาครบ
  const { data, error } = await sb.rpc('admin_get_kyc_data', { p_target_user_id: id });

  // แก้ไขจุดนี้: ป้องกัน Error เป็น null
  if (error || !data) {
    console.error('KYC ID Fetch Error:', error?.message || 'No data found');
    notFound();
  }

  return <KycReviewClient profile={data.profile} />;
}

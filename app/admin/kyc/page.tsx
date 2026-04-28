import { requireAdmin } from '../_lib/requireAdmin';
import KycListClient, { type KycListResponse } from './KycListClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PAGE_SIZE = 20;

type SearchParams = { page?: string };

export default async function AdminKYCPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { sb } = await requireAdmin('/admin/kyc');
  const { page } = await searchParams;

  const pageNum = Math.max(1, Number.parseInt(page ?? '1', 10) || 1);
  const offset = (pageNum - 1) * PAGE_SIZE;

  const { data, error } = await sb.rpc('admin_list_pending_kyc', {
    p_limit: PAGE_SIZE,
    p_offset: offset,
  });

  if (error) {
    console.error('[admin/kyc] rpc error:', error.message);
    throw new Error('ไม่สามารถโหลดรายการ KYC ได้');
  }

  const safe: KycListResponse = {
    total: data?.total ?? 0,
    limit: data?.limit ?? PAGE_SIZE,
    offset: data?.offset ?? 0,
    items: Array.isArray(data?.items) ? data.items : [],
  };

  return <KycListClient data={safe} pageNum={pageNum} pageSize={PAGE_SIZE} />;
}

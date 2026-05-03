import { requireAdmin } from '../_lib/requireAdmin';
import KycListClient, { type KycListResponse } from './KycListClient';
import { sbServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PAGE_SIZE = 20;

export default async function AdminKYCPage({ searchParams }: any) {
  // 1. ตรวจสอบสิทธิ์แอดมิน (Force redirect ถ้าไม่ใช่แอดมิน)
  await requireAdmin('/admin/kyc');
  
  // 2. เรียกใช้ Supabase Server Client
  const sb = sbServer();

  // 3. จัดการ Pagination (รองรับ Next.js 15 async searchParams)
  const params = await searchParams;
  const pageNum = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1);
  const offset = (pageNum - 1) * PAGE_SIZE;

  // 4. ดึงข้อมูลผ่าน RPC (เรียกใช้ฟังก์ชันที่เราสร้างไว้ใน SQL)
  const { data, error } = await sb.rpc('admin_list_pending_kyc', {
    p_limit: PAGE_SIZE,
    p_offset: offset,
  });

  if (error) {
    console.error('[admin/kyc] RPC Error:', error.message);
    // ส่ง Error ไปที่ Error Boundary ของ Next.js
    throw new Error('ระบบไม่สามารถโหลดรายการ KYC ได้ในขณะนี้');
  }

  // 5. ปั้นข้อมูลให้ปลอดภัย (Sanitize Data) ก่อนส่งให้ Client Component
  const safe: KycListResponse = {
    total: data?.total ?? 0,
    limit: data?.limit ?? PAGE_SIZE,
    offset: data?.offset ?? 0,
    items: Array.isArray(data?.items) ? data.items : [],
  };

  return (
    <div className="animate-in fade-in duration-500">
      <KycListClient 
        data={safe} 
        pageNum={pageNum} 
        pageSize={PAGE_SIZE} 
      />
    </div>
  );
}

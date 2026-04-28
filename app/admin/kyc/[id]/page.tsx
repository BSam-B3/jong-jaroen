import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import KycReviewClient from './KycReviewClient';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: { id: string } }) {
  const { id } = params;

  // 1. ตรวจสอบสิทธิ์แอดมินที่ฝั่ง Server (ปลอมแปลงไม่ได้)
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: isAdmin } = await sb.rpc('is_admin');
  if (!isAdmin) redirect('/');

  // 2. ใช้ Admin Client ดึงข้อมูล Profile (แม้จะเป็นตาราง Private ก็ดึงได้)
  const admin = createAdminClient();
  const { data: profile } = await admin.from('profiles').select('*').eq('id', id).single();
  
  if (!profile) notFound();

  // 3. 📝 บันทึกลง Log ว่าแอดมินเปิดเข้ามาดูหน้าโปรไฟล์นี้แล้ว (Audit Trail)
  await admin.from('kyc_access_log').insert({
    target_user: id,
    viewer: user.id,
    action: 'view_kyc_page',
  });

  return (
    <KycReviewClient
      userId={id}
      profile={profile}
      imageSrc={`/api/admin/kyc/${id}/image`}
    />
  );
}

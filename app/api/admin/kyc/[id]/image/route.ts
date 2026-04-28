import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: targetUserId } = params;

  // 1. ตรวจสอบสิทธิ์แอดมิน (ตรวจสอบที่ Server ชัวร์ที่สุด)
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return new NextResponse('UNAUTHORIZED', { status: 401 });

  const { data: isAdmin } = await sb.rpc('is_admin');
  if (!isAdmin) return new NextResponse('FORBIDDEN', { status: 403 });

  // 2. ใช้ Admin Client ไปหาไฟล์รูปใน Bucket ส่วนตัว
  const admin = createAdminClient();
  const { data: files } = await admin.storage.from('kyc_documents').list(targetUserId);

  const imageFile = files?.find(f => /\.(jpe?g|png|webp)$/i.test(f.name));
  if (!imageFile) return new NextResponse('NOT_FOUND', { status: 404 });

  // 3. 📝 บันทึกลง Log ว่าแอดมินคนนี้มาแอบส่องรูปคนนี้แล้วนะ (Audit Trail)
  await admin.from('kyc_access_log').insert({
    target_user: targetUserId,
    viewer: user.id,
    action: 'view_id_card_image',
  });

  // 4. ดาวน์โหลดไฟล์และส่งคืนเป็น Raw Bytes (ไม่มีลิงก์หลุดไปที่เบราว์เซอร์)
  const { data: blob, error: dlErr } = await admin.storage
    .from('kyc_documents')
    .download(`${targetUserId}/${imageFile.name}`);

  if (dlErr || !blob) return new NextResponse('INTERNAL_ERROR', { status: 500 });

  const buf = await blob.arrayBuffer();
  return new NextResponse(buf, {
    headers: {
      'Content-Type': blob.type || 'image/jpeg',
      'Cache-Control': 'private, no-store, no-cache, must-revalidate',
    },
  });
}

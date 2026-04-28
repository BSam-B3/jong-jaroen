import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  // 1. เช็คว่าเป็นแอดมินจริงไหม
  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) return new NextResponse('Unauthorized', { status: 403 });

  // 2. ไปหยิบรูปลับมาจาก Storage
  const { data: files } = await admin.storage.from('kyc_documents').list(id);
  const imageFile = files?.find(f => /\.(jpe?g|png|webp)$/i.test(f.name));

  if (!imageFile) return new NextResponse('Not Found', { status: 404 });

  const { data, error } = await admin.storage
    .from('kyc_documents')
    .createSignedUrl(`${id}/${imageFile.name}`, 60);

  if (error || !data.signedUrl) return new NextResponse('Error', { status: 500 });

  // 3. ส่งแอดมินไปที่ลิงก์ลับนั้น
  return NextResponse.redirect(data.signedUrl);
}

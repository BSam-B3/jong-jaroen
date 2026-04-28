import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'id_card'; // รับค่าว่าจะดูรูปอะไร

  const sb = await createClient();

  // 1) ตรวจสิทธิ์แอดมินก่อนให้ดูรูป (P0 Security)
  const { data: isAdmin, error: adminError } = await sb.rpc('is_admin');
  if (adminError || !isAdmin) return new NextResponse('Forbidden', { status: 403 });

  // 2) ดึงชื่อไฟล์จากโปรไฟล์
  const { data: profile } = await sb.from('profiles').select('id_card_url, selfie_url').eq('id', id).single();
  if (!profile) return new NextResponse('Not Found', { status: 404 });

  // เลือกไฟล์ตามที่ขอมา
  const filePath = type === 'selfie' ? profile.selfie_url : profile.id_card_url;
  if (!filePath) return new NextResponse('Not Found', { status: 404 });

  // 3) ดึงรูปจาก Storage (สมมติว่าใช้บัคเก็ตชื่อ 'kyc' เปลี่ยนได้ถ้าบีสามใช้ชื่ออื่น)
  const { data, error } = await sb.storage.from('kyc').download(filePath);
  if (error) {
    console.error(`Storage Download Error (${id}):`, error.message);
    return new NextResponse('Error loading image', { status: 500 });
  }

  return new NextResponse(data, { headers: { 'Content-Type': 'image/jpeg' } });
}

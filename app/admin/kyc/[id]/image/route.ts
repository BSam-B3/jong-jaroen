import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: any, { params }: any) {
  const { id } = await params;
  const sb = await createClient();

  // ตรวจสิทธิ์แอดมินก่อนให้ดูรูป
  const { data: isAdmin } = await sb.rpc('is_admin');
  if (!isAdmin) return new NextResponse('Forbidden', { status: 403 });

  // ดึงชื่อไฟล์จากโปรไฟล์
  const { data: profile } = await sb.from('profiles').select('id_card_url').eq('id', id).single();
  if (!profile?.id_card_url) return new NextResponse('Not Found', { status: 404 });

  // ดึงไฟล์จาก Storage (สมมติว่าใช้บัคเก็ตชื่อ 'kyc')
  const { data, error } = await sb.storage.from('kyc').download(profile.id_card_url);
  
  if (error) return new NextResponse('Error loading image', { status: 500 });

  return new NextResponse(data, { headers: { 'Content-Type': 'image/jpeg' } });
}

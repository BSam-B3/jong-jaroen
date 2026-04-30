import { NextResponse, type NextRequest } from 'next/server';
// ✅ เปลี่ยนมาใช้ sbAdmin ตามที่เราตั้งชื่อไว้ใน lib/supabase/admin.ts
import { sbAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ใช้กุญแจ Admin (Service Role) ดึงรูปจาก Storage โดยตรง
    const { data, error } = await sbAdmin
      .storage
      .from('kyc-documents')
      .download(params.id);

    if (error) {
      console.error('Storage error:', error.message);
      return NextResponse.json({ error: 'ไม่สามารถโหลดรูปภาพได้' }, { status: 404 });
    }

    return new NextResponse(data, {
      headers: {
        'Content-Type': data.type || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

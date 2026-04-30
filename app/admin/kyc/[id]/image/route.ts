import { NextResponse, type NextRequest } from 'next/server';
// ✅ แก้ไขจาก createClient เป็น sbServer
import { sbServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = sbServer(); // ✅ เรียกใช้ชื่อใหม่
    
    // ดึงข้อมูลรูปภาพจาก Storage
    const { data, error } = await supabase
      .storage
      .from('kyc-documents')
      .download(params.id);

    if (error) throw error;

    return new NextResponse(data, {
      headers: {
        'Content-Type': data.type,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

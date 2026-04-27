import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// 1) ปิดระบบ Cache ทั้งหมดสำหรับ Route นี้ (เพราะเป็นข้อมูล PII ที่ต้องอัปเดตเรียลไทม์)
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // 2) ตรวจสอบว่าใครเป็นคนเรียกใช้งาน API นี้ (ตรวจเช็ค Session)
    const sb = await createClient();
    const { data: { user }, error: userErr } = await sb.auth.getUser();
    
    if (userErr || !user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    // 3) ตรวจสอบสิทธิ์ว่าคนนี้เป็น Admin จริงๆ หรือไม่
    const { data: isAdmin, error: roleErr } = await sb.rpc('is_admin');
    if (roleErr || !isAdmin) {
      console.warn('⚠️ [kyc.approve] พยายามเข้าถึงโดยไม่มีสิทธิ์:', user.id);
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    // 4) แกะข้อมูลที่ส่งมาจากหน้าเว็บ
    const body = await req.json();
    const { user_id, decision, reviewer_note } = body;

    if (!user_id || !['approved', 'rejected'].includes(decision)) {
      return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 });
    }

    // 5) เรียกใช้กุญแจผู้คุม (Admin Client) เพื่อสั่งอนุมัติและบันทึก Log ลงฐานข้อมูล
    const admin = createAdminClient();
    const { error } = await admin.rpc('admin_approve_kyc', {
      p_target_user: user_id,
      p_decision: decision,
      p_reviewer: user.id,
      p_note: reviewer_note || null,
    });

    if (error) {
      console.error('[kyc.approve] Database Error:', error.message);
      return NextResponse.json({ error: 'INTERNAL' }, { status: 500 });
    }

    // 6) ส่งผลลัพธ์กลับไปให้หน้าเว็บ
    const res = NextResponse.json({ ok: true, kyc_status: decision });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.headers.set('Pragma', 'no-cache');
    
    return res;
    
  } catch (err) {
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}

export async function GET()    { return new NextResponse(null, { status: 405 }); }
export async function PUT()    { return new NextResponse(null, { status: 405 }); }
export async function DELETE() { return new NextResponse(null, { status: 405 }); }

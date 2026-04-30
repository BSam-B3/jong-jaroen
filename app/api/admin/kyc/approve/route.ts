import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
// ✅ แก้ไข Import ให้ตรงกับเครื่องมือตัวใหม่ใน lib
import { sbServer } from '@/lib/supabase/server';
import { sbAdmin } from '@/lib/supabase/admin';

// 1) ปิดระบบ Cache ทั้งหมดสำหรับ Route นี้
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // 2) ตรวจสอบ Session ผู้ใช้ (เรียกใช้ sbServer แบบไม่ต้อง await)
    const sb = sbServer();
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

    // 5) เรียกใช้กุญแจผู้คุม (sbAdmin) เพื่อสั่งอนุมัติผ่าน RPC
    const { data, error: approveErr } = await sbAdmin.rpc('admin_approve_kyc', {
      p_target_user_id: user_id,
      p_decision: decision,
      p_reviewer_note: reviewer_note || ''
    });

    if (approveErr) {
      console.error('❌ [kyc.approve] Error:', approveErr.message);
      return NextResponse.json({ error: approveErr.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: decision === 'approved' ? 'อนุมัติเรียบร้อย' : 'ปฏิเสธเรียบร้อย' 
    });

  } catch (error: any) {
    console.error('❌ [kyc.approve] Critical Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

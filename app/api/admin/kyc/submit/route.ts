import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
// ✅ แก้ไขให้ใช้กุญแจตัวใหม่
import { sbServer } from '@/lib/supabase/server';
import { sbAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

// ฟังก์ชันตรวจสอบชนิดไฟล์จาก Buffer
function detectMime(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return 'image/webp';
  return null;
}

// ฟังก์ชันตรวจความถูกต้องเลขบัตรประชาชน
function isValidThaiId(id: string): boolean {
  if (!/^\d{13}$/.test(id)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(id[i]) * (13 - i);
  const check = (11 - (sum % 11)) % 10;
  return check === parseInt(id[12]);
}

export async function POST(req: NextRequest) {
  try {
    // 1. ตรวจสอบ Session (ใช้ sbServer)
    const sb = sbServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const form = await req.formData();
    const file = form.get('file');
    const fullName = String(form.get('full_name') ?? '').trim();
    const nationalId = String(form.get('national_id') ?? '').replace(/\D/g, '');

    // 2. ตรวจสอบข้อมูลพื้นฐาน
    if (!fullName || !nationalId || !file) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
    }
    if (!isValidThaiId(nationalId)) {
      return NextResponse.json({ error: 'เลขบัตรประชาชนไม่ถูกต้อง' }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'ไฟล์ไม่ถูกต้อง' }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const mime = detectMime(buf) || file.type;

    if (buf.length > MAX_BYTES) return NextResponse.json({ error: 'ไฟล์ใหญ่เกิน 5MB' }, { status: 413 });
    if (!ALLOWED_MIME.has(mime)) return NextResponse.json({ error: 'รองรับเฉพาะ JPG, PNG, WEBP' }, { status: 415 });

    // 3. อัปโหลดไฟล์ไปที่ Storage (ใช้ sbAdmin เพื่อสิทธิ์สูงสุดในการเขียนไฟล์ KYC)
    const fileName = `${user.id}/${Date.now()}_kyc`;
    const { error: uploadErr } = await sbAdmin
      .storage
      .from('kyc-documents')
      .upload(fileName, buf, { contentType: mime, upsert: true });

    if (uploadErr) {
      console.error('Upload Error:', uploadErr.message);
      return NextResponse.json({ error: 'อัปโหลดสลิปไม่สำเร็จ' }, { status: 500 });
    }

    // 4. บันทึกข้อมูลลงฐานข้อมูล (เรียกใช้ RPC เพื่อความปลอดภัย)
    const { error: dbErr } = await sbAdmin.rpc('submit_kyc_data', {
      p_user_id: user.id,
      p_full_name: fullName,
      p_national_id: nationalId,
      p_document_path: fileName
    });

    if (dbErr) {
      console.error('DB Error:', dbErr.message);
      return NextResponse.json({ error: 'บันทึกข้อมูลไม่สำเร็จ' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'ส่งข้อมูล KYC เรียบร้อย' });

  } catch (error: any) {
    console.error('Submit KYC Critical Error:', error.message);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดภายในระบบ' }, { status: 500 });
  }
}

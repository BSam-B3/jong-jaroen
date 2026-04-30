import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
// ✅ แก้ไขเป็น sbServer ตามมาตรฐานใหม่ของเรา
import { sbServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(req: NextRequest) {
  try {
    // 1. เรียกใช้เครื่องมือเชื่อมต่อฐานข้อมูล (ไม่ต้องใช้ await หน้า sbServer)
    const sb = sbServer();
    const { data: { user } } = await sb.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    // 2. ตรวจสอบไฟล์ที่ส่งมา
    const form = await req.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'NO_FILE' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'TOO_LARGE' }, { status: 413 });
    }
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json({ error: 'BAD_MIME' }, { status: 415 });
    }

    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OCR_UNAVAILABLE' }, { status: 503 });
    }

    // 3. เตรียมข้อมูลส่งไปให้ Google Vision API
    const buf = Buffer.from(await file.arrayBuffer());
    const b64 = buf.toString('base64');

    const visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: b64 },
              features: [{ type: 'TEXT_DETECTION' }],
            },
          ],
        }),
      }
    );

    if (!visionRes.ok) {
      const errText = await visionRes.text();
      return NextResponse.json({ error: 'VISION_API_ERROR', detail: errText }, { status: 502 });
    }

    const visionData = await visionRes.json();
    const text = visionData.responses?.[0]?.fullTextAnnotation?.text || '';

    // 4. ส่งข้อความที่สแกนได้กลับไปที่หน้าเว็บ
    return NextResponse.json({ text });

  } catch (e: any) {
    console.error('OCR Error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

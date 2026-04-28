import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(req: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'NO_FILE' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'TOO_LARGE' }, { status: 413 });
  if (!ALLOWED.has(file.type)) return NextResponse.json({ error: 'BAD_MIME' }, { status: 415 });

  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'OCR_UNAVAILABLE' }, { status: 503 });

  const buf = Buffer.from(await file.arrayBuffer());
  const b64 = buf.toString('base64');

  const visionRes = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{ image: { content: b64 }, features: [{ type: 'TEXT_DETECTION' }] }],
      }),
    }
  );

  if (!visionRes.ok) return NextResponse.json({ error: 'OCR_FAILED' }, { status: 502 });

  const data = await visionRes.json();
  const rawText = data.responses?.[0]?.fullTextAnnotation?.text ?? '';
  return NextResponse.json({ text: rawText });
}

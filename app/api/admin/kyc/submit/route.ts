import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

function detectMime(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return 'image/webp';
  return null;
}

function isValidThaiId(id: string): boolean {
  if (!/^\d{13}$/.test(id)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(id[i]) * (13 - i);
  const check = (11 - (sum % 11)) % 10;
  return check === parseInt(id[12]);
}

export async function POST(req: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file');
  const fullName = String(form.get('full_name') ?? '').trim();
  const nationalId = String(form.get('national_id') ?? '').replace(/\D/g, '');
  const dateOfBirth = String(form.get('date_of_birth') ?? '').trim();
  const address = String(form.get('address') ?? '').trim();
  const pdpaConsent = form.get('pdpa_consent') === 'true';

  if (!pdpaConsent) return NextResponse.json({ error: 'PDPA_REQUIRED' }, { status: 400 });
  if (fullName.length < 2 || fullName.length > 120) return NextResponse.json({ error: 'BAD_NAME' }, { status: 400 });
  if (!isValidThaiId(nationalId)) return NextResponse.json({ error: 'BAD_NATIONAL_ID' }, { status: 400 });

  if (!(file instanceof File)) return NextResponse.json({ error: 'NO_FILE' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'TOO_LARGE' }, { status: 413 });
  if (!ALLOWED_MIME.has(file.type)) return NextResponse.json({ error: 'BAD_MIME' }, { status: 415 });

  const buf = Buffer.from(await file.arrayBuffer());
  const realMime = detectMime(buf);
  if (!realMime || realMime !== file.type) return NextResponse.json({ error: 'MIME_SPOOF' }, { status: 415 });

  const ext = realMime === 'image/jpeg' ? 'jpg' : realMime === 'image/png' ? 'png' : 'webp';
  const safeName = `${user.id}/id_card_${Date.now()}.${ext}`;
  const admin = createAdminClient();

  const { error: upErr } = await admin.storage
    .from('kyc_documents')
    .upload(safeName, buf, { contentType: realMime, upsert: true, cacheControl: '0' });
    
  if (upErr) return NextResponse.json({ error: 'UPLOAD_FAILED' }, { status: 500 });

  const { error: dbErr } = await sb.from('profiles').update({
    kyc_status: 'pending',
    full_name: fullName,
    national_id: nationalId,
    date_of_birth: dateOfBirth || null,
    address: address || null,
    id_card_url: safeName,
    pdpa_consented_at: new Date().toISOString(),
  }).eq('id', user.id);

  if (dbErr) return NextResponse.json({ error: 'DB_FAILED' }, { status: 500 });

  return NextResponse.json({ ok: true, kyc_status: 'pending' });
}

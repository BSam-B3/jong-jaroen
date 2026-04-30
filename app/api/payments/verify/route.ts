import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { sbAdmin } from '@/lib/supabase/admin';
import { sbServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SLIP_BUCKET = 'payment-slips';
const TOLERANCE_SAT = 0.01;

type SlipResult = {
  amount: number;
  ref1?: string | null;
  receiver_account?: string | null;
  trans_ref?: string | null;
  trans_timestamp?: string | null;
};

async function verifyWithProvider(fileBuf: Buffer, mime: string): Promise<SlipResult> {
  const provider = (process.env.SLIP_PROVIDER ?? 'easyslip').toLowerCase();

  if (provider === 'easyslip') {
    const fd = new FormData();
    fd.append('file', new Blob([fileBuf], { type: mime }), 'slip');
    const r = await fetch('https://developer.easyslip.com/api/v1/verify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.EASYSLIP_TOKEN!}` },
      body: fd,
    });
    if (!r.ok) throw new Error(`easyslip ${r.status}`);
    const j: any = await r.json();
    if (j.status !== 200 || !j.data) throw new Error(j.message ?? 'easyslip rejected');
    const d = j.data;
    return {
      amount: Number(d.amount?.amount ?? d.amount),
      ref1: d.ref1 ?? null,
      receiver_account:
        d.receiver?.account?.proxy?.account ??
        d.receiver?.account?.bank?.account ?? null,
      trans_ref: d.transRef ?? null,
      trans_timestamp: d.date ?? null,
    };
  }

  throw new Error(`unsupported provider: ${provider}`);
}

export async function POST(req: NextRequest) {
  try {
    const { tx_id, slip_path } = await req.json();
    if (!tx_id || !slip_path) return NextResponse.json({ error: 'tx_id and slip_path required' }, { status: 400 });

    const sb = sbServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    if (!slip_path.startsWith(`${user.id}/`)) return NextResponse.json({ error: 'path forbidden' }, { status: 403 });

    const { data: tx, error: txErr } = await sbAdmin
      .from('transactions')
      .select('id, payer_id, amount, ref1, status, expires_at, created_at')
      .eq('id', tx_id)
      .single();
    if (txErr || !tx) return NextResponse.json({ error: 'tx not found' }, { status: 404 });
    if (tx.payer_id !== user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    if (tx.status === 'verified') return NextResponse.json({ ok: true, status: 'verified' });
    if (new Date(tx.expires_at).getTime() < Date.now()) {
      await sbAdmin.from('transactions').update({ status: 'expired' }).eq('id', tx.id);
      return NextResponse.json({ error: 'expired' }, { status: 410 });
    }

    const dl = await sbAdmin.storage.from(SLIP_BUCKET).download(slip_path);
    if (dl.error || !dl.data) return NextResponse.json({ error: 'slip download failed' }, { status: 400 });
    const buf = Buffer.from(await dl.data.arrayBuffer());
    const mime = dl.data.type || 'image/jpeg';
    const sha256 = crypto.createHash('sha256').update(buf).digest('hex');

    const { data: dup } = await sbAdmin
      .from('transactions')
      .select('id')
      .eq('slip_sha256', sha256)
      .neq('id', tx.id)
      .maybeSingle();
    if (dup) {
      await sbAdmin.from('transactions')
        .update({ status: 'rejected', slip_path, slip_sha256: sha256 })
        .eq('id', tx.id);
      return NextResponse.json({ error: 'slip already used' }, { status: 409 });
    }

    await sbAdmin.from('transactions')
      .update({ status: 'submitted', slip_path, slip_sha256: sha256 })
      .eq('id', tx.id);

    let slip: SlipResult;
    try { slip = await verifyWithProvider(buf, mime); }
    catch (e: any) {
      await sbAdmin.from('transactions')
        .update({ status: 'rejected', reject_reason: `ocr: ${e.message}` })
        .eq('id', tx.id);
      return NextResponse.json({ error: 'slip verification failed', detail: e.message }, { status: 422 });
    }

    const reasons: string[] = [];
    if (Math.abs(Number(slip.amount) - Number(tx.amount)) > TOLERANCE_SAT)
      reasons.push(`amount ${slip.amount} != ${tx.amount}`);
    const ref1Norm = (slip.ref1 ?? '').toUpperCase().replace(/\s+/g,'');
    if (!ref1Norm.includes(tx.ref1.toUpperCase()))
      reasons.push(`ref1 mismatch (${slip.ref1})`);
    const expectedReceiver = (process.env.PROMPTPAY_ID ?? '').replace(/\D/g,'');
    const recvNorm = (slip.receiver_account ?? '').replace(/\D/g,'');
    if (expectedReceiver && recvNorm && !recvNorm.endsWith(expectedReceiver.slice(-4)))
      reasons.push(`receiver mismatch (${slip.receiver_account})`);

    if (reasons.length) {
      await sbAdmin.from('transactions')
        .update({ status: 'rejected', reject_reason: reasons.join('; '), provider_ref: slip.trans_ref ?? null })
        .eq('id', tx.id);
      return NextResponse.json({ error: 'slip mismatch', reasons }, { status: 422 });
    }

    const { error: upErr } = await sbAdmin
      .from('transactions')
      .update({
        status: 'verified',
        verified_at: new Date().toISOString(),
        provider_ref: slip.trans_ref ?? null,
      })
      .eq('id', tx.id)
      .eq('status', 'submitted');
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, status: 'verified', tx_id: tx.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'internal' }, { status: 500 });
  }
}

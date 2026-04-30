import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { sbAdmin } from '@/lib/supabase/admin';
import { sbServer } from '@/lib/supabase/server';
import { buildPromptPayPayload, makeRef1 } from '@/lib/promptpay';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { jobId } = await req.json();
    if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 });

    const sb = sbServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { data: job, error: jobErr } = await sbAdmin
      .from('jobs')
      .select('id, budget, employer_id, worker_id, status') // ✅ แก้ชื่อคอลัมน์ให้ตรงกับ DB ของจงเจริญ
      .eq('id', jobId)
      .single();
      
    if (jobErr || !job) return NextResponse.json({ error: 'job not found' }, { status: 404 });
    if (job.employer_id !== user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    if (!job.worker_id) return NextResponse.json({ error: 'no assignee' }, { status: 400 });
    if (Number(job.budget) <= 0) return NextResponse.json({ error: 'invalid budget' }, { status: 400 });

    const { data: existing } = await sbAdmin
      .from('transactions')
      .select('id, ref1, qr_payload, amount, expires_at, status')
      .eq('job_id', jobId)
      .in('status', ['pending','submitted'])
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    let tx = existing;
    if (!tx) {
      const txId = crypto.randomUUID();
      const ref1 = makeRef1(txId);
      const amount = Number(job.budget);
      const qr_payload = buildPromptPayPayload(process.env.PROMPTPAY_ID!, amount, ref1);
      const expires_at = new Date(Date.now() + 30 * 60_000).toISOString();

      const { data: ins, error: insErr } = await sbAdmin
        .from('transactions')
        .insert({
          id: txId,
          job_id: jobId,
          payer_id: user.id,
          payee_id: job.worker_id,
          amount,
          ref1,
          qr_payload,
          status: 'pending',
          expires_at,
        })
        .select('id, ref1, qr_payload, amount, expires_at, status')
        .single();
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
      tx = ins;
    }

    const qrPng = await QRCode.toBuffer(tx!.qr_payload, { type: 'png', margin: 1, width: 512 });
    return NextResponse.json({
      tx_id: tx!.id,
      ref1: tx!.ref1,
      amount: tx!.amount,
      expires_at: tx!.expires_at,
      status: tx!.status,
      qr: qrPng.toString('base64'),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'internal' }, { status: 500 });
  }
}

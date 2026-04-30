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
    // ✅ แก้ไขปัญหา Type Error โดยการแปลง Buffer เป็น Uint8Array
    const blob = new Blob([new Uint8Array(fileBuf)], { type: mime });
    fd.append('file', blob, 'slip.jpg');

    const r = await fetch('https://developer.easyslip.com/api/v1/verify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.EASYSLIP_TOKEN!}`
      },
      body: fd,
    });

    if (!r.ok) throw new Error(`easyslip ${r.status}`);
    const j: any = await r.json();
    
    if (j.status !== 200 || !j.data) {
      throw new Error(j.message ?? 'easyslip rejected');
    }

    const d = j.data;
    return {
      amount: Number(d.amount?.amount ?? d.amount),
      ref1: d.ref1,
      receiver_account: d.receiver?.account?.value ?? d.receiver_account,
      trans_ref: d.transRef ?? d.trans_ref,
      trans_timestamp: d.transDate ?? d.trans_timestamp
    };
  }

  throw new Error('Unsupported slip provider');
}

export async function POST(req: NextRequest) {
  try {
    const sb = sbServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const form = await req.formData();
    const file = form.get('file') as File;
    const jobId = form.get('job_id') as string;

    if (!file || !jobId) {
      return NextResponse.json({ error: 'MISSING_DATA' }, { status: 400 });
    }

    const fileBuf = Buffer.from(await file.arrayBuffer());
    
    // 1. ตรวจสอบสลิปกับ EasySlip
    const slip = await verifyWithProvider(fileBuf, file.type);

    // 2. อัปโหลดเก็บไว้ใน Storage (ใช้ sbAdmin)
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
    
    const { error: upErr } = await sbAdmin
      .storage
      .from(SLIP_BUCKET)
      .upload(fileName, fileBuf, { contentType: file.type });

    if (upErr) throw upErr;

    // 3. บันทึกการชำระเงินและเปลี่ยนสถานะงาน (เรียก RPC)
    const { data: result, error: payErr } = await sbAdmin.rpc('process_job_payment', {
      p_job_id: jobId,
      p_user_id: user.id,
      p_amount: slip.amount,
      p_slip_url: fileName,
      p_trans_ref: slip.trans_ref
    });

    if (payErr) throw payErr;

    return NextResponse.json({ success: true, result });

  } catch (err: any) {
    console.error('Verify Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

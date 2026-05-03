import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  try {
    const { imageBase64, jobId } = await req.json();

    // 1. ส่งรูปไปตรวจสอบที่ EasySlip API (บีสามต้องมี API Key ของเขานะคะ)
    const response = await fetch('https://developer.easyslip.com/api/v1/verify', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${process.env.EASYSLIP_API_KEY}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ image: imageBase64 })
    });

    const result = await response.json();

    if (result.status !== 200) {
      return NextResponse.json({ error: 'สลิปไม่ถูกต้องหรือตรวจสอบไม่ได้' }, { status: 400 });
    }

    const slipData = result.data;

    // 2. ตรวจสอบว่ามีงานนี้อยู่จริง และยอดเงินในสลิปตรงกับยอดใน Job ไหม?
    const { data: job, error: jobError } = await supabase.from('jobs').select('budget').eq('id', jobId).single();
    
    // 🌟 เพิ่มตัวดักจับตรงนี้: ถ้าไม่พบงาน หรือ job เป็น null ให้เด้งออกเลย
    if (jobError || !job) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลงานนี้ในระบบค่ะ' }, { status: 404 });
    }

    if (slipData.amount.amount !== job.budget) {
      return NextResponse.json({ error: 'ยอดเงินในสลิปไม่ตรงกับยอดงานค่ะ' }, { status: 400 });
    }

    // 3. บันทึกลง payment_logs และเรียก RPC approve_slip (ป้องกันการส่งสลิปซ้ำด้วย trans_ref)
    const { error: logError } = await supabase.from('payment_logs').insert({
      job_id: jobId,
      sender_name: slipData.sender.name.en,
      amount_satang: slipData.amount.amount * 100,
      trans_ref: slipData.transRef,
      sending_bank: slipData.sendingBank,
      raw_data: slipData
    });

    if (logError) return NextResponse.json({ error: 'สลิปนี้ถูกใช้งานไปแล้วค่ะ' }, { status: 400 });

    // 4. ถ้าทุกอย่างผ่าน สั่งอนุมัติเงินเข้า Escrow ทันที!
    const { error: approveError } = await supabase.rpc('approve_slip', { p_job_id: jobId });
    if (approveError) throw approveError;

    return NextResponse.json({ success: true });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

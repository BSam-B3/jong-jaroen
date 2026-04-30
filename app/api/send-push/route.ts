import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { sbAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ตั้งค่ากุญแจสำหรับยิงแจ้งเตือน
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:test@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: Request) {
  try {
    // 1. รับข้อมูลจาก Supabase Webhook เวลามีแชทใหม่เด้งเข้ามา
    const payload = await request.json();
    const message = payload.record;

    if (!message || !message.job_id || !message.sender_id) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // 2. หางานนี้เพื่อดูว่าใครคือคนส่ง ใครคือคนรับ (Service Role bypasses RLS)
    const { data: job } = await sbAdmin
      .from('jobs')
      .select('employer_id, worker_id')
      .eq('id', message.job_id)
      .single();
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    // 3. สลับฝั่งหาคนรับ (ถ้าคนจ้างเป็นคนส่ง ไรเดอร์คือคนรับ)
    const recipientId =
      message.sender_id === job.employer_id ? job.worker_id : job.employer_id;
    if (!recipientId) {
      return NextResponse.json({ success: true, note: 'No recipient yet' });
    }

    // 4. หาว่าคนรับอนุญาตให้แจ้งเตือนไว้กี่เครื่อง
    const { data: subs } = await sbAdmin
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', recipientId);

    if (subs && subs.length > 0) {
      const pushPayload = JSON.stringify({
        title: 'จงเจริญ 💬',
        body: message.image_url ? '📷 ส่งรูปภาพถึงคุณ' : message.content,
        url: `/chat/${message.job_id}`,
      });

      // 5. ส่งแจ้งเตือน (และเก็บกวาด subscription ที่ตายแล้ว)
      await Promise.all(
        subs.map(async (sub) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              },
              pushPayload
            );
          } catch (error: any) {
            if (error?.statusCode === 410 || error?.statusCode === 404) {
              await sbAdmin
                .from('push_subscriptions')
                .delete()
                .eq('endpoint', sub.endpoint);
            }
          }
        })
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

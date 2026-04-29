"use client";
import { createClient } from "@/lib/supabase/client";

const urlB64ToUint8 = (b64: string) => {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const s = (b64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(s);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
};

export async function enablePush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window))
    throw new Error("เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือนค่ะ");

  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("คุณปฏิเสธการแจ้งเตือน");

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
    });
  }
  
  const j = sub.toJSON();
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("กรุณาล็อกอินก่อนนะคะ");

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: j.endpoint!,
      p256dh: j.keys!.p256dh,
      auth: j.keys!.auth,
    },
    { onConflict: "endpoint" }
  );
  
  if (error) throw error;
  return sub;
}

export async function disablePush() {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  const supabase = createClient();
  await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
  await sub.unsubscribe();
}

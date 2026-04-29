/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";

declare const self: ServiceWorkerGlobalScope;

// เริ่มการทำงานของ Serwist สำหรับจัดการ Cache และ Service Worker
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

// 🔔 ระบบดักจับ Push Notification
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? { title: "จงเจริญ", body: "มีข้อความใหม่ถึงคุณค่ะ" };
  
  const options = {
    body: data.body,
    icon: "/icon-192.png", 
    badge: "/icon-192.png",
    data: data.url || "/",
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// 🖱️ ระบบเมื่อกดที่การแจ้งเตือน
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow(event.notification.data)
  );
});

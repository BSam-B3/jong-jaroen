"use client";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

// กำหนดรูปแบบข้อมูลตำแหน่ง
type Loc = { lat: number; lng: number; heading?: number | null; speed?: number | null; ts: number };

// สูตรคำนวณระยะทางว่ารถขยับไปไกลแค่ไหนแล้ว
const haversine = (a: Loc, b: Loc) => {
  const R = 6371000, toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const x = Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

export function useRiderBroadcast(jobId: string | null, active: boolean) {
  const lastSent = useRef<Loc | null>(null);

  useEffect(() => {
    if (!jobId || !active || !navigator.geolocation) return;
    const supabase = createClient();
    
    // สร้างห้องส่งสัญญาณลับส่วนตัว
    const channel = supabase.channel(`job:${jobId}`, {
      config: { broadcast: { self: false, ack: false }, private: true },
    });
    channel.subscribe();

    let lastEmit = 0;
    
    // สั่งเปิด GPS และดักจับการขยับของรถ
    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const now = Date.now();
        if (now - lastEmit < 1000) return; // ป้องกันการส่งถี่เกินไป (หน่วงไว้ 1 วินาที)
        
        const cur: Loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          ts: now,
        };
        
        // ถ้ารถขยับไม่ถึง 5 เมตร ไม่ต้องส่งข้อมูล (ประหยัดแบตเตอรี่)
        if (lastSent.current && haversine(lastSent.current, cur) < 5) return; 
        
        lastEmit = now;
        lastSent.current = cur;
        // ส่งพิกัดขึ้นอากาศ!
        await channel.send({ type: "broadcast", event: "loc", payload: cur });
      },
      (err) => console.warn("GPS Error:", err),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      supabase.removeChannel(channel);
    };
  }, [jobId, active]);
}

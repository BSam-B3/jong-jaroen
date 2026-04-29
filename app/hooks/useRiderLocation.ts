"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type RiderLoc = { lat: number; lng: number; heading?: number | null; speed?: number | null; ts: number };

export function useRiderLocation(jobId: string | null) {
  const [loc, setLoc] = useState<RiderLoc | null>(null);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    const supabase = createClient();
    const channel = supabase.channel(`job:${jobId}`, {
      config: { broadcast: { self: false }, private: true },
    });

    channel
      .on("broadcast", { event: "loc" }, ({ payload }) => {
        setLoc(payload as RiderLoc);
        setOnline(true);
      })
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") setOnline(false);
      });

    // ตรวจสอบว่าสัญญาณหายไปเกิน 15 วินาทีหรือไม่ (เผื่อไรเดอร์เข้าจุดอับสัญญาณ)
    const t = setInterval(() => {
      setLoc((p) => {
        if (p && Date.now() - p.ts > 15000) setOnline(false);
        return p;
      });
    }, 5000);

    return () => {
      clearInterval(t);
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  return { loc, online };
}

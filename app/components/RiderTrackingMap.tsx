"use client";
import { useEffect, useRef } from "react";
// ✅ แก้ไข Path ให้ถูกต้องตามโครงสร้างใหม่
import { useRiderLocation } from "../hooks/useRiderLocation";
import MapPinPicker from "./MapPinPicker";

export default function RiderTrackingMap({ jobId, dropoff }: {
  jobId: string;
  dropoff: { lat: number; lng: number };
}) {
  const { loc, online } = useRiderLocation(jobId);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!loc || !mapRef.current) return;
    
    // 🛵 สั่งให้หมุดมอเตอร์ไซค์ขยับ
    if (mapRef.current.setMarker) {
      mapRef.current.setMarker("rider", {
        lat: loc.lat,
        lng: loc.lng,
        rotation: loc.heading ?? 0,
        icon: "rider"
      });
    }
    
    // 📍 สั่งให้หน้าจอเลื่อนตามรถ
    if (mapRef.current.panTo) {
      mapRef.current.panTo({ lat: loc.lat, lng: loc.lng });
    }
  }, [loc]);

  return (
    <div className="relative w-full h-[300px] rounded-[2rem] overflow-hidden shadow-lg border border-gray-100">
      <MapPinPicker
        ref={mapRef}
        readOnly={true}
        initialMarkers={[
          { id: "dropoff", ...dropoff, icon: "pin" },
          ...(loc ? [{ id: "rider", lat: loc.lat, lng: loc.lng, icon: "rider" }] : []),
        ]}
      />
      
      {/* สถานะ GPS ดีไซน์พรีเมียม */}
      <div className={`absolute top-4 right-4 px-3 py-1.5 text-[10px] font-black rounded-full shadow-2xl flex items-center gap-2 transition-all duration-500 ${online ? "bg-emerald-500 text-white" : "bg-gray-900 text-gray-200"}`}>
        <span className="relative flex h-2 w-2">
          {online && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${online ? 'bg-white' : 'bg-gray-500'}`}></span>
        </span>
        {online ? "RIDER IS LIVE" : "SEARCHING GPS"}
      </div>
    </div>
  );
}

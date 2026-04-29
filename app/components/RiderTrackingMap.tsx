"use client";
import { useEffect, useRef } from "react";
import { useRiderLocation } from "@/hooks/useRiderLocation";
import MapPinPicker from "@/app/components/MapPinPicker";

export default function RiderTrackingMap({ jobId, dropoff }: {
  jobId: string;
  dropoff: { lat: number; lng: number };
}) {
  const { loc, online } = useRiderLocation(jobId);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!loc || !mapRef.current) return;
    // สั่งให้แผนที่เลื่อนตามรถมอเตอร์ไซค์
    if (mapRef.current.setMarker) {
      mapRef.current.setMarker("rider", {
        lat: loc.lat, lng: loc.lng, rotation: loc.heading ?? 0, icon: "rider"
      });
    }
    if (mapRef.current.panTo) {
      mapRef.current.panTo({ lat: loc.lat, lng: loc.lng });
    }
  }, [loc]);

  return (
    <div className="relative w-full h-[300px] rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      <MapPinPicker
        ref={mapRef}
        readOnly // ล็อกแผนที่ไว้ไม่ให้ลูกค้ากดปักหมุดมั่ว
        initialMarkers={[
          { id: "dropoff", ...dropoff, icon: "pin" },
          ...(loc ? [{ id: "rider", lat: loc.lat, lng: loc.lng, icon: "rider" }] : []),
        ]}
      />
      
      {/* ป้ายบอกสถานะสัญญาณ GPS มุมขวาบน */}
      <div className={`absolute top-4 right-4 px-3 py-1.5 text-[10px] font-black rounded-full shadow-lg flex items-center gap-2 transition-colors duration-300 ${online ? "bg-emerald-500 text-white" : "bg-gray-800 text-gray-200"}`}>
        <span className="relative flex h-2 w-2">
          {online && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${online ? 'bg-white' : 'bg-gray-500'}`}></span>
        </span>
        {online ? "GPS ทำงาน" : "กำลังหาสัญญาณ"}
      </div>
    </div>
  );
}

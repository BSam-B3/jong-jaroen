"use client";
import React, { useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";

const containerStyle = { width: "100%", height: "100%" };

const MapPinPicker = forwardRef((props: any, ref) => {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<any[]>(props.initialMarkers || []);

  const onUnmount = useCallback(function callback() { setMap(null); }, []);

  // 🌟 เปิดช่องทางให้ RiderTrackingMap ส่งคำสั่งเข้ามาควบคุมแผนที่ได้
  useImperativeHandle(ref, () => ({
    panTo: (latLng: { lat: number; lng: number }) => {
      if (map) map.panTo(latLng);
    },
    setMarker: (id: string, data: any) => {
      setMarkers((prev) => {
        const others = prev.filter((m) => m.id !== id);
        return [...others, { id, ...data }];
      });
    },
  }));

  if (!isLoaded) return <div className="w-full h-full bg-gray-100 animate-pulse rounded-2xl" />;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={props.initialMarkers?.[0] || { lat: 13.7563, lng: 100.5018 }}
      zoom={15}
      onLoad={(m) => setMap(m)}
      onUnmount={onUnmount}
      options={{
        disableDefaultUI: true,
        zoomControl: false,
        gestureHandling: props.readOnly ? "none" : "greedy",
      }}
    >
      {markers.map((m) => (
        <Marker
          key={m.id}
          position={{ lat: m.lat, lng: m.lng }}
          icon={m.icon === "rider" ? {
            url: "https://cdn-icons-png.flaticon.com/512/713/713437.png", // รูปมอเตอร์ไซค์
            scaledSize: new google.maps.Size(40, 40),
            rotation: m.rotation || 0,
          } : undefined}
        />
      ))}
    </GoogleMap>
  );
});

MapPinPicker.displayName = "MapPinPicker";
export default MapPinPicker;

'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

interface MapPinPickerProps {
  onLocationSelect: (lat: number, lng: number, label: string) => void;
  defaultLat?: number;
  defaultLng?: number;
  className?: string;
}

// Default: ปากน้ำประแส, Rayong
const DEFAULT_LAT = 12.5297;
const DEFAULT_LNG = 101.6225;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GMaps = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GMapInstance = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GMarker = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GGeocoder = any;

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google: any;
    initGoogleMap: () => void;
  }
}

export function MapPinPicker({
  onLocationSelect,
  defaultLat = DEFAULT_LAT,
  defaultLng = DEFAULT_LNG,
  className = '',
}: MapPinPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<GMapInstance | null>(null);
  const [marker, setMarker] = useState<GMarker | null>(null);
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const geocoderRef = useRef<GGeocoder | null>(null);

  // Load Google Maps script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not set');
      return;
    }

    if (window.google?.maps) {
      setMapLoaded(true);
      return;
    }

    window.initGoogleMap = () => setMapLoaded(true);

    const existing = document.querySelector('[data-gmap]');
    if (!existing) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initGoogleMap&language=th&region=TH`;
      script.async = true;
      script.defer = true;
      script.setAttribute('data-gmap', 'true');
      document.head.appendChild(script);
    }
  }, []);

  const handleLocationChange = useCallback((lat: number, lng: number) => {
    setSelectedLat(lat);
    setSelectedLng(lng);
    setLoading(true);

    if (geocoderRef.current) {
      geocoderRef.current.geocode(
        { location: { lat, lng } },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (results: any, status: string) => {
          setLoading(false);
          if (status === 'OK' && results && results[0]) {
            const addr = results[0].formatted_address
              .replace('ตำบล', 'ต.')
              .replace('อำเภอ', 'อ.')
              .replace('จังหวัด', 'จ.');
            setAddress(addr);
            onLocationSelect(lat, lng, addr);
          } else {
            const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            setAddress(fallback);
            onLocationSelect(lat, lng, fallback);
          }
        }
      );
    }
  }, [onLocationSelect]);

  // Init map after script loads
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || map) return;

    const G: GMaps = window.google.maps;

    const gMap: GMapInstance = new G.Map(mapRef.current, {
      center: { lat: defaultLat, lng: defaultLng },
      zoom: 14,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      gestureHandling: 'cooperative',
    });

    const gMarker: GMarker = new G.Marker({
      position: { lat: defaultLat, lng: defaultLng },
      map: gMap,
      draggable: true,
      title: 'ลากเพื่อย้ายตำแหน่ง',
      animation: G.Animation.DROP,
    });

    geocoderRef.current = new G.Geocoder();

    // Click to move marker
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gMap.addListener('click', (e: any) => {
      if (e.latLng) {
        gMarker.setPosition(e.latLng);
        handleLocationChange(e.latLng.lat(), e.latLng.lng());
      }
    });

    // Drag marker
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gMarker.addListener('dragend', (e: any) => {
      if (e.latLng) {
        handleLocationChange(e.latLng.lat(), e.latLng.lng());
      }
    });

    setMap(gMap);
    setMarker(gMarker);
  }, [mapLoaded, map, defaultLat, defaultLng, handleLocationChange]);

  // Use current GPS location
  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (map && marker) {
          map.panTo({ lat, lng });
          map.setZoom(16);
          marker.setPosition({ lat, lng });
        }
        handleLocationChange(lat, lng);
      },
      () => { setLoading(false); }
    );
  };

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className={`border-2 border-dashed border-orange-200 rounded-2xl p-4 bg-orange-50 ${className}`}>
        <p className="text-orange-700 text-sm font-medium">⚠️ Maps ยังไม่ได้ตั้งค่า</p>
        <p className="text-orange-500 text-xs mt-1">
          เพิ่ม NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ใน Vercel environment variables
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
        <div ref={mapRef} style={{ height: '280px', width: '100%' }}>
          {!mapLoaded && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl mb-2 animate-spin">🗺️</div>
                <p className="text-gray-500 text-sm">กำลังโหลดแผนที่...</p>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={useMyLocation}
          className="absolute bottom-3 right-3 bg-white shadow-md rounded-xl px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors flex items-center gap-1.5"
          type="button"
        >
          📍 ตำแหน่งฉัน
        </button>
      </div>

      <div className="bg-gray-50 rounded-xl p-3">
        {loading ? (
          <p className="text-xs text-gray-400 animate-pulse">🔍 กำลังค้นหาที่อยู่...</p>
        ) : selectedLat && selectedLng ? (
          <div>
            <p className="text-xs font-medium text-gray-700 mb-0.5">📍 ตำแหน่งที่เลือก</p>
            <p className="text-sm text-gray-800">{address || 'ไม่พบชื่อสถานที่'}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {selectedLat.toFixed(5)}, {selectedLng.toFixed(5)}
            </p>
          </div>
        ) : (
          <p className="text-xs text-gray-400">แตะที่แผนที่หรือลากหมุดเพื่อเลือกตำแหน่ง</p>
        )}
      </div>
    </div>
  );
}

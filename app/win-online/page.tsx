'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLoadScript, GoogleMap, MarkerF } from '@react-google-maps/api';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';

const libraries: ("places")[] = ["places"];
const DEFAULT_CENTER = { lat: 12.7844, lng: 101.6500 };

// จำลองพิกัดพี่วินใกล้ๆ
const MOCK_RIDERS = [
  { id: 1, lat: 12.7850, lng: 101.6510 },
  { id: 2, lat: 12.7830, lng: 101.6480 },
  { id: 3, lat: 12.7860, lng: 101.6495 },
];

// จำลองวินประจำ
const MOCK_FAVORITES = [
  { id: 'd1', name: 'พี่สมชาย ซอย 4', status: 'online', vehicle: 'motorcycle' },
  { id: 'd2', name: 'ลุงเอก ซาเล้ง', status: 'busy', vehicle: 'saleng' },
  { id: 'd3', name: 'พี่น้อย กระบะรับจ้าง', status: 'offline', vehicle: 'pickup' },
];

const JOB_TYPES_UI = [
  { key: 'ride', label: 'เรียกรถ', icon: '🛵', desc: 'รับ-ส่งคน' },
  { key: 'buy', label: 'ซื้อของ', icon: '🛒', desc: 'ฝากซื้อ' },
  { key: 'deliver', label: 'ส่งของ', icon: '📦', desc: 'รับ-ส่งพัสดุ' },
];

const VEHICLES_UI = [
  { key: 'motorcycle', label: 'มอไซค์', icon: '🛵' },
  { key: 'saleng', label: 'ซาเล้ง', icon: '🛺' },
  { key: 'car', label: 'รถเก๋ง', icon: '🚗' },
  { key: 'suv', label: 'ครอบครัว', icon: '🚙' },
  { key: 'van', label: 'รถตู้', icon: '🚐' },
  { key: 'pickup', label: 'กระบะ', icon: '🛻' }
];

export default function WinOnlinePage() {
  const router = useRouter();
  const supabase = createClient();

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries,
    region: 'TH'
  });

  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [isMapMode, setIsMapMode] = useState(false);
  const [pickingType, setPickingType] = useState<'pickup' | 'dropoff'>('pickup');
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [selectedPin, setSelectedPin] = useState<google.maps.LatLngLiteral | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  
  const [pickupCoords, setPickupCoords] = useState<google.maps.LatLngLiteral | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<google.maps.LatLngLiteral | null>(null);
  const [jobType, setJobType] = useState<'ride' | 'buy' | 'deliver'>('ride');
  const [vehicleType, setVehicleType] = useState<any>('motorcycle');
  const [title, setTitle] = useState('');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [fareBreakdown, setFareBreakdown] = useState({ base: 0, distanceFee: 0, fuelSurge: 0, platformFee: 0, totalFare: 0 });

  const { ready, value, suggestions: { status, data }, setValue, clearSuggestions, init } = usePlacesAutocomplete({
    initOnMount: false, requestOptions: { componentRestrictions: { country: 'th' } }, debounce: 300,
  });

  useEffect(() => { if (isLoaded) init(); }, [isLoaded, init]);

  // 🌟 1. ฟังก์ชันดึงข้อมูลแบบแยกโหลดแอนิเมชัน (isSilent)
  const fetchMyActiveJobs = useCallback(async (userId: string, isSilent = false) => {
    if (!isSilent) setIsLoading(true); 
    const { data } = await supabase.from('jobs')
      .select(`*, worker:profiles!worker_id (full_name)`)
      .eq('employer_id', userId)
      .in('status', ['open', 'in_progress'])
      .order('created_at', { ascending: false });
    
    if (data) setJobs(data);
    if (!isSilent) setIsLoading(false);
  }, [supabase]);

  // 🌟 2. ดึงข้อมูล User เริ่มต้น (ทำครั้งเดียว)
  useEffect(() => {
    const initData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
        fetchMyActiveJobs(session.user.id);
      } else {
        setIsLoading(false);
      }
    };
    initData();
  }, [fetchMyActiveJobs, supabase]);

  // 🌟 3. จัดการ Real-time (ทำเมื่อรู้ User แล้ว อัปเดตแบบ isSilent)
  useEffect(() => {
    if (!currentUser) return;
    const channel = supabase.channel('public-jobs-win-customer')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'jobs', 
        filter: `employer_id=eq.${currentUser.id}` 
      }, () => {
        fetchMyActiveJobs(currentUser.id, true); 
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchMyActiveJobs, supabase, currentUser]);

  const calculateRoute = useCallback(async (origin: google.maps.LatLngLiteral, destination: google.maps.LatLngLiteral) => {
    if (!isLoaded) return;
    const directionsService = new google.maps.DirectionsService();
    try {
      const result = await directionsService.route({ origin, destination, travelMode: google.maps.TravelMode.DRIVING });
      if (result.routes[0].legs[0].distance) { setDistanceKm(Number((result.routes[0].legs[0].distance.value / 1000).toFixed(1))); }
    } catch (error) { console.error(error); }
  }, [isLoaded]);

  useEffect(() => {
    if (pickupCoords && (dropoffCoords || jobType === 'buy')) {
      if (dropoffCoords) calculateRoute(pickupCoords, dropoffCoords);
      let baseFare = 0; let ratePerKm = 0;
      switch (vehicleType) {
        case 'motorcycle': baseFare = 20; ratePerKm = distanceKm > 5 ? 10 : 8; break;
        case 'saleng': baseFare = 30; ratePerKm = 10; break;
        case 'car': baseFare = 40; ratePerKm = 12; break;
        case 'suv': baseFare = 50; ratePerKm = 15; break;
        case 'van': baseFare = 100; ratePerKm = 20; break;
        case 'pickup': baseFare = 150; ratePerKm = 20; break;
      }
      const distanceFee = distanceKm * ratePerKm;
      const rawBeforeFuel = baseFare + distanceFee;
      const fuelSurge = (rawBeforeFuel * 1.05) - rawBeforeFuel;
      const totalDriverFare = rawBeforeFuel + fuelSurge;

      setFareBreakdown({
        base: baseFare, distanceFee, fuelSurge, platformFee: totalDriverFare * 0.03, totalFare: Math.ceil(totalDriverFare * 1.03)
      });
    }
  }, [pickupCoords, dropoffCoords, jobType, vehicleType, distanceKm, calculateRoute]);

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return router.push('/auth/login?next=/win-online');
    setIsSubmitting(true);
    const { error } = await supabase.from('jobs').insert({
      employer_id: currentUser.id, title, job_type: jobType, vehicle_type: vehicleType, pickup_location: pickup, dropoff_location: dropoff || null, distance_km: distanceKm, budget: fareBreakdown.totalFare, status

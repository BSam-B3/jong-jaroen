'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LocationEditPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [radius, setRadius] = useState<number>(10); // ค่าเริ่มต้น 10km
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }
      // ดึงข้อมูลพิกัดเก่าจากคอลัมน์ใหม่ที่เราทำไว้
      const { data } = await supabase
        .from('profiles')
        .select('location_lat, location_lng, work_radius_km')
        .eq('id', session.user.id)
        .single();
        
      if (data) {
        if (data.location_lat) setLat(data.location_lat);
        if (data.location_lng) setLng(data.location_lng);
        if (data.work_radius_km) setRadius(data.work_radius_km);
      }
      setLoading(false);
    }
    loadData();
  }, [router, supabase]);

  const handleGetLocation = () => {
    setError('');
    setSuccess('');
    if (!navigator.geolocation) {
      setError('อุปกรณ์ของคุณไม่รองรับการระบุตำแหน่งค่ะ');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setSuccess('📍 ดึงพิกัดปัจจุบันสำเร็จแล้วค่ะ');
      },
      (err) => {
        setError('ไม่สามารถดึงตำแหน่งได้ กรุณาเปิด GPS ในมือถือและอนุญาตการเข้าถึงตำแหน่งค่ะ');
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('หมดอายุการใช้งาน กรุณาล็อกอินใหม่');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          location_lat: lat,
          location_lng: lng,
          work_radius_km: radius
        })
        .eq('id', session.user.id);

      if (updateError) throw updateError;
      setSuccess('✅ บันทึกพื้นที่รับงานสำเร็จแล้วค่ะ');
      
      // กลับไปหน้าโปรไฟล์หลังเซฟเสร็จ 1 วินาที
      setTimeout(() => router.push('/profile/edit'), 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold">กำลังโหลด...</div>;

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-20">
      <div className="w-full sm:max-w-2xl bg-white min-h-screen flex flex-col shadow-xl">
        <div className="p-6 border-b sticky top-0 bg-white z-50 flex items-center gap-4">
          <Link href="/profile/edit" className="text-2xl font-bold text-gray-600 hover:text-black">←</Link>
          <h1 className="font-black text-xl">พื้นที่รับงาน (GPS)</h1>
        </div>

        <div className="p-6 space-y-8">
          
          {/* 📍 ส่วนที่ 1: ดึงพิกัด */}
          <div className="bg-orange-50 p-5 rounded-3xl border border-orange-100">
            <h2 className="font-black text-[#EE4D2D] mb-2 flex items-center gap-2">
              <span>📍</span> 1. พิกัดฐานที่ตั้ง
            </h2>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              ระบบจะใช้พิกัดนี้เป็น "จุดศูนย์กลาง" ในการค้นหางานที่อยู่ใกล้คุณที่สุด กรุณากดปุ่มด้านล่างขณะอยู่ที่บ้านหรือจุดรอรับงานหลักค่ะ
            </p>
            
            {lat && lng ? (
              <div className="bg-white p-4 rounded-2xl border border-gray-200 mb-4 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">พิกัดปัจจุบัน</p>
                  <p className="text-sm font-black text-gray-800">{lat.toFixed(5)}, {lng.toFixed(5)}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xl shadow-sm">✅</div>
              </div>
            ) : (
              <div className="bg-white p-4 rounded-2xl border border-dashed border-gray-300 mb-4 text-center">
                <p className="text-sm font-bold text-gray-400">ยังไม่ได้ตั้งค่าพิกัด</p>
              </div>
            )}

            <button 
              onClick={handleGetLocation}
              className="w-full py-3.5 bg-white border-2 border-[#EE4D2D] text-[#EE4D2D] rounded-2xl font-black text-sm active:scale-95 transition-all shadow-sm flex justify-center items-center gap-2 hover:bg-orange-100"
            >
              <span>🧭</span> ดึงพิกัด GPS ปัจจุบัน
            </button>
          </div>

          {/* 🛵 ส่วนที่ 2: รัศมีรับงาน */}
          <div className="bg-blue-50 p-5 rounded-3xl border border-blue-100">
            <h2 className="font-black text-blue-800 mb-2 flex items-center gap-2">
              <span>🛵</span> 2. รัศมีรับงาน (กิโลเมตร)
            </h2>
            <p className="text-xs text-blue-600 mb-6 leading-relaxed">
              คุณต้องการให้ระบบส่งงานที่อยู่ห่างจากจุดศูนย์กลางไม่เกินกี่กิโลเมตร?
            </p>

            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-gray-500">ใกล้บ้าน</span>
                <span className="text-4xl font-black text-blue-600 tracking-tighter">{radius} <span className="text-sm tracking-normal text-blue-400">km</span></span>
                <span className="text-xs font-bold text-gray-500">วิ่งไกล</span>
              </div>
              
              <input 
                type="range" 
                min="1" 
                max="50" 
                step="1"
                value={radius} 
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-[#EE4D2D]"
              />
              
              <div className="flex justify-between text-[10px] font-bold text-gray-400 px-1">
                <span>1 km</span>
                <span>25 km</span>
                <span>50 km</span>
              </div>
            </div>
          </div>

          {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-black border border-red-100 text-center">{error}</div>}
          {success && <div className="bg-green-50 text-green-600 p-4 rounded-2xl text-xs font-black border border-green-100 text-center">{success}</div>}

          {/* 💾 ปุ่มบันทึก */}
          <button 
            onClick={handleSave}
            disabled={saving || !lat || !lng}
            className={`w-full py-5 rounded-full font-black text-sm shadow-xl active:scale-95 transition-all flex justify-center items-center gap-2 mt-4
              ${(saving || !lat || !lng) ? 'bg-gray-300 text-gray-500' : 'bg-gradient-to-r from-[#EE4D2D] to-[#FF7337] text-white hover:shadow-2xl'}`}
          >
            {saving ? 'กำลังบันทึก...' : '💾 บันทึกการตั้งค่ารับงาน'}
          </button>
        </div>
      </div>
    </div>
  );
}

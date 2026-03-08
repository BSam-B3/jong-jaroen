'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const QUICK_DESTINATIONS = [
  { label: '🏥 ไปอนามัย/รพ.', value: 'hospital' },
  { label: '🛒 ไปตลาด', value: 'market' },
  { label: '🏦 ไปธนาคาร', value: 'bank' },
  { label: '📋 อื่นๆ', value: 'other' },
];

export default function ErrandPage() {
  const router = useRouter();
  const [destination, setDestination] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [locStatus, setLocStatus] = useState('idle'); // 'idle' | 'loading' | 'done' | 'error'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleGetLocation() {
    if (!navigator.geolocation) {
      setError('อุปกรณ์ของคุณไม่รองรับ GPS');
      return;
    }
    setLocStatus('loading');
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocStatus('done');
      },
      () => {
        setLocStatus('error');
        setError('ไม่สามารถดึงตำแหน่งได้ กรุณาอนุญาต GPS แล้วลองใหม่');
      },
      { timeout: 10000 }
    );
  }

  async function handleSubmit() {
    if (!destination) {
      setError('กรุณาเลือกปลายทางที่ต้องการไป');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      const { error: insertErr } = await supabase.from('job_requests').insert({
        job_type: 'errand',
        destination,
        lat: lat || null,
        lng: lng || null,
        status: 'looking_for_provider',
        user_id: session.user.id,
      });
      if (insertErr) throw insertErr;
      alert('ระบบกำลังค้นหาคนพาไป!');
      router.push('/');
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-600 text-xl">←</button>
        <h1 className="font-extrabold text-2xl text-gray-800">หาคนพาไปธุระ</h1>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* หัวข้อ */}
        <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-8">
          ให้พาไปไหนดี? 🛵
        </h2>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-lg font-semibold text-center">
            ⚠️ {error}
          </div>
        )}

        {/* ส่วน 1: Quick Options */}
        <div>
          <p className="text-xl font-bold text-gray-700 mb-3">เลือกปลายทาง</p>
          <div className="grid grid-cols-2 gap-4">
            {QUICK_DESTINATIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDestination(opt.value)}
                className={`w-full py-8 rounded-2xl text-2xl font-extrabold shadow-md transition border-4 ${
                  destination === opt.value
                    ? 'bg-orange-500 text-white border-orange-600 shadow-xl scale-105'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ส่วน 2: ปุ่มดึงตำแหน่ง */}
        <div>
          <p className="text-xl font-bold text-gray-700 mb-3">ตำแหน่งของคุณ (ไม่บังคับ)</p>
          <button
            onClick={handleGetLocation}
            disabled={locStatus === 'loading'}
            className="w-full py-6 text-xl font-bold bg-blue-100 text-blue-700 rounded-2xl border-2 border-blue-200 hover:bg-blue-200 transition disabled:opacity-50"
          >
            {locStatus === 'loading' ? '⏳ กำลังดึงตำแหน่ง...' :
             locStatus === 'done' ? `✅ ได้ตำแหน่งแล้ว (lat: ${lat?.toFixed(4)}, lng: ${lng?.toFixed(4)})` :
             locStatus === 'error' ? '❌ ลองดึงตำแหน่งอีกครั้ง' :
             '📍 ใช้ตำแหน่งปัจจุบันของฉัน'}
          </button>
        </div>

        {/* ส่วน 3: ปุ่มยืนยัน */}
        <button
          onClick={handleSubmit}
          disabled={loading || !destination}
          className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-50 text-white font-bold py-10 rounded-2xl text-3xl shadow-xl flex flex-col items-center transition"
        >
          {loading ? (
            <>
              <span className="text-5xl mb-2 animate-spin">⏳</span>
              กำลังค้นหา...
            </>
          ) : (
            <>
              <span className="text-5xl mb-2">🚀</span>
              ค้นหาคนพาไปเดี๋ยวนี้!
            </>
          )}
        </button>

        <p className="text-center text-gray-400 text-sm">
          ระบบจะแจ้งเตือนเมื่อมีคนรับงาน
        </p>
      </div>
    </div>
  );
}

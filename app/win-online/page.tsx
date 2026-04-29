'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type JobType = 'ride' | 'buy' | 'deliver';
type VehicleType = 'motorcycle' | 'car' | 'pickup' | 'van' | 'suv';

const JOB_TYPES: { key: JobType; label: string; icon: string; desc: string }[] = [
  { key: 'ride', label: 'เรียกรถ', icon: '🛵', desc: 'รับ-ส่งคน' },
  { key: 'buy', label: 'ซื้อของ', icon: '🛒', desc: 'ฝากซื้อ' },
  { key: 'deliver', label: 'ส่งของ', icon: '📦', desc: 'รับ-ส่งพัสดุ' },
];

const VEHICLES: {
  key: VehicleType;
  label: string;
  icon: string;
  base: number;
  perKm: number;
}[] = [
  { key: 'motorcycle', label: 'มอเตอร์ไซค์', icon: '🛵', base: 30, perKm: 8 },
  { key: 'car', label: 'รถเก๋ง', icon: '🚗', base: 60, perKm: 15 },
  { key: 'pickup', label: 'รถกระบะ', icon: '🛻', base: 100, perKm: 20 },
  { key: 'van', label: 'รถตู้', icon: '🚐', base: 120, perKm: 22 },
  { key: 'suv', label: 'SUV', icon: '🚙', base: 90, perKm: 18 },
];

const JOB_MULTIPLIER: Record<JobType, number> = {
  ride: 1,
  buy: 1.15,
  deliver: 1.05,
};

export default function WinOnlinePage() {
  const router = useRouter();
  const supabase = createClient();

  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [jobType, setJobType] = useState<JobType>('ride');
  const [vehicleType, setVehicleType] = useState<VehicleType>('motorcycle');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // คำนวณระยะทางและราคาจำลอง
  const { distance, price } = useMemo(() => {
    const len = pickup.trim().length + dropoff.trim().length;
    if (!pickup.trim() || !dropoff.trim()) {
      return { distance: 0, price: 0 };
    }
    const km = Math.max(1, Math.round((len / 6) * 10) / 10);
    const v = VEHICLES.find((x) => x.key === vehicleType)!;
    const raw = (v.base + km * v.perKm) * JOB_MULTIPLIER[jobType];
    return { distance: km, price: Math.round(raw / 5) * 5 };
  }, [pickup, dropoff, jobType, vehicleType]);

  const canSubmit =
    pickup.trim().length >= 3 &&
    dropoff.trim().length >= 3 &&
    price > 0 &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      setError('กรุณาเข้าสู่ระบบก่อนเรียกใช้บริการ');
      setSubmitting(false);
      return;
    }

    const { error: insertErr } = await supabase.from('jobs').insert({
      employer_id: user.id,
      job_type: jobType,
      vehicle_type: vehicleType,
      pickup_location: pickup.trim(),
      dropoff_location: dropoff.trim(),
      budget: price,
      status: 'open',
    });

    if (insertErr) {
      setError(`บันทึกไม่สำเร็จ: ${insertErr.message}`);
      setSubmitting(false);
      return;
    }

    alert('✅ ส่งคำขอเรียบร้อย กำลังหาคนรับงานให้คุณ...');
    router.push('/my-jobs');
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-20">
      <div className="w-full max-w-xl min-h-screen flex flex-col">
        {/* Header */}
        <header className="px-5 pt-8 pb-4 bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-b-[2rem] shadow-md">
          <h1 className="text-white text-2xl font-black tracking-tight">
            🛵 วินออนไลน์
          </h1>
          <p className="text-white/80 text-xs font-bold mt-1">
            เรียกรถ ส่งของ ฝากซื้อ ครบในที่เดียว
          </p>
        </header>

        <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4 flex-1">
          {/* Map placeholder */}
          <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="relative aspect-[16/9] bg-gradient-to-br from-blue-50 via-emerald-50 to-amber-50">
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-4xl mb-2">🗺️</div>
                <p className="font-black text-sm text-gray-700">
                  พื้นที่แสดงแผนที่
                </p>
                <p className="text-[11px] text-gray-500 font-bold">
                  Map Placeholder
                </p>
              </div>
              {distance > 0 && (
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm">
                  <p className="text-[11px] font-black text-gray-700">
                    📍 ระยะทาง ~{distance.toFixed(1)} กม.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Job type */}
          <section>
            <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wide mb-2">
              ประเภทบริการ
            </label>
            <div className="grid grid-cols-3 gap-2">
              {JOB_TYPES.map((t) => {
                const active = jobType === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setJobType(t.key)}
                    className={`p-3 rounded-2xl border-2 transition-all ${
                      active
                        ? 'border-[#EE4D2D] bg-orange-50 shadow-sm'
                        : 'border-gray-100 bg-white'
                    }`}
                  >
                    <div className="text-2xl mb-1">{t.icon}</div>
                    <p
                      className={`font-black text-sm ${
                        active ? 'text-[#EE4D2D]' : 'text-gray-800'
                      }`}
                    >
                      {t.label}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold">
                      {t.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Locations */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
            <div className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-base shrink-0">
                🟢
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-black text-emerald-700 uppercase tracking-wide">
                  จุดรับ
                </label>
                <input
                  type="text"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  placeholder="ระบุสถานที่รับ เช่น ตลาดประแสร์"
                  className="w-full bg-transparent outline-none text-sm font-bold text-gray-800 placeholder:text-gray-300"
                />
              </div>
            </div>
            <div className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center text-base shrink-0">
                🔴
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-black text-red-700 uppercase tracking-wide">
                  จุดส่ง
                </label>
                <input
                  type="text"
                  value={dropoff}
                  onChange={(e) => setDropoff(e.target.value)}
                  placeholder="ระบุปลายทาง เช่น โรงพยาบาลแกลง"
                  className="w-full bg-transparent outline-none text-sm font-bold text-gray-800 placeholder:text-gray-300"
                />
              </div>
            </div>
          </section>

          {/* Vehicle type */}
          <section>
            <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wide mb-2">
              เลือกประเภทรถ
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {VEHICLES.map((v) => {
                const active = vehicleType === v.key;
                return (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => setVehicleType(v.key)}
                    className={`p-3 rounded-2xl border-2 transition-all ${
                      active
                        ? 'border-[#EE4D2D] bg-orange-50 shadow-sm'
                        : 'border-gray-100 bg-white'
                    }`}
                  >
                    <div className="text-2xl mb-1">{v.icon}</div>
                    <p
                      className={`font-black text-[11px] leading-tight ${
                        active ? 'text-[#EE4D2D]' : 'text-gray-800'
                      }`}
                    >
                      {v.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Price summary */}
          <section className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-gray-400 font-bold">
                  ค่าบริการโดยประมาณ
                </p>
                <p className="text-[#EE4D2D] font-black text-2xl">
                  {price.toLocaleString('th-TH')} บาท
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-gray-400 font-bold">ระยะทาง</p>
                <p className="font-black text-gray-700 text-sm">
                  {distance > 0 ? `~${distance.toFixed(1)} กม.` : '-'}
                </p>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 font-bold mt-2 leading-relaxed">
              * ราคาคำนวณจากระยะทางและประเภทรถ อาจปรับได้ตามจริง
            </p>
          </section>

          {error && (
            <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
              <p className="text-xs font-black text-red-700">⚠️ {error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full py-4 rounded-2xl text-white text-sm font-black shadow-md active:scale-95 transition-transform ${
              canSubmit
                ? 'bg-gradient-to-r from-[#EE4D2D] to-[#FF7337]'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {submitting
              ? 'กำลังส่งคำขอ...'
              : canSubmit
              ? `ยืนยันเรียกใช้บริการ · ${price.toLocaleString('th-TH')} บาท`
              : 'กรอกจุดรับ-ส่งให้ครบก่อน'}
          </button>
        </form>
      </div>
    </div>
  );
}

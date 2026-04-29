'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function AdminRidersPage() {
  const supabase = createClient();
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. ดึงข้อมูลไรเดอร์ที่รอตรวจ พร้อมรถทุกคันในอู่
  const fetchPendingData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        rider_vehicles (*)
      `)
      .eq('is_rider', true)
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setRiders(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchPendingData();
  }, [fetchPendingData]);

  // 2. ฟังก์ชันอนุมัติ/ปฏิเสธ "ตัวคนขับ"
  const handleRiderStatus = async (riderId: string, status: 'approved' | 'rejected') => {
    if (!confirm(`ยืนยันการ ${status === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'} คนขับท่านนี้?`)) return;
    const { error } = await supabase
      .from('profiles')
      .update({ rider_status: status })
      .eq('id', riderId);
    
    if (!error) fetchPendingData();
  };

  // 3. ฟังก์ชันอนุมัติ/ปฏิเสธ "รถแต่ละคัน"
  const handleVehicleStatus = async (vehicleId: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('rider_vehicles')
      .update({ status: status })
      .eq('id', vehicleId);
    
    if (!error) fetchPendingData();
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans pb-20">
      <div className="max-w-6xl mx-auto px-4 py-10">
        
        <header className="mb-10 flex justify-between items-end">
          <div>
            <Link href="/" className="text-[#EE4D2D] font-black text-xs mb-2 inline-block">← กลับหน้าหลัก</Link>
            <h1 className="text-4xl font-black text-gray-900 italic">RIDER <span className="text-[#EE4D2D] not-italic">APPROVAL</span></h1>
            <p className="text-sm text-gray-400 font-bold mt-1 uppercase tracking-widest">ระบบตรวจสอบและอนุมัติคนขับ-ยานพาหนะ</p>
          </div>
          <button onClick={fetchPendingData} className="bg-white border border-gray-200 px-6 py-3 rounded-2xl text-xs font-black shadow-sm active:scale-95 transition-all">🔄 รีเฟรชข้อมูล</button>
        </header>

        {loading ? (
          <div className="text-center py-20 font-black text-gray-400">กำลังตรวจสอบเอกสาร... 🔍</div>
        ) : riders.length === 0 ? (
          <div className="bg-white rounded-[3rem] p-20 text-center shadow-sm border border-gray-100">
            <p className="font-black text-gray-400 text-xl">ไม่มีคนขับรอการอนุมัติในขณะนี้ ☕</p>
          </div>
        ) : (
          <div className="space-y-10">
            {riders.map((rider) => (
              <div key={rider.id} className="bg-white rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden flex flex-col lg:flex-row">
                
                {/* ฝั่งซ้าย: ข้อมูลคนขับ & เอกสาร KYC */}
                <div className="lg:w-1/3 p-8 bg-gray-50/50 border-r border-gray-100">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-3xl bg-white shadow-md overflow-hidden border-2 border-white">
                      <img src={rider.avatar_url || '/placeholder-user.png'} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-gray-900">{rider.full_name}</h2>
                      <p className="text-xs text-[#EE4D2D] font-bold">{rider.phone || 'ไม่ระบุเบอร์'}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <DocSection title="📸 รูปยืนยันตัวตน (KYC)" url={rider.liveness_photo_url} label="เซลฟี่คู่ใบขับขี่" />
                    <div className="grid grid-cols-1 gap-4">
                      <DocSection title="🪪 ใบขับขี่ที่มีในระบบ" url={rider.moto_license_url} label="จักรยานยนต์" />
                      <DocSection title="" url={rider.car_license_url} label="รถยนต์" />
                    </div>

                    <div className="pt-6 border-t border-gray-200 space-y-3">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center mb-4">จัดการสถานะคนขับ</p>
                      <div className="flex gap-2">
                        <button onClick={() => handleRiderStatus(rider.id, 'approved')} className="flex-1 bg-green-500 text-white py-3 rounded-2xl text-xs font-black shadow-md hover:bg-green-600 transition-colors">อนุมัติคนขับ</button>
                        <button onClick={() => handleRiderStatus(rider.id, 'rejected')} className="flex-1 bg-white text-red-500 border border-red-100 py-3 rounded-2xl text-xs font-black hover:bg-red-50 transition-colors">ปฏิเสธ</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ฝั่งขวา: ข้อมูลอู่รถ (List of Vehicles) */}
                <div className="lg:w-2/3 p-8 space-y-8">
                  <div className="flex justify-between items-center border-b pb-4">
                    <h2 className="text-xl font-black text-gray-800">อู่รถที่ลงทะเบียน ({rider.rider_vehicles?.length || 0})</h2>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {rider.rider_vehicles?.map((veh: any) => (
                      <div key={veh.id} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm relative group overflow-hidden">
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="md:w-1/3 space-y-3">
                            <span className="inline-block bg-gray-900 text-white text-[9px] font-black px-3 py-1 rounded-full italic uppercase">
                              {veh.vehicle_type}
                            </span>
                            <h3 className="text-lg font-black text-gray-800">{veh.brand} {veh.model}</h3>
                            <p className="text-sm font-black text-[#EE4D2D] bg-orange-50 inline-block px-3 py-1 rounded-lg">{veh.registration}</p>
                            <p className="text-xs text-gray-400 font-bold">สีรถ: {veh.color}</p>
                            
                            <div className="pt-4 space-y-2">
                              <button onClick={() => handleVehicleStatus(veh.id, 'approved')} className={`w-full py-2.5 rounded-xl text-[10px] font-black transition-all ${veh.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-gray-900 text-white shadow-md'}`}>
                                {veh.status === 'approved' ? '✅ อนุมัติแล้ว' : 'อนุมัติรถคันนี้'}
                              </button>
                              <button onClick={() => handleVehicleStatus(veh.id, 'rejected')} className="w-full py-2.5 rounded-xl text-[10px] font-black text-red-400 hover:bg-red-50">ปฏิเสธรถคันนี้</button>
                            </div>
                          </div>

                          <div className="md:w-2/3 grid grid-cols-3 gap-2">
                            <VehicleThumb url={veh.tax_act_url} label="ป้ายภาษี" />
                            <VehicleThumb url={veh.front_photo_url} label="หน้าตรง" />
                            <VehicleThumb url={veh.back_photo_url} label="หลัง (ทะเบียน)" />
                            <VehicleThumb url={veh.left_photo_url} label="ซ้าย" />
                            <VehicleThumb url={veh.right_photo_url} label="ขวา" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Component ย่อยสำหรับแสดงรูปเอกสาร ---
function DocSection({ title, url, label }: any) {
  if (!url && !title) return null;
  return (
    <div>
      {title && <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{title}</h3>}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="aspect-video bg-gray-100 flex items-center justify-center relative group">
          {url ? (
            <a href={url} target="_blank" className="w-full h-full">
              <img src={url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </a>
          ) : <span className="text-xs text-gray-300 font-bold">ยังไม่เพิ่มข้อมูล</span>}
        </div>
        <div className="p-2 bg-white">
          <p className="text-[9px] font-black text-gray-700 text-center uppercase">{label}</p>
        </div>
      </div>
    </div>
  );
}

function VehicleThumb({ url, label }: any) {
  return (
    <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
      <div className="aspect-square flex items-center justify-center">
        {url ? (
          <a href={url} target="_blank" className="w-full h-full">
            <img src={url} className="w-full h-full object-cover" />
          </a>
        ) : <span className="text-[10px] text-gray-300 font-bold italic">No Photo</span>}
      </div>
      <div className="p-1.5 bg-white border-t border-gray-50 text-center">
        <p className="text-[8px] font-black text-gray-500 uppercase">{label}</p>
      </div>
    </div>
  );
}

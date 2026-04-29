'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

type VehicleStatus = 'pending' | 'approved' | 'rejected';

interface VehicleRecord {
  id: string;
  rider_id: string;
  brand: string;
  model: string;
  registration: string;
  status: VehicleStatus;
  created_at: string;
  rider: {
    first_name: string;
    full_name: string;
    phone: string;
    avatar_url: string;
  };
}

export default function AdminVehiclesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'approved'>('pending');

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('rider_vehicles')
      .select(`
        id, rider_id, brand, model, registration, status, created_at,
        rider:profiles!rider_id (first_name, full_name, phone, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (data) {
      setVehicles(data as unknown as VehicleRecord[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleUpdateStatus = async (vehicleId: string, newStatus: VehicleStatus) => {
    const action = newStatus === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ';
    if (!confirm(`ยืนยันการ ${action} ยานพาหนะคันนี้ใช่ไหมคะ?`)) return;

    const { error } = await supabase
      .from('rider_vehicles')
      .update({ status: newStatus })
      .eq('id', vehicleId);

    if (error) {
      alert(`อัปเดตไม่สำเร็จ: ${error.message}`);
    } else {
      alert(`✅ ${action} เรียบร้อยแล้วค่ะ`);
      fetchVehicles();
    }
  };

  const displayList = vehicles.filter((v) => 
    tab === 'pending' ? v.status === 'pending' : v.status === 'approved'
  );

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans">
      <div className="w-full max-w-4xl min-h-screen flex flex-col bg-[#F4F6F8] border-x border-gray-100">
        
        <header className="bg-gray-900 px-6 pt-12 pb-6 sticky top-0 z-20 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              {/* 🌟 แก้ลิงก์กลับไปที่หน้าแดชบอร์ดหลัก */}
              <Link href="/admin" className="text-gray-400 font-bold text-xs mb-2 inline-block hover:text-white transition">← กลับหน้าแดชบอร์ด</Link>
              <h1 className="text-white text-3xl font-black tracking-tight">
                ADMIN <span className="text-[#EE4D2D]">VEHICLES</span>
              </h1>
              <p className="text-gray-400 text-xs font-bold mt-1">จัดการคำขอขึ้นทะเบียนรถของไรเดอร์</p>
            </div>
            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-2xl border border-gray-700">
              🛵
            </div>
          </div>
        </header>

        <div className="px-6 pt-6">
          <div className="bg-white rounded-2xl p-1.5 flex shadow-sm border border-gray-200 relative">
             <span
              className={`absolute top-1.5 bottom-1.5 w-[calc(50%-0.375rem)] rounded-xl bg-gray-900 shadow-md transition-all duration-300 ease-out ${tab === 'pending' ? 'left-1.5' : 'left-[calc(50%+0rem)]'}`}
              aria-hidden
            />
            <button onClick={() => setTab('pending')} className={`relative z-10 flex-1 py-3 rounded-xl text-sm font-black transition-colors ${tab === 'pending' ? 'text-white' : 'text-gray-500'}`}>
              ⏳ รออนุมัติ ({vehicles.filter(v => v.status === 'pending').length})
            </button>
            <button onClick={() => setTab('approved')} className={`relative z-10 flex-1 py-3 rounded-xl text-sm font-black transition-colors ${tab === 'approved' ? 'text-white' : 'text-gray-500'}`}>
              ✅ อนุมัติแล้ว ({vehicles.filter(v => v.status === 'approved').length})
            </button>
          </div>
        </div>

        <main className="flex-1 p-6 space-y-4 pb-10">
          {loading ? (
            <div className="text-center py-12 font-bold text-gray-400 animate-pulse">กำลังโหลดข้อมูลยานพาหนะ... ⏳</div>
          ) : displayList.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-12 text-center border border-gray-200 shadow-sm mt-4">
              <div className="text-6xl mb-4">📭</div>
              <p className="font-black text-gray-800 text-lg">ไม่มีรายการในหมวดหมู่นี้</p>
            </div>
          ) : (
            displayList.map((vehicle) => (
              <div key={vehicle.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-200 flex flex-col md:flex-row gap-6">
                
                <div className="flex items-center gap-4 md:w-1/3">
                  <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center text-3xl overflow-hidden shrink-0">
                    {vehicle.rider?.avatar_url ? (
                       <img src={vehicle.rider.avatar_url} className="w-full h-full object-cover" alt="rider avatar" />
                    ) : '👤'}
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-base leading-tight">{vehicle.rider?.full_name || vehicle.rider?.first_name || 'ไม่ระบุชื่อ'}</h3>
                    <p className="text-xs font-bold text-gray-500 mt-1">📞 {vehicle.rider?.phone || 'ไม่มีเบอร์โทร'}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1">สมัครเมื่อ: {new Date(vehicle.created_at).toLocaleDateString('th-TH')}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 flex-1 border border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black bg-gray-200 text-gray-600 px-2.5 py-1 rounded-md uppercase tracking-wider">ข้อมูลยานพาหนะ</span>
                    <p className="font-black text-gray-800 text-sm mt-2">{vehicle.brand} {vehicle.model}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black bg-yellow-300 text-gray-900 px-3 py-1 rounded-md uppercase tracking-widest border border-yellow-400">
                      ทะเบียน: {vehicle.registration}
                    </span>
                  </div>
                </div>

                {tab === 'pending' && (
                  <div className="flex flex-row md:flex-col gap-2 shrink-0 justify-center">
                    <button 
                      onClick={() => handleUpdateStatus(vehicle.id, 'approved')}
                      className="flex-1 md:w-32 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl text-xs font-black transition-transform active:scale-95 shadow-sm"
                    >
                      ✅ อนุมัติ
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(vehicle.id, 'rejected')}
                      className="flex-1 md:w-32 bg-red-50 hover:bg-red-100 text-red-600 py-3 rounded-xl text-xs font-black transition-colors"
                    >
                      ❌ ปฏิเสธ
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </main>
      </div>
    </div>
  );
}

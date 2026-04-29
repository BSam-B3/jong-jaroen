'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface RiderProfile {
  id: string;
  full_name: string;
  phone_number: string;
  is_rider: boolean;
  rider_status: string;
  vehicle_type: string;
  vehicle_registration: string;
}

export default function AdminRidersPage() {
  const supabase = createClient();
  const [riders, setRiders] = useState<RiderProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. ดึงข้อมูลคนที่สมัครเป็นไรเดอร์ทั้งหมด
  useEffect(() => {
    fetchRiders();
  }, []);

  const fetchRiders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_rider', true)
      .order('rider_status', { ascending: false }); // ให้ pending ขึ้นก่อน (ตัว p มาก่อน a ถ้าเรียงตามตัวอักษร แต่เราใช้ logic ดูง่ายๆ ไปก่อน)

    if (!error && data) {
      setRiders(data);
    }
    setLoading(false);
  };

  // 2. ฟังก์ชันอนุมัติ / ปฏิเสธ ไรเดอร์
  const handleUpdateStatus = async (userId: string, newStatus: 'approved' | 'rejected') => {
    if (!confirm(`ยืนยันการ ${newStatus === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'} ไรเดอร์ท่านนี้ใช่ไหมคะ?`)) return;

    const { error } = await supabase
      .from('profiles')
      .update({ rider_status: newStatus })
      .eq('id', userId);

    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } else {
      alert('อัปเดตสถานะเรียบร้อยค่ะ! ✅');
      fetchRiders(); // ดึงข้อมูลใหม่
    }
  };

  const getVehicleName = (type: string) => {
    switch (type) {
      case 'car': return '🚗 รถเก๋ง';
      case 'pickup': return '🛻 กระบะ';
      case 'saleng': return '🛺 ซาเล้ง';
      case 'motorcycle': return '🛵 มอเตอร์ไซค์';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <Link href="/" className="text-[#EE4D2D] text-sm font-black flex items-center gap-1 mb-2">
              ← กลับหน้าหลัก
            </Link>
            <h1 className="text-2xl font-black text-gray-900">จัดการข้อมูลคนขับ (Rider Admin)</h1>
            <p className="text-xs text-gray-400 font-bold">ตรวจสอบป้ายทะเบียนและใบขับขี่ เพื่อความปลอดภัยของลูกค้า</p>
          </div>
        </div>

        {/* Rider Table Card */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">ชื่อ-นามสกุล / เบอร์โทร</th>
                  <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">ประเภทยานพาหนะ</th>
                  <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">ป้ายทะเบียน</th>
                  <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">สถานะ</th>
                  <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center">
                      <div className="w-8 h-8 border-4 border-[#EE4D2D] border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="text-xs text-gray-400 font-bold mt-2">กำลังดึงข้อมูล...</p>
                    </td>
                  </tr>
                ) : riders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-400 text-sm font-bold">
                      ยังไม่มีผู้สมัครเป็นไรเดอร์
                    </td>
                  </tr>
                ) : (
                  riders.map((rider) => (
                    <tr key={rider.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-black text-gray-800">{rider.full_name || 'ไม่ระบุชื่อ'}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{rider.phone_number || '-'}</p>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-600">
                        {getVehicleName(rider.vehicle_type)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-black bg-gray-100 px-3 py-1 rounded-md border border-gray-200">
                          {rider.vehicle_registration || 'ไม่ระบุ'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                          rider.rider_status === 'approved' 
                            ? 'bg-green-50 text-green-600 border border-green-100' 
                            : rider.rider_status === 'rejected'
                            ? 'bg-red-50 text-red-600 border border-red-100'
                            : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {rider.rider_status === 'approved' ? '✓ ผ่านแล้ว' : rider.rider_status === 'rejected' ? '❌ ไม่ผ่าน' : '⌛ รอตรวจ'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {rider.rider_status === 'pending' ? (
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleUpdateStatus(rider.id, 'approved')}
                              className="bg-green-500 hover:bg-green-600 text-white text-xs font-black px-4 py-2 rounded-xl transition-colors shadow-sm"
                            >
                              อนุมัติ
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(rider.id, 'rejected')}
                              className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-black px-4 py-2 rounded-xl transition-colors border border-red-200"
                            >
                              ปฏิเสธ
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400 font-bold">ดำเนินการแล้ว</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

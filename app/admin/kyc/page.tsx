'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminKYCPage() {
  const router = useRouter();
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingKYC();
  }, []);

  async function fetchPendingKYC() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, national_id, kyc_status, pdpa_consented_at')
      .eq('kyc_status', 'pending')
      .order('pdpa_consented_at', { ascending: false });

    if (data) setPendingUsers(data);
    setLoading(false);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">ตรวจสอบเอกสาร (KYC)</h1>
          <p className="text-gray-500 mt-2 font-medium text-sm">รายการสมาชิกรอการอนุมัติยืนยันตัวตน</p>
        </div>
        <div className="bg-orange-50 border border-orange-100 text-orange-600 px-5 py-2.5 rounded-2xl font-black text-sm shadow-sm flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
           รอตรวจสอบ {pendingUsers.length} รายการ
        </div>
      </div>

      {/* Data Table Section */}
      {loading ? (
        <div className="text-center py-20 font-black text-gray-300 text-lg">กำลังโหลดข้อมูล...</div>
      ) : pendingUsers.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-20 text-center shadow-sm border border-gray-100">
          <div className="text-6xl mb-6">🎉</div>
          <h3 className="text-xl font-black text-gray-800 mb-2">ไม่มีรายการค้างตรวจสอบ</h3>
          <p className="text-gray-400 text-sm font-medium">คุณบีสามจัดการเคลียร์งานเอกสารหมดเกลี้ยงแล้วค่ะ!</p>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">ชื่อ-นามสกุล</th>
                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">เลขบัตรประชาชน</th>
                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">สถานะ</th>
                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pendingUsers.map(user => (
                <tr key={user.id} className="hover:bg-orange-50/30 transition-colors group">
                  <td className="p-5 font-bold text-sm text-gray-800">{user.full_name}</td>
                  <td className="p-5 font-mono text-sm tracking-widest text-gray-500">{user.national_id}</td>
                  <td className="p-5">
                    <span className="bg-yellow-50 text-yellow-600 border border-yellow-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                      Pending
                    </span>
                  </td>
                  <td className="p-5 text-right">
                    <button 
                      onClick={() => router.push(`/admin/kyc/${user.id}`)}
                      className="bg-gray-100 text-gray-600 hover:bg-[#EE4D2D] hover:text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all"
                    >
                      เปิดตรวจเอกสาร
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

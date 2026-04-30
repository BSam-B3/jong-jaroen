import Link from 'next/link';
import { requireAdmin } from './_lib/requireAdmin';
import { sbServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboardPage() {
  // 1. ตรวจสอบสิทธิ์แอดมิน
  await requireAdmin('/admin');
  
  // 2. เรียกเครื่องมือเชื่อมต่อฐานข้อมูลโดยตรง
  const sb = sbServer();

  // 3. ดึงข้อมูลสถิติจาก RPC
  const { data, error } = await sb.rpc('admin_dashboard_stats');

  if (error) {
    throw new Error(`โหลดข้อมูลแดชบอร์ดไม่ได้ สาเหตุ: ${error.message}`);
  }

  if (!data) {
    throw new Error('ไม่พบข้อมูลสถิติจากระบบ');
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      
      {/* ส่วนหัวกระดาษและปุ่มลัด */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            แดชบอร์ดผู้ดูแลระบบ
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            ภาพรวมสถิติแพลตฟอร์มจงเจริญ
          </p>
        </div>
        
        {/* กลุ่มปุ่มลัด (ย้ายเข้ามาอยู่ใน return แล้ว) */}
        <div className="flex gap-2">
          <Link href="/admin/kyc" className="bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm hover:bg-orange-600 transition-colors">
            ตรวจสอบ KYC
          </Link>
          <Link href="/admin/jobs" className="bg-gray-800 text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm hover:bg-black transition-colors">
            จัดการงาน
          </Link>
          <Link href="/admin/vehicles" className="bg-[#EE4D2D] text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm hover:bg-red-600 transition-colors">
            อนุมัติรถไรเดอร์
          </Link>
        </div>
      </div>

      {/* ส่วนแสดงข้อมูลสถิติ (ดึงจากตัวแปร data) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 font-medium mb-2">จำนวนผู้ใช้งานทั้งหมด</h3>
          <p className="text-3xl font-black text-gray-900">{data.total_users || 0} คน</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 font-medium mb-2">รอตรวจสอบ KYC</h3>
          <p className="text-3xl font-black text-orange-500">{data.pending_kyc || 0} รายการ</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 font-medium mb-2">งานทั้งหมดในระบบ</h3>
          <p className="text-3xl font-black text-gray-900">{data.total_jobs || 0} งาน</p>
        </div>
      </div>

    </div>
  );
}

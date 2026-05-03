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

  // 💡 ข้อมูลจำลอง (เดี๋ยวเราค่อยเชื่อม DB จริงตอน C เขียน SQL เสร็จค่ะ)
  const pendingSlips = [
    { id: '1', jobTitle: 'ซ่อมท่อป้าณี #1234', amount: 450, bank: 'KBank', time: '12:30 น.' }
  ];
  
  const pendingWithdrawals = [
    { id: '1', workerName: 'ช่างบอล #5678', amount: 1250, bank: 'กสิกร xxx-x3456-x', time: '10:15 น.' }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      
      {/* ส่วนหัวกระดาษและปุ่มลัด (ของเดิมที่บีสามทำไว้ สวยมากค่ะ) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            แดชบอร์ดผู้ดูแลระบบ
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            ภาพรวมสถิติแพลตฟอร์มจงเจริญ
          </p>
        </div>
        
        {/* กลุ่มปุ่มลัด */}
        <div className="flex flex-wrap gap-2">
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

      <hr className="border-gray-200" />

      {/* 🌟 ส่วนที่ 1: ตรวจสลิปเงินเข้า (Meta AI Copy) */}
      <div>
        <div className="mb-4">
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <span>📥</span> ตรวจสลิปเงินเข้า
            <span className="bg-orange-100 text-orange-600 text-xs px-3 py-1 rounded-lg">ค้าง {pendingSlips.length} รายการ</span>
          </h2>
          <p className="text-sm font-medium text-gray-500 mt-1">
            ลูกค้าโอนเข้า Escrow รอเช็คยอด-เช็คสลิปตรงนี้ <span className="text-emerald-600 font-bold ml-1">เช็คผ่าน = ช่างเริ่มงานได้ทันที</span>
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingSlips.map(slip => (
            <div key={slip.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-black text-gray-800 text-base">งาน: {slip.jobTitle}</h3>
                  <p className="text-xs font-bold text-gray-500 mt-1">ยอด ฿{slip.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} | {slip.bank} {slip.time}</p>
                </div>
                <button className="text-[#EE4D2D] bg-orange-50 px-3 py-1.5 rounded-lg text-xs font-black hover:bg-orange-100 transition-colors">
                  ดูรูปสลิป
                </button>
              </div>
              <div className="flex gap-2 mt-2">
                <button className="flex-1 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-black shadow-sm hover:bg-emerald-600 transition-colors">
                  อนุมัติ
                </button>
                <div className="flex-1 flex flex-col gap-1">
                  <button className="w-full px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-black hover:bg-gray-200 transition-colors">
                    ตีกลับ
                  </button>
                  <p className="text-[9px] text-gray-400 text-center">ตีกลับ = แจ้งลูกค้าโอนใหม่</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🌟 ส่วนที่ 2: คิวโอนเงินให้ช่าง (Meta AI Copy) */}
      <div className="pb-10">
        <div className="mb-4">
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <span>💸</span> คิวโอนเงินให้ช่าง
            <span className="bg-blue-100 text-blue-600 text-xs px-3 py-1 rounded-lg">รอโอน ฿1,250</span>
          </h2>
          <p className="text-sm font-medium text-gray-500 mt-1">
            ช่างกดถอนแล้ว เงินถูกล็อกไว้รอแอดมินโอนแบบ Batch <span className="text-[#EE4D2D] font-bold ml-1">รอบโอน 11:00 กับ 17:00 น. กดโอนเสร็จค่อยมากดยืนยัน</span>
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {pendingWithdrawals.map(req => (
            <div key={req.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="w-full md:w-auto">
                <h3 className="font-black text-gray-800 text-base">{req.workerName}</h3>
                <p className="text-xs font-bold text-gray-600 mt-1">
                  ถอน <span className="text-[#EE4D2D] font-black">฿{req.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span> → {req.bank}
                </p>
                <p className="text-[10px] text-gray-400 mt-1 italic">กดถอนเมื่อ {req.time}</p>
              </div>
              <button className="w-full md:w-auto px-8 py-3 bg-emerald-500 text-white rounded-xl text-sm font-black shadow-sm hover:bg-emerald-600 transition-colors">
                โอนแล้ว ยืนยัน
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

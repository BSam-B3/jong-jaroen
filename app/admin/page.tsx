import Link from 'next/link';
import { requireAdmin } from './_lib/requireAdmin';
import { sbServer } from '@/lib/supabase/server';
import SlipActions from './components/SlipActions';
import WithdrawalActions from './components/WithdrawalActions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboardPage() {
  // 1. ตรวจสอบสิทธิ์แอดมิน
  await requireAdmin('/admin');
  
  // 2. เรียกเครื่องมือเชื่อมต่อฐานข้อมูลโดยตรง
  const sb = sbServer();

  // 3. ดึงข้อมูลสถิติจาก RPC
  const { data: stats, error: statsError } = await sb.rpc('admin_dashboard_stats');

  // 4. ดึงข้อมูลสลิปที่รอตรวจสอบ (Real Data)
  const { data: slips } = await sb
    .from('slip_uploads')
    .select(`
      id,
      created_at,
      job:jobs ( id, title, budget ),
      employer:profiles!uploader_id ( full_name )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  // 5. ดึงข้อมูลคำขอถอนเงิน (Real Data)
  const { data: withdrawals } = await sb
    .from('withdrawals')
    .select(`
      id,
      amount_satang,
      bank_name,
      account_no,
      requested_at,
      worker:profiles!user_id ( full_name )
    `)
    .eq('status', 'pending')
    .order('requested_at', { ascending: true });

  if (statsError) {
    throw new Error(`โหลดข้อมูลแดชบอร์ดไม่ได้ สาเหตุ: ${statsError.message}`);
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header และ ปุ่มลัด */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            แดชบอร์ดผู้ดูแลระบบ 👑
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            ยินดีต้อนรับกลับมาค่ะบีสาม ภาพรวมระบบจงเจริญตอนนี้เป็นอย่างไรบ้าง?
          </p>
        </div>
        
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

      {/* สถิติหลัก */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 font-medium mb-2">จำนวนผู้ใช้งานทั้งหมด</h3>
          <p className="text-3xl font-black text-gray-900">{stats?.total_users || 0} คน</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 font-medium mb-2">รอตรวจสอบ KYC</h3>
          <p className="text-3xl font-black text-orange-500">{stats?.pending_kyc || 0} รายการ</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 font-medium mb-2">งานทั้งหมดในระบบ</h3>
          <p className="text-3xl font-black text-gray-900">{stats?.total_jobs || 0} งาน</p>
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* 🌟 ส่วนที่ 1: ตรวจสลิปเงินเข้า (เชื่อมต่อ RPC: approve_slip) */}
      <section>
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <span>📥</span> ตรวจสลิปเงินเข้า
              <span className="bg-orange-100 text-orange-600 text-xs px-3 py-1 rounded-lg">
                ค้าง {slips?.length || 0} รายการ
              </span>
            </h2>
            <p className="text-sm font-medium text-gray-500 mt-1">
              ตรวจสอบยอดโอนเข้าบัญชีกลาง <span className="text-emerald-600 font-bold ml-1">เช็คผ่าน = ช่างเริ่มงานได้ทันที</span>
            </p>
          </div>
        </div>
        
        {slips?.length === 0 ? (
          <div className="bg-gray-50 rounded-3xl p-10 text-center border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-bold">ไม่มีสลิปรอตรวจสอบในขณะนี้ค่ะ ✨</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {slips?.map(slip => (
              <div key={slip.id} className="bg-white p-5 rounded-[2rem] border border-gray-200 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-black text-gray-800 text-base line-clamp-1">{slip.job?.title}</h3>
                    <p className="text-xs font-bold text-gray-500 mt-1">
                      โดย: {slip.employer?.full_name} | ⏰ {new Date(slip.created_at).toLocaleTimeString('th-TH')}
                    </p>
                    <p className="text-xl font-black text-[#EE4D2D] mt-1 tracking-tight">
                      ฿{slip.job?.budget?.toLocaleString()}
                    </p>
                  </div>
                  {/* ลิงก์ไปดูรูปสลิปใน Storage */}
                  <a 
                    href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/slips-pending/${slip.storage_path}`} 
                    target="_blank"
                    className="text-[#EE4D2D] bg-orange-50 px-3 py-1.5 rounded-lg text-xs font-black hover:bg-orange-100 transition-colors"
                  >
                    ดูรูปสลิป
                  </a>
                </div>
                {/* ปุ่ม Actions อนุมัติสลิป */}
                <SlipActions slipId={slip.id} jobTitle={slip.job?.title} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 🌟 ส่วนที่ 2: คิวโอนเงินให้ช่าง (เชื่อมต่อ RPC: approve_withdrawal) */}
      <section className="pb-10">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <span>💸</span> คิวโอนเงินให้ช่าง
            <span className="bg-blue-100 text-blue-600 text-xs px-3 py-1 rounded-lg">
              รอโอน {withdrawals?.length || 0} รายการ
            </span>
          </h2>
          <p className="text-sm font-medium text-gray-500 mt-1">
            ช่างส่งคำขอถอนเงิน <span className="text-[#EE4D2D] font-bold ml-1">โอนเสร็จแล้วรบกวนกดยืนยันเพื่อตัดยอดค่ะ</span>
          </p>
        </div>
        
        {withdrawals?.length === 0 ? (
          <div className="bg-gray-50 rounded-3xl p-10 text-center border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-bold">ยังไม่มีคำขอถอนเงินใหม่ค่ะ 🙌</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {withdrawals?.map(req => (
              <div key={req.id} className="bg-white p-5 rounded-[2rem] border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="w-full md:w-auto">
                  <h3 className="font-black text-gray-800 text-base">{req.worker?.full_name}</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="text-xs font-bold text-gray-600 bg-gray-50 border border-gray-100 px-3 py-1 rounded-lg">
                      🏦 {req.bank_name}
                    </span>
                    <span className="text-xs font-bold text-gray-600 bg-gray-50 border border-gray-100 px-3 py-1 rounded-lg">
                      เลขบัญชี: {req.account_no}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-widest">
                    ขอถอนเมื่อ {new Date(req.requested_at).toLocaleString('th-TH')}
                  </p>
                </div>
                <div className="flex items-center gap-6 w-full md:w-auto justify-between">
                  <p className="text-2xl font-black text-gray-900 tracking-tight">
                    ฿{(req.amount_satang / 100).toLocaleString()}
                  </p>
                  {/* ปุ่ม Actions ยืนยันการโอนเงิน */}
                  <WithdrawalActions 
                    withdrawalId={req.id} 
                    workerName={req.worker?.full_name} 
                    amount={req.amount_satang / 100}
                    bankInfo={`${req.bank_name} ${req.account_no}`} 
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}

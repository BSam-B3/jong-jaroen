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

  // 4. ดึงข้อมูลกระเป๋าเงินแพลตฟอร์มทั้ง 5 กอง (Real Data)
  const { data: revenueWallets } = await sb
    .from('wallets')
    .select('kind, balance_satang')
    .in('kind', ['revenue_app', 'revenue_pg', 'revenue_invest', 'revenue_dividend', 'revenue_social']);

  // คำนวณยอดเงินแต่ละกอง (แปลงจากสตางค์เป็นบาท)
  const rev = { app: 0, pg: 0, invest: 0, dividend: 0, social: 0, total: 0 };
  revenueWallets?.forEach(w => {
    const amount = w.balance_satang / 100;
    rev.total += amount;
    if (w.kind === 'revenue_app') rev.app = amount;
    if (w.kind === 'revenue_pg') rev.pg = amount;
    if (w.kind === 'revenue_invest') rev.invest = amount;
    if (w.kind === 'revenue_dividend') rev.dividend = amount;
    if (w.kind === 'revenue_social') rev.social = amount;
  });

  // 5. ดึงข้อมูลสลิปที่รอตรวจสอบ (Real Data)
  const { data: slips } = await sb
    .from('slip_uploads')
    .select(`
      id,
      created_at,
      storage_path,
      job:jobs ( id, title, budget ),
      employer:profiles!uploader_id ( full_name )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  // 6. ดึงข้อมูลคำขอถอนเงิน (Real Data)
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

      {/* 🌟 Dashboard สรุปรายได้ 5 กองทุน */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-200">
        <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
          <span>📊</span> ผลประกอบการแพลตฟอร์ม (10%)
        </h2>
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          
          {/* กล่องรายได้รวม */}
          <div className="w-full lg:w-1/3 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-center shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-5 rounded-full blur-2xl"></div>
            <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">รายได้สะสมทั้งหมด</p>
            <p className="text-5xl font-black text-emerald-400 mt-2 tracking-tight">
              ฿{rev.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* กล่องแยก 5 กอง */}
          <div className="w-full lg:w-2/3 grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 transition-colors hover:bg-blue-50">
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-wider mb-1">เข้าแอป (5%)</p>
              <p className="text-xl font-black text-blue-900">฿{rev.app.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 transition-colors hover:bg-purple-50">
              <p className="text-[10px] font-black text-purple-500 uppercase tracking-wider mb-1">ค่าระบบ PG (3%)</p>
              <p className="text-xl font-black text-purple-900">฿{rev.pg.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100 transition-colors hover:bg-orange-50">
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-wider mb-1">กองทุนลงทุน (0.5%)</p>
              <p className="text-xl font-black text-orange-900">฿{rev.invest.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="p-4 bg-pink-50/50 rounded-2xl border border-pink-100 transition-colors hover:bg-pink-50">
              <p className="text-[10px] font-black text-pink-500 uppercase tracking-wider mb-1">ปันผล (0.5%)</p>
              <p className="text-xl font-black text-pink-900">฿{rev.dividend.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 transition-colors hover:bg-emerald-50 md:col-span-2 lg:col-span-1">
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-wider mb-1">คืนสังคม (1%)</p>
              <p className="text-xl font-black text-emerald-900">฿{rev.social.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* 🌟 ส่วนที่ 1: ตรวจสลิปเงินเข้า */}
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
            {slips?.map((slip: any) => (
              <div key={slip.id} className="bg-white p-5 rounded-[2rem] border border-gray-200 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    {/* แก้ไขการเรียก job ให้รองรับกรณีที่มันคืนมาเป็น array */}
                    <h3 className="font-black text-gray-800 text-base line-clamp-1">{Array.isArray(slip.job) ? slip.job[0]?.title : slip.job?.title}</h3>
                    <p className="text-xs font-bold text-gray-500 mt-1">
                      โดย: {Array.isArray(slip.employer) ? slip.employer[0]?.full_name : slip.employer?.full_name} | ⏰ {new Date(slip.created_at).toLocaleTimeString('th-TH')}
                    </p>
                    <p className="text-xl font-black text-[#EE4D2D] mt-1 tracking-tight">
                      ฿{Array.isArray(slip.job) ? slip.job[0]?.budget?.toLocaleString() : slip.job?.budget?.toLocaleString()}
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
                <SlipActions slipId={slip.id} jobTitle={Array.isArray(slip.job) ? slip.job[0]?.title : slip.job?.title} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 🌟 ส่วนที่ 2: คิวโอนเงินให้ช่าง */}
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
            {withdrawals?.map((req: any) => (
              <div key={req.id} className="bg-white p-5 rounded-[2rem] border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="w-full md:w-auto">
                  <h3 className="font-black text-gray-800 text-base">{Array.isArray(req.worker) ? req.worker[0]?.full_name : req.worker?.full_name}</h3>
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
                    workerName={Array.isArray(req.worker) ? req.worker[0]?.full_name : req.worker?.full_name} 
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

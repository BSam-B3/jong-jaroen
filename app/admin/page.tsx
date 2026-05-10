import Link from 'next/link';
import { requireAdmin } from './_lib/requireAdmin';
import { sbServer } from '@/lib/supabase/server';
import SlipActions from './components/SlipActions';
import WithdrawalActions from './components/WithdrawalActions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboardPage() {
  await requireAdmin('/admin');
  const sb = sbServer();

  const { data: stats, error: statsError } = await sb.rpc('admin_dashboard_stats');

  const { data: revenueWallets } = await sb
    .from('wallets')
    .select('kind, balance_satang')
    .in('kind', ['revenue_app', 'revenue_pg', 'revenue_invest', 'revenue_dividend', 'revenue_social']);

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

  const { data: withdrawals } = await sb
    .from('wallet_transactions')
    .select(`
      id,
      amount_satang,
      bank_name,
      account_no,
      created_at,
      wallets (
        profiles ( full_name )
      )
    `)
    .eq('type', 'withdraw_request')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (statsError) {
    throw new Error(`โหลดข้อมูลแดชบอร์ดไม่ได้ สาเหตุ: ${statsError.message}`);
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-24">
      
      {/* Header และ ปุ่มลัด */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
        <div className="w-full">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
            แดชบอร์ดแอดมิน 👑
          </h1>
          <p className="text-gray-500 mt-1 font-medium text-sm md:text-base">
            ยินดีต้อนรับค่ะบีสาม สรุปภาพรวมระบบวันนี้
          </p>
        </div>
        
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full lg:w-auto">
          <Link href="/admin/kyc" className="bg-orange-500 text-white p-2.5 rounded-xl text-[11px] font-black shadow-sm text-center">
            เช็ค KYC
          </Link>
          <Link href="/admin/jobs" className="bg-gray-800 text-white p-2.5 rounded-xl text-[11px] font-black shadow-sm text-center">
            จัดการงาน
          </Link>
          <Link href="/admin/garage" className="bg-[#EE4D2D] text-white p-2.5 rounded-xl text-[11px] font-black shadow-sm text-center">
            ศูนย์ตรวจรถ
          </Link>
          <Link href="/admin/withdrawals" className="bg-emerald-500 text-white p-2.5 rounded-xl text-[11px] font-black shadow-sm text-center">
            คิวโอนเงิน
          </Link>
        </div>
      </div>

      {/* สถิติหลัก */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-400 text-xs font-bold uppercase mb-1">ผู้ใช้ทั้งหมด</h3>
          <p className="text-2xl font-black text-gray-900">{stats?.total_users || 0} <span className="text-sm text-gray-400">คน</span></p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-400 text-xs font-bold uppercase mb-1">รอตรวจ KYC</h3>
          <p className="text-2xl font-black text-orange-500">{stats?.pending_kyc || 0} <span className="text-sm text-gray-400">รายการ</span></p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-400 text-xs font-bold uppercase mb-1">งานในระบบ</h3>
          <p className="text-2xl font-black text-gray-900">{stats?.total_jobs || 0} <span className="text-sm text-gray-400">งาน</span></p>
        </div>
      </div>

      {/* 📊 Dashboard รายได้ 5 กองทุน */}
      <div className="bg-white p-5 md:p-8 rounded-[2rem] shadow-sm border border-gray-200">
        <h2 className="text-lg font-black text-gray-900 mb-5 flex items-center gap-2">
          <span>📊</span> ผลประกอบการ (10%)
        </h2>
        <div className="flex flex-col gap-6">
          
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-center shadow-lg relative overflow-hidden">
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">รายได้สะสมทั้งหมด</p>
            <p className="text-4xl md:text-5xl font-black text-emerald-400 mt-2">
              ฿{rev.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
              <p className="text-[10px] font-black text-blue-500 uppercase">แอป (5%)</p>
              <p className="text-lg font-black text-blue-900">฿{rev.app.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100">
              <p className="text-[10px] font-black text-purple-500 uppercase">PG (3%)</p>
              <p className="text-lg font-black text-purple-900">฿{rev.pg.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-orange-50/50 rounded-xl border border-orange-100">
              <p className="text-[10px] font-black text-orange-500 uppercase">ลงทุน (0.5%)</p>
              <p className="text-lg font-black text-orange-900">฿{rev.invest.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-pink-50/50 rounded-xl border border-pink-100">
              <p className="text-[10px] font-black text-pink-500 uppercase">ปันผล (0.5%)</p>
              <p className="text-lg font-black text-pink-900">฿{rev.dividend.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <p className="text-[10px] font-black text-emerald-500 uppercase">สังคม (1%)</p>
              <p className="text-lg font-black text-emerald-900">฿{rev.social.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 ส่วนที่ 1: ตรวจสลิป */}
      <section className="space-y-4">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
          📥 ตรวจสลิปเงินเข้า
          <span className="bg-orange-100 text-orange-600 text-[10px] px-2 py-0.5 rounded-full">
            ค้าง {slips?.length || 0}
          </span>
        </h2>
        
        {slips?.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-8 text-center border border-dashed">
            <p className="text-gray-400 text-sm font-bold">ไม่มีสลิปรอตรวจสอบค่ะ ✨</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {slips?.map((slip: any) => (
              <div key={slip.id} className="bg-white p-4 rounded-[1.5rem] border border-gray-200 shadow-sm space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <div className="overflow-hidden">
                    <h3 className="font-black text-gray-800 text-sm truncate">{Array.isArray(slip.job) ? slip.job[0]?.title : slip.job?.title}</h3>
                    <p className="text-[10px] font-bold text-gray-400 mt-0.5 truncate">
                      โดย: {Array.isArray(slip.employer) ? slip.employer[0]?.full_name : slip.employer?.full_name}
                    </p>
                    <p className="text-lg font-black text-[#EE4D2D]">
                      ฿{Array.isArray(slip.job) ? slip.job[0]?.budget?.toLocaleString() : slip.job?.budget?.toLocaleString()}
                    </p>
                  </div>
                  <a 
                    href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/slips-pending/${slip.storage_path}`} 
                    target="_blank"
                    className="shrink-0 text-[#EE4D2D] bg-orange-50 px-3 py-1.5 rounded-lg text-[10px] font-black"
                  >
                    ดูรูปสลิป
                  </a>
                </div>
                <SlipActions slipId={slip.id} jobTitle={Array.isArray(slip.job) ? slip.job[0]?.title : slip.job?.title} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 🌟 ส่วนที่ 2: คิวโอนเงิน */}
      <section className="space-y-4">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
          💸 คิวโอนเงินให้ช่าง
          <span className="bg-blue-100 text-blue-600 text-[10px] px-2 py-0.5 rounded-full">
            รอ {withdrawals?.length || 0}
          </span>
        </h2>
        
        {withdrawals?.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-8 text-center border border-dashed">
            <p className="text-gray-400 text-sm font-bold">ยังไม่มีรายการถอนเงินค่ะ 🙌</p>
          </div>
        ) : (
          <div className="space-y-3">
            {withdrawals?.map((req: any) => (
              <div key={req.id} className="bg-white p-4 rounded-[1.5rem] border border-gray-200 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-gray-800 text-sm">
                      {req.wallets?.profiles?.full_name || 'ไม่ทราบชื่อ'}
                    </h3>
                    <div className="flex flex-col gap-1 mt-2">
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                        🏦 {req.bank_name}
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                        เลขบัญชี: {req.account_no}
                      </span>
                    </div>
                  </div>
                  <p className="text-xl font-black text-gray-900">
                    ฿{(req.amount_satang / 100).toLocaleString()}
                  </p>
                </div>
                <div className="pt-2 border-t border-gray-50">
                  <WithdrawalActions 
                    withdrawalId={req.id} 
                    workerName={req.wallets?.profiles?.full_name || 'นายช่าง'} 
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

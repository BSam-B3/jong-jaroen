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
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-24">
      
      {/* Header และ ปุ่มลัด */}
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-end md:space-y-0">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight">
            แดชบอร์ดแอดมิน 👑
          </h1>
          <p className="text-gray-500 font-medium text-sm md:text-lg">
            สวัสดีค่ะบีสาม วันนี้ระบบจงเจริญเป็นอย่างไรบ้าง?
          </p>
        </div>
        
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full lg:w-auto">
          <Link href="/admin/kyc" className="bg-orange-500 text-white p-2.5 rounded-xl text-[11px] font-black shadow-sm text-center active:scale-95 transition-transform">เช็ค KYC</Link>
          <Link href="/admin/jobs" className="bg-gray-800 text-white p-2.5 rounded-xl text-[11px] font-black shadow-sm text-center active:scale-95 transition-transform">จัดการงาน</Link>
          <Link href="/admin/garage" className="bg-[#EE4D2D] text-white p-2.5 rounded-xl text-[11px] font-black shadow-sm text-center active:scale-95 transition-transform">ศูนย์ตรวจรถ</Link>
          <Link href="/admin/withdrawals" className="bg-emerald-500 text-white p-2.5 rounded-xl text-[11px] font-black shadow-sm text-center active:scale-95 transition-transform">คิวโอนเงิน</Link>
        </div>
      </div>

      {/* สถิติหลัก */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <h3 className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">ผู้ใช้ทั้งหมด</h3>
          <p className="text-3xl font-black text-gray-900">{stats?.total_users || 0} <span className="text-sm font-bold text-gray-300 ml-1">คน</span></p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <h3 className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">รอตรวจ KYC</h3>
          <p className="text-3xl font-black text-orange-500">{stats?.pending_kyc || 0} <span className="text-sm font-bold text-gray-300 ml-1">รายการ</span></p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <h3 className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">งานในระบบ</h3>
          <p className="text-3xl font-black text-gray-900">{stats?.total_jobs || 0} <span className="text-sm font-bold text-gray-300 ml-1">งาน</span></p>
        </div>
      </div>

      {/* 📊 Dashboard รายได้ 5 กองทุน */}
      <div className="bg-white p-5 md:p-10 rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden relative">
        <div className="relative z-10">
          <h2 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
            <span className="bg-emerald-100 p-2 rounded-xl text-lg">📊</span> ผลประกอบการ (10%)
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-[2.5rem] p-8 text-center md:text-left shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#EE4D2D] opacity-10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:opacity-20 transition-opacity"></div>
              <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.3em] mb-2">รายได้สะสมทั้งหมด</p>
              <p className="text-4xl md:text-5xl font-black text-emerald-400 tracking-tighter">
                ฿{rev.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: 'แอป (5%)', val: rev.app, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'PG (3%)', val: rev.pg, color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'ลงทุน (0.5%)', val: rev.invest, color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'ปันผล (0.5%)', val: rev.dividend, color: 'text-pink-600', bg: 'bg-pink-50' },
                { label: 'คืนสังคม (1%)', val: rev.social, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              ].map((item) => (
                <div key={item.label} className={`${item.bg} p-4 rounded-3xl border border-white flex flex-col justify-center`}>
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">{item.label}</p>
                  <p className={`text-lg font-black ${item.color}`}>฿{item.val.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 🌟 ส่วนที่ 1: ตรวจสลิป */}
        <section className="space-y-6">
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3 px-2">
            📥 ตรวจสลิป <span className="bg-orange-100 text-orange-600 text-xs px-3 py-1 rounded-full">{slips?.length || 0}</span>
          </h2>
          <div className="space-y-4">
            {slips?.length === 0 ? (
              <div className="bg-white/50 rounded-[2.5rem] p-12 text-center border-2 border-dashed border-gray-200">
                <p className="text-gray-400 font-bold">ไม่มีสลิปใหม่ค่ะ ✨</p>
              </div>
            ) : (
              slips?.map((slip: any) => (
                <div key={slip.id} className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <h3 className="font-black text-gray-800 text-base truncate">{Array.isArray(slip.job) ? slip.job[0]?.title : slip.job?.title}</h3>
                      <p className="text-xs font-bold text-gray-400 mt-1 truncate">👤 {Array.isArray(slip.employer) ? slip.employer[0]?.full_name : slip.employer?.full_name}</p>
                      <p className="text-xl font-black text-[#EE4D2D] mt-1">฿{Array.isArray(slip.job) ? slip.job[0]?.budget?.toLocaleString() : slip.job?.budget?.toLocaleString()}</p>
                    </div>
                    <a href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/slips-pending/${slip.storage_path}`} target="_blank" className="shrink-0 bg-gray-50 text-gray-800 px-4 py-2 rounded-xl text-[11px] font-black hover:bg-gray-100 active:scale-95 transition-all">ดูสลิป</a>
                  </div>
                  <SlipActions slipId={slip.id} jobTitle={Array.isArray(slip.job) ? slip.job[0]?.title : slip.job?.title} />
                </div>
              ))
            )}
          </div>
        </section>

        {/* 🌟 ส่วนที่ 2: คิวโอนเงิน */}
        <section className="space-y-6">
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3 px-2">
            💸 คิวโอนเงิน <span className="bg-blue-100 text-blue-600 text-xs px-3 py-1 rounded-full">{withdrawals?.length || 0}</span>
          </h2>
          <div className="space-y-4">
            {withdrawals?.length === 0 ? (
              <div className="bg-white/50 rounded-[2.5rem] p-12 text-center border-2 border-dashed border-gray-200">
                <p className="text-gray-400 font-bold">ไม่มีรายการถอนค่ะ 🙌</p>
              </div>
            ) : (
              withdrawals?.map((req: any) => (
                <div key={req.id} className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div className="min-w-0">
                      <h3 className="font-black text-gray-800 text-base truncate">{req.wallets?.profiles?.full_name || 'ไม่ทราบชื่อ'}</h3>
                      <div className="flex flex-col space-y-1 mt-2">
                        <span className="text-[11px] font-bold text-gray-500 bg-gray-50 px-3 py-1 rounded-lg w-fit">🏦 {req.bank_name}</span>
                        <span className="text-[11px] font-black text-gray-800 bg-gray-50 px-3 py-1 rounded-lg w-fit">เลขบัญชี: {req.account_no}</span>
                      </div>
                    </div>
                    <div className="text-left md:text-right border-t md:border-t-0 pt-4 md:pt-0">
                      <p className="text-2xl font-black text-gray-900 tracking-tighter">฿{(req.amount_satang / 100).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <WithdrawalActions withdrawalId={req.id} workerName={req.wallets?.profiles?.full_name || 'นายช่าง'} amount={req.amount_satang / 100} bankInfo={`${req.bank_name} ${req.account_no}`} />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';

// ============================================================
//  Types
// ============================================================

export type RecentJob = {
  id: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  total_price_thb: number | null;
  created_at: string;
  customer_name: string | null;
};

export type DashboardStats = {
  total_users: number;
  pending_kyc: number;
  active_jobs: number;
  today_jobs: number;
  recent_jobs: RecentJob[];
};

type Props = {
  stats: DashboardStats;
};

// ============================================================
//  Helpers
// ============================================================

function formatTHB(n: number | null | undefined): string {
  if (n == null) return '-';
  return `฿${n.toLocaleString('th-TH')}`;
}

const STATUS_COLOR: Record<RecentJob['status'], string> = {
  open: 'bg-orange-50 text-orange-600',
  in_progress: 'bg-blue-50 text-blue-600',
  completed: 'bg-green-50 text-green-600',
  cancelled: 'bg-gray-100 text-gray-500',
  disputed: 'bg-red-50 text-red-600',
};

// ============================================================
//  Main Component
// ============================================================

export default function AdminDashboardClient({ stats }: Props) {
  const router = useRouter();

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <header>
        <h2 className="text-4xl font-black text-gray-900 tracking-tighter">
          ภาพรวมระบบ
        </h2>
        <p className="text-gray-400 mt-2 font-bold text-sm uppercase tracking-widest">
          Real-time Operations Insight
        </p>
      </header>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="สมาชิกทั้งหมด"
          value={stats.total_users}
          icon="👥"
          color="text-blue-600"
          onClick={() => router.push('/admin/users')}
        />
        <StatCard
          title="รอยืนยันตัวตน"
          value={stats.pending_kyc}
          icon="🪪"
          color="text-orange-500"
          onClick={() => router.push('/admin/kyc')}
        />
        <StatCard
          title="งานที่กำลังวิ่ง"
          value={stats.active_jobs}
          icon="🛵"
          color="text-[#EE4D2D]"
          onClick={() => router.push('/admin/jobs')}
        />
        <StatCard
          title="งานใหม่วันนี้"
          value={stats.today_jobs}
          icon="🔥"
          color="text-green-600"
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Jobs Table */}
        <section className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex justify-between items-center">
            <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest">
              งานล่าสุดในระบบ
            </h3>
            <button
              onClick={() => router.push('/admin/jobs')}
              className="text-[#EE4D2D] font-black text-[10px] uppercase hover:underline"
            >
              ดูทั้งหมด ›
            </button>
          </div>

          <div className="overflow-x-auto">
            {stats.recent_jobs.length === 0 ? (
              <p className="p-8 text-center text-gray-400 font-bold text-sm">
                ยังไม่มีงานในระบบ
              </p>
            ) : (
              <table className="w-full text-left">
                <tbody className="divide-y divide-gray-50">
                  {stats.recent_jobs.map((job) => (
                    <tr
                      key={job.id}
                      onClick={() => router.push(`/admin/jobs/${job.id}`)}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="p-6">
                        <p className="font-black text-sm text-gray-800">
                          งาน #{job.id.slice(0, 8)}
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">
                          ลูกค้า: {job.customer_name ?? '—'}
                        </p>
                      </td>
                      <td className="p-6">
                        <span
                          className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                            STATUS_COLOR[job.status] ??
                            'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="p-6 text-right font-black text-sm text-gray-700">
                        {formatTHB(job.total_price_thb)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Quick Actions */}
        <aside className="space-y-6">
          <div className="bg-gray-900 p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
            <div className="absolute -right-4 -top-4 text-6xl opacity-20 rotate-12">
              ⚙️
            </div>
            <h3 className="text-lg font-black tracking-tight mb-2">
              ทางลัดแอดมิน
            </h3>
            <p className="text-gray-400 text-xs font-bold mb-6">
              จัดการส่วนต่างๆ ได้รวดเร็วขึ้น
            </p>
            <div className="space-y-3">
              <ShortcutButton
                label="อนุมัติ KYC ด่วน"
                onClick={() => router.push('/admin/kyc')}
              />
              <ShortcutButton
                label="ค้นหาสมาชิก"
                onClick={() => router.push('/admin/users')}
              />
              <ShortcutButton
                label="จัดการงาน"
                onClick={() => router.push('/admin/jobs')}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ============================================================
//  Sub-components
// ============================================================

function StatCard({
  title,
  value,
  icon,
  color,
  onClick,
}: {
  title: string;
  value: number;
  icon: string;
  color: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : -1}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) onClick();
      }}
      className={`bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 relative overflow-hidden group transition-all ${
        onClick
          ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1'
          : ''
      }`}
    >
      <div className="absolute -right-2 -top-2 text-6xl opacity-5 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
        {title}
      </p>
      <p className={`text-4xl font-black ${color} tracking-tighter`}>
        {value.toLocaleString('th-TH')}
      </p>
    </div>
  );
}

function ShortcutButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-xl text-xs font-black transition-all text-left px-4 flex justify-between items-center"
    >
      <span>{label}</span>
      <span>→</span>
    </button>
  );
}

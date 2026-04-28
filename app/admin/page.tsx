import Link from 'next/link'; // เพิ่มการนำเข้า Link เพื่อให้กดได้
import { requireAdmin } from './_lib/requireAdmin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboardPage() {
  // ตรวจสอบสิทธิ์แอดมิน
  const { sb } = await requireAdmin('/admin');

  // ดึงข้อมูลสถิติจาก RPC
  const { data, error } = await sb.rpc('admin_dashboard_stats');

  if (error) {
    throw new Error(`โหลดข้อมูลแดชบอร์ดไม่ได้ สาเหตุ: ${error.message}`);
  }

  if (!data) {
    throw new Error('ไม่พบข้อมูลสถิติจากระบบ');
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">แดชบอร์ดผู้ดูแลระบบ</h1>
          <p className="text-gray-500 mt-2 font-medium">ภาพรวมสถิติแพลตฟอร์มจงเจริญ</p>
        </div>
        {/* เพิ่มปุ่มลัดด้านบน */}
        <div className="flex gap-2">
           <Link href="/admin/kyc" className="bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm hover:bg-orange-600 transition-colors">
             ตรวจสอบ KYC
           </Link>
           <Link href="/admin/jobs" className="bg-gray-800 text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm hover:bg-black transition-colors">
             จัดการงาน
           </Link>
        </div>
      </div>

      {/* กล่องสถิติ - เจมปรับให้กดได้แล้วค่ะ! */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="ผู้ใช้งานทั้งหมด" 
          value={data.total_users} 
          color="blue" 
        />
        <StatCard 
          title="รอยืนยันตัวตน (KYC)" 
          value={data.pending_kyc} 
          color="orange" 
          href="/admin/kyc" 
          badge="คลิกเพื่อตรวจ"
        />
        <StatCard 
          title="งานกำลังดำเนินการ" 
          value={data.active_jobs} 
          color="green" 
          href="/admin/jobs"
        />
        <StatCard 
          title="งานวันนี้" 
          value={data.today_jobs} 
          color="purple" 
        />
      </div>

      {/* ตารางงานล่าสุด */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden mt-8">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-black text-gray-800">งานล่าสุด 5 รายการ</h2>
          <Link href="/admin/jobs" className="text-[#EE4D2D] text-xs font-black hover:underline">
            ดูงานทั้งหมด →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">ชื่อลูกค้า</th>
                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">ค่าจ้าง</th>
                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.recent_jobs && data.recent_jobs.length > 0 ? (
                data.recent_jobs.map((job: any) => (
                  <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-5">
                      <p className="font-bold text-sm text-gray-800">{job.customer_name || 'ไม่ระบุชื่อ'}</p>
                      <p className="text-xs text-gray-400 mt-1">ID: #{job.id.slice(0, 8)}</p>
                    </td>
                    <td className="p-5 font-bold text-sm text-gray-800">
                      {job.total_price_thb != null ? `${job.total_price_thb.toLocaleString()} บาท` : 'ไม่ระบุ'}
                    </td>
                    <td className="p-5">
                      <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border bg-blue-50 text-blue-600 border-blue-100">
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="p-10 text-center text-gray-400 font-bold text-sm">ยังไม่มีข้อมูลงาน</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Component ผู้ช่วยวาดกล่องสถิติ (ปรับปรุงให้รองรับการคลิก)
function StatCard({ title, value, color, href, badge }: { title: string, value: number, color: string, href?: string, badge?: string }) {
  const colorMap: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-300',
    orange: 'bg-orange-50 text-orange-600 border-orange-100 hover:border-orange-300',
    green: 'bg-green-50 text-green-600 border-green-100 hover:border-green-300',
    purple: 'bg-purple-50 text-purple-600 border-purple-100 hover:border-purple-300',
  };
  const theme = colorMap[color] || colorMap.blue;

  const CardContent = (
    <div className={`p-6 rounded-[2rem] border ${theme} shadow-sm transition-all duration-200 h-full relative group`}>
      {badge && (
        <span className="absolute top-4 right-4 text-[8px] font-black bg-white/50 px-2 py-1 rounded-lg uppercase tracking-tighter">
          {badge}
        </span>
      )}
      <div className="text-xs font-black uppercase tracking-widest opacity-70 mb-2">{title}</div>
      <div className="text-4xl font-black">{value != null ? value.toLocaleString() : 0}</div>
      {href && (
        <div className="mt-3 text-[10px] font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
          จัดการข้อมูล <span>→</span>
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href} className="block no-underline transform active:scale-95 transition-transform">{CardContent}</Link>;
  }

  return CardContent;
}

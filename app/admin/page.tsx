import { requireAdmin } from './_lib/requireAdmin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboardPage() {
  // ตรวจสอบสิทธิ์แอดมิน
  const { sb } = await requireAdmin('/admin');

  // ดึงข้อมูลสถิติจาก RPC
  const { data, error } = await sb.rpc('admin_dashboard_stats');

  // 🚨 ถ้าฐานข้อมูลพัง ให้ฟ้อง Error สาเหตุที่แท้จริงออกมาที่หน้าจอทันที
  if (error) {
    throw new Error(`โหลดข้อมูลแดชบอร์ดไม่ได้ สาเหตุ: ${error.message}`);
  }

  // ถ้าไม่มีข้อมูลกลับมา
  if (!data) {
    throw new Error('ไม่พบข้อมูลสถิติจากระบบ');
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">แดชบอร์ดผู้ดูแลระบบ</h1>
        <p className="text-gray-500 mt-2 font-medium">ภาพรวมสถิติแพลตฟอร์มจงเจริญ</p>
      </div>

      {/* กล่องสถิติ 4 กล่อง */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="ผู้ใช้งานทั้งหมด" value={data.total_users} color="blue" />
        <StatCard title="รอยืนยันตัวตน (KYC)" value={data.pending_kyc} color="orange" />
        <StatCard title="งานกำลังดำเนินการ" value={data.active_jobs} color="green" />
        <StatCard title="งานวันนี้" value={data.today_jobs} color="purple" />
      </div>

      {/* ตารางงานล่าสุด */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden mt-8">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-black text-gray-800">งานล่าสุด 5 รายการ</h2>
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

// Component ผู้ช่วยวาดกล่องสถิติ (ให้อยู่ในไฟล์เดียวกันเลยจะได้ไม่เกิด Error หาไฟล์ไม่เจอ)
function StatCard({ title, value, color }: { title: string, value: number, color: string }) {
  const colorMap: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };
  const theme = colorMap[color] || colorMap.blue;

  return (
    <div className={`p-6 rounded-[2rem] border ${theme} shadow-sm`}>
      <div className="text-xs font-black uppercase tracking-widest opacity-70 mb-2">{title}</div>
      <div className="text-4xl font-black">{value != null ? value.toLocaleString() : 0}</div>
    </div>
  );
}

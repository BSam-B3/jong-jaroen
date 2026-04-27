'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingKYC: 0,
    activeJobs: 0,
    todayJobs: 0
  });
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      // 1. ดึงจำนวน User ทั้งหมด
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      
      // 2. ดึงจำนวนคนที่รอตรวจ KYC
      const { count: kycCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('kyc_status', 'pending');
      
      // 3. ดึงจำนวนงานที่ยังเปิดอยู่ (Open & In Progress)
      const { count: jobCount } = await supabase.from('jobs').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress']);
      
      // 4. ดึงงานที่โพสต์วันนี้
      const today = new Date().toISOString().split('T')[0];
      const { count: todayCount } = await supabase.from('jobs').select('*', { count: 'exact', head: true }).gte('created_at', today);

      // 5. ดึงรายการงานล่าสุด 5 รายการ
      const { data: latestJobs } = await supabase
        .from('jobs')
        .select(`id, title, status, budget, employer:profiles!employer_id(full_name)`)
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalUsers: userCount || 0,
        pendingKYC: kycCount || 0,
        activeJobs: jobCount || 0,
        todayJobs: todayCount || 0
      });
      setRecentJobs(latestJobs || []);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div>
        <h2 className="text-4xl font-black text-gray-900 tracking-tighter">ภาพรวมระบบ</h2>
        <p className="text-gray-400 mt-2 font-bold text-sm uppercase tracking-widest">Real-time Operations Insight</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="สมาชิกทั้งหมด" value={stats.totalUsers} icon="👥" color="text-blue-600" onClick={() => router.push('/admin/users')} />
        <StatCard title="รอยืนยันตัวตน" value={stats.pendingKYC} icon="🪪" color="text-orange-500" onClick={() => router.push('/admin/kyc')} />
        <StatCard title="งานที่กำลังวิ่ง" value={stats.activeJobs} icon="🛵" color="text-[#EE4D2D]" onClick={() => router.push('/admin/jobs')} />
        <StatCard title="งานใหม่วันนี้" value={stats.todayJobs} icon="🔥" color="text-green-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Jobs Table */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex justify-between items-center">
            <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest">งานล่าสุดในระบบ</h3>
            <button onClick={() => router.push('/admin/jobs')} className="text-[#EE4D2D] font-black text-[10px] uppercase hover:underline">ดูทั้งหมด ›</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <tbody className="divide-y divide-gray-50">
                {recentJobs.map(job => (
                  <tr key={job.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => router.push(`/admin/jobs/${job.id}`)}>
                    <td className="p-6">
                      <p className="font-black text-sm text-gray-800">{job.title}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">โดย: {job.employer?.full_name}</p>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                        job.status === 'open' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="p-6 text-right font-black text-sm text-gray-700">฿{job.budget}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions / Shortcuts */}
        <div className="space-y-6">
          <div className="bg-gray-900 p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
            <div className="absolute -right-4 -top-4 text-6xl opacity-20 rotate-12">⚙️</div>
            <h3 className="text-lg font-black tracking-tight mb-2">ทางลัดแอดมิน</h3>
            <p className="text-gray-400 text-xs font-bold mb-6">จัดการส่วนต่างๆ ได้รวดเร็วขึ้น</p>
            <div className="space-y-3">
              <button onClick={() => router.push('/admin/kyc')} className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-xl text-xs font-black transition-all text-left px-4 flex justify-between">
                <span>อนุมัติ KYC ด่วน</span>
                <span>→</span>
              </button>
              <button onClick={() => router.push('/admin/users')} className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-xl text-xs font-black transition-all text-left px-4 flex justify-between">
                <span>ค้นหาสมาชิก</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 relative overflow-hidden group transition-all ${onClick ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1' : ''}`}
    >
      <div className="absolute -right-2 -top-2 text-6xl opacity-5 group-hover:scale-110 transition-transform">{icon}</div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{title}</p>
      <p className={`text-4xl font-black ${color} tracking-tighter`}>{value.toLocaleString()}</p>
    </div>
  );
}

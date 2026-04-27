'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    setLoading(true);
    try {
      // ดึงข้อมูลงาน (เดี๋ยวเราค่อยไปสร้างตาราง jobs ใน Supabase กันทีหลังค่ะ)
    const { data, error } = await supabase
        .from('jobs')
        .select(`
          id, title, status, budget, created_at,
          employer:profiles!employer_id(full_name, phone),
          worker:profiles!worker_id(full_name, phone)
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      if (data) setJobs(data);
    } catch (error) {
      console.log('ยังไม่มีตาราง Jobs หรือเกิดข้อผิดพลาด:', error);
      // ใส่ข้อมูลจำลอง (Mock Data) ไปก่อนเพื่อให้เห็นหน้าตา UI
      setJobs([
        { id: '1', title: 'ซ่อมท่อประปาแตกหน้าบ้าน', status: 'in_progress', budget: 500, employer: { full_name: 'คุณสมชาย' }, worker: { full_name: 'ช่างเอก ประแส' } },
        { id: '2', title: 'ล้างแอร์ 2 ตัว', status: 'completed', budget: 1000, employer: { full_name: 'ป้าศรี' }, worker: { full_name: 'ร้านแอร์เย็นเจี๊ยบ' } },
        { id: '3', title: 'หาคนช่วยย้ายของ', status: 'open', budget: 300, employer: { full_name: 'คุณนัท' }, worker: null },
      ]);
    }
    setLoading(false);
  }

  const filteredJobs = jobs.filter(j => 
    j.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.employer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter">จัดการงาน (Jobs)</h2>
          <p className="text-gray-400 mt-2 font-bold text-sm uppercase tracking-widest">ศูนย์ควบคุมระบบจ้างงาน</p>
        </div>
        <div className="relative w-full md:w-96 group">
          <input 
            type="text" 
            placeholder="ค้นหางาน หรือ ชื่อผู้จ้าง..." 
            className="w-full pl-14 pr-6 py-4 bg-white border-2 border-gray-100 rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-[#EE4D2D]/10 focus:border-[#EE4D2D] outline-none shadow-sm transition-all group-hover:border-gray-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-6 top-4.5 text-xl opacity-40 group-focus-within:opacity-100 transition-opacity">🔍</span>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="p-7 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">ชื่องาน</th>
                <th className="p-7 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">ผู้จ้าง / ผู้รับงาน</th>
                <th className="p-7 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">ค่าจ้าง</th>
                <th className="p-7 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">สถานะ</th>
                <th className="p-7 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right whitespace-nowrap">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-32 text-center">
                    <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="font-black text-gray-300 italic tracking-widest">กำลังโหลดข้อมูลงาน...</p>
                  </td>
                </tr>
              ) : filteredJobs.map(job => (
                <tr key={job.id} className="hover:bg-blue-50/20 transition-all duration-300 group">
                  <td className="p-7">
                    <p className="font-black text-sm text-gray-800 whitespace-nowrap">{job.title}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">ID: #{job.id}</p>
                  </td>
                  <td className="p-7">
                    <div className="space-y-1 whitespace-nowrap">
                      <p className="text-xs font-bold text-gray-600"><span className="text-gray-400">จ้าง:</span> {job.employer?.full_name}</p>
                      <p className="text-xs font-bold text-gray-600"><span className="text-gray-400">ทำ:</span> {job.worker?.full_name || '-'}</p>
                    </div>
                  </td>
                  <td className="p-7 font-mono font-black text-gray-700 whitespace-nowrap">
                    {job.budget?.toLocaleString()} บาท
                  </td>
                  <td className="p-7 whitespace-nowrap">
                    {job.status === 'completed' ? (
                      <span className="bg-green-50 text-green-600 border border-green-100 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">✅ เสร็จสิ้น</span>
                    ) : job.status === 'in_progress' ? (
                      <span className="bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">⏳ กำลังทำ</span>
                    ) : job.status === 'disputed' ? (
                      <span className="bg-red-50 text-red-600 border border-red-100 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">⚠️ มีข้อพิพาท</span>
                    ) : (
                      <span className="bg-orange-50 text-orange-600 border border-orange-100 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">หาผู้รับงาน</span>
                    )}
                  </td>
                  <td className="p-7 text-right whitespace-nowrap">
                    <button className="bg-gray-50 text-gray-400 hover:bg-blue-500 hover:text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm">
                      รายละเอียด
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminVerifySlipsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);

  // 🌟 ดึงเฉพาะงานที่จ่ายเงินแล้ว (รอตรวจสอบสลิป)
  const fetchPendingSlips = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        employer:profiles!employer_id(full_name, phone)
      `)
      .eq('status', 'pending_payment') // หรือเปลี่ยนเป็น 'verifying_slip' ตาม SQL ที่รันไป
      .order('created_at', { ascending: true });

    if (data) setJobs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPendingSlips();
  }, [supabase]);

  // 🌟 ฟังก์ชันอนุมัติสลิป
  const handleApprove = async (jobId: string) => {
    if (!confirm('ยืนยันว่าสลิปนี้ถูกต้อง และต้องการเปิดงานให้ไรเดอร์เห็นใช่ไหมคะ?')) return;

    const { error } = await supabase
      .from('jobs')
      .update({ status: 'open', updated_at: new Date().toISOString() })
      .eq('id', jobId);

    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } else {
      alert('✅ อนุมัติสำเร็จ! งานเข้าสู่ระบบเรียบร้อยค่ะ');
      fetchPendingSlips();
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
      <div className="w-10 h-10 border-4 border-[#EE4D2D] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-10">
      <div className="w-full lg:max-w-5xl bg-white min-h-screen shadow-xl flex flex-col">
        
        {/* 🛡️ Admin Header */}
        <header className="bg-gray-900 px-8 py-10 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black tracking-tight">ระบบตรวจสอบสลิป Admin 🛡️</h1>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">Slip Verification Center</p>
            </div>
            <div className="bg-orange-500 px-4 py-2 rounded-xl text-xs font-black animate-pulse">
              {jobs.length} รายการรอดำเนินการ
            </div>
          </div>
        </header>

        <main className="p-6 flex-1 bg-gray-50">
          {jobs.length === 0 ? (
            <div className="text-center py-20 opacity-40 grayscale">
              <div className="text-6xl mb-4">☕</div>
              <h3 className="text-lg font-black text-gray-800">ไม่มีสลิปค้างให้ตรวจสอบค่ะ</h3>
              <p className="text-xs font-bold mt-1 text-gray-500">แอดมินพักผ่อนก่อนได้เลย!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 flex flex-col gap-4">
                  
                  {/* ข้อมูลลูกค้าและงาน */}
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase">
                        {job.job_type}
                      </span>
                      <h3 className="text-base font-black text-gray-800 mt-1">{job.title || 'เรียกงานด่วน'}</h3>
                      <p className="text-[11px] text-gray-400 font-bold mt-0.5">👤 {job.employer?.full_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-[#00C300]">฿{job.budget}</p>
                      <p className="text-[10px] text-gray-400 font-bold italic">{new Date(job.created_at).toLocaleString('th-TH')}</p>
                    </div>
                  </div>

                  {/* จุดรับ-ส่ง */}
                  <div className="bg-gray-50 p-4 rounded-2xl text-[11px] font-bold text-gray-600 space-y-2 border border-gray-100">
                    <p className="line-clamp-1">📍 {job.pickup_location}</p>
                    <p className="line-clamp-1 text-red-400">🚩 {job.dropoff_location}</p>
                  </div>

                  {/* 🖼️ พื้นที่แสดงรูปสลิป (สมมติว่าเก็บในคอลัมน์ slip_url) */}
                  <div className="aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden border border-dashed border-gray-300 relative group">
                    {job.slip_url ? (
                      <img 
                        src={job.slip_url} 
                        className="w-full h-full object-cover" 
                        alt="Slip"
                        onClick={() => window.open(job.slip_url)}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <span className="text-3xl mb-2">📸</span>
                        <p className="text-[10px] font-black uppercase">ไม่พบรูปภาพสลิป</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-black cursor-pointer">
                      ดูรูปขนาดใหญ่
                    </div>
                  </div>

                  {/* ปุ่มจัดการ */}
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <button 
                      onClick={() => alert('ฟีเจอร์ปฏิเสธสลิป กำลังพัฒนาค่ะ')}
                      className="py-3.5 rounded-2xl border border-red-100 text-red-500 text-sm font-black hover:bg-red-50 active:scale-95 transition-all"
                    >
                      ❌ ปฏิเสธ
                    </button>
                    <button 
                      onClick={() => handleApprove(job.id)}
                      className="py-3.5 rounded-2xl bg-[#00C300] text-white text-sm font-black shadow-lg shadow-green-100 hover:bg-green-600 active:scale-95 transition-all"
                    >
                      ✅ อนุมัติสลิป
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

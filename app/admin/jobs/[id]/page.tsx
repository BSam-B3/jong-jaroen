'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';

export default function AdminJobDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (jobId) fetchJobDetails();
  }, [jobId]);

  async function fetchJobDetails() {
    setLoading(true);
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        employer:profiles!employer_id(id, full_name, phone, role),
        worker:profiles!worker_id(id, full_name, phone, role)
      `)
      .eq('id', jobId)
      .single();

    if (data) setJob(data);
    if (error) console.error("Error fetching job:", error);
    setLoading(false);
  }

  // --- Admin Actions ---
  
  async function handleForceCancel() {
    if (!confirm('ยืนยันการ "ยกเลิกงานนี้" บังคับให้สถานะเป็น cancelled ใช่หรือไม่?')) return;
    setProcessing(true);
    const { error } = await supabase.from('jobs').update({ status: 'cancelled' }).eq('id', jobId);
    if (!error) {
      alert('ยกเลิกงานสำเร็จค่ะ');
      fetchJobDetails();
    }
    setProcessing(false);
  }

  async function handleDeleteJob() {
    const promptText = prompt('หากต้องการลบงานนี้ถาวร พิมพ์คำว่า "DELETE"');
    if (promptText !== 'DELETE') return;
    
    setProcessing(true);
    const { error } = await supabase.from('jobs').delete().eq('id', jobId);
    if (!error) {
      alert('ลบงานออกจากระบบฐานข้อมูลเรียบร้อยค่ะ');
      router.push('/admin/jobs');
    } else {
      alert('เกิดข้อผิดพลาดในการลบ: ' + error.message);
      setProcessing(false);
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-[#EE4D2D] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-black text-gray-400 tracking-widest">กำลังดึงข้อมูลงาน...</p>
    </div>
  );

  if (!job) return <div className="p-10 font-black text-center text-red-500 text-xl">ไม่พบข้อมูลงานนี้ หรือถูกลบไปแล้วค่ะ</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Header & Back Button */}
      <div className="flex items-center gap-4 border-b border-gray-200 pb-6">
        <button onClick={() => router.back()} className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors">
          <span className="text-gray-500 font-black">←</span>
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">{job.title}</h1>
          <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Job ID: {job.id}</p>
        </div>
        <div>
          {job.status === 'completed' ? <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">✅ เสร็จสิ้น</span> :
           job.status === 'in_progress' ? <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">⏳ กำลังทำ</span> :
           job.status === 'cancelled' ? <span className="bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">❌ ยกเลิกแล้ว</span> :
           job.status === 'disputed' ? <span className="bg-red-100 text-red-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest animate-pulse">⚠️ ข้อพิพาท</span> :
           <span className="bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">⚪ หาผู้รับงาน</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Job Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
            <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">รายละเอียดงาน</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 font-bold mb-1">รายละเอียด / หมายเหตุ</p>
                <p className="font-medium text-gray-800 bg-gray-50 p-4 rounded-2xl">{job.description || 'ไม่มีการระบุรายละเอียดเพิ่มเติม'}</p>
              </div>
              <div className="flex gap-4">
                <div className="flex-1 bg-orange-50 p-4 rounded-2xl border border-orange-100">
                  <p className="text-xs text-orange-600/70 font-bold mb-1 uppercase tracking-wider">ค่าจ้างสุทธิ</p>
                  <p className="text-2xl font-black text-[#EE4D2D]">{job.budget?.toLocaleString()} บาท</p>
                </div>
                <div className="flex-1 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-wider">วันที่โพสต์</p>
                  <p className="text-sm font-black text-gray-800 mt-1">{new Date(job.created_at).toLocaleString('th-TH')}</p>
                </div>
              </div>
              {job.location_name && (
                <div>
                  <p className="text-xs text-gray-500 font-bold mb-1">สถานที่ทำงาน / จุดรับส่ง</p>
                  <p className="font-bold text-gray-800 flex items-center gap-2"><span className="text-green-500">📍</span> {job.location_name}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: People Involved */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
            <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">ผู้เกี่ยวข้อง</h2>
            
            <div className="mb-6">
              <p className="text-[10px] font-black text-gray-400 uppercase bg-gray-50 px-2 py-1 rounded-md inline-block mb-2">ผู้จ้าง (Customer)</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#EE4D2D]/10 text-[#EE4D2D] rounded-xl flex items-center justify-center font-black">
                  {job.employer?.full_name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-black text-sm text-gray-900">{job.employer?.full_name || 'ไม่ระบุชื่อ'}</p>
                  <p className="text-xs font-mono text-gray-500 font-bold">{job.employer?.phone || 'ไม่มีเบอร์โทร'}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase bg-blue-50 text-blue-600 px-2 py-1 rounded-md inline-block mb-2">ผู้รับงาน (Worker)</p>
              {job.worker ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-black">
                    {job.worker.full_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-black text-sm text-gray-900">{job.worker.full_name}</p>
                    <p className="text-xs font-mono text-gray-500 font-bold">{job.worker.phone || 'ไม่มีเบอร์โทร'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm font-bold text-gray-400 italic">ยังไม่มีผู้รับงานนี้</p>
              )}
            </div>
          </div>

          {/* Admin Actions (Danger Zone) */}
          <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100">
            <h2 className="text-[11px] font-black text-red-500 uppercase tracking-widest mb-4">🛠️ เครื่องมือแอดมิน</h2>
            <div className="space-y-3">
              {(job.status === 'open' || job.status === 'in_progress' || job.status === 'disputed') && (
                <button 
                  onClick={handleForceCancel}
                  disabled={processing}
                  className="w-full bg-white text-orange-600 border border-orange-200 py-3 rounded-xl text-xs font-black shadow-sm hover:bg-orange-50 disabled:opacity-50 transition-all"
                >
                  ⚠️ บังคับยกเลิกงาน
                </button>
              )}
              <button 
                onClick={handleDeleteJob}
                disabled={processing}
                className="w-full bg-red-600 text-white py-3 rounded-xl text-xs font-black shadow-md hover:bg-red-700 disabled:opacity-50 transition-all"
              >
                🗑️ ลบงานนี้ถาวร
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function JobDetailPage() {
  const { id: jobId } = useParams();
  const router = useRouter();
  const supabase = createClient();
  
  const [job, setJob] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchJobData();
  }, [jobId]);

  const fetchJobData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) setCurrentUser(session.user);

    // ดึงข้อมูลงาน พร้อมข้อมูลลูกค้า (employer) และช่างที่รับงาน (worker)
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        employer:profiles!employer_id(full_name, avatar_url, phone),
        worker:profiles!hired_worker_id(full_name, avatar_url, phone)
      `)
      .eq('id', jobId)
      .single();

    if (data) setJob(data);
    setLoading(false);
  };

  const isEmployer = currentUser?.id === job?.employer_id;
  const isWorker = currentUser?.id === job?.hired_worker_id;
  const isGuestOrOtherWorker = currentUser && !isEmployer && !isWorker;

  // 1. ช่างกด "รับงาน" -> เปลี่ยนสถานะรอจ่ายเงิน
  const handleAcceptJob = async () => {
    if (!confirm('ยืนยันการรับงานนี้ใช่ไหมคะ?')) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.from('jobs').update({
        status: 'pending_payment',
        hired_worker_id: currentUser.id,
        updated_at: new Date().toISOString()
      }).eq('id', jobId);
      
      if (error) throw error;
      
      // เด้งแจ้งเตือนหาลูกค้าว่ามีคนรับงานแล้ว
      await supabase.from('notifications').insert({
        user_id: job.employer_id,
        type: 'job',
        title: 'มีช่างรับงานของคุณแล้ว! 👷‍♂️',
        body: `กรุณาชำระเงินเพื่อล็อกคิวช่างและเริ่มงานค่ะ`,
      });

      alert('รับงานสำเร็จ! กรุณารอลูกค้าชำระเงินเข้าระบบนะคะ ⏳');
      fetchJobData();
    } catch (err: any) { alert(err.message); }
    setActionLoading(false);
  };

  // 2. ช่างกด "ส่งมอบงาน" -> เปลี่ยนสถานะเป็นส่งมอบแล้ว
  const handleDeliverJob = async () => {
    if (!confirm('ส่งมอบงานเรียบร้อยแล้วใช่ไหมคะ?')) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.from('jobs').update({
        status: 'delivered',
        updated_at: new Date().toISOString()
      }).eq('id', jobId);
      if (error) throw error;
      alert('ส่งงานให้ลูกค้าตรวจแล้ว! 🔧');
      fetchJobData();
    } catch (err: any) { alert(err.message); }
    setActionLoading(false);
  };

  // 3. ลูกค้ากด "รับงานและปล่อยเงิน" -> เปลี่ยนสถานะเสร็จสิ้น
  const handleCompleteJob = async () => {
    if (!confirm('ตรวจงานเรียบร้อยและยืนยันการปล่อยเงินให้ช่างใช่ไหมคะ?')) return;
    setActionLoading(true);
    try {
      // 🌟 หมายเหตุ: ในระบบจริงควรเรียก RPC เพื่อโอนเงินจาก Escrow เข้า Wallet ช่างด้วย
      const { error } = await supabase.from('jobs').update({
        status: 'completed',
        updated_at: new Date().toISOString()
      }).eq('id', jobId);
      if (error) throw error;
      alert('ปิดจ๊อบสมบูรณ์! ขอบคุณที่ใช้บริการจงเจริญค่ะ 🎉');
      fetchJobData();
    } catch (err: any) { alert(err.message); }
    setActionLoading(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold bg-[#F4F6F8]">⏳ กำลังโหลดข้อมูลงาน...</div>;
  if (!job) return <div className="min-h-screen flex items-center justify-center font-bold text-red-500">❌ ไม่พบข้อมูลงานนี้ค่ะ</div>;

  // ตั้งค่าป้ายสถานะ
  const getStatusBadge = () => {
    switch (job.status) {
      case 'open': return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">เปิดรับช่าง</span>;
      case 'pending_payment': return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">รอชำระเงิน</span>;
      case 'in_progress': return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">กำลังดำเนินการ</span>;
      case 'delivered': return <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">รอตรวจงาน</span>;
      case 'completed': return <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">เสร็จสิ้นแล้ว</span>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans pb-32 flex justify-center">
      <div className="w-full max-w-2xl bg-[#F4F6F8] min-h-screen relative flex flex-col">
        
        {/* Header */}
        <header className="px-6 pt-10 pb-4 flex justify-between items-center sticky top-0 bg-[#F4F6F8]/90 backdrop-blur-md z-40">
          <button onClick={() => router.back()} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-xl font-bold active:scale-95">←</button>
          {getStatusBadge()}
        </header>

        <main className="px-6 flex-1 space-y-6">
          {/* หัวข้องานและราคา */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 mt-2">
            <h1 className="text-xl font-black text-gray-900 leading-tight mb-3">{job.title}</h1>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">💰</span>
              <span className="text-3xl font-black text-[#EE4D2D]">฿{job.budget?.toLocaleString('th-TH') || 'เสนอราคา'}</span>
            </div>
            <div className="flex items-start gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="text-red-500 mt-0.5">📍</span>
              <p className="text-xs font-bold text-gray-600 leading-relaxed">{job.location || 'ไม่ระบุสถานที่'}</p>
            </div>
          </div>

          {/* รายละเอียดงาน */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-3">
            <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">📝 รายละเอียดเพิ่มเติม</h2>
            <p className="text-sm font-medium text-gray-700 leading-relaxed whitespace-pre-wrap">{job.description}</p>
          </div>

          {/* ข้อมูลผู้ว่าจ้าง (Employer) */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
            <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">👤 ข้อมูลผู้ว่าจ้าง</h2>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center text-2xl overflow-hidden">
                {job.employer?.avatar_url ? <img src={job.employer.avatar_url} className="w-full h-full object-cover" /> : '👨‍💼'}
              </div>
              <div>
                <p className="font-black text-gray-900">{job.employer?.full_name || 'ไม่ทราบชื่อ'}</p>
                {/* โชว์เบอร์โทรเฉพาะตอนที่รับงานแล้ว */}
                {(isEmployer || isWorker) && job.status !== 'open' && (
                  <p className="text-xs font-bold text-gray-500 mt-1">📞 {job.employer?.phone || 'ไม่ระบุเบอร์'}</p>
                )}
              </div>
            </div>
          </div>

          {/* ข้อมูลช่างที่รับงาน (แสดงเมื่อมีช่างรับแล้ว) */}
          {job.hired_worker_id && (
            <div className="bg-blue-50 p-6 rounded-[2rem] shadow-sm border border-blue-100">
              <h2 className="text-[11px] font-black text-blue-400 uppercase tracking-widest mb-4">👷‍♂️ ช่างที่รับผิดชอบ</h2>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-2xl overflow-hidden border-2 border-blue-200">
                  {job.worker?.avatar_url ? <img src={job.worker.avatar_url} className="w-full h-full object-cover" /> : '🛠️'}
                </div>
                <div>
                  <p className="font-black text-blue-900">{job.worker?.full_name || 'ไม่ทราบชื่อ'}</p>
                  {(isEmployer || isWorker) && (
                    <p className="text-xs font-bold text-blue-600 mt-1">📞 {job.worker?.phone || 'ไม่ระบุเบอร์'}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* 🌟 Action Buttons (Sticky Bottom) 🌟 */}
        <div className="fixed bottom-0 left-0 right-0 w-full max-w-2xl mx-auto p-4 bg-white/90 backdrop-blur-xl border-t border-gray-100 z-50">
          
          {/* กรณีงานเปิดอยู่ และเป็นช่างเข้ามาดู */}
          {job.status === 'open' && isGuestOrOtherWorker && (
            <button onClick={handleAcceptJob} disabled={actionLoading} className="w-full bg-[#0082FA] text-white py-4 rounded-2xl font-black shadow-lg active:scale-95 transition-transform disabled:opacity-50">
              {actionLoading ? 'กำลังดำเนินการ...' : 'รับงานนี้ 🚀'}
            </button>
          )}

          {/* กรณีรอลูกค้าจ่ายเงิน */}
          {job.status === 'pending_payment' && isEmployer && (
            <Link href={`/jobs/${job.id}/pay`} className="flex justify-center items-center w-full bg-[#EE4D2D] text-white py-4 rounded-2xl font-black shadow-lg active:scale-95 transition-transform">
              ชำระเงินเข้าแอป (฿{job.budget?.toLocaleString()}) 💸
            </Link>
          )}

          {/* กรณีงานกำลังทำ และช่างเป็นคนดู */}
          {job.status === 'in_progress' && isWorker && (
            <button onClick={handleDeliverJob} disabled={actionLoading} className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black shadow-lg active:scale-95 transition-transform disabled:opacity-50">
              {actionLoading ? 'กำลังดำเนินการ...' : 'ส่งมอบงานให้ลูกค้าตรวจ 🔧'}
            </button>
          )}

          {/* กรณีช่างส่งงานแล้ว และลูกค้าเป็นคนดู */}
          {job.status === 'delivered' && isEmployer && (
            <button onClick={handleCompleteJob} disabled={actionLoading} className="w-full bg-[#EE4D2D] text-white py-4 rounded-2xl font-black shadow-lg active:scale-95 transition-transform disabled:opacity-50">
              {actionLoading ? 'กำลังดำเนินการ...' : 'ตรวจรับงานและปล่อยเงินให้ช่าง 🎉'}
            </button>
          )}

          {/* แจ้งเตือนสถานะสำหรับอีกฝั่งที่รออยู่ */}
          {job.status === 'pending_payment' && isWorker && <p className="text-center text-xs font-bold text-amber-600">⏳ รอผู้ว่าจ้างชำระเงินเพื่อล็อกคิวงาน</p>}
          {job.status === 'in_progress' && isEmployer && <p className="text-center text-xs font-bold text-blue-600">⏳ ช่างกำลังปฏิบัติงาน กรุณารอการส่งมอบ</p>}
          {job.status === 'delivered' && isWorker && <p className="text-center text-xs font-bold text-purple-600">⏳ รอผู้ว่าจ้างตรวจรับงานและปล่อยเงิน</p>}
          {job.status === 'completed' && <p className="text-center text-xs font-black text-emerald-600">✅ งานนี้เสร็จสมบูรณ์แล้ว</p>}
        </div>

      </div>
    </div>
  );
}

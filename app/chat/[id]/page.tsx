'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ChatPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const jobId = params.id;

  const [job, setJob] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    async function initChat() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/auth/login');
      setCurrentUser(session.user);

      // ดึงข้อมูลงานและคู่สัญญา
      const { data } = await supabase
        .from('jobs')
        .select('*, employer:profiles!employer_id(full_name), worker:profiles!worker_id(full_name)')
        .eq('id', jobId)
        .single();
      
      setJob(data);
      setLoading(false);
    }
    initChat();
  }, [jobId, router, supabase]);

  // 📦 1. ฟังก์ชันช่างกดส่งงาน
  const handleSubmitWork = async () => {
    if (!confirm('ช่างทำเสร็จแล้วโว้ย 🔧 ยืนยันการส่งมอบงานใช่ไหมคะ?')) return;
    setIsActionLoading(true);
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'delivered', updated_at: new Date().toISOString() })
        .eq('id', jobId);
      if (error) throw error;
      
      alert('ส่งงานเรียบร้อย! ✨\nแจ้งเตือนลูกค้า: "งานเสร็จแล้ว! ช่างส่งงานซ่อมให้ตรวจ แวะกดรับงานหน่อย ช่างจะได้เบิกตังค์จ้า"');
      window.location.reload();
    } catch (err: any) { alert(err.message); }
    finally { setIsActionLoading(false); }
  };

  // 💸 2. ฟังก์ชันผู้จ้างกดรับงานและปล่อยเงิน (เรียก RPC)
  const handleReleaseFunds = async () => {
    if (!confirm('เฮ! ตรวจงานเรียบร้อยแล้ว ยืนยันการปล่อยเงินให้ช่างใช่ไหมคะ?')) return;
    setIsActionLoading(true);
    try {
      const { error } = await supabase.rpc('release_escrow', { p_job_id: jobId });
      if (error) throw error;
      
      alert('ปล่อยเงินสำเร็จ! 🎉\nแจ้งเตือนช่าง: "ตังค์เข้าเป๋าแล้วนายช่าง! 💸 งานผ่านฉลุย กดถอนโลด"');
      router.push('/my-jobs');
    } catch (err: any) { alert(err.message); }
    finally { setIsActionLoading(false); }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">⏳ กำลังเปิดห้องคุย...</div>;

  const isWorker = currentUser?.id === job?.worker_id;
  const isEmployer = currentUser?.id === job?.employer_id;

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col font-sans">
      
      {/* 🟢 Action Header (ศูนย์บัญชาการปิดงาน) */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button onClick={() => router.back()} className="text-gray-400 text-2xl active:scale-95 transition-transform">←</button>
          <div className="text-center">
            <h1 className="font-black text-gray-800 text-sm line-clamp-1">{job?.title || 'ห้องแชทงาน'}</h1>
            <p className="text-[10px] font-bold text-[#EE4D2D] uppercase tracking-widest">
              สถานะ: {job?.status === 'in_progress' ? 'กำลังดำเนินการ' : job?.status === 'delivered' ? 'ส่งมอบแล้ว' : job?.status}
            </p>
          </div>
          <div className="w-8"></div>
        </div>

        {/* ปุ่มตามหน้าที่ (Role-based Actions) */}
        <div className="max-w-2xl mx-auto mt-4">
          {isWorker && job?.status === 'in_progress' && (
            <button 
              onClick={handleSubmitWork}
              disabled={isActionLoading}
              className="w-full bg-[#EE4D2D] text-white py-3 rounded-2xl font-black text-sm shadow-md active:scale-95 transition-transform disabled:opacity-50"
            >
              {isActionLoading ? 'กำลังส่งงาน...' : '📦 ส่งมอบงาน (เก็บตังค์!)'}
            </button>
          )}

          {isEmployer && job?.status === 'delivered' && (
            <button 
              onClick={handleReleaseFunds}
              disabled={isActionLoading}
              className="w-full bg-emerald-500 text-white py-3 rounded-2xl font-black text-sm shadow-md active:scale-95 transition-transform disabled:opacity-50"
            >
              {isActionLoading ? 'กำลังปล่อยเงิน...' : '✅ ตรวจรับงานและปล่อยเงิน 💸'}
            </button>
          )}

          {job?.status === 'completed' && (
            <div className="w-full bg-emerald-50 text-emerald-600 py-3 rounded-2xl font-black text-xs text-center border border-emerald-100">
              🎉 งานนี้สำเร็จเรียบร้อยแล้ว เงินเข้ากระเป๋าช่างแล้วค่ะ!
            </div>
          )}
        </div>
      </div>

      {/* 💬 Chat Area (Mockup พื้นที่คุย) */}
      <main className="flex-1 p-6 space-y-4 max-w-2xl mx-auto w-full">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 self-start max-w-[80%]">
          <p className="text-xs font-bold text-[#EE4D2D] mb-1">จงเจริญ AI 🤖</p>
          <p className="text-sm text-gray-700 leading-relaxed">
            ยินดีด้วยค่ะ! ห้องแชทเปิดแล้ว คุยรายละเอียดงานกันที่นี่ได้เลยนะ<br/>
            <span className="font-bold">กฎเหล็ก:</span> อย่าลืมกด "ส่งงาน" และ "รับงาน" ผ่านแอปเพื่อความปลอดภัยของเงินนะคะ!
          </p>
        </div>

        {/* ตัวอย่างแชทจากคู่สัญญา */}
        <div className="flex flex-col gap-2">
           <div className={`p-4 rounded-2xl shadow-sm max-w-[80%] ${isWorker ? 'bg-[#EE4D2D] text-white self-end' : 'bg-white text-gray-800 self-start border border-gray-100'}`}>
              <p className="text-sm font-medium">สวัสดีครับ พร้อมลุยงานแล้วครับ!</p>
           </div>
        </div>
      </main>

      {/* ⌨️ Input Area */}
      <div className="p-4 bg-white border-t border-gray-100 sticky bottom-0">
        <div className="max-w-2xl mx-auto flex gap-2">
          <input 
            type="text" 
            placeholder="พิมพ์ข้อความที่นี่..." 
            className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#EE4D2D] focus:border-transparent outline-none transition-all"
          />
          <button className="bg-[#EE4D2D] text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-md active:scale-95 transition-transform">
            🚀
          </button>
        </div>
      </div>

    </div>
  );
}

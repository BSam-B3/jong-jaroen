'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ChatJobPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const jobId = params.id;

  const [job, setJob] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // States สำหรับระบบรีวิว
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. โหลดข้อมูลงานและข้อความเริ่มต้น
  useEffect(() => {
    async function initChat() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/auth/login');
      setCurrentUser(session.user);

      // ดึงข้อมูลงาน
      const { data: jobData } = await supabase
        .from('jobs')
        .select('*, employer:profiles!employer_id(full_name), worker:profiles!worker_id(full_name)')
        .eq('id', jobId)
        .single();
      setJob(jobData);

      // ดึงประวัติแชท
      const { data: msgData } = await supabase
        .from('job_chat_messages')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true });
      if (msgData) setMessages(msgData);

      setLoading(false);
    }
    initChat();

    // Subscribe แชท Real-time
    const channel = supabase.channel(`job_chat_${jobId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'job_chat_messages',
        filter: `job_id=eq.${jobId}`
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [jobId, router, supabase]);

  // 2. เลื่อนลงล่างสุดอัตโนมัติเมื่อมีข้อความใหม่
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // ✉️ ฟังก์ชันส่งข้อความ
  const handleSendMessage = async (e?: React.FormEvent, quickText?: string) => {
    e?.preventDefault();
    const text = quickText || newMessage;
    if (!text.trim() || !currentUser) return;

    setNewMessage('');
    await supabase.from('job_chat_messages').insert({
      job_id: jobId,
      sender_id: currentUser.id,
      message: text
    });
  };

  // 📦 ช่างกดส่งงานแนบรูป (Logic ของบีสาม)
  const handleUploadAndSubmit = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !confirm('ยืนยันการแนบรูปเพื่อส่งมอบงานใช่ไหมคะ?')) return;
    setIsActionLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${jobId}-proof-${Date.now()}.${fileExt}`;
      const { error: upErr } = await supabase.storage.from('job-proofs').upload(fileName, file);
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from('job-proofs').getPublicUrl(fileName);
      await supabase.from('jobs').update({ 
        status: 'delivered', 
        delivery_image_url: urlData.publicUrl,
        updated_at: new Date().toISOString() 
      }).eq('id', jobId);

      await handleSendMessage(undefined, "📦 ผมส่งมอบงานเรียบร้อยแล้วครับ ตรวจสอบรูปหลักฐานได้เลยครับ!");
      window.location.reload();
    } catch (err: any) { alert(err.message); } 
    finally { setIsActionLoading(false); }
  };

  // 💸 ลูกค้ากดปล่อยเงิน
  const handleReleaseFunds = async () => {
    if (!confirm('ยืนยันการปล่อยเงินให้ช่างใช่ไหมคะ?')) return;
    setIsActionLoading(true);
    try {
      const { error } = await supabase.rpc('release_escrow', { p_job_id: jobId });
      if (error) throw error;
      await handleSendMessage(undefined, "✅ ผมตรวจสอบงานเรียบร้อยและปล่อยเงินให้แล้วครับ ขอบคุณครับ!");
      window.location.reload();
    } catch (err: any) { alert(err.message); }
    finally { setIsActionLoading(false); }
  };

  // ⭐ ลูกค้าส่งรีวิว
  const handleSubmitReview = async () => {
    setIsActionLoading(true);
    try {
      const { error } = await supabase.rpc('submit_review', {
        p_job_id: jobId, p_rating: rating, p_review_text: reviewText
      });
      if (error) throw error;
      alert('ขอบคุณสำหรับรีวิวค่ะ!');
      window.location.reload();
    } catch (err: any) { alert(err.message); }
    finally { setIsActionLoading(false); }
  };

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center font-black text-[#EE4D2D] animate-pulse text-xl">JONG JAROEN...</div>;

  const isWorker = currentUser?.id === job?.worker_id;
  const isEmployer = currentUser?.id === job?.employer_id;

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col font-sans h-screen overflow-hidden">
      
      {/* 🟠 Header: Action Center */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between max-w-2xl mx-auto mb-4">
          <button onClick={() => router.back()} className="text-gray-400 text-2xl">←</button>
          <div className="text-center flex-1 mx-4">
            <h1 className="font-black text-gray-800 text-sm line-clamp-1">{job?.title}</h1>
            <div className="flex items-center justify-center gap-2 mt-1">
               <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
               <p className="text-[10px] font-bold text-[#EE4D2D] uppercase tracking-widest">สถานะ: {job?.status}</p>
            </div>
          </div>
          <div className="w-8"></div>
        </div>

        <div className="max-w-2xl mx-auto">
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleUploadAndSubmit} className="hidden" />
          
          {isWorker && job?.status === 'in_progress' && (
            <button onClick={() => fileInputRef.current?.click()} disabled={isActionLoading} className="w-full bg-[#EE4D2D] text-white py-3 rounded-2xl font-black text-sm shadow-md active:scale-95 transition-all">
              {isActionLoading ? 'กำลังอัปโหลด...' : '📸 ถ่ายรูปส่งงาน & รับเงิน'}
            </button>
          )}

          {isEmployer && job?.status === 'delivered' && (
            <button onClick={handleReleaseFunds} disabled={isActionLoading} className="w-full bg-emerald-500 text-white py-3 rounded-2xl font-black text-sm shadow-md active:scale-95 transition-all">
              {isActionLoading ? 'กำลังประมวลผล...' : '✅ ตรวจงานผ่าน ปล่อยเงินเลย 💸'}
            </button>
          )}

          {job?.status === 'completed' && isEmployer && !job?.rating && (
            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
              <p className="text-xs font-black text-gray-800 text-center mb-2">ให้คะแนนช่างหน่อยค่ะ 🌟</p>
              <div className="flex justify-center gap-2 mb-3">
                {[1,2,3,4,5].map(s => <button key={s} onClick={() => setRating(s)} className={`text-2xl ${rating >= s ? 'text-orange-400' : 'text-gray-200'}`}>★</button>)}
              </div>
              <div className="flex gap-2">
                <input value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="พิมพ์ชมช่าง..." className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none" />
                <button onClick={handleSubmitReview} className="bg-gray-800 text-white px-4 rounded-xl text-xs font-black">ส่ง</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 💬 Chat Area */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl mx-auto w-full">
        {/* System Message */}
        <div className="bg-white/60 p-4 rounded-2xl border border-gray-100 self-start max-w-[85%] text-xs font-medium text-gray-500 italic">
          🔒 การสนทนานี้ปลอดภัย เงินของคุณถูกพักไว้ในระบบ Escrow ของจงเจริญจนกว่างานจะเสร็จสิ้น
        </div>

        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUser?.id;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className={`p-4 rounded-[1.5rem] shadow-sm max-w-[85%] ${isMe ? 'bg-[#EE4D2D] text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}>
                <p className="text-sm font-medium whitespace-pre-wrap">{msg.message}</p>
              </div>
              <span className="text-[9px] text-gray-400 mt-1 px-2">
                {new Date(msg.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}

        {job?.delivery_image_url && (
          <div className="flex flex-col items-center bg-white p-3 rounded-[2rem] border-2 border-emerald-100 shadow-sm w-full max-w-xs mx-auto">
            <p className="text-[10px] font-black text-emerald-600 mb-2">📦 รูปหลักฐานการส่งงาน</p>
            <img src={job.delivery_image_url} className="rounded-2xl w-full aspect-square object-cover" alt="Proof" />
          </div>
        )}
      </main>

      {/* ⌨️ Input & Quick Reply */}
      <div className="bg-white border-t border-gray-100 p-4 pb-8">
        <div className="max-w-2xl mx-auto">
          {/* Quick Replies */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3">
             {isWorker ? (
               <>
                <button onClick={() => handleSendMessage(undefined, "📍 กำลังเดินทางไปครับ")} className="shrink-0 bg-gray-100 px-3 py-1.5 rounded-full text-[10px] font-bold text-gray-600">📍 กำลังไป</button>
                <button onClick={() => handleSendMessage(undefined, "📦 ถึงที่หมายแล้วครับ")} className="shrink-0 bg-gray-100 px-3 py-1.5 rounded-full text-[10px] font-bold text-gray-600">📦 ถึงแล้ว</button>
                <button onClick={() => handleSendMessage(undefined, "🔧 ขอเริ่มงานเลยนะครับ")} className="shrink-0 bg-gray-100 px-3 py-1.5 rounded-full text-[10px] font-bold text-gray-600">🔧 เริ่มงาน</button>
               </>
             ) : (
               <>
                <button onClick={() => handleSendMessage(undefined, "📍 ตอนนี้อยู่ไหนแล้วคะ?")} className="shrink-0 bg-gray-100 px-3 py-1.5 rounded-full text-[10px] font-bold text-gray-600">📍 อยู่ไหนแล้ว?</button>
                <button onClick={() => handleSendMessage(undefined, "✅ งานเรียบร้อยดีมากค่ะ")} className="shrink-0 bg-gray-100 px-3 py-1.5 rounded-full text-[10px] font-bold text-gray-600">✅ งานดีมาก</button>
               </>
             )}
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input 
              type="text" 
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="พิมพ์ข้อความ..." 
              className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-[#EE4D2D] outline-none transition-all"
            />
            <button type="submit" disabled={!newMessage.trim()} className="bg-[#EE4D2D] text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-md active:scale-95 disabled:opacity-30">
              🚀
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

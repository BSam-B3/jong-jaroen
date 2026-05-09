'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ChatPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const jobId = params.id;

  const [job, setJob] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // State สำหรับระบบรีวิว
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // เลื่อนจอลงไปข้อความล่าสุดอัตโนมัติ
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    async function initChat() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/auth/login');
      setCurrentUser(session.user);

      // 1. ดึงข้อมูลงานและคู่สัญญา
      const { data: jobData } = await supabase
        .from('jobs')
        .select('*, employer:profiles!employer_id(full_name), worker:profiles!worker_id(full_name)')
        .eq('id', jobId)
        .single();
      setJob(jobData);

      // 2. ดึงประวัติข้อความแชท
      const { data: msgData } = await supabase
        .from('job_chat_messages')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true });
      if (msgData) setMessages(msgData);

      setLoading(false);
    }
    initChat();

    // 3. เปิดรับข้อความแบบ Real-time
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

  // ✉️ ฟังก์ชันส่งข้อความ
  const handleSendMessage = async (e?: React.FormEvent, quickText?: string) => {
    e?.preventDefault();
    const text = quickText || newMessage;
    if (!text.trim() || !currentUser) return;

    setNewMessage(''); // เคลียร์ช่องพิมพ์ทันที
    await supabase.from('job_chat_messages').insert({
      job_id: jobId,
      sender_id: currentUser.id,
      message: text.trim()
    });
  };

  // 📸 1. ช่างกดส่งงานแนบรูป
  const handleUploadAndSubmit = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!confirm('ยืนยันการแนบรูปนี้เพื่อส่งมอบงานใช่ไหมคะ?')) return;
    setIsActionLoading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${jobId}-proof-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('job-proofs').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('job-proofs').getPublicUrl(fileName);

      const { error } = await supabase
        .from('jobs')
        .update({ status: 'delivered', delivery_image_url: publicUrlData.publicUrl, updated_at: new Date().toISOString() })
        .eq('id', jobId);
      if (error) throw error;

      // ส่งแชทแจ้งเตือนลูกค้าอัตโนมัติ
      await handleSendMessage(undefined, "📦 ผมส่งมอบงานเรียบร้อยแล้วครับ รบกวนตรวจสอบรูปหลักฐานด้วยนะครับ!");
      window.location.reload();
    } catch (err: any) { alert('เกิดข้อผิดพลาด: ' + err.message); } 
    finally { setIsActionLoading(false); }
  };

  // 💸 2. ลูกค้ากดรับงานและปล่อยเงิน
  const handleReleaseFunds = async () => {
    if (!confirm('ตรวจรูปงานเรียบร้อยแล้ว ยืนยันการปล่อยเงินให้ช่างใช่ไหมคะ?')) return;
    setIsActionLoading(true);
    try {
      const { error } = await supabase.rpc('release_escrow', { p_job_id: jobId });
      if (error) throw error;
      
      // ส่งแชทแจ้งเตือนช่างอัตโนมัติ
      await handleSendMessage(undefined, "✅ ผมตรวจสอบงานเรียบร้อยและกดยืนยันปล่อยเงินให้แล้วครับ ขอบคุณครับ!");
      window.location.reload(); 
    } catch (err: any) { alert(err.message); } 
    finally { setIsActionLoading(false); }
  };

  // ⭐ 3. ลูกค้ากดส่งรีวิว
  const handleSubmitReview = async () => {
    if (!confirm('ยืนยันการให้คะแนนช่างใช่ไหมคะ?')) return;
    setIsActionLoading(true);
    try {
      const { error } = await supabase.rpc('submit_review', {
        p_job_id: jobId,
        p_rating: rating,
        p_review_text: reviewText
      });
      if (error) throw error;
      alert('ขอบคุณสำหรับรีวิวค่ะ! 🌟 ช่างได้คะแนนเรียบร้อยแล้ว');
      window.location.reload();
    } catch (err: any) { alert(err.message); } 
    finally { setIsActionLoading(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center font-sans">
      <div className="w-10 h-10 border-4 border-[#EE4D2D] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const isWorker = currentUser?.id === job?.worker_id;
  const isEmployer = currentUser?.id === job?.employer_id;
  const isJobOnsite = job?.job_type === 'onsite';
  const shortRefId = job?.id ? job.id.substring(0, 6).toUpperCase() : 'UNKNOWN';

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col font-sans h-screen overflow-hidden">

      {/* 🟢 Action Header */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-30 shadow-sm shrink-0">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button onClick={() => router.back()} className="text-gray-400 text-2xl active:scale-95 transition-transform shrink-0">←</button>
          
          <div className="text-center flex-1 mx-2">
            <h1 className="font-black text-gray-800 text-sm md:text-base line-clamp-1" title={job?.title}>{job?.title || 'ห้องแชทงาน'}</h1>
            
            {/* 🌟 แสดง Ref ID และงบประมาณ ให้ User แยกแยะงานได้ชัดเจน */}
            <div className="flex items-center justify-center gap-2 mt-1.5 flex-wrap">
               <span className="text-[9px] font-black text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                 Ref: #{shortRefId}
               </span>
               <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                 ฿{job?.budget?.toLocaleString() || '0'}
               </span>
               <span className="text-[9px] font-bold text-[#EE4D2D] uppercase tracking-widest flex items-center gap-1">
                 <span className={`w-1.5 h-1.5 rounded-full ${job?.status === 'completed' ? 'bg-emerald-500' : 'bg-[#EE4D2D] animate-pulse'}`}></span>
                 สถานะ: {job?.status === 'in_progress' ? 'กำลังดำเนินการ' : job?.status === 'delivered' ? 'ส่งมอบแล้ว' : job?.status}
               </span>
            </div>
          </div>

          <div className="w-8 shrink-0"></div>
        </div>

        {/* ปุ่มตามหน้าที่ (Role-based Actions) */}
        <div className="max-w-2xl mx-auto mt-4">
          
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleUploadAndSubmit} className="hidden" />

          {/* 💰 เพิ่มส่วนชำระเงินสำหรับผู้ว่าจ้าง */}
          {isEmployer && job?.status === 'open' && (
            <Link 
              href={`/checkout/${jobId}`}
              className="w-full bg-[#0047FF] text-white py-4 rounded-2xl font-black text-base shadow-lg shadow-blue-200 active:scale-95 transition-all text-center block mb-2"
            >
              💳 ยืนยันจ้างงานและชำระเงิน ฿{job?.budget?.toLocaleString()}
            </Link>
          )}

          {isWorker && job?.status === 'in_progress' && (
            <button onClick={() => fileInputRef.current?.click()} disabled={isActionLoading} className="w-full bg-[#EE4D2D] text-white py-3 rounded-2xl font-black text-sm shadow-md active:scale-95 transition-transform disabled:opacity-50">
              {isActionLoading ? 'กำลังอัปโหลดรูป...' : '📸 ถ่ายรูปผลงาน & ส่งมอบ (เก็บตังค์!)'}
            </button>
          )}

          {isEmployer && job?.status === 'delivered' && (
            <button onClick={handleReleaseFunds} disabled={isActionLoading} className="w-full bg-emerald-500 text-white py-3 rounded-2xl font-black text-sm shadow-md active:scale-95 transition-transform disabled:opacity-50">
              {isActionLoading ? 'กำลังประมวลผล...' : '✅ ตรวจรูปผลงาน & ปล่อยเงิน 💸'}
            </button>
          )}

          {/* กล่องรีวิว */}
          {job?.status === 'completed' && isEmployer && !job?.rating && (
            <div className="w-full bg-white p-4 rounded-2xl border border-orange-200 shadow-sm animate-in fade-in slide-in-from-top-2">
              <p className="text-sm font-black text-gray-800 text-center mb-2">ให้คะแนนช่างหน่อยค่ะ 🌟</p>
              <div className="flex justify-center gap-2 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setRating(star)} className={`text-3xl transition-transform active:scale-75 ${rating >= star ? 'text-orange-400' : 'text-gray-200'}`}>
                    ★
                  </button>
                ))}
              </div>
              <textarea 
                value={reviewText} onChange={(e) => setReviewText(e.target.value)}
                placeholder="ประทับใจตรงไหน พิมพ์ชมช่างได้เลย..." 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs mb-3 focus:ring-2 focus:ring-orange-400 outline-none"
                rows={2}
              />
              <button onClick={handleSubmitReview} disabled={isActionLoading} className="w-full bg-gray-900 text-white py-2.5 rounded-xl font-black text-xs shadow-md">
                {isActionLoading ? 'กำลังบันทึก...' : 'ส่งรีวิว'}
              </button>
            </div>
          )}

          {job?.status === 'completed' && (job?.rating || isWorker) && (
            <div className="w-full bg-emerald-50 text-emerald-600 py-3 rounded-2xl font-black text-xs text-center border border-emerald-100 flex flex-col gap-1">
              <span>🎉 งานนี้สำเร็จเรียบร้อยแล้ว</span>
              {job?.rating && <span className="text-orange-500 text-lg">{'★'.repeat(job.rating)}</span>}
            </div>
          )}
        </div>
      </div>

      {/* 💬 Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 max-w-2xl mx-auto w-full">
        <div className="text-center mb-4">
          <span className="text-[10px] font-bold text-gray-500 bg-white border border-gray-200 px-4 py-1.5 rounded-full shadow-sm">
            🔒 การสนทนานี้ปลอดภัย เงินถูกพักในระบบจงเจริญ
          </span>
        </div>

        {/* 📸 แสดงรูปผลงานที่ช่างอัปโหลด */}
        {job?.delivery_image_url && (
          <div className="flex flex-col items-center mb-6 p-4 bg-white rounded-[2rem] border border-emerald-100 shadow-sm animate-in zoom-in duration-300">
            <p className="text-xs font-black text-emerald-600 mb-3 uppercase tracking-widest">📦 รูปหลักฐานการส่งมอบงาน</p>
            <img 
              src={job.delivery_image_url} 
              alt="Proof of work" 
              className="rounded-2xl w-full max-w-sm object-cover border border-gray-100 shadow-sm" 
            />
            {isEmployer && job.status === 'delivered' && (
              <p className="text-[10px] text-gray-400 mt-3 font-bold text-center">
                กรุณาตรวจสอบผลงานก่อนกดปล่อยเงินด้านบนนะคะ
              </p>
            )}
          </div>
        )}

        {/* ดึงข้อความแชทจริงมาแสดง */}
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUser?.id;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${isMe ? 'bg-[#EE4D2D] text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'}`}>
                <p className="text-sm font-medium whitespace-pre-wrap">{msg.message}</p>
              </div>
              <span className="text-[9px] font-bold text-gray-400 mt-1 px-1">
                {new Date(msg.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      {/* ⌨️ Input Area & Quick Reply */}
      <div className="p-4 bg-white border-t border-gray-100 shrink-0 pb-6 md:pb-4">
        <div className="max-w-2xl mx-auto">
          
          {/* 🌟 Dynamic Quick Replies (โชว์ตามประเภทงาน) */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3 pb-1">
            {isWorker ? (
              isJobOnsite ? (
                <>
                <button onClick={() => handleSendMessage(undefined, "📍 กำลังเดินทางไปครับ")} className="shrink-0 bg-gray-50 border border-gray-200 px-4 py-1.5 rounded-full text-[11px] font-bold text-gray-600 hover:bg-orange-50 transition-colors">📍 กำลังไป</button>
                <button onClick={() => handleSendMessage(undefined, "📦 ถึงที่หมายแล้วครับ")} className="shrink-0 bg-gray-50 border border-gray-200 px-4 py-1.5 rounded-full text-[11px] font-bold text-gray-600 hover:bg-orange-50 transition-colors">📦 ถึงแล้ว</button>
                </>
              ) : (
                <>
                <button onClick={() => handleSendMessage(undefined, "💻 พร้อมเริ่มงานแล้วครับ")} className="shrink-0 bg-gray-50 border border-gray-200 px-4 py-1.5 rounded-full text-[11px] font-bold text-gray-600 hover:bg-orange-50 transition-colors">💻 เริ่มงาน</button>
                <button onClick={() => handleSendMessage(undefined, "📥 ส่งดราฟต์ให้ตรวจสอบครับ")} className="shrink-0 bg-gray-50 border border-gray-200 px-4 py-1.5 rounded-full text-[11px] font-bold text-gray-600 hover:bg-orange-50 transition-colors">📥 ส่งดราฟต์</button>
                </>
              )
            ) : (
              isJobOnsite ? (
                <>
                <button onClick={() => handleSendMessage(undefined, "📍 ตอนนี้อยู่ไหนแล้วคะ?")} className="shrink-0 bg-gray-50 border border-gray-200 px-4 py-1.5 rounded-full text-[11px] font-bold text-gray-600 hover:bg-orange-50 transition-colors">📍 อยู่ไหนแล้ว?</button>
                <button onClick={() => handleSendMessage(undefined, "✅ รออยู่ที่จุดนัดหมายค่ะ")} className="shrink-0 bg-gray-50 border border-gray-200 px-4 py-1.5 rounded-full text-[11px] font-bold text-gray-600 hover:bg-orange-50 transition-colors">✅ รออยู่ค่ะ</button>
                </>
              ) : (
                <>
                <button onClick={() => handleSendMessage(undefined, "✏️ ขอปรับแก้ตรงนี้หน่อยค่ะ")} className="shrink-0 bg-gray-50 border border-gray-200 px-4 py-1.5 rounded-full text-[11px] font-bold text-gray-600 hover:bg-orange-50 transition-colors">✏️ ขอปรับแก้</button>
                <button onClick={() => handleSendMessage(undefined, "✅ งานเรียบร้อยดีมากค่ะ")} className="shrink-0 bg-gray-50 border border-gray-200 px-4 py-1.5 rounded-full text-[11px] font-bold text-gray-600 hover:bg-orange-50 transition-colors">✅ งานโอเคค่ะ</button>
                </>
              )
            )}
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="พิมพ์ข้อความที่นี่..." 
              className="flex-1 bg-gray-100 border border-transparent rounded-2xl px-5 py-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-[#EE4D2D] outline-none transition-all"
            />
            <button 
              type="submit" 
              disabled={!newMessage.trim()}
              className="bg-[#EE4D2D] text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-md active:scale-95 disabled:opacity-50 transition-transform shrink-0"
            >
              <svg className="w-6 h-6 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </form>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}

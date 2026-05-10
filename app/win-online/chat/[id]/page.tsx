'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function WinChatPage() {
  const { id: jobId } = useParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [job, setJob] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const QUICK_REPLIES = ["ถึงแล้วครับ/ค่ะ", "รอสักครู่นะครับ", "กำลังไปครับ", "โอเคครับ"];

  useEffect(() => {
    const initChat = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/auth/login');
      setCurrentUser(session.user);

      // ดึงข้อมูลงาน
      const { data: jobData } = await supabase
        .from('jobs')
        .select('*, employer:profiles!employer_id(full_name, phone, avatar_url), worker:profiles!worker_id(full_name, phone, avatar_url)')
        .eq('id', jobId)
        .single();
      
      setJob(jobData);

      // ดึงข้อความเก่า
      const { data: msgData } = await supabase
        .from('job_messages')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true });
      
      if (msgData) setMessages(msgData);
      setLoading(false);
    };

    initChat();

    // Real-time Messages
    const channel = supabase.channel(`chat:${jobId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'job_messages', filter: `job_id=eq.${jobId}` }, 
      (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [jobId, supabase]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    await supabase.from('job_messages').insert({
      job_id: jobId,
      sender_id: currentUser.id,
      content: text
    });
    setNewMessage('');
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50">กำลังเชื่อมต่อห้องแชท...</div>;

  const isRider = currentUser?.id === job?.worker_id;
  const partner = isRider ? job?.employer : job?.worker;

  return (
    <div className="flex flex-col h-screen bg-[#F4F6F8] font-sans">
      {/* 🟠 Header แชท */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center text-gray-400">←</button>
          <div className="w-10 h-10 rounded-full bg-orange-100 overflow-hidden border border-orange-200">
            {partner?.avatar_url ? <img src={partner.avatar_url} className="w-full h-full object-cover" /> : '👤'}
          </div>
          <div>
            <h2 className="text-sm font-black text-gray-800 leading-none">{partner?.full_name || 'คู่สนทนา'}</h2>
            <p className="text-[10px] font-bold text-[#00C300] mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#00C300] rounded-full animate-pulse"></span> ออนไลน์
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {partner?.phone && (
            <a href={`tel:${partner.phone}`} className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center shadow-sm active:scale-95">📞</a>
          )}
          <button className="w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center shadow-sm active:scale-95">🚨</button>
        </div>
      </header>

      {/* 💸 Payment Status Banner */}
      <div className="bg-emerald-500 text-white px-4 py-1.5 text-center text-[10px] font-black uppercase tracking-widest">
        ชำระเงินเข้าระบบเรียบร้อยแล้ว ปลอดภัย 100%
      </div>

      {/* 💬 Message Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm font-medium shadow-sm ${
              msg.sender_id === currentUser.id ? 'bg-[#EE4D2D] text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'
            }`}>
              {msg.content}
              <p className={`text-[8px] mt-1 opacity-50 ${msg.sender_id === currentUser.id ? 'text-right' : 'text-left'}`}>
                {new Date(msg.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </main>

      {/* ⚡ Quick Replies & Input */}
      <footer className="bg-white border-t border-gray-100 p-4 pb-8 space-y-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {QUICK_REPLIES.map((text) => (
            <button key={text} onClick={() => sendMessage(text)} className="shrink-0 bg-gray-50 text-gray-600 px-3 py-1.5 rounded-full text-[11px] font-bold border border-gray-200 active:bg-orange-50 active:text-[#EE4D2D]">
              {text}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(newMessage)}
            placeholder="พิมพ์ข้อความ..."
            className="flex-1 bg-gray-100 border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-[#EE4D2D] outline-none"
          />
          <button onClick={() => sendMessage(newMessage)} className="w-12 h-12 bg-[#EE4D2D] text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform">
            🚀
          </button>
        </div>
      </footer>
    </div>
  );
}

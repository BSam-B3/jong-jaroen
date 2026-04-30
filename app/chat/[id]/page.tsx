'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
// 🌟 นำเข้าแผนที่ติดตามรถ
import RiderTrackingMap from "@/app/components/RiderTrackingMap";

export default function ChatPage({ params }: { params: { id: string } }) {
  const jobId = params.id;
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchJobAndMessages = useCallback(async () => {
    // ดึงข้อมูลงาน
    const { data: jobData } = await supabase
      .from('jobs')
      .select('*, employer:profiles!employer_id(first_name, avatar_url), worker:profiles!worker_id(first_name, avatar_url)')
      .eq('id', jobId)
      .single();
      
    if (jobData) setJobDetails(jobData);

    // ดึงข้อความแชท
    const { data: chatData } = await supabase
      .from('job_messages')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true });
      
    if (chatData) setMessages(chatData);
  }, [jobId, supabase]);

  useEffect(() => {
    let sub: any;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return router.push('/auth/login');
      setUserId(session.user.id);
      fetchJobAndMessages();

      // ดักจับแชทใหม่แบบ Real-time
      sub = supabase
        .channel(`chat_${jobId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'job_messages', filter: `job_id=eq.${jobId}` },
          (p) => {
            setMessages((prev) => [...prev, p.new]);
          }
        )
        .subscribe();
    });

    return () => {
      if (sub) supabase.removeChannel(sub);
    };
  }, [jobId, router, supabase, fetchJobAndMessages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !userId) return;

    const textToSend = newMessage;
    setNewMessage(''); 

    await supabase.from('job_messages').insert({
      job_id: jobId,
      sender_id: userId,
      recipient_id: userId === jobDetails?.employer_id ? jobDetails?.worker_id : jobDetails?.employer_id,
      content: textToSend
    });
  };

  // ดึงพิกัดปลายทาง (Dropoff) จากงาน (ถ้ามี) หรือใช้พิกัดเริ่มต้น
  const dropoffLocation = {
    lat: jobDetails?.dropoff_lat || 13.7563,
    lng: jobDetails?.dropoff_lng || 100.5018
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] font-sans">
      {/* 🌟 Header ด้านบน */}
      <div className="flex items-center px-4 py-3 bg-white shadow-sm z-20">
        <button onClick={() => router.back()} className="mr-4 text-2xl text-gray-600 hover:text-gray-900 transition-colors">
          ←
        </button>
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl overflow-hidden mr-3 border border-gray-200">
          👤
        </div>
        <div>
          <h2 className="font-bold text-gray-900 text-sm">สนทนา</h2>
          <p className="text-[10px] font-bold text-emerald-500 flex items-center gap-1.5 uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span> 
            กำลังออนไลน์
          </p>
        </div>
      </div>

      {/* 📍 แผนที่ติดตามรถ (RiderTrackingMap) */}
      <div className="w-full shrink-0 bg-white z-10 border-b border-gray-100 relative">
        <RiderTrackingMap jobId={jobId} dropoff={dropoffLocation} />
      </div>

      {/* 💬 พื้นที่แสดงแชท */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
        {messages.map((msg) => {
          const isMe = msg.sender_id === userId;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                isMe 
                  ? 'bg-gradient-to-r from-[#EE4D2D] to-[#FF7337] text-white rounded-br-sm' 
                  : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* ⌨️ กล่องพิมพ์ข้อความ */}
      <div className="fixed bottom-[80px] left-0 right-0 bg-white p-3 border-t border-gray-100 z-20">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-md mx-auto">
          <button type="button" className="p-2.5 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full transition-colors">
            📷
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="พิมพ์ข้อความ..."
            className="flex-1 bg-gray-50 rounded-full px-5 py-2.5 text-sm outline-none border border-gray-200 focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D] transition-all"
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim()} 
            className="w-10 h-10 rounded-full bg-[#EE4D2D] text-white flex items-center justify-center disabled:opacity-50 hover:bg-[#D44327] transition-colors shadow-sm"
          >
            🚀
          </button>
        </form>
      </div>
    </div>
  );
}

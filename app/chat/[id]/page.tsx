'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

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
  useEffect(() => { scrollToBottom(); }, [messages]);

  const fetchJobAndMessages = useCallback(async () => {
    const { data: jobData } = await supabase.from('jobs').select('*, employer:profiles!employer_id(first_name, avatar_url), worker:profiles!worker_id(first_name, avatar_url)').eq('id', jobId).single();
    if (jobData) setJobDetails(jobData);
    const { data: chatData } = await supabase.from('job_messages').select('*').eq('job_id', jobId).order('created_at', { ascending: true });
    if (chatData) setMessages(chatData);
  }, [jobId, supabase]);

  useEffect(() => {
    let sub: any;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return router.push('/auth/login');
      setUserId(session.user.id);
      fetchJobAndMessages();
      sub = supabase.channel(`chat_${jobId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'job_messages', filter: `job_id=eq.${jobId}` }, (p) => {
        setMessages(prev => [...prev, p.new]);
      }).subscribe();
    });
    return () => { if (sub) supabase.removeChannel(sub); };
  }, [fetchJobAndMessages, jobId, router, supabase]);

  // 🌟 ฟังก์ชันส่งรูปภาพ
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${jobId}/${Date.now()}.${fileExt}`;

    // 1. อัปโหลดไป Storage
    const { data, error: uploadError } = await supabase.storage.from('chat_images').upload(fileName, file);

    if (uploadError) {
      alert('อัปโหลดรูปไม่สำเร็จค่ะ');
      setIsUploading(false);
      return;
    }

    // 2. ดึง Public URL
    const { data: { publicUrl } } = supabase.storage.from('chat_images').getPublicUrl(fileName);

    // 3. บันทึกลงตารางข้อความ
    await supabase.from('job_messages').insert({ job_id: jobId, sender_id: userId, content: 'ส่งรูปภาพ', image_url: publicUrl });
    setIsUploading(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId) return;
    const msg = newMessage.trim();
    setNewMessage('');
    await supabase.from('job_messages').insert({ job_id: jobId, sender_id: userId, content: msg });
  };

  const chatPartner = jobDetails?.employer_id === userId ? jobDetails?.worker : jobDetails?.employer;

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans">
      <div className="w-full max-w-xl h-screen flex flex-col bg-white shadow-2xl relative">
        
        <header className="px-5 py-4 bg-white border-b border-gray-100 flex items-center gap-4 z-10 shadow-sm">
          <button onClick={() => router.back()} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-600 font-bold">←</button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-xl overflow-hidden border border-orange-100 shadow-sm shrink-0">
              {chatPartner?.avatar_url ? <img src={chatPartner.avatar_url} className="w-full h-full object-cover" alt="avatar" /> : '👤'}
            </div>
            <div>
              <h1 className="text-sm font-black text-gray-900">{chatPartner?.first_name || 'สนทนา'}</h1>
              <p className="text-[10px] font-bold text-[#EE4D2D]">🟢 กำลังออนไลน์</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#F8FAFC]">
          {messages.map((msg, i) => {
            const isMe = msg.sender_id === userId;
            return (
              <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] shadow-sm overflow-hidden ${isMe ? 'bg-[#EE4D2D] text-white rounded-[1.5rem] rounded-tr-sm' : 'bg-white text-gray-800 border border-gray-100 rounded-[1.5rem] rounded-tl-sm'}`}>
                  {/* 🌟 ถ้ามีรูปภาพ ให้แสดงรูปภาพ */}
                  {msg.image_url ? (
                    <img src={msg.image_url} alt="chat" className="w-full max-h-60 object-cover p-1 rounded-[1.4rem]" />
                  ) : (
                    <div className="px-4 py-3 text-sm font-bold">{msg.content}</div>
                  )}
                </div>
                <span className="text-[9px] text-gray-400 font-bold mt-1 px-1">{new Date(msg.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </main>

        <footer className="p-4 bg-white border-t border-gray-100">
          <div className="flex gap-2 items-center">
            {/* 📸 ปุ่มส่งรูป */}
            <label className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-xl cursor-pointer hover:bg-gray-100 transition active:scale-90 shadow-sm border border-gray-100">
              <input type="file" accept="image/*" className="hidden" onChange={handleUploadImage} disabled={isUploading} />
              {isUploading ? '⏳' : '📷'}
            </label>
            
            <form onSubmit={handleSendMessage} className="flex-1 flex gap-2">
              <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="พิมพ์ข้อความ..." className="flex-1 bg-gray-50 border border-gray-200 rounded-[1.5rem] px-5 py-3 text-sm font-bold outline-none focus:border-[#EE4D2D]" />
              <button type="submit" disabled={!newMessage.trim()} className="w-12 h-12 bg-[#EE4D2D] text-white rounded-full flex items-center justify-center shadow-md active:scale-95 disabled:opacity-50">🚀</button>
            </form>
          </div>
        </footer>
      </div>
    </div>
  );
}

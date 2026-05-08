'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const urlJobId = searchParams.get('job');
  const urlProviderId = searchParams.get('provider');

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // เลื่อนจอลงไปข้อความล่าสุดอัตโนมัติ
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const initChat = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push('/auth/login?next=/chat');
        return;
      }
      const user = session.user;
      setCurrentUser(user);

      // 🌟 1. ดึงรายชื่อห้องแชททั้งหมดที่ฉันมีส่วนร่วม
      const { data: chatList } = await supabase
        .from('job_chats')
        .select(`
          *,
          job:jobs(title, status),
          employer:profiles!employer_id(id, full_name, avatar_url),
          freelancer:profiles!freelancer_id(id, full_name, avatar_url)
        `)
        .or(`employer_id.eq.${user.id},freelancer_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (chatList) setChats(chatList);

      // 🌟 2. ถ้าระบุ job และ provider มาใน URL ให้หาหรือสร้างห้องแชทใหม่
      if (urlJobId && urlProviderId) {
        let existingChat = chatList?.find(c => c.job_id === urlJobId && c.freelancer_id === urlProviderId);
        
        if (existingChat) {
          setActiveChat(existingChat);
        } else {
          // ถ้ายังไม่เคยคุยกัน ให้สร้างห้องแชทใหม่
          const { data: newChat } = await supabase
            .from('job_chats')
            .insert({
              job_id: urlJobId,
              employer_id: user.id, // สมมติว่าคนกดเปิดแชทจากหน้า My Jobs คือคนจ้าง
              freelancer_id: urlProviderId
            })
            .select(`*, job:jobs(title, status), employer:profiles!employer_id(id, full_name, avatar_url), freelancer:profiles!freelancer_id(id, full_name, avatar_url)`)
            .single();
            
          if (newChat) {
            setChats(prev => [newChat, ...prev]);
            setActiveChat(newChat);
          }
        }
      } else if (chatList && chatList.length > 0) {
        // ถ้าไม่มี URL Params ให้เปิดห้องแชทล่าสุด
        setActiveChat(chatList[0]);
      }
      
      setLoading(false);
    };

    initChat();
  }, [supabase, router, urlJobId, urlProviderId]);

  // 🌟 3. ดึงข้อความแชท และ Subscribe Realtime เมื่อเลือกห้องแชท
  useEffect(() => {
    if (!activeChat) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('job_chat_messages')
        .select('*')
        .eq('chat_id', activeChat.id)
        .order('created_at', { ascending: true });
      
      if (data) setMessages(data);
    };

    fetchMessages();

    // ดักฟังข้อความใหม่แบบ Real-time
    const channel = supabase.channel(`chat_${activeChat.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'job_chat_messages',
        filter: `chat_id=eq.${activeChat.id}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeChat, supabase]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || !currentUser) return;

    const msgText = newMessage.trim();
    setNewMessage(''); // เคลียร์ช่องพิมพ์ทันทีให้รู้สึกเร็ว

    await supabase.from('job_chat_messages').insert({
      chat_id: activeChat.id,
      sender_id: currentUser.id,
      message: msgText
    });

    // อัปเดตเวลาห้องแชทล่าสุด
    await supabase.from('job_chats').update({ updated_at: new Date().toISOString() }).eq('id', activeChat.id);
  };

  const getChatPartner = (chat: any) => {
    if (!chat || !currentUser) return null;
    return chat.employer_id === currentUser.id ? chat.freelancer : chat.employer;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center font-sans">
         <div className="w-10 h-10 border-4 border-gray-200 border-t-[#EE4D2D] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans flex flex-col md:flex-row max-w-6xl mx-auto md:p-6 h-screen">
      
      {/* 📱 Mobile Header (แสดงเฉพาะตอนไม่มี Active Chat ในมือถือ) */}
      <div className={`md:hidden bg-gradient-to-r from-[#EE4D2D] to-[#FF7337] p-4 text-white shadow-md ${activeChat ? 'hidden' : 'block'}`}>
        <div className="flex items-center gap-3">
          <Link href="/my-jobs" className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-black active:scale-95">←</Link>
          <h1 className="text-xl font-black">ข้อความ 💬</h1>
        </div>
      </div>

      {/* 👥 Sidebar: ลิสต์ห้องแชททั้งหมด */}
      <div className={`w-full md:w-[320px] bg-white md:rounded-l-[2rem] border-r border-gray-100 flex flex-col overflow-hidden shadow-sm ${activeChat ? 'hidden md:flex' : 'flex'} h-[calc(100vh-64px)] md:h-full`}>
        <div className="hidden md:flex bg-gradient-to-r from-[#EE4D2D] to-[#FF7337] p-6 text-white items-center gap-3">
          <Link href="/my-jobs" className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-black active:scale-95 hover:bg-white/30 transition-colors">←</Link>
          <h2 className="text-xl font-black">แชททั้งหมด</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <div className="text-4xl mb-2 grayscale opacity-50">📭</div>
              <p className="font-bold text-sm">ยังไม่มีประวัติการแชท</p>
            </div>
          ) : (
            chats.map(chat => {
              const partner = getChatPartner(chat);
              const isActive = activeChat?.id === chat.id;
              
              return (
                <button 
                  key={chat.id}
                  onClick={() => setActiveChat(chat)}
                  className={`w-full text-left p-4 border-b border-gray-50 flex items-center gap-3 transition-colors ${isActive ? 'bg-orange-50 border-l-4 border-l-[#EE4D2D]' : 'hover:bg-gray-50 border-l-4 border-l-transparent'}`}
                >
                  <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden shrink-0">
                    {partner?.avatar_url ? <img src={partner.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg">👤</div>}
                  </div>
                  <div className="flex-1 truncate">
                    <h3 className="font-black text-gray-800 text-sm truncate">{partner?.full_name || 'ผู้ใช้จงเจริญ'}</h3>
                    <p className="text-[10px] text-[#EE4D2D] font-bold truncate mt-0.5">งาน: {chat.job?.title}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 💬 Main Area: หน้าต่างแชท */}
      {activeChat ? (
        <div className={`flex-1 bg-[#F8FAFC] flex flex-col md:rounded-r-[2rem] shadow-sm relative h-screen md:h-full`}>
          
          {/* Chat Header */}
          <header className="bg-white p-4 border-b border-gray-100 flex items-center gap-4 shadow-sm z-10 md:rounded-tr-[2rem]">
            <button onClick={() => setActiveChat(null)} className="md:hidden w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-black">←</button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                {getChatPartner(activeChat)?.avatar_url ? <img src={getChatPartner(activeChat).avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">👤</div>}
              </div>
              <div>
                <h2 className="font-black text-gray-800 leading-tight">{getChatPartner(activeChat)?.full_name || 'ผู้สนทนา'}</h2>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full mt-0.5 inline-block">งาน: {activeChat.job?.title}</span>
              </div>
            </div>
            
            {/* ปุ่มทางลัดพาไปหน้าจ่ายเงิน (จำลอง) */}
            <div className="ml-auto hidden sm:block">
              {activeChat.employer_id === currentUser.id && (
                <Link href={`/checkout/${activeChat.job_id}`} className="bg-[#00C300] text-white px-4 py-2 rounded-xl text-xs font-black shadow-md hover:bg-[#00A300] transition-colors">
                  ✅ ยืนยันจ้างงาน
                </Link>
              )}
            </div>
          </header>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            <div className="text-center mb-6">
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-4 py-1.5 rounded-full">เริ่มต้นการสนทนาสำหรับงานนี้ ปลอดภัย 100% 🛡️</span>
            </div>
            
            {messages.map((msg, idx) => {
              const isMe = msg.sender_id === currentUser.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] md:max-w-[60%] rounded-2xl px-5 py-3 shadow-sm ${isMe ? 'bg-gradient-to-br from-[#EE4D2D] to-[#FF7337] text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm'}`}>
                    <p className="text-sm font-medium whitespace-pre-wrap">{msg.message}</p>
                    <p className={`text-[9px] font-bold mt-1 text-right ${isMe ? 'text-orange-100' : 'text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-100 md:rounded-br-[2rem]">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="พิมพ์ข้อความที่นี่..." 
                className="flex-1 bg-gray-100 rounded-full px-5 py-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-200 transition-shadow"
              />
              <button 
                type="submit" 
                disabled={!newMessage.trim()}
                className="w-12 h-12 bg-[#EE4D2D] text-white rounded-full flex items-center justify-center shadow-md active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all shrink-0"
              >
                <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </form>
          </div>

        </div>
      ) : (
        <div className="hidden md:flex flex-1 bg-[#F8FAFC] items-center justify-center rounded-r-[2rem] border-y border-r border-gray-100 shadow-sm">
          <div className="text-center opacity-40 grayscale">
            <div className="text-7xl mb-4">💬</div>
            <p className="font-black text-gray-800 text-lg">เลือกห้องแชทเพื่อเริ่มสนทนา</p>
          </div>
        </div>
      )}

    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center font-black text-gray-400">กำลังโหลดห้องแชท...</div>}>
      <ChatContent />
    </Suspense>
  );
}

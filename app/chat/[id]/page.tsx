'use client';

import { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

function ChatHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const urlJobId = searchParams.get('job');
  const urlProviderId = searchParams.get('provider');

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // 🌟 States สำหรับจัดการระบบจบงาน
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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

      const { data: chatList } = await supabase
        .from('job_chats')
        .select(`
          *,
          job:jobs(*),
          employer:profiles!employer_id(id, full_name, avatar_url),
          freelancer:profiles!freelancer_id(id, full_name, avatar_url)
        `)
        .or(`employer_id.eq.${user.id},freelancer_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (chatList) setChats(chatList);

      if (urlJobId && urlProviderId) {
        let existingChat = chatList?.find(c => c.job_id === urlJobId && c.freelancer_id === urlProviderId);
        
        if (existingChat) {
          setActiveChat(existingChat);
        } else {
          const { data: newChat } = await supabase
            .from('job_chats')
            .insert({
              job_id: urlJobId,
              employer_id: user.id, 
              freelancer_id: urlProviderId
            })
            .select(`*, job:jobs(*), employer:profiles!employer_id(id, full_name, avatar_url), freelancer:profiles!freelancer_id(id, full_name, avatar_url)`)
            .single();
            
          if (newChat) {
            setChats(prev => [newChat, ...prev]);
            setActiveChat(newChat);
          }
        }
      } else if (chatList && chatList.length > 0) {
        setActiveChat(chatList[0]);
      }
      
      setLoading(false);
    };

    initChat();
  }, [supabase, router, urlJobId, urlProviderId]);

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

  // ✉️ ฟังก์ชันส่งข้อความแชท (รองรับ Quick Reply)
  const handleSendMessage = async (e?: React.FormEvent, quickText?: string) => {
    e?.preventDefault();
    const text = quickText || newMessage;
    if (!text.trim() || !activeChat || !currentUser) return;

    setNewMessage(''); 

    await supabase.from('job_chat_messages').insert({
      chat_id: activeChat.id,
      sender_id: currentUser.id,
      message: text.trim()
    });

    await supabase.from('job_chats').update({ updated_at: new Date().toISOString() }).eq('id', activeChat.id);
  };

  // 📸 ช่างอัปโหลดรูปส่งงาน
  const handleUploadAndSubmit = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !confirm('ยืนยันการแนบรูปเพื่อส่งมอบงานใช่ไหมคะ?')) return;
    setIsActionLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${activeChat.job_id}-proof-${Date.now()}.${fileExt}`;
      const { error: upErr } = await supabase.storage.from('job-proofs').upload(fileName, file);
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from('job-proofs').getPublicUrl(fileName);
      await supabase.from('jobs').update({ 
        status: 'delivered', 
        delivery_image_url: urlData.publicUrl,
        updated_at: new Date().toISOString() 
      }).eq('id', activeChat.job_id);

      await handleSendMessage(undefined, "📦 ผมส่งมอบงานเรียบร้อยแล้วครับ ตรวจสอบรูปหลักฐานได้เลยครับ!");
      
      // อัปเดต UI ทันที
      setActiveChat((prev: any) => ({
        ...prev, job: { ...prev.job, status: 'delivered', delivery_image_url: urlData.publicUrl }
      }));
    } catch (err: any) { alert(err.message); } 
    finally { setIsActionLoading(false); }
  };

  // 💸 ลูกค้ากดตรวจรับงานและปล่อยเงิน
  const handleReleaseFunds = async () => {
    if (!confirm('ยืนยันการปล่อยเงินให้ช่างใช่ไหมคะ?')) return;
    setIsActionLoading(true);
    try {
      const { error } = await supabase.rpc('release_escrow', { p_job_id: activeChat.job_id });
      if (error) throw error;
      
      await handleSendMessage(undefined, "✅ ผมตรวจสอบงานเรียบร้อยและปล่อยเงินให้แล้วครับ ขอบคุณครับ!");
      setActiveChat((prev: any) => ({ ...prev, job: { ...prev.job, status: 'completed' } }));
    } catch (err: any) { alert(err.message); }
    finally { setIsActionLoading(false); }
  };

  // ⭐ ลูกค้ากดส่งรีวิว
  const handleSubmitReview = async () => {
    setIsActionLoading(true);
    try {
      const { error } = await supabase.rpc('submit_review', {
        p_job_id: activeChat.job_id, p_rating: rating, p_review_text: reviewText
      });
      if (error) throw error;
      alert('ขอบคุณสำหรับรีวิวค่ะ!');
      setActiveChat((prev: any) => ({ ...prev, job: { ...prev.job, rating: rating } }));
    } catch (err: any) { alert(err.message); }
    finally { setIsActionLoading(false); }
  };

  const getChatPartner = (chat: any) => {
    if (!chat || !currentUser) return null;
    return chat.employer_id === currentUser.id ? chat.freelancer : chat.employer;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center font-sans">
         <div className="w-10 h-10 border-4 border-[#EE4D2D] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // เช็ค Role ในแชทปัจจุบัน
  const isWorker = activeChat && currentUser?.id === activeChat.freelancer_id;
  const isEmployer = activeChat && currentUser?.id === activeChat.employer_id;
  const currentJob = activeChat?.job;

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans flex flex-col md:flex-row max-w-6xl mx-auto md:p-6 h-screen">
      
      {/* 📱 Mobile Header */}
      <div className={`md:hidden bg-gradient-to-r from-[#EE4D2D] to-[#FF7337] p-4 text-white shadow-md ${activeChat ? 'hidden' : 'block'}`}>
        <div className="flex items-center gap-3">
          <Link href="/my-jobs" className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-black active:scale-95">←</Link>
          <h1 className="text-xl font-black">ข้อความ 💬</h1>
        </div>
      </div>

      {/* 👥 Sidebar: ลิสต์ห้องแชท */}
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
              const shortRef = chat.job_id.substring(0, 6).toUpperCase();
              
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
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[9px] font-black text-gray-500 bg-white border border-gray-200 px-1.5 rounded">#{shortRef}</span>
                      <p className="text-[10px] text-[#EE4D2D] font-bold truncate">{chat.job?.title}</p>
                    </div>
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
          
          <header className="bg-white p-4 border-b border-gray-100 flex flex-col gap-3 shadow-sm z-10 md:rounded-tr-[2rem]">
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveChat(null)} className="md:hidden w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-black shrink-0">←</button>
              <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden shrink-0">
                {getChatPartner(activeChat)?.avatar_url ? <img src={getChatPartner(activeChat).avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">👤</div>}
              </div>
              <div className="flex-1">
                <h2 className="font-black text-gray-800 leading-tight line-clamp-1">{getChatPartner(activeChat)?.full_name || 'ผู้สนทนา'}</h2>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className="text-[9px] font-black text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded shadow-sm">Ref: #{currentJob?.id.substring(0, 6).toUpperCase()}</span>
                  <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded shadow-sm">฿{currentJob?.budget?.toLocaleString() || '0'}</span>
                  <span className="text-[9px] font-bold text-[#EE4D2D] uppercase tracking-widest flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${currentJob?.status === 'completed' ? 'bg-emerald-500' : 'bg-[#EE4D2D] animate-pulse'}`}></span>
                    สถานะ: {currentJob?.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-50">
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleUploadAndSubmit} className="hidden" />
              
              {isEmployer && currentJob?.status === 'open' && (
                <Link href={`/checkout/${currentJob.id}`} className="block w-full bg-[#00C300] text-white py-2.5 rounded-xl text-xs font-black shadow-md hover:bg-[#00A300] transition-colors text-center">
                  ✅ ยืนยันจ้างงาน & ชำระเงิน (Escrow)
                </Link>
              )}

              {isWorker && currentJob?.status === 'in_progress' && (
                <button onClick={() => fileInputRef.current?.click()} disabled={isActionLoading} className="w-full bg-[#EE4D2D] text-white py-2.5 rounded-xl font-black text-xs shadow-md active:scale-95 transition-all">
                  {isActionLoading ? 'กำลังอัปโหลด...' : '📸 ถ่ายรูปผลงาน & ส่งมอบ (เก็บตังค์!)'}
                </button>
              )}

              {isEmployer && currentJob?.status === 'delivered' && (
                <button onClick={handleReleaseFunds} disabled={isActionLoading} className="w-full bg-emerald-500 text-white py-2.5 rounded-xl font-black text-xs shadow-md active:scale-95 transition-all">
                  {isActionLoading ? 'กำลังประมวลผล...' : '✅ ตรวจงานผ่าน ปล่อยเงินเลย 💸'}
                </button>
              )}

              {currentJob?.status === 'completed' && isEmployer && !currentJob?.rating && (
                <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 animate-in fade-in slide-in-from-top-2">
                  <p className="text-[11px] font-black text-gray-800 text-center mb-1">ให้คะแนนช่างหน่อยค่ะ 🌟</p>
                  <div className="flex justify-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setRating(star)} className={`text-xl transition-transform active:scale-75 ${rating >= star ? 'text-orange-400' : 'text-gray-200'}`}>★</button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="พิมพ์ชมช่าง..." className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-[10px] outline-none" />
                    <button onClick={handleSubmitReview} disabled={isActionLoading} className="bg-gray-900 text-white px-3 py-1.5 rounded-lg font-black text-[10px] shadow-md">ส่งรีวิว</button>
                  </div>
                </div>
              )}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            <div className="text-center mb-6">
              <span className="text-[10px] font-bold text-gray-400 bg-white border border-gray-100 shadow-sm px-4 py-1.5 rounded-full">🛡️ การสนทนานี้ปลอดภัยด้วยระบบจงเจริญ</span>
            </div>

            {currentJob?.delivery_image_url && (
              <div className="flex flex-col items-center my-4 p-3 bg-white rounded-2xl border-2 border-emerald-100 shadow-sm w-full max-w-xs mx-auto animate-in zoom-in duration-300">
                <p className="text-[10px] font-black text-emerald-600 mb-2 uppercase tracking-widest">📦 รูปหลักฐานการส่งมอบงาน</p>
                <img src={currentJob.delivery_image_url} alt="Proof of work" className="rounded-xl w-full object-cover border border-gray-100" />
              </div>
            )}
            
            {messages.map((msg, idx) => {
              const isMe = msg.sender_id === currentUser.id;
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-2.5 shadow-sm ${isMe ? 'bg-gradient-to-br from-[#EE4D2D] to-[#FF7337] text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm'}`}>
                    <p className="text-sm font-medium whitespace-pre-wrap">{msg.message}</p>
                  </div>
                  <span className="text-[9px] font-bold mt-1 px-1 text-gray-400">
                    {new Date(msg.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 md:p-4 bg-white border-t border-gray-100 md:rounded-br-[2rem]">
            {/* 🚀 Quick Replies */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3 pb-1 px-1">
               {isWorker ? (
                 <>
                  <button onClick={() => handleSendMessage(undefined, "📍 กำลังเดินทางไปครับ")} className="shrink-0 bg-gray-50 border border-gray-100 hover:bg-orange-50 px-3 py-1.5 rounded-full text-[10px] font-bold text-gray-600 transition-colors">📍 กำลังไป</button>
                  <button onClick={() => handleSendMessage(undefined, "📦 ถึงที่หมายแล้วครับ")} className="shrink-0 bg-gray-50 border border-gray-100 hover:bg-orange-50 px-3 py-1.5 rounded-full text-[10px] font-bold text-gray-600 transition-colors">📦 ถึงแล้ว</button>
                  <button onClick={() => handleSendMessage(undefined, "🔧 ขอเริ่มงานเลยนะครับ")} className="shrink-0 bg-gray-50 border border-gray-100 hover:bg-orange-50 px-3 py-1.5 rounded-full text-[10px] font-bold text-gray-600 transition-colors">🔧 เริ่มงาน</button>
                 </>
               ) : (
                 <>
                  <button onClick={() => handleSendMessage(undefined, "📍 ตอนนี้อยู่ไหนแล้วคะ?")} className="shrink-0 bg-gray-50 border border-gray-100 hover:bg-orange-50 px-3 py-1.5 rounded-full text-[10px] font-bold text-gray-600 transition-colors">📍 อยู่ไหนแล้ว?</button>
                  <button onClick={() => handleSendMessage(undefined, "✅ งานเรียบร้อยดีมากค่ะ")} className="shrink-0 bg-gray-50 border border-gray-100 hover:bg-orange-50 px-3 py-1.5 rounded-full text-[10px] font-bold text-gray-600 transition-colors">✅ งานดีมาก</button>
                 </>
               )}
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="พิมพ์ข้อความที่นี่..." 
                className="flex-1 bg-gray-100 rounded-full px-5 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-[#EE4D2D] transition-shadow"
              />
              <button 
                type="submit" 
                disabled={!newMessage.trim()}
                className="w-12 h-12 bg-[#EE4D2D] text-white rounded-full flex items-center justify-center shadow-md active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all shrink-0"
              >
                <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
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

      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center font-black text-[#EE4D2D]">กำลังโหลดห้องแชท...</div>}>
      <ChatHubContent />
    </Suspense>
  );
}

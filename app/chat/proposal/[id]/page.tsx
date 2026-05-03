'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ProposalChatPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const proposalId = params.id as string;

  const [proposal, setProposal] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // ตัวช่วยเลื่อนหน้าจอลงล่างสุดอัตโนมัติ
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = async () => {
      // 1. เช็ค User
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }
      setCurrentUser(session.user);

      // 2. ดึงข้อมูลข้อเสนอ งาน และโปรไฟล์ช่าง/ลูกค้า
      const { data: propData, error: propError } = await supabase
        .from('job_proposals')
        .select(`
          *,
          job:jobs (*, employer:profiles!employer_id(id, full_name, avatar_url)),
          worker:profiles!worker_id(id, full_name, avatar_url)
        `)
        .eq('id', proposalId)
        .single();

      if (!propError && propData) setProposal(propData);

      // 3. ดึงประวัติแชทเก่า
      const { data: msgData } = await supabase
        .from('proposal_messages')
        .select('*, sender:profiles!sender_id(id, full_name, avatar_url)')
        .eq('proposal_id', proposalId)
        .order('created_at', { ascending: true });

      if (msgData) setMessages(msgData);
      setLoading(false);
    };

    initChat();

    // 🌟 4. เปิดรับข้อความใหม่แบบ Realtime
    const channel = supabase.channel(`chat_${proposalId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'proposal_messages',
        filter: `proposal_id=eq.${proposalId}`
      }, async (payload) => {
        // เมื่อมีข้อความใหม่ ให้ไปดึงชื่อและรูปคนส่งมาด้วย
        const { data: senderData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', payload.new.sender_id)
          .single();
          
        const newMsg = { ...payload.new, sender: senderData };
        setMessages((prev) => [...prev, newMsg]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [proposalId, router, supabase]);

  // เลื่อนลงล่างสุดทุกครั้งที่มีข้อความใหม่
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const msgToSend = newMessage.trim();
    setNewMessage(''); // เคลียร์ช่องพิมพ์ทันทีให้ดูไว

    const { error } = await supabase.from('proposal_messages').insert({
      proposal_id: proposalId,
      sender_id: currentUser.id,
      message: msgToSend
    });

    if (error) {
      alert('ส่งข้อความไม่สำเร็จค่ะ: ' + error.message);
      setNewMessage(msgToSend); // คืนค่ากลับมาถ้าส่งพัง
    }
  };

  const handleHire = async () => {
    if (!confirm('ยืนยันจ้างงานช่างคนนี้ และไปยังหน้าชำระเงินใช่ไหมคะ?')) return;
    try {
      const { error } = await supabase.rpc('accept_proposal', {
        p_job_id: proposal.job_id,
        p_proposal_id: proposal.id,
        p_worker_id: proposal.worker_id
      });
      if (error) throw error;
      router.push(`/checkout/${proposal.job_id}`);
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F4F6F8] font-bold text-gray-400">กำลังโหลดห้องแชท...</div>;
  if (!proposal) return <div className="min-h-screen flex items-center justify-center bg-[#F4F6F8] font-bold text-gray-800">ไม่พบข้อมูลข้อเสนอนี้ค่ะ</div>;

  const isEmployer = currentUser?.id === proposal.job.employer_id;
  const chatPartner = isEmployer ? proposal.worker : proposal.job.employer;

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans">
      <div className="w-full max-w-2xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl">
        
        {/* 🟠 Header (Sticky) */}
        <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm pt-safe">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.back()} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-600 font-bold active:scale-95 transition-all">←</button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 rounded-full overflow-hidden border border-orange-100 shrink-0 flex justify-center items-center text-sm">
                  {chatPartner?.avatar_url ? <img src={chatPartner.avatar_url} className="w-full h-full object-cover" /> : '👤'}
                </div>
                <div>
                  <h1 className="text-sm font-black text-gray-900 line-clamp-1">{chatPartner?.full_name || 'ผู้ใช้งาน'}</h1>
                  <p className="text-[10px] font-bold text-green-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> ออนไลน์
                  </p>
                </div>
              </div>
            </div>
            {/* โชว์ราคา */}
            <div className="text-right">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">เสนอราคา</p>
              <p className="text-base font-black text-[#EE4D2D]">{proposal.proposed_price?.toLocaleString('th-TH')} บาท</p>
            </div>
          </div>

          {/* แถบสรุปงาน & ปุ่มจ้าง (โชว์เฉพาะคนจ้าง และสถานะยังเปิดอยู่) */}
          {isEmployer && proposal.job.status === 'open' && (
            <div className="bg-orange-50/50 px-4 py-3 border-t border-orange-100 flex items-center justify-between shadow-sm">
              <div className="flex-1 pr-4">
                <p className="text-[11px] font-bold text-gray-500 line-clamp-1">งาน: {proposal.job.title}</p>
              </div>
              <button onClick={handleHire} className="bg-[#EE4D2D] text-white px-4 py-2 rounded-xl text-[11px] font-black shadow-sm active:scale-95 transition-transform shrink-0">
                ✅ จ้างช่างคนนี้
              </button>
            </div>
          )}
        </div>

        {/* 💬 พื้นที่แชท (Scrollable) - 🌟 เพิ่มพื้นที่ด้านล่าง (pb-48) ไม่ให้แชทโดนบัง */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-48">
          {messages.length === 0 ? (
            <div className="text-center mt-10">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm mx-auto mb-3">👋</div>
              <p className="text-xs font-bold text-gray-400">เริ่มคุยรายละเอียดงาน หรือต่อรองราคากันได้เลยค่ะ</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === currentUser?.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-[1.5rem] px-5 py-3 shadow-sm ${isMe ? 'bg-[#EE4D2D] text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'}`}>
                    <p className={`text-sm font-medium leading-relaxed ${isMe ? 'text-white' : 'text-gray-700'}`}>{msg.message}</p>
                    <p className={`text-[9px] font-bold mt-1 text-right ${isMe ? 'text-orange-200' : 'text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ⌨️ ช่องพิมพ์ข้อความ - 🌟 ยกขึ้นมา 80px หนีเมนู Bottom Navigation */}
        <div className="fixed bottom-[80px] left-0 right-0 p-4 bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.05)] sm:max-w-2xl sm:mx-auto z-40">
          <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
            <textarea
              rows={1}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="พิมพ์ข้อความ..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-[1.5rem] px-5 py-3.5 text-sm font-medium focus:outline-none focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D] resize-none max-h-32"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <button 
              type="submit" 
              disabled={!newMessage.trim()}
              className="w-12 h-12 rounded-[1.25rem] bg-[#EE4D2D] text-white flex items-center justify-center shrink-0 disabled:opacity-50 disabled:bg-gray-200 shadow-sm active:scale-95 transition-all"
            >
              <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

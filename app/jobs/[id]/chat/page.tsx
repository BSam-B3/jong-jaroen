'use client';
import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  job_id: string;
  sender_id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  sender?: { full_name: string };
}

interface Job {
  id: string;
  title: string;
  customer_id: string;
  freelancer_id: string | null;
  status: string;
}

function ChatContent() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }
      setUserId(user.id);

      // Load job
      const { data: jobData } = await supabase
        .from('jobs').select('id,title,customer_id,freelancer_id,status')
        .eq('id', jobId).single();
      if (!jobData) { router.push('/dashboard'); return; }
      setJob(jobData as Job);

      // Load messages
      const { data: msgs } = await supabase
        .from('messages')
        .select('*, sender:profiles!sender_id(full_name)')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true });
      setMessages((msgs || []) as Message[]);
      setLoading(false);

      // Subscribe to real-time messages
      const channel = supabase
        .channel(`chat-${jobId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `job_id=eq.${jobId}`,
        }, async (payload) => {
          // Fetch sender name for new message
          const { data: senderData } = await supabase
            .from('profiles').select('full_name').eq('id', payload.new.sender_id).single();
          const newMsg = {
            ...payload.new,
            sender: senderData || { full_name: 'ผู้ใช้' },
          } as Message;
          setMessages(prev => [...prev, newMsg]);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    };

    if (jobId) init();
  }, [jobId, router]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (content?: string, imageUrl?: string) => {
    if (!content?.trim() && !imageUrl) return;
    setSending(true);
    setError('');
    try {
      const { error: insertError } = await supabase.from('messages').insert({
        job_id: jobId,
        sender_id: userId,
        content: content?.trim() || null,
        image_url: imageUrl || null,
      });
      if (insertError) throw insertError;
      setNewMessage('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'ส่งข้อความไม่สำเร็จ');
    } finally {
      setSending(false);
    }
  };

  const uploadImage = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { setError('ไฟล์ต้องไม่เกิน 10MB'); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `chat/${jobId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('job-images').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('job-images').getPublicUrl(path);
      await sendMessage(undefined, publicUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload ไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center"><div className="text-4xl animate-bounce mb-2">💬</div>
        <p className="text-blue-600 font-medium">กำลังโหลดแชท...</p></div>
      </div>
    );
  }

  // Group messages by date
  let lastDate = '';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-blue-900 shadow-sm sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href={`/jobs/${jobId}`} className="text-blue-200 hover:text-white text-sm">← กลับ</Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-sm truncate">💬 {job?.title || 'แชท'}</h1>
            <p className="text-blue-200 text-xs">แชทเฉพาะงาน • Real-time</p>
          </div>
          <div className={`w-2 h-2 rounded-full ${job?.status === 'in_progress' ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto max-w-xl mx-auto w-full px-4 py-4 space-y-2 pb-32">
        {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-2 text-xs">⚠️ {error}</div>}

        {messages.length === 0 && (
          <div className="text-center py-10">
            <div className="text-4xl mb-2">💬</div>
            <p className="text-gray-400 text-sm">ยังไม่มีข้อความ เริ่มคุยกันได้เลย!</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender_id === userId;
          const msgDate = formatDate(msg.created_at);
          const showDate = msgDate !== lastDate;
          lastDate = msgDate;

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="text-center my-3">
                  <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{msgDate}</span>
                </div>
              )}
              <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2`}>
                {!isMe && (
                  <div className="w-7 h-7 bg-blue-200 rounded-full flex items-center justify-center text-blue-800 font-bold text-xs flex-shrink-0 mt-1">
                    {(msg.sender?.full_name || '?').charAt(0)}
                  </div>
                )}
                <div className={`max-w-xs ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                  {!isMe && <p className="text-xs text-gray-400 mb-0.5 ml-1">{msg.sender?.full_name}</p>}
                  <div className={`rounded-2xl px-3 py-2 ${isMe
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'}`}>
                    {msg.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={msg.image_url} alt="รูปภาพ"
                        className="max-w-full max-h-48 rounded-xl object-cover mb-1 cursor-pointer"
                        onClick={() => window.open(msg.image_url || '', '_blank')} />
                    )}
                    {msg.content && <p className="text-sm">{msg.content}</p>}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 mx-1">{formatTime(msg.created_at)}</p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </main>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-20">
        <div className="max-w-xl mx-auto">
          <div className="flex items-end gap-2">
            {/* Image upload */}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-50"
            >
              {uploading ? <span className="text-xs animate-spin">⏳</span> : <span className="text-lg">📷</span>}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); }} />

            {/* Text input */}
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(newMessage);
                }
              }}
              placeholder="พิมพ์ข้อความ... (Enter ส่ง)"
              rows={1}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />

            {/* Send button */}
            <button
              onClick={() => sendMessage(newMessage)}
              disabled={sending || !newMessage.trim()}
              className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
            >
              <span className="text-white text-lg">{sending ? '⏳' : '📤'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-4xl animate-bounce">💬</div>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}

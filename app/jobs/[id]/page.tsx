'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface JobRequest {
  id: string;
  job_type: string;
  destination: string;
  lat: number | null;
  lng: number | null;
  status: string;
  requester_id: string;
  provider_id: string | null;
  created_at: string;
}

interface Message {
  id: string;
  job_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

export default function JobChatPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;

  const [job, setJob] = useState<JobRequest | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [msgInput, setMsgInput] = useState('');
  const [sending, setSending] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (jobId) init();
  }, [jobId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function init() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setCurrentUser(user);

      const { data: jobData, error: jErr } = await supabase
        .from('job_requests')
        .select('*')
        .eq('id', jobId)
        .single();
      if (jErr || !jobData) { setError('ไม่พบงานนี้'); setLoading(false); return; }
      setJob(jobData);

      const { data: msgs } = await supabase
        .from('job_messages')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true });
      setMessages(msgs || []);

      const channel = supabase
        .channel('job-chat-' + jobId)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'job_messages',
          filter: `job_id=eq.${jobId}`,
        }, (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    } catch (_e) {
      setError('เกิดข้อผิดพลาด');
    }
    setLoading(false);
  }

  async function sendMessage() {
    if (!msgInput.trim() || !currentUser || !jobId) return;
    setSending(true);
    try {
      const { error: err } = await supabase.from('job_messages').insert({
        job_id: jobId,
        sender_id: currentUser.id,
        message: msgInput.trim(),
      });
      if (err) setError(err.message);
      else setMsgInput('');
    } catch (_e) {
      setError('ส่งข้อความไม่ได้');
    }
    setSending(false);
  }

  async function completeJob() {
    if (!job || !currentUser) return;
    setCompleting(true);
    try {
      const { error: err } = await supabase
        .from('job_requests')
        .update({ status: 'completed' })
        .eq('id', jobId);
      if (err) setError(err.message);
      else setJob({ ...job, status: 'completed' });
    } catch (_e) {
      setError('เกิดข้อผิดพลาด');
    }
    setCompleting(false);
  }

  const isProvider = currentUser?.id === job?.provider_id;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500 text-xl font-bold">กำลังโหลดแชท...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative">
      {/* ส่วนหัว */}
      <div className="bg-white shadow-sm px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-gray-600 text-3xl font-bold pr-2">
          ←
        </button>
        <div className="flex-1">
          <h1 className="font-extrabold text-2xl text-blue-600">
            {job?.destination || 'แชทคุยงาน'}
          </h1>
          <p className="text-sm font-bold text-gray-500">
            {job?.status === 'in_progress' ? '🔵 กำลังดำเนินการ' :
             job?.status === 'completed' ? '✅ งานนี้จบแล้ว' : '📍 ' + job?.status}
          </p>
        </div>
      </div>

      {/* ปุ่มจบงานสำหรับผู้ช่วย */}
      {isProvider && job?.status === 'in_progress' && (
        <div className="px-4 pt-4">
          <button
            onClick={completeJob}
            disabled={completing}
            className="w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white text-2xl font-extrabold py-6 rounded-2xl shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <span className="text-3xl">✅</span>
            {completing ? 'กำลังบันทึก...' : 'ถึงที่หมายแล้ว'}
          </button>
        </div>
      )}

      {/* พื้นที่แชท */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 pb-32">
        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUser?.id;
          return (
            <div key={msg.id} className={'flex ' + (isMine ? 'justify-end' : 'justify-start')}>
              <div
                className={
                  'max-w-[85%] rounded-2xl px-5 py-4 shadow-md ' +
                  (isMine
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 rounded-bl-sm')
                }
              >
                <p className="text-2xl leading-relaxed font-medium">{msg.message}</p>
                <p className={'text-xs mt-2 font-bold ' + (isMine ? 'text-blue-200' : 'text-gray-400')}>
                  {new Date(msg.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* ช่องกรอกข้อความ */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 px-4 py-4 flex gap-3 items-center shadow-2xl">
        <input
          type="text"
          value={msgInput}
          onChange={(e) => setMsgInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
          placeholder="พิมพ์ข้อความที่นี่..."
          className="flex-1 border-2 border-gray-200 rounded-2xl px-5 py-5 text-2xl focus:outline-none focus:border-blue-500"
          disabled={job?.status === 'completed'}
        />
        <button
          onClick={sendMessage}
          disabled={sending || !msgInput.trim() || job?.status === 'completed'}
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl px-6 py-5 text-3xl font-bold shadow-lg disabled:opacity-30"
        >
          ✈️
        </button>
      </div>
    </div>
  );
}

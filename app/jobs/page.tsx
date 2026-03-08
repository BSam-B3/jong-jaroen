'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const JOB_LABEL = {
  errand: '🛵 พาไปธุระ',
  repair: '🔧 งานช่าง',
  other: '📋 อื่นๆ',
};

const DEST_LABEL = {
  hospital: '🏥 ไปอนามัย/รพ.',
  market: '🛒 ไปตลาด',
  bank: '🏦 ไปธนาคาร',
  other: '📋 อื่นๆ',
};

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'เมื่อกี้';
  if (diff < 3600) return 'เมื่อ ' + Math.floor(diff / 60) + ' นาทีที่แล้ว';
  if (diff < 86400) return 'เมื่อ ' + Math.floor(diff / 3600) + ' ชั่วโมงที่แล้ว';
  return 'เมื่อ ' + Math.floor(diff / 86400) + ' วันที่แล้ว';
}

export default function JobBoardPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);
  const channelRef = useRef(null);

  async function fetchJobs() {
    const { data, error } = await supabase
      .from('job_requests')
      .select('*')
      .eq('status', 'looking_for_provider')
      .order('created_at', { ascending: false });
    if (!error && data) setJobs(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchJobs();
    channelRef.current = supabase
      .channel('job_requests_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_requests' }, () => {
        fetchJobs();
      })
      .subscribe();
    return () => { channelRef.current?.unsubscribe(); };
  }, []);

  async function handleAccept(jobId) {
    setAccepting(jobId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const { error } = await supabase
        .from('job_requests')
        .update({ status: 'in_progress', provider_id: session.user.id })
        .eq('id', jobId)
        .eq('status', 'looking_for_provider');
      if (error) throw error;
      alert('คุณรับงานนี้แล้ว! กำลังเดินทางไปหาผู้จ้าง');
      router.push('/jobs/' + jobId);
    } catch (err) {
      alert(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setAccepting(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-gradient-to-r from-orange-500 to-orange-400 pt-10 pb-6 px-4 rounded-b-3xl shadow-md">
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-white text-3xl font-extrabold drop-shadow">📢 งานที่รอคนช่วย</h1>
          <p className="text-white/90 text-base mt-1">อัปเดตแบบ Realtime ตลอดเวลา</p>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 mt-6 space-y-4">
        {loading && (
          <div className="text-center py-12">
            <div className="text-5xl animate-bounce mb-3">🔍</div>
            <p className="text-gray-400 text-xl">กำลังโหลดงาน...</p>
          </div>
        )}

        {!loading && jobs.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">😴</div>
            <p className="text-gray-500 text-2xl font-bold">ยังไม่มีงานรอคนช่วย</p>
            <p className="text-gray-400 mt-2">ระบบจะแจ้งเตือนทันทีเมื่อมีงานใหม่</p>
          </div>
        )}

        {jobs.map((job) => (
          <div key={job.id} className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
            <div className="flex justify-between items-start mb-3">
              <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-base font-bold">
                {JOB_LABEL[job.job_type] || job.job_type}
              </span>
              <span className="text-sm text-gray-400">{timeAgo(job.created_at)}</span>
            </div>
            <h3 className="text-2xl font-extrabold text-gray-800 mb-2">
              {DEST_LABEL[job.destination] || job.destination || 'งานทั่วไป'}
            </h3>
            {job.lat && job.lng && (
              <p className="text-base text-blue-600 mb-3">
                📍 มีตำแหน่ง GPS ({parseFloat(job.lat).toFixed(4)}, {parseFloat(job.lng).toFixed(4)})
              </p>
            )}
            <button
              onClick={() => handleAccept(job.id)}
              disabled={accepting === job.id}
              className="w-full bg-green-500 hover:bg-green-600 active:bg-green-700 disabled:opacity-50 text-white font-bold py-6 text-2xl rounded-2xl shadow-xl transition"
            >
              {accepting === job.id ? '⏳ กำลังรับงาน...' : '✅ รับงานนี้!'}
            </button>
          </div>
        ))}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 z-50">
        <Link href="/" className="flex flex-col items-center gap-0.5 text-gray-400 text-xs"><span className="text-xl">🏠</span>หน้าแรก</Link>
        <Link href="/services" className="flex flex-col items-center gap-0.5 text-gray-400 text-xs"><span className="text-xl">🔧</span>บริการ</Link>
        <Link href="/coupons" className="flex flex-col items-center gap-0.5 text-gray-400 text-xs"><span className="text-xl">🎟️</span>รางวัล</Link>
        <Link href="/jobs" className="flex flex-col items-center gap-0.5 text-orange-500 font-bold text-xs"><span className="text-xl">📋</span>งาน</Link>
        <Link href="/profile" className="flex flex-col items-center gap-0.5 text-gray-400 text-xs"><span className="text-xl">👤</span>ฉัน</Link>
      </nav>
    </div>
  );
}

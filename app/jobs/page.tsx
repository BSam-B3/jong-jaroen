'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface JobRequest {
  id: string;
  job_type: string;
  destination: string;
  status: string;
  created_at: string;
  provider_id?: string | null;
}

// ✅ บรรทัดที่ 20 ที่ Vercel จ้องจะเล่นงาน เราใส่ : string ให้แล้วค่ะ
function timeAgo(dateStr: string) {
  if (!dateStr) return 'ไม่ระบุเวลา';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'เมื่อกี้';
  if (diff < 3600) return 'เมื่อ ' + Math.floor(diff / 60) + ' นาทีที่แล้ว';
  return 'เมื่อนานมาแล้ว';
}

export default function JobBoardPage() {
  const [jobs, setJobs] = useState<JobRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchJobs();
    const channel = supabase
      .channel('public:job_requests')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'job_requests' 
      }, (payload) => {
        if (payload.new.status === 'looking_for_provider') {
          setJobs((prev) => [payload.new as JobRequest, ...prev]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchJobs() {
    setLoading(true);
    const { data, error } = await supabase
      .from('job_requests')
      .select('*')
      .eq('status', 'looking_for_provider')
      .order('created_at', { ascending: false });
    
    if (!error) setJobs(data || []);
    setLoading(false);
  }

  async function acceptJob(jobId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { error } = await supabase
      .from('job_requests')
      .update({ status: 'in_progress', provider_id: user.id })
      .eq('id', jobId);

    if (!error) router.push(`/jobs/${jobId}`);
  }

  if (loading) return <div className="p-10 text-center text-2xl font-bold">กำลังโหลดงาน...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-md mx-auto">
      <h1 className="text-3xl font-extrabold text-blue-700 text-center my-8">งานที่รอคนช่วย</h1>
      <div className="space-y-6">
        {jobs.length === 0 ? (
          <p className="text-center text-gray-500 text-xl mt-10">ยังไม่มีงานใหม่ในขณะนี้</p>
        ) : (
          jobs.map((job) => (
            <div key={job.id} className="bg-white rounded-3xl p-6 shadow-xl border-2 border-blue-100">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-5xl">🛵</span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{job.destination}</h2>
                  <p className="text-blue-500 font-bold">{timeAgo(job.created_at)}</p>
                </div>
              </div>
              <button
                onClick={() => acceptJob(job.id)}
                className="w-full bg-green-500 hover:bg-green-600 text-white text-3xl font-extrabold py-6 rounded-2xl shadow-lg"
              >
                รับงานนี้
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
// ✅ แก้ไข: เปลี่ยนมาใช้กุญแจตัวใหม่จากโฟลเดอร์ client
import { createClient } from '@/lib/supabase/client';

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  phone: string;
  email: string;
  bio: string | null;
  skills: string[];
  is_online: boolean;
  total_jobs: number;
  is_verified: boolean;
  rating: number;
  earning_total: number;
}

interface Job {
  id: string;
  category: string;
  title: string;
  description: string;
  price: number;
  location: string;
  created_at: string;
  status: string;
}

export default function PortfolioPage() {
  const router = useRouter();
  // ✅ แก้ไข: สร้างกุญแจเชื่อมต่อภายใน Component
  const supabase = useMemo(() => createClient(), []);
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // ดึงข้อมูลโปรไฟล์
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // ดึงข้อมูลงานที่เคยทำสำเร็จ
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*')
        .eq('worker_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (profileData) setProfile(profileData);
      if (jobsData) setJobs(jobsData as Job[]);
      setLoading(false);
    };

    fetchData();
  }, [supabase, router]);

  if (loading) return <div className="p-10 text-center font-bold">กำลังโหลดพอร์ตโฟลิโอ...</div>;

  return (
    <div className="min-h-screen bg-white p-6 pb-24">
      <div className="max-w-md mx-auto space-y-6">
        <button onClick={() => router.back()} className="text-gray-500 font-bold text-sm">← กลับ</button>
        
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto overflow-hidden border-4 border-orange-100">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
            )}
          </div>
          <h1 className="text-2xl font-black text-gray-900">{profile?.full_name}</h1>
          <div className="flex justify-center gap-2">
            {profile?.skills.map((skill, i) => (
              <span key={i} className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-600">
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-3xl text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase">งานที่สำเร็จ</p>
            <p className="text-xl font-black text-gray-900">{profile?.total_jobs || 0}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-3xl text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase">คะแนนเฉลี่ย</p>
            <p className="text-xl font-black text-orange-500">⭐ {profile?.rating || 0}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-black text-gray-800">ผลงานที่ผ่านมา</h2>
          {jobs.length === 0 ? (
            <p className="text-center py-10 text-gray-400 text-sm italic">ยังไม่มีประวัติการรับงานค่ะ</p>
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="p-4 border border-gray-100 rounded-2xl space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-sm text-gray-800">{job.title}</h3>
                  <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">สำเร็จแล้ว</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{job.description}</p>
                <p className="text-[10px] text-gray-400">{new Date(job.created_at).toLocaleDateString('th-TH')}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

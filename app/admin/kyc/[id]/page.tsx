'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/app/components/BottomNav';

export default function KycDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [profile, setProfile] = useState<any>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // 1. ตรวจสอบว่าล็อกอินหรือยัง (เช็คผ่านเบราว์เซอร์โดยตรง)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      // 2. ดึงข้อมูล Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      setProfile(profileData);

      // 3. ดึงลิงก์รูป (แบบสร้างลิงก์ลับชั่วคราว 60 วินาที)
      if (profileData) {
        const { data: files } = await supabase.storage.from('kyc_documents').list(userId);
        const imageFile = files?.find(f => /\.(jpe?g|png|webp)$/i.test(f.name));
        
        if (imageFile) {
          const { data } = await supabase.storage
            .from('kyc_documents')
            .createSignedUrl(`${userId}/${imageFile.name}`, 60);
          setImageSrc(data?.signedUrl || null);
        }
      }
      setLoading(false);
    }
    loadData();
  }, [userId, router]);

  if (loading) return <div className="p-10 text-center font-bold">กำลังตรวจสอบสิทธิ์...</div>;
  if (!profile) return <div className="p-10 text-center text-red-500">ไม่พบข้อมูล หรือคุณไม่มีสิทธิ์ดูหน้านี้</div>;

  return (
    <div className="min-h-screen bg-white p-6 pb-24">
      <button onClick={() => router.back()} className="mb-6 text-blue-500 font-bold">← กลับ</button>
      <h1 className="text-xl font-black mb-6">ตรวจเอกสาร: {profile.full_name || 'ไม่ระบุชื่อ'}</h1>
      
      <div className="bg-gray-100 rounded-2xl aspect-video mb-6 flex items-center justify-center overflow-hidden border">
        {imageSrc ? (
          <img src={imageSrc} className="w-full h-full object-contain" alt="ID Card" />
        ) : (
          <p className="text-gray-400">ไม่พบรูปบัตรประชาชน</p>
        )}
      </div>

      <div className="space-y-4 bg-gray-50 p-4 rounded-xl border">
        <div>
          <p className="text-[10px] text-gray-400 font-bold uppercase">เลขบัตรประชาชน</p>
          <p className="text-lg font-mono">{profile.national_id || 'ไม่ระบุ'}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 font-bold uppercase">ที่อยู่</p>
          <p className="text-sm">{profile.address || '-'}</p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

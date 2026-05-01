'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function AvatarEditPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    async function getProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.from('profiles').select('avatar_url').eq('id', session.user.id).single();
        if (data) setAvatarUrl(data.avatar_url);
      }
    }
    getProfile();
  }, [supabase]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${session.user.id}-${Math.random()}.${fileExt}`;

      // 1. อัปโหลดขึ้น Storage
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      // 2. ดึง Public URL
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // 3. อัปเดตลง Database
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', session.user.id);
      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      alert('เปลี่ยนรูปโปรไฟล์สำเร็จ!');
      router.refresh();
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการอัปโหลด');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col p-6">
        <Link href="/profile/edit" className="text-gray-500 font-bold mb-10 inline-block">← ย้อนกลับ</Link>
        
        <div className="flex flex-col items-center gap-8 mt-10">
          <h1 className="text-2xl font-black text-gray-800">รูปโปรไฟล์</h1>
          
          <div className="w-48 h-48 rounded-full bg-white shadow-xl border-4 border-white overflow-hidden flex items-center justify-center text-6xl">
            {avatarUrl ? (
              <img src={avatarUrl} className="w-full h-full object-cover" alt="avatar" />
            ) : '👤'}
          </div>

          <label className={`px-8 py-4 rounded-2xl font-black text-white shadow-lg transition-all active:scale-95 cursor-pointer ${uploading ? 'bg-gray-400' : 'bg-[#EE4D2D]'}`}>
            {uploading ? 'กำลังอัปโหลด...' : '📷 เลือกรูปภาพใหม่'}
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
          
          <p className="text-xs text-gray-400 text-center leading-relaxed">
            รูปนี้จะแสดงให้ลูกค้าและเพื่อนสมาชิกเห็นในระบบ <br/>แนะนำให้ใช้รูปที่เห็นใบหน้าชัดเจนเพื่อความน่าเชื่อถือค่ะ
          </p>
        </div>
      </div>
    </div>
  );
}

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
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    async function getProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.from('profiles').select('avatar_url').eq('id', session.user.id).single();
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
      }
    }
    getProfile();
  }, [supabase]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    const file = event.target.files[0];
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;
    
    try {
      setUploading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 🗑️ STEP 1: ลบรูปเก่าออกจาก Storage (ถ้ามี)
      if (avatarUrl) {
        try {
          // ดึงเฉพาะชื่อไฟล์จาก URL (ตัวอย่าง: .../avatars/filename.jpg -> filename.jpg)
          const oldFileName = avatarUrl.split('/').pop();
          if (oldFileName) {
            await supabase.storage.from('avatars').remove([oldFileName]);
            console.log("ลบรูปเก่าเรียบร้อย:", oldFileName);
          }
        } catch (err) {
          console.error("Error deleting old avatar:", err);
          // ไม่ต้องหยุดการทำงาน เผื่อรูปเก่าไม่มีอยู่จริงใน Storage
        }
      }

      // 📤 STEP 2: อัปโหลดรูปใหม่ (สุ่มชื่อใหม่เพื่อเลี่ยงปัญหา Cache)
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `${session.user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // 🔗 STEP 3: ดึง Public URL และอัปเดต Database
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      alert('อัปเดตรูปโปรไฟล์สำเร็จแล้วค่ะ!');
      router.push('/profile/edit/basic');
      router.refresh();

    } catch (error: any) {
      console.error("Upload Error:", error);
      alert('เกิดข้อผิดพลาดในการอัปโหลด กรุณาลองใหม่อีกครั้งค่ะ');
    } finally {
      setUploading(false);
    }
  };

  const displayImage = previewUrl || avatarUrl;

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-20">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col p-6">
        <Link href="/profile/edit/basic" className="text-gray-500 font-bold mb-10 inline-block">← ย้อนกลับ</Link>
        
        <div className="flex flex-col items-center gap-8 mt-10">
          <h1 className="text-2xl font-black text-gray-800">รูปโปรไฟล์</h1>
          
          <div className="w-48 h-48 rounded-full bg-white shadow-xl border-4 border-white overflow-hidden flex items-center justify-center text-6xl">
            {displayImage ? (
              <img src={displayImage} className="w-full h-full object-cover" alt="avatar" />
            ) : '👤'}
          </div>

          {!selectedFile ? (
            <label className="px-8 py-4 rounded-2xl font-black text-[#EE4D2D] bg-white border-2 border-[#EE4D2D] shadow-sm transition-all active:scale-95 cursor-pointer hover:bg-orange-50">
              📷 เลือกรูปภาพใหม่
              <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            </label>
          ) : (
            <div className="flex gap-4 w-full justify-center px-4">
              <button 
                onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                disabled={uploading}
                className="px-6 py-4 rounded-2xl font-black text-gray-500 bg-gray-200 active:scale-95 transition-all flex-1 max-w-[140px]"
              >
                ❌ ยกเลิก
              </button>
              <button 
                onClick={handleConfirmUpload}
                disabled={uploading}
                className={`px-6 py-4 rounded-2xl font-black text-white shadow-lg active:scale-95 transition-all flex-1 max-w-[200px] ${uploading ? 'bg-gray-400' : 'bg-gradient-to-r from-[#EE4D2D] to-[#FF7337]'}`}
              >
                {uploading ? 'กำลังบันทึก...' : '✅ ยืนยันอัปโหลด'}
              </button>
            </div>
          )}
          
          <p className="text-xs text-gray-400 text-center leading-relaxed">
            รูปนี้จะแสดงให้ลูกค้าเห็น สามารถเปลี่ยนได้บ่อยเท่าที่ต้องการค่ะ <br/>
            ระบบจะช่วยลบรูปเก่าทิ้งให้อัตโนมัติเพื่อประหยัดพื้นที่ค่ะ ✨
          </p>
        </div>
      </div>
    </div>
  );
}

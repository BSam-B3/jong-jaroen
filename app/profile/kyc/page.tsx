// app/profile/kyc/page.tsx (ตัวอย่างการนำไปใช้)
'use client';
import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
// ✅ นำเข้าฟังก์ชันประทับลายน้ำ
import { addKycWatermark } from '@/app/utils/watermark';

export default function KycUploadPage() {
  const supabase = useMemo(() => createClient(), []);
  const [uploading, setUploading] = useState(false);

  const handleKycUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('กรุณาเลือกรูปภาพค่ะ');
      }

      const originalFile = event.target.files[0];
      console.log('1. รูปต้นฉบับ:', originalFile);

      // ✨ 🌟 ไฮไลท์: เรียกใช้ระบบประทับลายน้ำอัตโนมัติก่อนส่ง
      console.log('2. กำลังประทับลายน้ำฝั่ง Client...');
      const watermarkedFile = await addKycWatermark(originalFile, session.user.id);
      console.log('3. รูปที่ประทับลายน้ำแล้ว:', watermarkedFile);


      // 4. ส่งไฟล์ที่ "ปลอดภัยแล้ว" ขึ้น Supabase Storage
      console.log('4. กำลังอัปโหลดรูปที่ปลอดภัยแล้ว...');
      const filePath = `kyc/${session.user.id}/id_card_${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from('kyc-documents') // อย่าลืมสร้าง Bucket นี้และตั้ง RLS นะคะ
        .upload(filePath, watermarkedFile);

      if (error) throw error;

      alert('อัปโหลดรูปยืนยันตัวตนสำเร็จแล้วค่ะ! รอแอดมินตรวจสอบนะคะ');
      
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการอัปโหลด');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-10 text-center">
        <h1 className="text-xl font-black mb-5">อัปโหลดรูปคู่บัตรประชาชน (KYC)</h1>
        <label className="bg-[#EE4D2D] text-white px-5 py-3 rounded-xl font-bold cursor-pointer hover:shadow-lg transition-all active:scale-95">
            {uploading ? 'กำลังประมวลผล...' : '🖼️ เลือกรูปถ่ายของคุณ'}
            <input 
                type="file" 
                accept="image/jpeg,image/png" 
                onChange={handleKycUpload} 
                className="hidden" 
                disabled={uploading}
            />
        </label>
        <p className="text-xs text-gray-400 mt-3">*รูปจะถูกประทับลายน้ำเพื่อความปลอดภัยโดยอัตโนมัติก่อนส่ง</p>
    </div>
  );
}

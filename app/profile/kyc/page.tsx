'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
// ✅ ดึงฟังก์ชันลายน้ำมาใช้
import { addKycWatermark } from '@/app/utils/watermark';

export default function KycUploadPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // เช็ค Auth ก่อน
  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
      } else {
        setCheckingAuth(false);
      }
    }
    checkUser();
  }, [router, supabase]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    const file = event.target.files[0];
    
    // ตรวจสอบขนาดไฟล์เบื้องต้น (จำกัดที่ 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('ขนาดไฟล์ใหญ่เกินไป กรุณาเลือกรูปภาพขนาดไม่เกิน 10MB ค่ะ');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("ไม่พบข้อมูลผู้ใช้งาน");

      // ✨ 1. ประทับลายน้ำฝั่ง Client (รูปต้นฉบับจะไม่ถูกส่งขึ้น Server)
      const watermarkedFile = await addKycWatermark(selectedFile, session.user.id);

      // 📤 2. อัปโหลดเข้า Private Bucket (kyc-documents)
      const fileExt = selectedFile.name.split('.').pop() || 'jpg';
      const filePath = `kyc/${session.user.id}/id_card_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(filePath, watermarkedFile, {
            upsert: false // สร้างไฟล์ใหม่เสมอ ไม่ทับของเดิมเพื่อเก็บประวัติ
        });

      if (uploadError) throw uploadError;

      // 🔄 3. อัปเดตสถานะในตาราง Profiles
      // 💡 [Logic Update] เปลี่ยน kyc_status เป็น pending และล้างเหตุผลการปฏิเสธเดิมทิ้ง
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
            kyc_status: 'pending',
            kyc_rejected_reason: null
        })
        .eq('id', session.user.id);

      if (profileError) throw profileError;

      alert('ส่งข้อมูลยืนยันตัวตนสำเร็จแล้วค่ะ! รอแอดมินตรวจสอบนะคะ');
      router.push('/profile/edit'); // เด้งกลับหน้าตั้งค่าบัญชี
      router.refresh();

    } catch (error: any) {
      console.error("KYC Upload Error:", error);
      alert('เกิดข้อผิดพลาดในการอัปโหลดข้อมูล กรุณาลองใหม่อีกครั้งค่ะ');
    } finally {
      setUploading(false);
    }
  };

  if (checkingAuth) return <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center font-black text-[#EE4D2D] animate-pulse">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-20">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl">
        
        {/* 🟠 Header ส้มจงเจริญ */}
        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-[2.5rem] p-6 pt-10 pb-8 shadow-md m-3">
            <Link href="/profile/edit" className="text-white/80 font-bold text-sm mb-4 inline-block hover:text-white">← ย้อนกลับ</Link>
            <h1 className="text-white text-2xl font-black">ยืนยันตัวตน (KYC)</h1>
            <p className="text-white/90 text-[11px] font-medium mt-1 leading-relaxed">
              อัปโหลดภาพถ่ายคู่กับบัตรประชาชนของคุณ เพื่อรับสิทธิพิเศษในการรับงานและโอนเงินเข้าบัญชี
            </p>
        </div>

        <main className="px-5 space-y-4 mt-2">
          
          {/* 🌟 การ์ดคำแนะนำ (DOs & DON'Ts) แบบ Shopee Style */}
          <section className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-black text-gray-800 text-sm border-l-4 border-[#EE4D2D] pl-2 mb-4">วิธีการถ่ายภาพที่ถูกต้อง</h2>
            
            <div className="flex gap-4 mb-4">
                <div className="w-24 h-24 bg-green-50 rounded-xl border-2 border-green-200 flex flex-col items-center justify-center shrink-0">
                    <span className="text-3xl mb-1">📸</span>
                    <span className="text-[10px] font-bold text-green-700">✓ แบบที่ถูกต้อง</span>
                </div>
                <div className="flex-1 flex flex-col justify-center space-y-2 text-[11px] font-medium text-gray-600">
                    <p className="flex items-start gap-1.5"><span className="text-green-500">✓</span> <span>ถือบัตรประชาชนแนบไว้ใกล้ใบหน้า</span></p>
                    <p className="flex items-start gap-1.5"><span className="text-green-500">✓</span> <span>เห็นใบหน้าและตัวหนังสือบนบัตรชัดเจน</span></p>
                    <p className="flex items-start gap-1.5"><span className="text-green-500">✓</span> <span>ถ่ายในที่ที่มีแสงสว่างเพียงพอ</span></p>
                </div>
            </div>

            <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                <p className="text-[10px] font-bold text-red-600 flex items-center gap-1.5">
                    <span className="text-sm">❌</span> ข้อห้าม: สวมแว่นตาดำ, สวมหมวก, หรือใช้แอปพลิเคชันแต่งรูปที่บิดเบือนใบหน้าจริง
                </p>
            </div>
          </section>

          {/* 🌟 ส่วนอัปโหลดรูปภาพ */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center gap-4">
            
            {/* โชว์รูปตัวอย่างถ้าเลือกแล้ว */}
            {previewUrl ? (
                <div className="w-full relative">
                    <img src={previewUrl} alt="KYC Preview" className="w-full rounded-2xl shadow-inner border border-gray-200 object-contain max-h-[350px] bg-gray-50" />
                    {/* ลูกเล่นกราฟิกลายน้ำจำลองให้ผู้ใช้รู้สึกปลอดภัย */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                         <span className="text-xl font-black text-[#EE4D2D] -rotate-12 select-none tracking-widest drop-shadow-md">ใช้สำหรับแอปจงเจริญเท่านั้น</span>
                    </div>
                </div>
            ) : (
                <div className="w-full h-48 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 gap-2">
                    <span className="text-4xl">🆔</span>
                    <span className="text-[11px] font-medium">ยังไม่ได้เลือกรูปภาพ</span>
                </div>
            )}

            {/* ปุ่มควบคุม */}
            {!selectedFile ? (
                <label className="w-full py-4 rounded-2xl font-black text-[#EE4D2D] bg-orange-50 border-2 border-[#EE4D2D]/30 shadow-sm transition-all active:scale-95 cursor-pointer hover:bg-orange-100 text-center text-sm flex items-center justify-center gap-2">
                    <span>📷 ถ่ายรูปหรือเลือกรูปภาพ</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileSelect} className="hidden" />
                </label>
            ) : (
                <div className="flex gap-3 w-full mt-2">
                    <button 
                        onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                        disabled={uploading}
                        className="py-3.5 px-2 rounded-2xl font-black text-gray-500 bg-gray-100 active:scale-95 transition-all flex-1 text-xs border border-gray-200"
                    >
                        🔄 เลือกรูปใหม่
                    </button>
                    <button 
                        onClick={handleUploadSubmit}
                        disabled={uploading}
                        className={`py-3.5 px-2 rounded-2xl font-black text-white shadow-lg active:scale-95 transition-all flex-[2] text-sm flex items-center justify-center gap-2 ${uploading ? 'bg-gray-400' : 'bg-gradient-to-r from-[#EE4D2D] to-[#FF7337]'}`}
                    >
                        {uploading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                กำลังประมวลผล...
                            </>
                        ) : '✅ ส่งข้อมูลยืนยันตัวตน'}
                    </button>
                </div>
            )}
            
            <p className="text-[9px] text-gray-400 text-center leading-relaxed mt-2 px-2">
                *ภาพของคุณจะถูกประทับลายน้ำอัตโนมัติก่อนส่งเข้าระบบ และถูกจัดเก็บด้วยความปลอดภัยขั้นสูงสุดตามมาตรฐาน PDPA
            </p>
          </section>

        </main>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/app/components/BottomNav';

export default function KycApprovalPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [profile, setProfile] = useState<any>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // เพิ่มตัวแปรสำหรับโหมดนักสืบ
  const [debugLog, setDebugLog] = useState<string>('กำลังเริ่มค้นหา...');

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // 1. ลองดึงจาก id_card_url ในฐานข้อมูลก่อน (ถ้ามี)
        if (profileData && profileData.id_card_url) {
          setDebugLog(`พบ path ใน DB: ${profileData.id_card_url}`);
          const { data } = supabase.storage
            .from('kyc_documents')
            .getPublicUrl(profileData.id_card_url);
          
          setImageUrl(data.publicUrl);
          setDebugLog(prev => prev + ` => สร้างลิงก์สำเร็จ`);
        } else {
          setDebugLog(`ไม่พบ Path ในตาราง Profiles (ว่างเปล่า) กำลังค้นหาในโฟลเดอร์...`);
          
          // 2. ถ้าไม่มีใน DB ให้ไปรื้อในโฟลเดอร์
          const { data: files, error: listError } = await supabase.storage
            .from('kyc_documents')
            .list(userId);

          if (listError) {
            setDebugLog(`ติดปัญหาการเข้าถึงโฟลเดอร์: ${listError.message}`);
            return;
          }

          if (files && files.length > 0) {
            const imageFile = files.find(f => f.name.includes('.jpg') || f.name.includes('.png') || f.name.includes('.jpeg'));

            if (imageFile) {
              const { data } = supabase.storage
                .from('kyc_documents')
                .getPublicUrl(`${userId}/${imageFile.name}`);
              
              setImageUrl(data.publicUrl);
              setDebugLog(`ค้นเจอไฟล์ในโฟลเดอร์ชื่อ: ${imageFile.name}`);
            } else {
              setDebugLog(`เจอไฟล์แต่ไม่ใช่นามสกุลรูป: ${JSON.stringify(files.map(f => f.name))}`);
            }
          } else {
            setDebugLog(`ค้นหาแล้ว แต่ในโฟลเดอร์ว่างเปล่า ไม่มีไฟล์เลยค่ะ`);
          }
        }
      } catch (err: any) {
        setDebugLog(`ระบบผิดพลาด: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
    if (userId) fetchData();
  }, [userId]);

  const handleDecision = async (decision: 'approved' | 'rejected') => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะ ${decision === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'} ผู้ใช้นี้?`)) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/kyc/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: userId, 
          decision: decision, 
          reviewer_note: `ตรวจสอบโดยแอดมิน เมื่อ ${new Date().toLocaleString('th-TH')}`
        })
      });

      if (res.ok) {
        alert('บันทึกข้อมูลเรียบร้อยแล้วค่ะ!');
        router.push('/admin');
      } else {
        const errorData = await res.json();
        alert(`เกิดข้อผิดพลาด: ${errorData.error}`);
      }
    } catch (error) {
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ค่ะ');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#F4F6F8] flex justify-center items-center font-bold text-gray-500">กำลังดึงข้อมูล...</div>;
  if (!profile) return <div className="min-h-screen bg-[#F4F6F8] flex justify-center items-center font-bold text-red-500">ไม่พบข้อมูลผู้ใช้นี้ค่ะ</div>;

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-24 text-left">
      <div className="w-full max-w-3xl bg-white min-h-screen shadow-xl p-6 md:p-10">
        
        <button onClick={() => router.back()} className="text-sm font-bold text-gray-400 mb-6 flex items-center gap-2 hover:text-gray-600">
          <span>←</span> กลับหน้าแอดมิน
        </button>

        <h1 className="text-2xl font-black text-gray-800 mb-2 border-b pb-4 text-center">พิจารณาเอกสารยืนยันตัวตน</h1>
        
        {/* ส่วนแสดงรูปบัตรประชาชน */}
        <div className="mb-8">
          <div className="text-sm font-black text-gray-500 mb-3 uppercase tracking-wider text-center">หลักฐานรูปถ่ายบัตรประชาชน</div>
          
          <div className="bg-gray-100 rounded-3xl border-2 border-dashed border-gray-300 overflow-hidden flex flex-col items-center justify-center relative aspect-video shadow-inner p-4">
            {imageUrl ? (
              <img src={imageUrl} alt="ID Card" className="object-contain w-full h-full z-10 relative" />
            ) : (
              <div className="text-center p-10 z-10 relative">
                <div className="text-4xl mb-2">📸</div>
                <div className="text-gray-400 font-bold text-sm mb-4">ไม่พบไฟล์รูปภาพในระบบ</div>
              </div>
            )}
            
            {/* 🔴 กล่องบอกสาเหตุ (Debug) จะได้รู้ว่าติดตรงไหน! 🔴 */}
            <div className="absolute bottom-2 left-2 right-2 bg-black/90 text-green-400 font-mono text-[11px] p-3 rounded-lg z-20 break-words border border-green-500">
              <span className="text-white font-bold mb-1 block">📌 สถานะการดึงรูปภาพ (โหมดนักสืบ):</span>
              {debugLog}
            </div>

            {/* Watermark ลายน้ำความปลอดภัย */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10 z-0">
              <span className="text-5xl font-black text-black rotate-[-30deg]">JONG JAROEN ADMIN</span>
            </div>
          </div>
        </div>

        {/* ข้อมูลเปรียบเทียบจากตาราง profiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 p-6 bg-gray-50 rounded-3xl border border-gray-100">
          <div className="space-y-6">
            <DataField label="ชื่อ-นามสกุล" value={profile.full_name} />
            <DataField label="เลขบัตรประชาชน" value={profile.national_id} isMono />
            <DataField label="วันเกิด" value={profile.date_of_birth} />
          </div>
          <div className="space-y-6">
            <DataField label="ที่อยู่ตามที่กรอกมา" value={profile.address || 'ไม่ได้ระบุที่อยู่'} isAddress />
            <div>
              <div className="text-[10px] font-black text-gray-400 uppercase mb-1">สถานะปัจจุบัน</div>
              <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider">
                {profile.kyc_status || 'pending'}
              </span>
            </div>
          </div>
        </div>

        {/* ปุ่มอนุมัติและปฏิเสธ */}
        <div className="flex gap-4 sticky bottom-6 bg-white/80 backdrop-blur-md p-4 rounded-2xl border shadow-sm z-30">
          <button 
            onClick={() => handleDecision('approved')} 
            disabled={isSubmitting} 
            className="flex-1 bg-[#22C55E] hover:bg-green-600 text-white py-5 rounded-2xl font-black text-lg transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            ✅ ข้อมูลถูกต้อง อนุมัติ
          </button>
          <button 
            onClick={() => handleDecision('rejected')} 
            disabled={isSubmitting} 
            className="flex-1 bg-[#EF4444] hover:bg-red-600 text-white py-5 rounded-2xl font-black text-lg transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            ❌ ปฏิเสธข้อมูล
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

// ส่วนประกอบย่อยสำหรับโชว์ข้อมูล
function DataField({ label, value, isMono = false, isAddress = false }: any) {
  return (
    <div className="text-left">
      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</div>
      <div className={`font-bold text-gray-800 ${isMono ? 'font-mono text-xl text-[#EE4D2D]' : 'text-lg'} ${isAddress ? 'leading-relaxed text-base' : ''}`}>
        {value || '-'}
      </div>
    </div>
  );
}

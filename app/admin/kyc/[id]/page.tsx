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
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        setProfile(profileData);

        const { data: files } = await supabase.storage.from('kyc_documents').list(userId);
        if (files && files.length > 0) {
          const imageFile = files.find(f => /\.(jpe?g|png|webp)$/i.test(f.name));
          if (imageFile) {
            const { data, error } = await supabase.storage
              .from('kyc_documents')
              .createSignedUrl(`${userId}/${imageFile.name}`, 60);
            if (data?.signedUrl) setImageUrl(data.signedUrl);
          }
        }
      } catch (err) {
        console.error('Fetch Error:', err);
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
          decision, 
          reviewer_note: `Admin Review: ${new Date().toLocaleString('th-TH')}` 
        })
      });
      if (res.ok) { alert('บันทึกเรียบร้อยค่ะ!'); router.push('/admin/kyc'); }
      else alert('เกิดข้อผิดพลาดในการบันทึกค่ะ');
    } catch (error) { alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ค่ะ'); } 
    finally { setIsSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">กำลังโหลด...</div>;
  if (!profile) return <div className="min-h-screen flex items-center justify-center font-bold text-red-500">ไม่พบข้อมูลผู้ใช้</div>;

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-24 text-left">
      {isZoomed && imageUrl && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex justify-center items-center p-4 cursor-zoom-out animate-in fade-in duration-300" onClick={() => setIsZoomed(false)}>
          <img src={imageUrl} alt="Zoomed ID" className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" />
        </div>
      )}
      <div className="w-full max-w-3xl bg-white min-h-screen shadow-xl p-6 md:p-10 border-x">
        <button onClick={() => router.back()} className="text-sm font-bold text-blue-500 mb-6 flex items-center gap-1 hover:underline">← กลับไปหน้าแอดมิน</button>
        <h1 className="text-2xl font-black text-gray-800 mb-6 border-b pb-4 text-center">พิจารณาเอกสารยืนยันตัวตน</h1>
        <div className="mb-8">
          <div className="text-sm font-bold text-gray-500 mb-2 uppercase">หลักฐานรูปถ่ายบัตรประชาชน</div>
          <div className="bg-gray-50 rounded-2xl border overflow-hidden flex items-center justify-center relative aspect-video cursor-zoom-in group" onClick={() => imageUrl && setIsZoomed(true)}>
            {imageUrl ? (
              <><img src={imageUrl} alt="ID Card" className="object-contain w-full h-full z-10 transition-transform duration-300 group-hover:scale-[1.02]" /><div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] px-3 py-1 rounded-full z-20 opacity-0 group-hover:opacity-100 transition-opacity">🔍 คลิกเพื่อขยาย</div></>
            ) : (
              <div className="text-gray-400 font-bold">ไม่พบรูปภาพในระบบ (ตรวจสอบชื่อโฟลเดอร์ใน Storage ด้วยนะคะ)</div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 p-6 bg-gray-50/50 rounded-2xl border shadow-sm">
          <div className="space-y-6">
            <DataField label="ชื่อ-นามสกุล" value={profile.full_name} />
            <DataField label="เลขบัตรประชาชน" value={profile.national_id} isMono />
            <DataField label="วันเกิด" value={profile.date_of_birth} />
          </div>
          <div className="space-y-6">
            <DataField label="ที่อยู่" value={profile.address} isAddress />
            <div><div className="text-[10px] font-bold text-gray-400 uppercase mb-1">สถานะ</div><span className="bg-orange-100 text-orange-600 px-3 py-0.5 rounded text-xs font-bold border border-orange-200">{profile.kyc_status || 'pending'}</span></div>
          </div>
        </div>
        <div className="flex gap-4 sticky bottom-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl border shadow-lg z-30">
          <button onClick={() => handleDecision('approved')} disabled={isSubmitting} className="flex-1 bg-green-500 text-white py-4 rounded-xl font-black text-lg shadow-md active:scale-95 disabled:opacity-50">อนุมัติ ✅</button>
          <button onClick={() => handleDecision('rejected')} disabled={isSubmitting} className="flex-1 bg-red-500 text-white py-4 rounded-xl font-black text-lg shadow-md active:scale-95 disabled:opacity-50">ปฏิเสธ ❌</button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

function DataField({ label, value, isMono = false, isAddress = false }: any) {
  return (<div className="text-left"><div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</div><div className={`font-bold text-gray-800 ${isMono ? 'font-mono text-xl text-red-500' : 'text-lg'} ${isAddress ? 'leading-relaxed text-sm' : ''}`}>{value || '-'}</div></div>);
}

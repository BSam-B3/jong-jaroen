'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/app/components/BottomNav';

export default function KycReviewClient({ userId, profile, imageSrc }: any) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showId, setShowId] = useState(false);

  // ฟังก์ชันจัดการการอนุมัติ/ปฏิเสธ
  const handleDecision = async (decision: 'approved' | 'rejected') => {
    const note = prompt(decision === 'rejected' ? 'ระบุเหตุผลที่ปฏิเสธ:' : 'บันทึกเพิ่มเติม (ถ้ามี):', decision === 'approved' ? 'ข้อมูลถูกต้อง' : '');
    if (note === null) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/kyc/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, decision, reviewer_note: note })
      });
      if (res.ok) { alert('ดำเนินการเรียบร้อยค่ะ!'); router.push('/admin'); router.refresh(); }
      else alert('เกิดข้อผิดพลาดค่ะ');
    } finally { setIsSubmitting(false); }
  };

  const maskedId = profile.national_id?.replace(/^(\d{1})\d+(\d{4})$/, '$1-XXXX-XXXXX-$2-X');

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center pb-24 text-left font-sans">
      {/* Zoom Modal */}
      {isZoomed && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex justify-center items-center p-4 cursor-zoom-out" onClick={() => setIsZoomed(false)}>
          <img src={imageSrc} className="max-w-full max-h-[90vh] object-contain rounded-xl" />
        </div>
      )}

      <div className="w-full max-w-3xl bg-white min-h-screen shadow-xl p-6 md:p-10 border-x">
        <button onClick={() => router.back()} className="text-sm font-bold text-blue-500 mb-6 hover:underline">← กลับหน้าแอดมิน</button>
        <h1 className="text-2xl font-black text-gray-800 mb-6 border-b pb-4 text-center">พิจารณาเอกสาร (ระบบรักษาความปลอดภัยสูง)</h1>
        
        <div className="mb-8">
          <div className="text-sm font-bold text-gray-500 mb-2 uppercase text-center">หลักฐานรูปถ่ายบัตรประชาชน</div>
          <div className="bg-gray-100 rounded-2xl overflow-hidden aspect-video relative flex items-center justify-center cursor-zoom-in group border" onClick={() => setIsZoomed(true)}>
            <img src={imageSrc} className="object-contain w-full h-full z-10 group-hover:scale-[1.02] transition-transform" />
            <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] px-3 py-1 rounded-full z-20">🔍 คลิกเพื่อขยาย</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 p-6 bg-gray-50 rounded-2xl border">
          <div className="space-y-4">
            <DataField label="ชื่อ-นามสกุล" value={profile.full_name} />
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase">เลขบัตรประชาชน</div>
              <button onClick={() => setShowId(!showId)} className="font-mono text-lg text-red-500 underline decoration-dotted">
                {showId ? profile.national_id : maskedId}
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <DataField label="ที่อยู่" value={profile.address} isAddress />
            <DataField label="สถานะ" value={profile.kyc_status} />
          </div>
        </div>

        <div className="flex gap-4 sticky bottom-6 bg-white/90 backdrop-blur p-4 rounded-2xl border shadow-lg">
          <button onClick={() => handleDecision('approved')} disabled={isSubmitting} className="flex-1 bg-green-500 text-white py-4 rounded-xl font-black shadow-md hover:bg-green-600">อนุมัติ ✅</button>
          <button onClick={() => handleDecision('rejected')} disabled={isSubmitting} className="flex-1 bg-red-500 text-white py-4 rounded-xl font-black shadow-md hover:bg-red-600">ปฏิเสธ ❌</button>
        </div>
      </div>
    </div>
  );
}

function DataField({ label, value, isAddress = false }: any) {
  return (
    <div>
      <div className="text-[10px] font-bold text-gray-400 uppercase">{label}</div>
      <div className={`font-bold text-gray-800 ${isAddress ? 'text-sm' : 'text-lg'}`}>{value || '-'}</div>
    </div>
  );
}

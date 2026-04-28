'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/app/components/BottomNav';

export default function KycReviewClient({ profile, imageProxyUrl, userId }: any) {
  const router = useRouter();
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F6F8] p-6 pb-24">
      {isZoomed && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center" onClick={() => setIsZoomed(false)}>
          <img src={imageProxyUrl} className="max-w-full max-h-[90vh] object-contain" />
        </div>
      )}
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl p-6">
        <button onClick={() => router.back()} className="text-blue-500 mb-4">← กลับ</button>
        <h1 className="text-2xl font-black mb-6 text-center">พิจารณาเอกสาร</h1>
        
        <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden mb-6 border cursor-zoom-in" onClick={() => setIsZoomed(true)}>
          <img src={imageProxyUrl} className="w-full h-full object-contain" alt="ID Card" />
        </div>

        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border">
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">ชื่อ-นามสกุล</p>
            <p className="font-bold">{profile.full_name || '-'}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">เลขบัตรประชาชน</p>
            <p className="font-bold text-red-500">{profile.national_id || '-'}</p>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

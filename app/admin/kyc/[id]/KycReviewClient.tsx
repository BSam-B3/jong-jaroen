'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function KycReviewClient({ profile }: { profile: any }) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState(profile.kyc_status);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const isReviewable = currentStatus === 'pending' || currentStatus === 'unverified';
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  async function submitDecision(decision: 'approved' | 'rejected') {
    if (!confirm(`ยืนยันการ ${decision === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'} เอกสารนี้?`)) return;
    setIsSubmitting(true);
    const { error } = await sb.rpc('admin_update_kyc_status', { p_target_id: profile.id, p_status: decision });
    setIsSubmitting(false);

    if (error) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } else {
      setCurrentStatus(decision);
      alert('บันทึกสำเร็จ!');
      router.refresh(); // รีเฟรชข้อมูล Server Data เพื่อให้หน้า List อัปเดตทันที
      setTimeout(() => router.push('/admin/kyc'), 1500); // กลับหน้า list
    }
  }

  // สร้างลิงก์รูปภาพ
  const idCardProxy = profile.id_card_url ? `/api/admin/kyc/${profile.id}/image?type=id_card` : null;
  const selfieProxy = profile.selfie_url ? `/api/admin/kyc/${profile.id}/image?type=selfie` : null;

  return (
    <div className="max-w-3xl mx-auto pb-24 p-6 animate-in fade-in">
      {/* Zoom Overlay */}
      {zoomedImage && (
        <div className="fixed inset-0 bg-black/95 z-50 flex justify-center items-center p-4 cursor-zoom-out" onClick={() => setZoomedImage(null)}>
          <img src={zoomedImage} alt="Zoomed" className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-8 border-b pb-4">
        <button onClick={() => router.back()} className="text-2xl font-bold text-gray-500 hover:text-gray-800">←</button>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-gray-900">พิจารณาเอกสารยืนยันตัวตน</h1>
          <p className="text-xs text-gray-400 font-bold mt-1">ID: {profile.id.slice(0, 8)}… | ส่งเมื่อ: {new Date(profile.submitted_at || profile.reviewed_at).toLocaleDateString()}</p>
        </div>
        <div className={`px-3 py-1 rounded-full font-black uppercase text-xs border ${profile.kyc_status === 'pending' ? 'bg-orange-100 text-orange-600 border-orange-200' : 'bg-gray-100'}`}>{currentStatus}</div>
      </div>

      {/* Images Section: โชว์ 2 รูปคู่กัน */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-6 bg-gray-50/50 rounded-2xl border">
        <div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">บัตรประชาชน</div>
          <div className="bg-gray-100 rounded-2xl border aspect-video flex items-center justify-center overflow-hidden cursor-zoom-in" onClick={() => idCardProxy && setZoomedImage(idCardProxy)}>
            {idCardProxy ? <img src={idCardProxy} alt="ID Card" className="object-cover w-full h-full hover:scale-105 transition-transform" /> : <p className="text-gray-400 font-bold">ไม่มีรูปบัตร</p>}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">รูปถ่ายตนเองคู่กับบัตร (Selfie)</div>
          <div className="bg-gray-100 rounded-2xl border aspect-video flex items-center justify-center overflow-hidden cursor-zoom-in" onClick={() => selfieProxy && setZoomedImage(selfieProxy)}>
            {selfieProxy ? <img src={selfieProxy} alt="Selfie" className="object-cover w-full h-full hover:scale-105 transition-transform" /> : <p className="text-gray-400 font-bold">ไม่มีรูปเซลฟี่</p>}
          </div>
        </div>
      </div>

      {/* Profile Data */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-6 bg-gray-50/50 rounded-2xl border shadow-inner">
        <DataField label="อีเมลบัญชี (Email)" value={profile.email} />
        <DataField label="ชื่อ-นามสกุล" value={profile.full_name} />
        <DataField label="เลขบัตรประชาชน" value={profile.national_id} isMono />
        <DataField label="เบอร์โทรศัพท์" value={profile.phone} />
        <DataField label="วันเกิด" value={profile.date_of_birth} />
        <DataField label="เขต/อำเภอ" value={profile.district} />
        <div className="md:col-span-2">
          <DataField label="ที่อยู่เต็ม" value={profile.address} isAddress />
        </div>
      </section>

      {/* Action Buttons */}
      {isReviewable ? (
        <div className="flex gap-4 sticky bottom-6 bg-white/90 backdrop-blur-sm p-4 rounded-2xl border shadow-xl">
          <button onClick={() => submitDecision('approved')} disabled={isSubmitting} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-black text-lg shadow-md disabled:opacity-50 transition-all">
            {isSubmitting ? 'กำลังบันทึก…' : 'อนุมัติ ✅'}
          </button>
          <button onClick={() => submitDecision('rejected')} disabled={isSubmitting} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl font-black text-lg shadow-md disabled:opacity-50 transition-all">
            {isSubmitting ? 'กำลังบันทึก…' : 'ไม่อนุมัติ ❌'}
          </button>
        </div>
      ) : (
        <div className="text-center p-6 bg-blue-50 border border-blue-100 rounded-2xl text-sm text-blue-700 font-bold">เอกสารนี้ได้รับการตรวจสอบแล้ว — {currentStatus}</div>
      )}
    </div>
  );
}

function DataField({ label, value, isMono = false, isAddress = false }: { label: string; value: string | null; isMono?: boolean; isAddress?: boolean; }) {
  return (
    <div>
      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</div>
      <div className={`font-bold text-gray-800 ${isMono ? 'font-mono text-lg text-orange-600 tracking-widest' : 'text-base'} ${isAddress ? 'leading-relaxed text-sm' : ''}`}>
        {value || '— ไม่ระบุ —'}
      </div>
    </div>
  );
}

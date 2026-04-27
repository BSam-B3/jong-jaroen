'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/app/components/BottomNav';

export default function KycApprovalPage() {
  const params = useParams();
  const router = useRouter();
  // แกะรหัส ID ของ user ออกมาจาก URL
  const userId = params.id as string;

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      setProfile(data);
      setLoading(false);
    }
    if (userId) fetchProfile();
  }, [userId]);

  // ฟังก์ชันเวลากดปุ่ม อนุมัติ/ไม่อนุมัติ
  const handleDecision = async (decision: 'approved' | 'rejected') => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะ ${decision === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'} ผู้ใช้นี้?`)) return;
    
    setIsSubmitting(true);
    try {
      // เรียกใช้ API หลังบ้านที่เราสร้างไว้
      const res = await fetch('/api/admin/kyc/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: userId, 
          decision: decision, 
          reviewer_note: 'ตรวจเอกสารผ่านระบบ Admin' 
        })
      });

      if (res.ok) {
        alert('บันทึกข้อมูลเรียบร้อยแล้วค่ะ!');
        router.push('/admin'); // เด้งกลับไปหน้า Dashboard หลัก
      } else {
        const errorData = await res.json();
        alert(`เกิดข้อผิดพลาด: ${errorData.error}`);
      }
    } catch (error) {
      console.error(error);
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ค่ะ');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#F4F6F8] flex justify-center items-center font-bold text-gray-500">กำลังดึงข้อมูล...</div>;
  if (!profile) return <div className="min-h-screen bg-[#F4F6F8] flex justify-center items-center font-bold text-red-500">ไม่พบข้อมูลผู้ใช้นี้ค่ะ</div>;

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-24">
      <div className="w-full max-w-3xl bg-white min-h-screen shadow-xl p-6 md:p-10">
        
        <button onClick={() => router.back()} className="text-sm font-bold text-gray-400 mb-6 hover:text-gray-600">
          ← กลับหน้าแอดมิน
        </button>

        <h1 className="text-2xl font-black text-gray-800 mb-6 border-b pb-4">ตรวจสอบเอกสาร KYC</h1>
        
        {/* ข้อมูลเบื้องต้นของผู้ใช้ */}
        <div className="bg-gray-50 rounded-xl p-6 space-y-4 mb-8 border border-gray-100">
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">ชื่อ-นามสกุล</div>
            <div className="text-lg font-bold text-gray-800">{profile.full_name || '-'}</div>
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">เลขบัตรประชาชน</div>
            {/* โชว์เลขบัตรที่คุณบีสามเพิ่งแก้ใน Supabase เมื่อกี้ค่ะ */}
            <div className="text-lg font-mono font-bold text-[#EE4D2D]">{profile.national_id || 'ไม่ได้ระบุ'}</div>
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">สถานะปัจจุบัน</div>
            <div className="mt-1 inline-block bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-black">
              {profile.kyc_status || 'pending'}
            </div>
          </div>
        </div>

        {/* ปุ่มตัดสินใจ */}
        <div className="flex gap-4">
          <button
            onClick={() => handleDecision('approved')}
            disabled={isSubmitting}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-black text-lg transition-colors shadow-md disabled:opacity-50"
          >
            ✅ อนุมัติผ่าน
          </button>
          <button
            onClick={() => handleDecision('rejected')}
            disabled={isSubmitting}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl font-black text-lg transition-colors shadow-md disabled:opacity-50"
          >
            ❌ ไม่ผ่าน
          </button>
        </div>

      </div>
      <BottomNav />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function SlipActions({ slipId, jobTitle }: { slipId: string, jobTitle: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleApprove = async () => {
    if (!confirm(`ยืนยันการอนุมัติสลิปสำหรับงาน: ${jobTitle} ใช่ไหมคะ?`)) return;
    setIsLoading(true);

    try {
      const { error } = await supabase.rpc('approve_slip', { p_slip_id: slipId });
      if (error) throw error;

      // 💬 ใช้ Copy จาก Meta AI จำลองการส่ง Push Notification
      alert(`✅ อนุมัติสำเร็จ!\n\nแจ้งเตือนลูกค้า:\n"เงินเข้า Escrow แล้ว ✅ ช่างพร้อมเริ่มงาน ไม่ต้องห่วง"\n\nแจ้งเตือนช่าง:\n"เงินล็อกให้แล้ว ลุยได้เลย! 🔒 งาน ${jobTitle} เสร็จแล้วกดเบิกได้ทันที"`);
      
      // รีเฟรชหน้าเว็บเพื่อดึงข้อมูลใหม่
      window.location.reload();
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-2 mt-2">
      <button 
        onClick={handleApprove}
        disabled={isLoading}
        className="flex-1 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-black shadow-sm hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50"
      >
        {isLoading ? 'กำลังประมวลผล...' : '✅ อนุมัติ'}
      </button>
      <div className="flex-1 flex flex-col gap-1">
        <button 
          disabled={isLoading}
          className="w-full px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-black hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-50"
        >
          ตีกลับ
        </button>
        <p className="text-[9px] text-gray-400 text-center">ตีกลับ = แจ้งลูกค้าโอนใหม่</p>
      </div>
    </div>
  );
}

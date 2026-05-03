'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function WithdrawalActions({ withdrawalId, workerName, amount }: { withdrawalId: string, workerName: string, amount: number }) {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleApprovePayout = async () => {
    if (!confirm(`ยืนยันว่าคุณได้โอนเงิน ${amount.toLocaleString('th-TH')} บาท ให้กับ ${workerName} เรียบร้อยแล้วใช่ไหมคะ?`)) return;
    
    setIsLoading(true);

    try {
      // 💡 เดี๋ยวเราจะเปลี่ยนชื่อ RPC ตามที่ C ออกแบบมาให้อีกทีค่ะ
      const { error } = await supabase.rpc('approve_withdrawal', { p_withdrawal_id: withdrawalId });
      if (error) throw error;

      // 💬 รอ Copy แจ้งเตือนช่างจาก Meta AI มาใส่ตรงนี้
      alert(`✅ ตัดยอดสำเร็จ! ระบบได้แจ้งเตือน ${workerName} แล้วค่ะ`);
      
      window.location.reload();
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full md:w-auto">
      <button 
        onClick={handleApprovePayout}
        disabled={isLoading}
        className="w-full px-8 py-3 bg-emerald-500 text-white rounded-xl text-sm font-black shadow-sm hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50"
      >
        {isLoading ? 'กำลังประมวลผล...' : '💸 โอนแล้ว ยืนยัน'}
      </button>
    </div>
  );
}

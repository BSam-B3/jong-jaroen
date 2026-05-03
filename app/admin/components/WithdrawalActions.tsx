'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function WithdrawalActions({ withdrawalId, workerName, amount, bankInfo }: { withdrawalId: string, workerName: string, amount: number, bankInfo: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleApprovePayout = async () => {
    // ให้แอดมินกรอกเลข Ref สลิปโอนเงินสั้นๆ
    const bankRef = prompt(`กำลังจะโอนเงิน ฿${amount.toLocaleString('th-TH')} ให้ ${workerName}\nหากโอนสำเร็จ กรุณากรอก 'เลขที่อ้างอิงสลิป' เพื่อยืนยัน:`);
    
    if (!bankRef) return; // ถ้ายกเลิกหรือไม่กรอก ให้หยุดทำงาน
    
    setIsLoading(true);

    try {
      // เรียกใช้ RPC อนุมัติโอนเงิน
      const { error } = await supabase.rpc('approve_withdrawal', { 
        p_withdrawal_id: withdrawalId,
        p_bank_ref: bankRef
      });
      if (error) throw error;

      // 💬 Push Notification จำลอง (คำพูด Meta AI)
      alert(`✅ โอนให้แล้ว! เงินถึงบัญชี\nแจ้งเตือนช่าง: "ตังค์เข้าแล้วนายช่าง! 🎉 ฿${amount.toLocaleString('th-TH')} ถึงบัญชี ${bankInfo} เรียบร้อย เอาไปใช้โลด"`);
      
      window.location.reload();
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={handleApprovePayout}
      disabled={isLoading}
      className="w-full md:w-auto px-8 py-3 bg-emerald-500 text-white rounded-xl text-sm font-black shadow-sm hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50"
    >
      {isLoading ? 'กำลังประมวลผล...' : '💸 โอนแล้ว ยืนยัน'}
    </button>
  );
}

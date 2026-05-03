'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function WalletPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 🌟 State สำหรับระบบถอนเงิน
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchWalletData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/auth/login');

      // 1. ดึงยอดเงิน (✅ แก้บั๊กกรณีเงินเป็น 0 บาท)
      const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('owner_id', session.user.id)
        .maybeSingle();

      if (wallet) {
        const currentBalance = wallet.balance_satang != null 
          ? (wallet.balance_satang / 100) 
          : (wallet.balance || 0);
        setBalance(currentBalance);
      }

      // 2. ดึงประวัติธุรกรรม
      const { data: txData } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', wallet?.id) // ดึงเฉพาะของกระเป๋านี้เพื่อความชัวร์
        .order('created_at', { ascending: false });

      if (txData) setTransactions(txData);
      setIsLoading(false);
    };

    fetchWalletData();
  }, [supabase, router]);

  // 🌟 ฟังก์ชันจัดการการถอนเงิน (ยิงเข้า RPC หลังบ้าน)
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(withdrawAmount);

    if (!withdrawAmount || amountNum <= 0) return alert("กรุณาระบุจำนวนเงินที่ต้องการถอนค่ะ");
    if (amountNum < 50) return alert("ยอดขั้นต่ำในการถอนคือ 50 บาทค่ะ");
    if (amountNum > balance) return alert("ยอดเงินในกระเป๋าไม่พอค่ะ");
    if (!bankName || !accountNumber) return alert("กรุณากรอกข้อมูลธนาคารให้ครบถ้วนค่ะ");

    setIsSubmitting(true);

    try {
      // เรียกใช้ RPC ถอนเงิน
      const { error } = await supabase.rpc('request_withdrawal', {
        p_amount_satang: amountNum * 100, // แปลงเป็นสตางค์
        p_bank_name: bankName,
        p_account_no: accountNumber
      });

      if (error) throw error;

      // 💬 คำนวณเวลาเพื่อโชว์ข้อความสุดกวนสไตล์จงเจริญ
      const currentHour = new Date().getHours();
      let alertMessage = "";
      if (currentHour < 11) {
        alertMessage = "รับเรื่องถอนแล้ว! ล็อกคิวโอนรอบ 11:00 น.\nแอดมินเตรียมโอนให้ เงินไม่หาย สบายใจได้ ✨";
      } else {
        alertMessage = "รับเรื่องถอนแล้ว! ล็อกคิวโอนรอบ 17:00 น.\nโอนเสร็จเดี๋ยวสลิปเด้งเข้าแชทเลย ✨";
      }

      alert(alertMessage);
      
      // ปิด Modal และรีเฟรชหน้าเพื่อให้ยอดเงินลดลง
      setIsWithdrawModalOpen(false);
      setWithdrawAmount('');
      setBankName('');
      setAccountNumber('');
      window.location.reload();

    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-24">
      {/* 🌟 Header */}
      <div className="bg-gradient-to-br from-[#EE4D2D] to-[#FF7337] px-6 pt-12 pb-20 rounded-b-[2.5rem] shadow-lg text-center relative z-10">
        <div className="flex items-center justify-between absolute w-full px-6 left-0 top-10">
          <button onClick={() => router.back()} className="text-white text-2xl font-black active:scale-95 transition-transform">←</button>
        </div>
        <h1 className="text-white font-black text-lg mb-4 mt-2">กระเป๋าตังค์ของนายช่าง</h1>
        <p className="text-white/80 text-sm font-bold">ยอดถอนได้</p>
        <div className="text-white text-5xl font-black">฿{balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</div>
        <p className="text-white/60 text-[10px] mt-2 font-bold">อัปเดตล่าสุด: เมื่อกี้เลย</p>
      </div>

      {/* 💳 ส่วนปุ่มถอนเงิน */}
      <div className="px-4 -mt-10 relative z-20">
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <button 
            onClick={() => setIsWithdrawModalOpen(true)}
            className="w-full bg-[#EE4D2D] text-white py-4 rounded-2xl font-black text-sm shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            ถอนเงินเข้าบัญชี <span className="text-lg leading-none">→</span>
          </button>
        </div>
      </div>

      {/* 📜 ส่วนประวัติธุรกรรม */}
      <div className="px-6 mt-8 relative z-0">
        <h2 className="text-gray-800 font-black mb-4">ประวัติเงินเข้า-ออก</h2>
        
        {isLoading ? (
          <p className="text-center text-gray-400 font-bold py-10">กำลังโหลดประวัติ...</p>
        ) : transactions.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-5xl mb-4">💸</div>
            <p className="font-black text-gray-800">ยังไม่มีรายการตังค์เข้าออกเลย</p>
            <p className="text-xs text-gray-500 font-bold mt-1">รับงานในจงเจริญก่อน เดี๋ยวตังค์เข้าเอง</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx, index) => {
              // ✅ แก้บั๊กยอดเงินเป็น 0 และนำ index มาใช้ป้องกัน Error
              const displayAmount = tx.amount_satang != null ? (tx.amount_satang / 100) : (tx.amount || 0);
              const isInflow = tx.type === 'deposit' || tx.type === 'slip_inflow' || displayAmount > 0;
              
              return (
                <div key={tx.id || index} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center shadow-sm">
                  <div className="flex gap-3 items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${isInflow ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                      {isInflow ? '💰' : '💸'}
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-sm">
                        {tx.type === 'withdraw_request' ? 'รายการถอนเงิน' : tx.type || 'รายการธุรกรรม'}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold">
                        {tx.created_at ? new Date(tx.created_at).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : ''}
                      </p>
                    </div>
                  </div>
                  <div className={`font-black text-right ${isInflow ? 'text-emerald-500' : 'text-gray-600'}`}>
                    {isInflow ? '+' : '-'}฿{Math.abs(displayAmount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- 🌟 POPUP ยืนยันการถอนเงิน (Modal) --- */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center p-4 pb-0 sm:pb-4">
          <div className="bg-white w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
            
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden"></div>
            
            <form onSubmit={handleWithdraw}>
              <h3 className="text-xl font-black text-gray-900 mb-2 text-center">จะถอนเท่าไหร่ดี?</h3>
              <p className="text-xs text-center text-gray-500 font-bold mb-6">
                ยอดถอนได้สูงสุด <span className="text-[#EE4D2D]">฿{balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </p>

              {/* กล่องจำนวนเงิน */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">จำนวนเงิน (ขั้นต่ำ 50)</span>
                  <button type="button" onClick={() => setWithdrawAmount(balance.toString())} className="text-[#EE4D2D] text-[10px] font-black">ถอนทั้งหมด</button>
                </div>
                <input 
                  type="number" required min="50" max={balance} step="any"
                  value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full bg-transparent text-3xl font-black text-gray-900 outline-none placeholder-gray-300"
                  placeholder="0"
                />
              </div>

              {/* กล่องบัญชีธนาคาร */}
              <div className="space-y-3 mb-6">
                <input 
                  type="text" required placeholder="ธนาคาร (เช่น กสิกรไทย)" 
                  value={bankName} onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#EE4D2D]"
                />
                <input 
                  type="text" required placeholder="เลขบัญชี / พร้อมเพย์" 
                  value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#EE4D2D]"
                />
              </div>
              
              <div className="flex flex-col gap-3">
                <button type="submit" disabled={isSubmitting || balance < 50} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black shadow-lg disabled:opacity-50 active:scale-95 transition-transform flex justify-center items-center">
                  {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'ใช่เลย ถอนโลด'}
                </button>
                <button type="button" onClick={() => setIsWithdrawModalOpen(false)} className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl font-black active:scale-95 transition-transform">
                  ไว้ก่อน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

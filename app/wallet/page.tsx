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
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  useEffect(() => {
    const fetchWalletData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/auth/login');

      // 1. ดึงยอดเงิน (ดึงมาทั้งหมดก่อนเพื่อความชัวร์กับโครงสร้างเก่า)
      const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('owner_id', session.user.id)
        .maybeSingle();

      if (wallet) {
        // รองรับทั้งแบบเก่าและแบบใหม่ (ถ้ามี _satang ให้หาร 100 ถ้าไม่มีใช้ยอดปกติ)
        const currentBalance = wallet.balance_satang ? (wallet.balance_satang / 100) : (wallet.balance || 0);
        setBalance(currentBalance);
      }

      // 2. ดึงประวัติธุรกรรม (ใช้ created_at แทน และไม่ต้อง Join table ให้เสี่ยงพัง)
      const { data: txData } = await supabase
        .from('wallet_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (txData) setTransactions(txData);
      setIsLoading(false);
    };

    fetchWalletData();
  }, [supabase, router]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-24">
      {/* 🌟 Header */}
      <div className="bg-gradient-to-br from-[#EE4D2D] to-[#FF7337] px-6 pt-12 pb-20 rounded-b-[2.5rem] shadow-lg text-center">
        <div className="flex items-center justify-between absolute w-full px-6 left-0 top-10">
          <button onClick={() => router.back()} className="text-white text-2xl font-black">←</button>
        </div>
        <h1 className="text-white font-black text-lg mb-4 mt-2">กระเป๋าตังค์ของนายช่าง</h1>
        <p className="text-white/80 text-sm font-bold">ยอดถอนได้</p>
        <div className="text-white text-5xl font-black">฿{balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</div>
        <p className="text-white/60 text-[10px] mt-2 font-bold">อัปเดตล่าสุด: เมื่อกี้เลย</p>
      </div>

      {/* 💳 ส่วนปุ่มถอนเงิน */}
      <div className="px-4 -mt-10 relative z-10">
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <button 
            onClick={() => setIsWithdrawModalOpen(true)}
            className="w-full bg-[#EE4D2D] text-white py-4 rounded-2xl font-black text-sm shadow-md active:scale-95 transition-all"
          >
            ถอนเงินเข้าบัญชี →
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
            {transactions.map((tx) => {
              // เช็คเงื่อนไขของเก่า (ถ้าเก่ามากๆ อาจใช้ column 'amount' ตรงๆ)
              const displayAmount = tx.amount_satang ? (tx.amount_satang / 100) : (tx.amount || 0);
              const isInflow = tx.type === 'deposit' || tx.type === 'slip_inflow' || displayAmount > 0;
              
              return (
                <div key={tx.id || Math.random()} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center shadow-sm">
                  <div className="flex gap-3 items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${isInflow ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                      {isInflow ? '💰' : '💸'}
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-sm">
                        {tx.type || 'รายการธุรกรรม'}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold">
                        {tx.created_at ? new Date(tx.created_at).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : ''}
                      </p>
                    </div>
                  </div>
                  <div className={`font-black text-right ${isInflow ? 'text-emerald-500' : 'text-gray-600'}`}>
                    {isInflow ? '+' : '-'}฿{Math.abs(displayAmount).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

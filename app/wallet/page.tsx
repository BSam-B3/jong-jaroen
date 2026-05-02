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

      // 1. ดึงยอดเงินปัจจุบัน
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance_satang')
        .eq('owner_id', session.user.id)
        .eq('kind', 'user')
        .maybeSingle();

      if (wallet) setBalance(wallet.balance_satang / 100);

      // 2. ดึงประวัติธุรกรรม (Join กับ wallet_entries เพื่อดูจำนวนเงิน)
      const { data: txData } = await supabase
        .from('wallet_transactions')
        .select(`
          id, type, status, amount_satang, posted_at,
          wallet_entries!inner(direction, amount_satang)
        `)
        .order('posted_at', { ascending: false });

      if (txData) setTransactions(txData);
      setIsLoading(false);
    };

    fetchWalletData();
  }, [supabase, router]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-24">
      {/* 🌟 Header (คงเดิมตามสไตล์ Meta AI ที่บีสามชอบ) */}
      <div className="bg-gradient-to-br from-[#EE4D2D] to-[#FF7337] px-6 pt-12 pb-20 rounded-b-[2.5rem] shadow-lg text-center">
        <h1 className="text-white font-black text-lg mb-4">กระเป๋าตังค์ของนายช่าง</h1>
        <p className="text-white/80 text-sm font-bold">ยอดถอนได้</p>
        <div className="text-white text-5xl font-black">฿{balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</div>
        <p className="text-white/60 text-[10px] mt-2 font-bold">อัปเดตล่าสุด: เมื่อกี้เลย</p>
      </div>

      {/* 💳 ส่วนปุ่มถอนเงิน */}
      <div className="px-4 -mt-10">
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <button 
            onClick={() => setIsWithdrawModalOpen(true)}
            className="w-full bg-[#EE4D2D] text-white py-4 rounded-2xl font-black text-sm shadow-md active:scale-95 transition-all"
          >
            ถอนเงินเข้าบัญชี →
          </button>
        </div>
      </div>

      {/* 📜 ส่วนประวัติธุรกรรม (ใช้ Copy จาก Meta AI) */}
      <div className="px-6 mt-8">
        <h2 className="text-gray-800 font-black mb-4">ประวัติเงินเข้า-ออก</h2>
        
        {isLoading ? (
          <p className="text-center text-gray-400 font-bold py-10">กำลังคุ้ยบัญชีให้คร้าบบ...</p>
        ) : transactions.length === 0 ? (
          /* 1. Empty State */
          <div className="text-center py-10">
            <div className="text-5xl mb-4">💸</div>
            <p className="font-black text-gray-800">ยังไม่มีรายการตังค์เข้าออกเลย</p>
            <p className="text-xs text-gray-500 font-bold mt-1">กระเป๋าโล่งแบบนี้เหงาแย่ ไปรับงานในจงเจริญก่อน เดี๋ยวตังค์เข้าเอง</p>
            <button onClick={() => router.push('/jobs')} className="mt-4 text-[#EE4D2D] font-black text-sm">ไปดูงานเลย →</button>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => {
              const isInflow = tx.type === 'slip_inflow' || tx.type === 'job_release';
              return (
                <div key={tx.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center shadow-sm">
                  <div className="flex gap-3 items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${isInflow ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                      {isInflow ? '💰' : '💸'}
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-sm">
                        {tx.type === 'job_release' ? 'ค่าจ้างส่งมอบงาน' : 
                         tx.type === 'withdraw_request' ? 'ถอนเข้ากสิกร' : 'รายการอื่นๆ'}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold">
                        {new Date(tx.posted_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                      </p>
                    </div>
                  </div>
                  <div className={`font-black text-right ${isInflow ? 'text-emerald-500' : 'text-gray-400'}`}>
                    {isInflow ? '+' : '-'}฿{(tx.amount_satang / 100).toLocaleString()}
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

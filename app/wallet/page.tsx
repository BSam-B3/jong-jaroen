'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function WalletPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // State สำหรับ Modal ถอนเงิน
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');

  useEffect(() => {
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return router.push('/auth/login');

    // ดึงยอดเงินจากตาราง wallets (ระบบบัญชีคู่ของ C)
    const { data, error } = await supabase
      .from('wallets')
      .select('balance_satang')
      .eq('owner_id', session.user.id)
      .eq('kind', 'user')
      .single();

    if (data) {
      setBalance(data.balance_satang / 100); // แปลงสตางค์เป็นบาท
    }
    setIsLoading(false);
  };

  const handleWithdrawRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(withdrawAmount);
    
    if (amountNum < 50) {
      return alert('ยอดถอนขั้นต่ำคือ 50 บาทค่ะ');
    }
    if (amountNum > balance) {
      return alert('ยอดเงินในกระเป๋าไม่พอค่ะ');
    }

    // ตรงนี้เดี๋ยวเราจะเชื่อมกับ RPC ตัดเงินของ C ในอนาคต
    // ตอนนี้สร้าง Alert จำลองความสำเร็จให้ดูก่อนค่ะ
    alert(`🎉 ส่งคำขอถอนเงิน ${amountNum.toLocaleString()} บาท สำเร็จ!\nแอดมินจะโอนเข้าบัญชี ${bankName} ภายใน 24 ชม. ค่ะ`);
    
    setIsWithdrawModalOpen(false);
    setWithdrawAmount('');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-24">
      {/* 🌟 Header */}
      <div className="bg-gradient-to-br from-[#EE4D2D] to-[#FF7337] px-6 pt-12 pb-20 rounded-b-[2.5rem] shadow-lg relative">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => router.back()} className="text-white text-2xl active:scale-95 transition-transform">←</button>
          <h1 className="text-white font-black text-lg">กระเป๋าเงินของฉัน</h1>
          <div className="w-8 h-8"></div> {/* Spacer */}
        </div>
        
        <div className="text-center">
          <p className="text-white/80 text-sm font-bold mb-1">ยอดเงินคงเหลือที่ถอนได้</p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-white text-5xl font-black tracking-tight">
              {isLoading ? '...' : balance.toLocaleString()}
            </span>
            <span className="text-white/90 text-xl font-bold">บาท</span>
          </div>
        </div>
      </div>

      {/* 💳 ส่วนเมนูจัดการเงิน (ลอยทับ Header) */}
      <div className="px-4 -mt-10 relative z-10">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex gap-4">
          <button 
            onClick={() => setIsWithdrawModalOpen(true)}
            className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-black text-sm shadow-md hover:bg-gray-800 active:scale-95 transition-all flex flex-col items-center justify-center gap-1"
          >
            <span className="text-2xl">💸</span>
            ถอนเงินเข้าบัญชี
          </button>
          <button 
            className="flex-1 bg-gray-50 text-gray-700 py-4 rounded-2xl font-black text-sm border border-gray-200 hover:bg-gray-100 active:scale-95 transition-all flex flex-col items-center justify-center gap-1"
          >
            <span className="text-2xl">🧾</span>
            ประวัติเงินเข้า-ออก
          </button>
        </div>
      </div>

      {/* 📋 รายการแจ้งเตือน / สถานะ */}
      <div className="px-6 mt-8">
        <h2 className="text-gray-800 font-black mb-4">สถานะการเงินล่าสุด</h2>
        {balance === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm">
            <p className="text-gray-400 font-bold text-sm">ยังไม่มียอดเงินเข้าในขณะนี้ค่ะ 🚀<br/>รับงานเพิ่มเพื่อสะสมรายได้กันเลย!</p>
          </div>
        ) : (
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-xl shrink-0">✅</div>
            <div>
              <p className="text-emerald-800 font-bold text-sm">เงินค่าจ้างเข้ากระเป๋าแล้ว!</p>
              <p className="text-emerald-600/80 text-xs font-medium">ยอดเงินพร้อมถอน คุณสามารถกดถอนได้ทันที</p>
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL ถอนเงิน --- */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
          <div className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-2xl animate-fade-in-up">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden"></div>
            
            <h3 className="text-2xl font-black text-gray-900 mb-1">ระบุยอดที่ต้องการถอน</h3>
            {/* 💬 เดี๋ยวเอาคำพูดของ Meta AI มาแปะตรงบรรทัดล่างนี้นะคะ */}
            <p className="text-xs text-gray-500 font-bold mb-6">ขั้นต่ำ 50 บาท (เงินจะโอนเข้าบัญชีภายใน 24 ชม.)</p>
            
            <form onSubmit={handleWithdrawRequest}>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-400 uppercase">จำนวนเงิน (บาท)</span>
                  <button type="button" onClick={() => setWithdrawAmount(balance.toString())} className="text-[#EE4D2D] text-xs font-black">ถอนทั้งหมด</button>
                </div>
                <input 
                  type="number" required min="50" max={balance} value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full bg-transparent text-4xl font-black text-gray-900 outline-none placeholder-gray-300"
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-3 mb-6">
                <input 
                  type="text" required placeholder="ชื่อธนาคาร (เช่น กสิกรไทย)" value={bankName} onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#EE4D2D]"
                />
                <input 
                  type="text" required placeholder="เลขที่บัญชี" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#EE4D2D]"
                />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setIsWithdrawModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-sm active:scale-95 transition-transform">ยกเลิก</button>
                <button type="submit" disabled={!withdrawAmount || Number(withdrawAmount) < 50} className="flex-[2] py-4 bg-[#EE4D2D] text-white rounded-2xl font-black text-sm shadow-md disabled:opacity-50 disabled:active:scale-100 active:scale-95 transition-transform">
                  ยืนยันการถอนเงิน 🚀
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function WalletPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [balance, setBalance] = useState<number>(0); 
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  
  // สร้าง State สำหรับเก็บข้อมูลธนาคาร
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  // 🌟 ดึงยอดเงินจริงจากฐานข้อมูล
  useEffect(() => {
    const fetchWalletData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/auth/login');

      // ดึงยอดเงินกระเป๋า user (ถ้าไม่มีจะคืนค่า null เราจึงใส่ || 0)
      const { data, error } = await supabase
        .from('wallets')
        .select('balance_satang')
        .eq('owner_id', session.user.id)
        .eq('kind', 'user')
        .maybeSingle();

      if (data) {
        setBalance(data.balance_satang / 100); // แปลงสตางค์เป็นบาท
      }
      setIsLoading(false);
    };

    fetchWalletData();
  }, [supabase, router]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (balance < 50) return alert("ยอดขั้นต่ำในการถอนคือ 50 บาทค่ะ");
    if (!bankName || !accountNumber) return alert("กรุณากรอกข้อมูลธนาคารให้ครบถ้วนค่ะ");

    // โค้ดตรงนี้เดี๋ยวเราจะเอา RPC ของ C มาใส่เพื่อตัดเงินจริงๆ
    // ชั่วคราวเราทำ UI จำลองความสำเร็จไปก่อน
    setIsSuccess(true);
    setTimeout(() => {
      setIsWithdrawModalOpen(false);
      setIsSuccess(false);
      alert("เรียบร้อย! ล็อกคิวโอนให้แล้ว ✨\nเงินกำลังเดินทางเข้าบัญชีนายช่าง");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-24">
      {/* 🌟 Header สไตล์ Meta AI */}
      <div className="bg-gradient-to-br from-[#EE4D2D] to-[#FF7337] px-6 pt-12 pb-20 rounded-b-[2.5rem] shadow-lg relative">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => router.back()} className="text-white text-2xl">←</button>
          <h1 className="text-white font-black text-lg">กระเป๋าตังค์ของนายช่าง</h1>
          <div className="w-8 h-8"></div>
        </div>
        
        <div className="text-center">
          <p className="text-white/80 text-sm font-bold mb-1">ยอดถอนได้</p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-white text-5xl font-black tracking-tight">
              {isLoading ? '...' : `฿${balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`}
            </span>
          </div>
          <p className="text-white/60 text-[10px] mt-2 font-bold">อัปเดตล่าสุด: เมื่อกี้เลย</p>
        </div>
      </div>

      {/* 💳 Card อธิบายเล็กๆ ใต้ยอดเงิน */}
      <div className="px-4 -mt-10 relative z-10">
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-start gap-3 mb-4">
            <div className="text-2xl">✨</div>
            <div>
              <p className="font-black text-gray-800 text-sm">เงินเข้าปุ๊บ ถอนได้ปั๊บ ไม่มีหมกเม็ด</p>
              <p className="text-[11px] text-gray-500 font-bold">จงเจริญหัก 10% เป็นค่าดูแลแอป ที่เหลือเข้ากระเป๋าเธอเต็มๆ</p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsWithdrawModalOpen(true)}
            className="w-full bg-[#EE4D2D] text-white py-4 rounded-2xl font-black text-sm shadow-md active:scale-95 transition-all"
          >
            ถอนเงินเข้าบัญชี →
          </button>
          
          <div className="mt-4 text-center">
            <p className="text-[10px] text-gray-400 font-bold">
              ถอนขั้นต่ำ 50 บาท โอนฟรี ไม่มีค่าธรรมเนียมแอบแฝง<br/>
              แอดมินกดโอนให้ทุกวัน 11:00 กับ 17:00 น. กดก่อนเวลาได้คิวก่อนนะ
            </p>
          </div>
        </div>
      </div>

      {/* --- POPUP ยืนยันการถอน --- */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-fade-in-up">
            {!isSuccess ? (
              <form onSubmit={handleWithdraw}>
                <h3 className="text-xl font-black text-gray-900 mb-2 text-center">จะถอน ฿{balance.toLocaleString('th-TH')} ใช่ปะ?</h3>
                <p className="text-xs text-center text-gray-500 font-bold mb-4">
                  <span className="text-[#EE4D2D]">กด "ใช่เลย" = ล็อกคิวโอนรอบถัดไป</span>
                </p>

                {/* กล่องกรอกข้อมูลบัญชี */}
                <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <input 
                    type="text" required placeholder="ชื่อธนาคาร (เช่น กสิกรไทย)" 
                    value={bankName} onChange={(e) => setBankName(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#EE4D2D]"
                  />
                  <input 
                    type="text" required placeholder="เลขที่บัญชี" 
                    value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#EE4D2D]"
                  />
                </div>
                
                <div className="flex flex-col gap-3">
                  <button type="submit" disabled={balance < 50} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black shadow-lg disabled:opacity-50">
                    ใช่เลย ถอนโลด
                  </button>
                  <button type="button" onClick={() => setIsWithdrawModalOpen(false)} className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl font-black">
                    ไว้ก่อน
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-4">
                <div className="text-6xl mb-4">✨</div>
                <h3 className="text-xl font-black text-gray-900 mb-2">เรียบร้อย! ล็อกคิวโอนให้แล้ว</h3>
                <p className="text-sm text-gray-500 font-bold">
                  เงินกำลังเดินทางเข้าบัญชีนายช่าง<br/>
                  เช็คสลิปในแชทได้ตอนแอดมินโอนเสร็จ
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

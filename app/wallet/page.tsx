'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function WalletPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🌟 State สำหรับ Modal เติมเงิน
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number | ''>('');
  const [isUploading, setIsUploading] = useState(false);
  const [slipUrl, setSlipUrl] = useState<string | null>(null);

  useEffect(() => {
    const initWallet = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth/login');
        return;
      }
      setCurrentUser(session.user);
      fetchWalletData(session.user.id);
    };
    initWallet();
  }, [router, supabase]);

  const fetchWalletData = async (userId: string) => {
    setLoading(true);
    // 1. ดึงข้อมูลกระเป๋า
    const { data: walletData } = await supabase
      .from('wallets')
      .select('*')
      .eq('owner_id', userId)
      .eq('kind', 'user')
      .single();
    
    if (walletData) {
      setWallet(walletData);
      
      // 2. ดึงประวัติธุรกรรม (หัก GP, เติมเงิน, ถอนเงิน)
      const { data: txData } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', walletData.id)
        .order('created_at', { ascending: false })
        .limit(20);
        
      if (txData) setTransactions(txData);
    }
    setLoading(false);
  };

  // 📸 ฟังก์ชันอัปโหลดรูปสลิปตอนเติมเงิน
  const handleSlipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `topup_${currentUser.id}_${Date.now()}.${fileExt}`;
    const filePath = `topups/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('slips-pending').upload(filePath, file);

    if (uploadError) {
      alert('อัปโหลดรูปภาพไม่สำเร็จ: ' + uploadError.message);
    } else {
      const { data: { publicUrl } } = supabase.storage.from('slips-pending').getPublicUrl(filePath);
      setSlipUrl(publicUrl);
    }
    setIsUploading(false);
  };

  // 💸 ฟังก์ชันส่งคำขอเติมเครดิต
  const handleConfirmTopUp = async () => {
    if (!topUpAmount || Number(topUpAmount) < 20) {
      return alert('กรุณาระบุยอดเงินที่ต้องการเติม (ขั้นต่ำ 20 บาท)');
    }
    if (!slipUrl) {
      return alert('กรุณาแนบสลิปการโอนเงินเพื่อยืนยันค่ะ');
    }

    setIsUploading(true);
    // สร้าง Request ไปที่ระบบหลังบ้านรอแอดมินอนุมัติ (หรือเข้าตารางตรวจสอบสลิป)
    const { error } = await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        type: 'deposit_request',
        amount_satang: Number(topUpAmount) * 100,
        status: 'pending',
        metadata: { slip_url: slipUrl } // เก็บ URL สลิปไว้ใน metadata
      });

    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } else {
      alert('✅ ส่งคำขอเติมเครดิตเรียบร้อย! กรุณารอระบบตรวจสอบสักครู่นะคะ');
      setIsTopUpModalOpen(false);
      setTopUpAmount('');
      setSlipUrl(null);
      fetchWalletData(currentUser.id);
    }
    setIsUploading(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center font-sans">
      <div className="w-12 h-12 border-4 border-[#EE4D2D] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-24 md:pb-10 relative">
      <div className="w-full lg:max-w-4xl xl:max-w-5xl bg-[#F8FAFC] min-h-screen relative flex flex-col md:shadow-2xl overflow-x-hidden md:border-x border-gray-200/50">
        
        {/* 🟠 Header Wallet (ปรับสีเป็นโทนจงเจริญ) */}
        <header className="bg-gradient-to-br from-[#EE4D2D] via-[#FF6243] to-[#FF8A65] px-6 pt-12 pb-10 rounded-b-[2.5rem] md:rounded-b-[3.5rem] text-white shadow-xl relative z-20 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-[80px] -mr-20 -mt-20"></div>
          
          <div className="flex items-center gap-4 max-w-2xl mx-auto relative z-10">
            <button onClick={() => router.back()} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 active:scale-95 transition-all backdrop-blur-md">←</button>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight drop-shadow-sm">JJWallet</h1>
              <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest mt-0.5">กระเป๋าเครดิตจงเจริญ</p>
            </div>
          </div>

          <div className="max-w-2xl mx-auto mt-8 text-center relative z-10">
            <p className="text-xs text-white/80 font-bold mb-1">เครดิตค้ำประกันคงเหลือ</p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-3xl font-bold text-white/90 drop-shadow-sm">฿</span>
              <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-white drop-shadow-md">
                {((wallet?.balance_satang || 0) / 100).toLocaleString('th-TH')}
              </h1>
            </div>
            {(wallet?.balance_satang / 100) < 20 && (
              <div className="mt-3 inline-block bg-white/20 border border-white/40 text-white px-4 py-1.5 rounded-full text-[10px] font-black tracking-wider animate-pulse shadow-sm backdrop-blur-sm">
                ⚠️ เครดิตต่ำกว่า 20 บาท (ไม่สามารถรับงานได้)
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-5 md:px-10 -mt-6 relative z-30 w-full max-w-2xl mx-auto space-y-6">
          
          {/* Action Buttons (ปรับให้สีโดดเด่นเข้ากับฉากหลัง) */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setIsTopUpModalOpen(true)}
              className="bg-white text-[#EE4D2D] p-5 rounded-[2rem] shadow-sm flex flex-col items-center gap-2 hover:border-[#EE4D2D] hover:shadow-md active:scale-95 transition-all border border-orange-100 group"
            >
              <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">💳</div>
              <span className="font-black text-sm">เติมเครดิต</span>
            </button>
            <button 
              onClick={() => alert('ฟีเจอร์ถอนเงินกำลังพัฒนาค่ะ')}
              className="bg-white text-gray-600 p-5 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center gap-2 hover:border-gray-300 active:scale-95 transition-all group"
            >
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🏦</div>
              <span className="font-black text-sm">ถอนเงิน</span>
            </button>
          </div>

          {/* Transaction History (Ledger) */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4 flex items-center justify-between">
              ประวัติทำรายการ <span>📝</span>
            </h2>
            
            {transactions.length === 0 ? (
              <div className="text-center py-10 opacity-50 grayscale">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-xs font-bold text-gray-500">ยังไม่มีประวัติทำรายการ</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        tx.type === 'deposit_request' ? 'bg-orange-50 text-[#EE4D2D]' :
                        tx.amount_satang < 0 ? 'bg-red-50 text-red-500' : 'bg-[#00C300]/10 text-[#00C300]'
                      }`}>
                        {tx.type === 'deposit_request' ? '⏳' : tx.amount_satang < 0 ? '🔻' : '🟢'}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-800">
                          {tx.type === 'deposit_request' ? 'เติมเครดิต (รอตรวจสอบ)' : 
                           tx.amount_satang < 0 ? 'หักค่า GP แพลตฟอร์ม' : 'ได้รับเครดิต'}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 mt-0.5">
                          {new Date(tx.created_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })} น.
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-base font-black ${tx.type === 'deposit_request' ? 'text-[#EE4D2D]' : tx.amount_satang < 0 ? 'text-gray-800' : 'text-[#00C300]'}`}>
                        {tx.amount_satang > 0 ? '+' : ''}{(tx.amount_satang / 100).toLocaleString()} ฿
                      </p>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                        tx.status === 'pending' ? 'bg-orange-100 text-[#EE4D2D]' : 
                        tx.status === 'completed' ? 'bg-[#00C300]/20 text-[#00C300]' : 'bg-red-100 text-red-600'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* 🌟 Modal เติมเครดิต */}
        {isTopUpModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-xl rounded-t-[2.5rem] p-8 max-h-[90vh] overflow-y-auto pb-safe shadow-2xl relative flex flex-col">
              <div className="flex justify-between items-center mb-6 shrink-0 sticky top-0 bg-white z-10 py-2">
                <div>
                  <h2 className="text-xl font-black text-gray-800">เติมเครดิต 💳</h2>
                  <p className="text-[10px] text-gray-500 font-bold mt-0.5">สำหรับใช้รับงานในระบบจงเจริญ</p>
                </div>
                <button onClick={() => { setIsTopUpModalOpen(false); setSlipUrl(null); }} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 font-bold active:scale-95">✕</button>
              </div>

              <div className="space-y-5">
                {/* 1. ใส่จำนวนเงิน */}
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2 mb-1 block">ระบุจำนวนเงินที่ต้องการเติม (บาท)</label>
                  <input 
                    type="number" 
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(Number(e.target.value))}
                    placeholder="เช่น 100, 300, 500"
                    className="w-full bg-gray-50 border border-gray-200 rounded-[1.5rem] px-5 py-4 text-xl font-black focus:bg-white focus:border-[#EE4D2D] outline-none text-center text-[#EE4D2D] transition-colors"
                  />
                  <div className="flex gap-2 mt-2">
                    {[100, 300, 500].map(amt => (
                      <button key={amt} onClick={() => setTopUpAmount(amt)} type="button" className="flex-1 bg-orange-50 border border-orange-100 py-2 rounded-xl text-xs font-bold text-[#EE4D2D] active:bg-orange-100 transition-colors">
                        +{amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. แสดง QR Code หรือ บัญชีบริษัท */}
                <div className="bg-blue-50 border border-blue-100 rounded-[1.5rem] p-5 text-center">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">สแกนเพื่อโอนเงินเข้าบริษัท</p>
                  <div className="w-40 h-40 bg-white mx-auto rounded-2xl shadow-sm border border-gray-200 flex items-center justify-center mb-3">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" alt="PromptPay QR" className="w-32 h-32 opacity-50" />
                  </div>
                  <p className="text-sm font-black text-gray-800">บจก. จงเจริญ ซุปเปอร์แอป</p>
                  <p className="text-xs font-bold text-gray-500">พร้อมเพย์: 099-XXX-XXXX</p>
                </div>

                {/* 3. แนบสลิป */}
                <div>
                  {slipUrl ? (
                    <div className="relative">
                      <img src={slipUrl} alt="Slip" className="w-full h-40 object-cover rounded-[1.5rem] border border-gray-200 shadow-sm" />
                      <button onClick={() => setSlipUrl(null)} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full text-xs shadow-md hover:scale-105 transition-transform">✕</button>
                    </div>
                  ) : (
                    <label className={`w-full border-2 border-dashed rounded-[1.5rem] p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${isUploading ? 'bg-gray-50 border-gray-300' : 'bg-white border-orange-200 hover:bg-orange-50 hover:border-[#EE4D2D]'}`}>
                      {isUploading ? (
                        <div className="w-8 h-8 border-4 border-[#EE4D2D] border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <span className="text-3xl mb-2">📸</span>
                          <span className="text-sm font-black text-[#EE4D2D]">กดเพื่อแนบสลิปการโอนเงิน</span>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handleSlipUpload} disabled={isUploading} />
                    </label>
                  )}
                </div>

                <button 
                  onClick={handleConfirmTopUp}
                  disabled={isUploading || !topUpAmount || !slipUrl}
                  className="w-full bg-[#EE4D2D] text-white font-black py-4 rounded-[1.5rem] text-base shadow-lg shadow-orange-200 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                >
                  ส่งคำขอเติมเครดิต 🚀
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

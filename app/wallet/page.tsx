'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function WalletPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [stats, setStats] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const fetchWalletData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return router.push('/auth/login');

    // 1. ดึงสถิติยอดเงินรวม
    const { data: statsData } = await supabase.rpc('get_provider_wallet_stats');
    if (statsData) setStats(statsData);

    // 2. ดึงประวัติการถอนเงิน
    const { data: historyData } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('provider_id', session.user.id)
      .order('created_at', { ascending: false });
    
    if (historyData) setWithdrawals(historyData);
    setLoading(false);
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) return alert('กรุณาระบุจำนวนเงินให้ถูกต้องค่ะ');
    if (amount > (stats?.current_balance || 0)) return alert('ยอดเงินถอนได้ไม่เพียงพอค่ะ');

    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc('request_withdrawal', { p_amount: amount });
      if (error) throw error;
      
      alert('แจ้งถอนเงินสำเร็จ! แอดมินจะโอนให้ภายใน 24 ชม. ค่ะ 🚀');
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      fetchWalletData(); // รีเฟรชข้อมูลใหม่
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F4F6F8] font-bold text-gray-400">กำลังโหลดกระเป๋าเงิน...</div>;

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-24">
      <div className="w-full max-w-2xl flex flex-col relative">
        
        {/* Header บัตรกระเป๋าเงิน */}
        <div className="bg-gradient-to-br from-[#1DA1F2] to-[#0077C0] rounded-[2.5rem] p-6 pt-10 pb-10 shadow-lg shadow-blue-200 relative z-20 m-3 mt-4 flex flex-col overflow-hidden">
          {/* ลายเส้นตกแต่งบัตร */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-black opacity-5 rounded-full translate-y-1/3 -translate-x-1/4"></div>

          <div className="relative z-10 flex justify-between items-start mb-6">
            <Link href="/profile" className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 text-white text-xl active:scale-95 transition-transform">←</Link>
            <div className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/30 text-white text-[11px] font-black tracking-widest uppercase">
              Wallet
            </div>
          </div>

          <div className="relative z-10">
            <p className="text-blue-100 text-[11px] font-bold uppercase tracking-wider mb-1">ยอดเงินที่ถอนได้ (บาท)</p>
            <h1 className="text-5xl font-black text-white tracking-tighter mb-4 drop-shadow-sm">
              ฿{stats?.current_balance?.toLocaleString('th-TH') || '0'}
            </h1>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowWithdrawModal(true)}
                disabled={stats?.current_balance <= 0}
                className="bg-white text-blue-600 px-6 py-3 rounded-2xl text-[13px] font-black shadow-md hover:bg-blue-50 active:scale-95 transition-all disabled:opacity-50 disabled:bg-white/50 disabled:text-white flex items-center gap-2"
              >
                💸 แจ้งถอนเงิน
              </button>
            </div>
          </div>
        </div>

        {/* สรุปยอดรวม (Stats) */}
        <div className="px-5 grid grid-cols-2 gap-3 -mt-4 relative z-10">
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
            <span className="text-xl mb-1">📈</span>
            <p className="text-[10px] font-bold text-gray-400 uppercase">รายได้รวมสะสม</p>
            <p className="text-base font-black text-gray-800">฿{stats?.total_earnings?.toLocaleString('th-TH') || '0'}</p>
          </div>
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
            <span className="text-xl mb-1">⏳</span>
            <p className="text-[10px] font-bold text-gray-400 uppercase">รอแอดมินโอน</p>
            <p className="text-base font-black text-orange-500">฿{stats?.pending_withdraw?.toLocaleString('th-TH') || '0'}</p>
          </div>
        </div>

        {/* ประวัติการถอนเงิน */}
        <main className="px-5 mt-6 space-y-4">
          <h2 className="text-sm font-black text-gray-800">ประวัติการถอนเงิน 📝</h2>
          
          {withdrawals.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-sm">
              <div className="text-4xl mb-3 opacity-50">🧾</div>
              <p className="text-xs font-bold text-gray-400">ยังไม่มีประวัติการแจ้งถอนเงินค่ะ</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-3 shadow-sm border border-gray-100">
              {withdrawals.map((w, idx) => (
                <div key={w.id} className={`p-4 flex items-center justify-between ${idx !== withdrawals.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${w.status === 'completed' ? 'bg-emerald-50 text-emerald-500' : w.status === 'pending' ? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-500'}`}>
                      {w.status === 'completed' ? '✅' : w.status === 'pending' ? '⏳' : '❌'}
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-800">
                        {w.status === 'completed' ? 'ถอนเงินสำเร็จ' : w.status === 'pending' ? 'รอดำเนินการ' : 'ถูกปฏิเสธ'}
                      </p>
                      <p className="text-[9px] font-bold text-gray-400 mt-0.5">
                        {new Date(w.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-black text-gray-900">-฿{w.amount.toLocaleString('th-TH')}</p>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Modal แจ้งถอนเงิน */}
        {showWithdrawModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-2xl animate-fade-in-up">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-gray-800">แจ้งถอนเงินเข้าบัญชี</h3>
                <button onClick={() => setShowWithdrawModal(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold active:scale-95">✕</button>
              </div>

              <div className="bg-blue-50 p-4 rounded-2xl mb-6 border border-blue-100">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">ยอดเงินที่ถอนได้สูงสุด</p>
                <p className="text-2xl font-black text-blue-700">฿{stats?.current_balance?.toLocaleString('th-TH')}</p>
              </div>

              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <label className="text-xs font-black text-gray-600 ml-1 mb-2 block">จำนวนเงินที่ต้องการถอน (บาท)</label>
                  <input
                    type="number"
                    required
                    max={stats?.current_balance}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="ระบุจำนวนเงิน..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-xl font-black focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
                
                <p className="text-[10px] font-bold text-gray-400 text-center">
                  * เงินจะถูกโอนเข้าบัญชีที่ลงทะเบียนไว้ในหน้าโปรไฟล์ ภายใน 24 ชม.
                </p>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm active:scale-95 transition-transform disabled:opacity-50 shadow-lg shadow-blue-200"
                >
                  {isSubmitting ? 'กำลังดำเนินการ...' : 'ยืนยันแจ้งถอนเงิน 💸'}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function AdminWithdrawalsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingWithdrawals();
  }, [supabase, router]);

  const fetchPendingWithdrawals = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return router.push('/auth/login');

    // 1. ตรวจสอบสิทธิ์แอดมิน
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single();
    if (!profile?.is_admin) {
      alert('เฉพาะผู้ดูแลระบบเท่านั้นค่ะ');
      return router.push('/');
    }

    // 2. ดึงรายการขอถอนเงินที่รออนุมัติ
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select(`
        *,
        wallets (
          owner_id,
          profiles (full_name, phone)
        )
      `)
      .eq('type', 'withdraw_request')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (!error && data) setPendingRequests(data);
    setLoading(false);
  };

  // ✅ ฟังก์ชันแอดมินกดโอนเงินแล้ว
  const handleApprove = async (txId: string, ownerId: string, amount: number) => {
    if (!confirm('บีสามยืนยันว่า "โอนเงินเข้าบัญชีช่าง" เรียบร้อยแล้วใช่ไหมคะ?')) return;
    setActionLoading(txId);
    
    try {
      // 1. อัปเดตสถานะเป็น completed
      const { error } = await supabase
        .from('wallet_transactions')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', txId);
        
      if (error) throw error;
      
      // 2. เด้งแจ้งเตือนหาช่าง (Copywriting วัยรุ่นประแส 💸)
      await supabase.from('notifications').insert({
        user_id: ownerId,
        type: 'system',
        title: 'ตังค์เข้าแล้วนายช่าง! 🎉',
        body: `฿${amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ถึงบัญชีเรียบร้อย เอาไปใช้โลด เช็คแอปธนาคารได้เลย ✅`,
      });

      alert('บันทึกและแจ้งเตือนช่างเรียบร้อยค่ะ! 💸');
      setPendingRequests(prev => prev.filter(req => req.id !== txId));
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ❌ ฟังก์ชันปฏิเสธการถอน (กรณีเลขบัญชีผิด)
  const handleReject = async (txId: string, ownerId: string, amount: number, walletId: string) => {
    const reason = prompt('ระบุเหตุผลที่ตีกลับ (เช่น เลขบัญชีผิด, ชื่อไม่ตรง):');
    if (reason === null) return; 
    
    setActionLoading(txId);
    try {
      // 1. ตีกลับสถานะเป็น rejected
      const { error } = await supabase
        .from('wallet_transactions')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', txId);
        
      if (error) throw error;

      // 2. คืนเงินกลับเข้า Wallet ช่าง (ใช้ RPC คืนเงิน หรือบวกกลับตรงๆ)
      // * สมมติว่าสร้างธุรกรรมตีกลับเงิน *
      await supabase.from('wallet_transactions').insert({
        wallet_id: walletId,
        type: 'refund',
        amount_satang: amount * 100, // ใส่ยอดบวกกลับ
        status: 'completed'
      });
      
      // 3. แจ้งเตือนช่าง
      await supabase.from('notifications').insert({
        user_id: ownerId,
        type: 'system',
        title: 'การถอนเงินถูกตีกลับ ❌',
        body: `ระบบคืนเงินเข้ากระเป๋าแล้วเนื่องจาก: ${reason || 'ข้อมูลธนาคารไม่ถูกต้อง'} กรุณาตรวจสอบและทำรายการใหม่ค่ะ`,
      });

      alert('ตีกลับรายการและคืนเงินเรียบร้อยค่ะ');
      setPendingRequests(prev => prev.filter(req => req.id !== txId));
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans pb-20">
      
      {/* 🌟 Header */}
      <div className="bg-gray-900 p-8 pt-12 rounded-b-[3rem] shadow-lg text-white relative">
        <Link href="/admin" className="absolute top-6 left-6 text-gray-400 hover:text-white text-2xl transition active:scale-95">←</Link>
        <h1 className="text-3xl font-black tracking-tight mt-4 flex items-center gap-2">
          <span>💸</span> ศูนย์จัดการการถอนเงิน
        </h1>
        <p className="text-sm font-medium mt-2 text-gray-400">
          อนุมัติการจ่ายเงินให้ช่าง (Withdrawal Approvals)
        </p>
      </div>

      <main className="p-6 -mt-6 relative z-10 max-w-5xl mx-auto">
        <div className="flex justify-between items-end mb-4 px-2">
          <h2 className="text-lg font-black text-gray-800">
            รอโอนเงิน <span className="text-[#EE4D2D] ml-1">{pendingRequests.length}</span> รายการ
          </h2>
          <button onClick={fetchPendingWithdrawals} className="text-xs font-bold text-gray-500 hover:text-gray-900">
            🔄 รีเฟรช
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-[2rem] p-10 text-center shadow-sm border border-gray-100">
            <p className="text-gray-400 font-bold animate-pulse">กำลังโหลดข้อมูล...</p>
          </div>
        ) : pendingRequests.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-12 text-center shadow-sm border border-gray-100">
            <div className="text-6xl mb-4 grayscale opacity-30">✨</div>
            <p className="font-black text-gray-800 text-lg">ไม่มีรายการค้างโอนค่ะ</p>
            <p className="text-sm text-gray-400 font-medium mt-1">แอดมินพักผ่อนได้เลย ☕</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingRequests.map(req => {
              const amount = req.amount_satang ? (req.amount_satang / 100) : (req.amount || 0);
              const owner = req.wallets?.profiles;

              return (
                <div key={req.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-200 shadow-sm flex flex-col">
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-2xl">💰</div>
                      <div>
                        <h3 className="font-black text-gray-900 text-xl">฿{amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</h3>
                        <p className="text-[10px] text-gray-400 font-bold">
                          {new Date(req.created_at).toLocaleString('th-TH')}
                        </p>
                      </div>
                    </div>
                    <span className="bg-amber-50 text-amber-600 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                      รอโอน
                    </span>
                  </div>

                  {/* ข้อมูลการโอน */}
                  <div className="bg-gray-50 p-4 rounded-2xl mb-6 border border-gray-100 space-y-2">
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">🏦 ข้อมูลบัญชีรับเงิน</p>
                      <p className="text-sm font-black text-blue-700">{req.bank_name || 'ไม่ระบุธนาคาร'}</p>
                      <p className="text-lg font-black text-gray-900 tracking-widest">{req.account_no || 'ไม่ระบุเลขบัญชี'}</p>
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-sm font-bold text-gray-800">👤 {owner?.full_name || 'ไม่ทราบชื่อ'}</p>
                      <p className="text-xs text-gray-500">📞 {owner?.phone || 'ไม่ระบุเบอร์'}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-auto">
                    <button 
                      onClick={() => handleReject(req.id, req.wallets?.owner_id, amount, req.wallet_id)}
                      disabled={actionLoading === req.id}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-4 rounded-2xl font-black text-xs transition-colors disabled:opacity-50 border border-red-100"
                    >
                      ❌ ตีกลับรายการ
                    </button>
                    <button 
                      onClick={() => handleApprove(req.id, req.wallets?.owner_id, amount)}
                      disabled={actionLoading === req.id}
                      className="flex-[1.5] bg-[#EE4D2D] hover:bg-[#d64528] text-white py-4 rounded-2xl font-black text-xs shadow-md transition-colors disabled:opacity-50"
                    >
                      {actionLoading === req.id ? 'กำลังบันทึก...' : '✅ โอนเงินเรียบร้อย'}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

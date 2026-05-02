'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AdminDashboardPage() {
  const supabase = createClient();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWithdrawals = async () => {
    setLoading(true);
    // ดึงรายการถอนเงินที่สถานะ 'hold' (รอโอน)
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*, worker:profiles!worker_id(first_name, full_name, avatar_url)')
      .eq('status', 'hold')
      .order('requested_at', { ascending: true });

    if (!error && data) setWithdrawals(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const handleMarkAsPaid = async (id: string) => {
    if (!confirm('ยืนยันว่าคุณได้โอนเงินเข้าบัญชีธนาคารของช่างเรียบร้อยแล้วใช่ไหมคะ?')) return;
    
    // อัปเดตสถานะเป็นโอนแล้ว (paid)
    const { error } = await supabase
      .from('withdrawals')
      .update({ status: 'paid', settled_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      alert('บันทึกการโอนเงินเรียบร้อยค่ะ! ✅');
      fetchWithdrawals();
    } else {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans pb-24 flex justify-center">
      <div className="w-full max-w-4xl p-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 shadow-xl text-white mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Admin Dashboard 👑</h1>
            <p className="text-sm text-gray-400 mt-1 font-bold">จัดการระบบการเงินและอนุมัติการถอนเงิน</p>
          </div>
          <div className="bg-white/10 px-5 py-3 rounded-2xl border border-white/20 backdrop-blur-md text-center">
            <p className="text-[10px] uppercase font-black tracking-widest text-gray-300">รอดำเนินการ</p>
            <p className="text-3xl font-black text-emerald-400">{withdrawals.length}</p>
          </div>
        </div>

        {/* ตารางรายการรอโอนเงิน */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
            <h2 className="font-black text-gray-800">📥 รายการขอถอนเงินเข้าธนาคาร (Withdrawals)</h2>
          </div>
          
          {loading ? (
            <div className="p-10 text-center font-bold text-gray-400 animate-pulse">กำลังโหลดข้อมูล...</div>
          ) : withdrawals.length === 0 ? (
            <div className="p-16 text-center">
              <div className="text-5xl mb-4 grayscale opacity-50">💸</div>
              <p className="font-black text-gray-800 text-lg">ไม่มีรายการรอโอนเงินค่ะ</p>
              <p className="text-xs text-gray-400 font-bold mt-1">แอดมินพักผ่อนได้เลย เยี่ยมมาก!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {withdrawals.map((w) => (
                <div key={w.id} className="p-6 flex items-center justify-between hover:bg-blue-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden border border-gray-200 shrink-0">
                      {w.worker?.avatar_url ? (
                        <img src={w.worker.avatar_url} alt="worker" className="w-full h-full object-cover" />
                      ) : <div className="w-full h-full flex items-center justify-center text-xl">👤</div>}
                    </div>
                    <div>
                      <p className="font-black text-gray-900">{w.worker?.full_name || 'ผู้ใช้ไม่ระบุชื่อ'}</p>
                      <div className="flex gap-3 mt-1">
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                          ธนาคาร: {w.bank_account?.bank_name || 'ไม่ได้ระบุ'}
                        </span>
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                          เลขที่: {w.bank_account?.account_number || 'ไม่ได้ระบุ'}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-medium mt-1.5">
                        แจ้งถอนเมื่อ: {new Date(w.requested_at).toLocaleString('th-TH')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-0.5">ยอดโอน (บาท)</p>
                      <p className="text-2xl font-black text-gray-900">{(w.amount_satang / 100).toLocaleString()}</p>
                    </div>
                    <button 
                      onClick={() => handleMarkAsPaid(w.id)}
                      className="bg-gray-900 text-white px-6 py-3 rounded-xl text-xs font-black shadow-lg hover:bg-gray-800 active:scale-95 transition-all"
                    >
                      อนุมัติโอนแล้ว
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

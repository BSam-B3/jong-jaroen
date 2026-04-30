'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function BankProfilePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bankData, setBankData] = useState({
    bank_name: '',
    account_number: '',
    account_name: ''
  });

  useEffect(() => {
    const loadBankData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('bank_name, account_number, account_name')
        .eq('id', user.id)
        .single();

      if (data) setBankData(data);
      setLoading(false);
    };

    loadBankData();
  }, [supabase, router]);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('profiles')
      .update(bankData)
      .eq('id', user?.id);

    if (error) {
      alert('บันทึกข้อมูลไม่สำเร็จค่ะ: ' + error.message);
    } else {
      alert('บันทึกข้อมูลธนาคารเรียบร้อยแล้วค่ะ');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-10 text-center font-bold">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto space-y-6">
        <button onClick={() => router.back()} className="text-gray-500 font-bold text-sm">← กลับ</button>
        <h1 className="text-2xl font-black text-gray-900">ข้อมูลบัญชีธนาคาร</h1>
        <p className="text-xs text-gray-500">ใช้สำหรับรับเงินค่าจ้างจากแพลตฟอร์มค่ะ</p>

        <div className="bg-white p-6 rounded-3xl shadow-sm space-y-4">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ธนาคาร</label>
            <input
              type="text"
              value={bankData.bank_name}
              onChange={(e) => setBankData({...bankData, bank_name: e.target.value})}
              placeholder="เช่น กสิกรไทย, ไทยพาณิชย์"
              className="w-full mt-1 p-3 bg-gray-50 rounded-xl text-sm border-none focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">เลขที่บัญชี</label>
            <input
              type="text"
              value={bankData.account_number}
              onChange={(e) => setBankData({...bankData, account_number: e.target.value})}
              placeholder="000-0-00000-0"
              className="w-full mt-1 p-3 bg-gray-50 rounded-xl text-sm border-none focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ชื่อบัญชี</label>
            <input
              type="text"
              value={bankData.account_name}
              onChange={(e) => setBankData({...bankData, account_name: e.target.value})}
              placeholder="ชื่อ-นามสกุล (ภาษาไทย)"
              className="w-full mt-1 p-3 bg-gray-50 rounded-xl text-sm border-none focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all disabled:opacity-50"
        >
          {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
        </button>
      </div>
    </div>
  );
}

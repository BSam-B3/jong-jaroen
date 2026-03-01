'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAIL = 'surapong3331@gmail.com';

interface KYCProfile {
  id: string;
  full_name: string;
  phone: string;
  location: string;
  kyc_status: string;
  id_card_url: string | null;
  selfie_with_id_url: string | null;
  bank_account_number: string | null;
  bank_name: string | null;
  created_at: string;
  email?: string;
}

export default function AdminKYCPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<KYCProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push('/dashboard');
        return;
      }
      loadProfiles();
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const loadProfiles = async () => {
    setLoading(true);
    const query = supabase
      .from('profiles')
      .select('id,full_name,phone,location,kyc_status,id_card_url,selfie_with_id_url,bank_account_number,bank_name,created_at')
      .order('created_at', { ascending: false });

    if (filter !== 'all') query.eq('kyc_status', filter);

    const { data } = await query;
    setProfiles((data || []) as KYCProfile[]);
    setLoading(false);
  };

  useEffect(() => { loadProfiles(); }, [filter]);

  const updateKYC = async (userId: string, status: 'approved' | 'rejected') => {
    setUpdating(userId);
    const { error } = await supabase.from('profiles').update({
      kyc_status: status,
      is_verified: status === 'approved',
    }).eq('id', userId);

    if (!error) {
      setMsg(`✅ ${status === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'} KYC สำเร็จ`);
      setProfiles(prev => prev.filter(p => p.id !== userId));
      setTimeout(() => setMsg(''), 3000);
    }
    setUpdating(null);
  };

  const statusColor = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    none: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-4 py-3 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">🔐 Admin: KYC Review</h1>
            <p className="text-blue-200 text-xs">จงเจริญ Dashboard</p>
          </div>
          <button onClick={() => router.push('/dashboard')} className="text-blue-200 hover:text-white text-sm">← ออก</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-5">
        {msg && <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 mb-4 text-sm font-medium">{msg}</div>}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {(['pending','approved','rejected','all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex-shrink-0 ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
              {f === 'pending' ? '⏳ รอตรวจ' : f === 'approved' ? '✅ อนุมัติแล้ว' : f === 'rejected' ? '❌ ปฏิเสธแล้ว' : '📋 ทั้งหมด'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-10"><div className="text-3xl animate-spin">⏳</div></div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl shadow-sm">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-gray-500">ไม่มีรายการใน filter นี้</p>
          </div>
        ) : (
          <div className="space-y-4">
            {profiles.map(p => (
              <div key={p.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-5 pt-4 pb-3 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-800">{p.full_name}</h3>
                      <p className="text-xs text-gray-500">📞 {p.phone || '—'} | 📍 {p.location || '—'}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[p.kyc_status as keyof typeof statusColor] || statusColor.none}`}>
                      {p.kyc_status}
                    </span>
                  </div>
                </div>

                {/* Bank Info */}
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-1">🏦 ข้อมูลธนาคาร</p>
                  <p className="text-sm text-gray-800">
                    {p.bank_name || '—'}: <span className="font-mono font-bold">{p.bank_account_number || '—'}</span>
                  </p>
                </div>

                {/* ID Card Images */}
                <div className="px-5 py-4">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">🪪 รูปบัตรประชาชน</p>
                      {p.id_card_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.id_card_url} alt="ID Card"
                          className="w-full h-32 object-cover rounded-xl border border-gray-200 cursor-pointer hover:opacity-90"
                          onClick={() => window.open(p.id_card_url!, '_blank')} />
                      ) : <div className="w-full h-32 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-xs">ไม่มีรูป</div>}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">🤳 Selfie คู่บัตร</p>
                      {p.selfie_with_id_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.selfie_with_id_url} alt="Selfie"
                          className="w-full h-32 object-cover rounded-xl border border-gray-200 cursor-pointer hover:opacity-90"
                          onClick={() => window.open(p.selfie_with_id_url!, '_blank')} />
                      ) : <div className="w-full h-32 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-xs">ไม่มีรูป</div>}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {p.kyc_status === 'pending' && (
                    <div className="flex gap-3">
                      <button onClick={() => updateKYC(p.id, 'approved')} disabled={!!updating}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
                        {updating === p.id ? '⏳ กำลังอัพเดต...' : '✅ อนุมัติ KYC'}
                      </button>
                      <button onClick={() => updateKYC(p.id, 'rejected')} disabled={!!updating}
                        className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
                        ❌ ปฏิเสธ
                      </button>
                    </div>
                  )}
                  {p.kyc_status !== 'pending' && (
                    <p className="text-xs text-center text-gray-400">ตรวจสอบแล้วเมื่อ: สถานะ "{p.kyc_status}"</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

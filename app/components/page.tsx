'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CouponsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/auth/login');

      // ดึงข้อมูลตั๋วที่ตัวเองเป็นเจ้าของ
      const { data } = await supabase
        .from('reward_tickets')
        .select('*, job:jobs(title, budget)')
        .eq('owner_id', session.user.id)
        .order('created_at', { ascending: false });
      
      if (data) setTickets(data);
      setLoading(false);
    };
    fetchTickets();
  }, [router, supabase]);

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans pb-20">
      
      {/* 🌟 Header ปองเจริญ */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-8 pt-12 rounded-b-[3rem] shadow-lg text-white relative">
        <button onClick={() => router.back()} className="absolute top-6 left-6 text-2xl">←</button>
        <h1 className="text-4xl font-black tracking-tight mt-4">ปองเจริญ 🎟️</h1>
        <p className="text-sm font-bold mt-1 opacity-90 tracking-wider">ระบบตั๋วสมนาคุณ (Hidden Mode)</p>
      </div>

      {/* 🎟️ คลังตั๋ว */}
      <main className="p-6 -mt-6 relative z-10">
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 min-h-[300px]">
          <h2 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
            <span>🎁</span> ตั๋วลุ้นโชคของคุณ ({tickets.length} ใบ)
          </h2>
          
          {loading ? (
            <div className="text-center py-10 text-gray-400 font-bold animate-pulse">กำลังโหลดกรุสมบัติ...</div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-6xl mb-3 grayscale opacity-30">🎫</div>
              <p className="font-black text-gray-600 text-lg">ยังไม่มีตั๋วปองเจริญค่ะ</p>
              <p className="text-xs text-gray-400 mt-2 font-bold">
                *เงื่อนไขการรับตั๋วฟรี:<br/>
                ผู้จ้าง: งานยอด 3,000 บาทขึ้นไป<br/>
                ช่าง: งานยอด 5,000 บาทขึ้นไป
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map(t => (
                <div key={t.id} className="bg-gradient-to-br from-orange-50 to-amber-50 p-5 rounded-2xl border border-orange-100 flex justify-between items-center relative overflow-hidden shadow-sm">
                  {/* ลายน้ำตั๋ว */}
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-white opacity-40 rounded-full"></div>
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-r border-orange-100"></div>
                  
                  <div className="relative z-10 ml-2">
                    <p className="font-black text-orange-600 text-xl tracking-widest">{t.ticket_number}</p>
                    <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-wider">ได้รับจาก: {t.job?.title}</p>
                  </div>
                  <div className="relative z-10 text-right">
                    <span className="bg-white text-orange-500 text-[10px] font-black px-4 py-1.5 rounded-full shadow-sm border border-orange-100">
                      รอลุ้นรางวัล
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

    </div>
  );
}

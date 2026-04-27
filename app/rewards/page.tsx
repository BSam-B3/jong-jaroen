'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/app/components/BottomNav';

export default function RewardsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeCampaign, setActiveCampaign] = useState<any>(null);
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setIsLoading(false);
      return;
    }
    setCurrentUser(session.user);

    // 1. ดึงงวดที่กำลังเปิดอยู่ (Active)
    const { data: campaign } = await supabase
      .from('pong_campaigns')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (campaign) {
      setActiveCampaign(campaign);

      // 2. ดึงตั๋วของ User คนนี้ ในงวดนี้
      const { data: tickets } = await supabase
        .from('pong_tickets')
        .select('*')
        .eq('campaign_id', campaign.id)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
        
      if (tickets) setMyTickets(tickets);
    }
    setIsLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans">
      <div className="w-full max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-2xl border-x border-gray-100 pb-24">
        
        {/* Header Section */}
        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-b-[2.5rem] p-8 pt-12 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 text-9xl">🎁</div>
          <h1 className="text-white text-3xl font-black tracking-tight relative z-10">ปองเจริญ</h1>
          <p className="text-white/90 text-sm font-bold mt-2 relative z-10">ยิ่งจ้าง ยิ่งรับ ยิ่งมีสิทธิ์รวย!</p>
          
          <div className="mt-8 bg-white/20 backdrop-blur-md rounded-2xl p-5 border border-white/30 relative z-10">
            <h2 className="text-white text-xs font-black uppercase tracking-widest opacity-80 mb-1">งวดปัจจุบัน</h2>
            <div className="text-white text-lg font-bold">
              {activeCampaign ? activeCampaign.period_name : 'กำลังโหลดข้อมูลงวด...'}
            </div>
            <div className="mt-3 inline-block bg-white text-[#EE4D2D] px-4 py-1.5 rounded-full text-xs font-black shadow-sm">
              รางวัล: {activeCampaign ? activeCampaign.prize_detail : '-'}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 -mt-4 relative z-20">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-4">
              <div>
                <h3 className="font-black text-gray-800 text-lg">กระเป๋าตั๋วของฉัน</h3>
                <p className="text-[10px] font-bold text-gray-400 mt-1">รีเซ็ตโควต้าใหม่ทุกวันที่ 1 และ 16</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-[#EE4D2D]">{myTickets.length}</span>
                <span className="text-sm font-bold text-gray-400 ml-1">/ 8 ใบ</span>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-10 text-gray-400 font-bold animate-pulse">กำลังเปิดกระเป๋าตั๋ว...</div>
            ) : !currentUser ? (
              <div className="text-center py-10 text-gray-400 font-bold">กรุณาเข้าสู่ระบบเพื่อดูตั๋วของท่านค่ะ</div>
            ) : myTickets.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <div className="text-4xl mb-3">🎫</div>
                <h4 className="font-black text-gray-600 text-sm">ยังไม่มีตั๋วในงวดนี้</h4>
                <p className="text-xs text-gray-400 mt-1 font-medium">เรียกวิน หรือรับงาน เพื่อสะสมยอดรับตั๋วฟรีเลย!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myTickets.map((ticket, index) => (
                  <div key={ticket.id} className="bg-orange-50/50 border border-orange-100 rounded-[1.2rem] p-4 flex justify-between items-center hover:bg-orange-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#EE4D2D] text-white rounded-full flex items-center justify-center font-black text-sm shadow-md">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-xs font-black text-orange-400 tracking-widest uppercase mb-0.5">รหัสลุ้นโชค</div>
                        <div className="font-mono font-black text-lg text-gray-800 tracking-wider">
                          {ticket.ticket_code}
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] font-bold text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-100">
                      {new Date(ticket.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <BottomNav />
      </div>
    </div>
  );
}

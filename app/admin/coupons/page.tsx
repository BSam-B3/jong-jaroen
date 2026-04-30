'use client';

import { useState, useEffect, useMemo } from 'react';
// ✅ เปลี่ยนมาใช้กุญแจตัวใหม่
import { createClient } from '@/lib/supabase/client';

export default function AdminCouponsPage() {
  // ✅ สร้างตัวแปรเชื่อมต่อฐานข้อมูล
  const supabase = useMemo(() => createClient(), []);
  const [activeTab, setActiveTab] = useState<'lottery' | 'promo'>('lottery');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลแคมเปญปองเจริญ และนับจำนวนตั๋วที่มีคนได้ไป
  useEffect(() => {
    fetchCampaigns();
  }, [supabase]); // ใส่ dependency เพื่อความถูกต้อง

  async function fetchCampaigns() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pong_campaigns')
        .select(`
          *,
          winner:profiles!winner_user_id(full_name),
          pong_tickets(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  }

  // ฟังก์ชันสร้างแคมเปญใหม่ (กดแล้วสร้างลง DB เลย)
  const handleCreateCampaign = async () => {
    const periodName = prompt("ตั้งชื่อรอบรางวัล เช่น 'รอบ 16 พ.ค. 2026'");
    if (!periodName) return;
    
    const prize = prompt("ใส่ของรางวัล เช่น 'เครดิตจงเจริญ 2,000 บาท'");
    if (!prize) return;

    const { error } = await supabase.from('pong_campaigns').insert({
      period_name: periodName,
      prize_detail: prize,
      status: 'active'
    });

    if (error) {
      alert("สร้างแคมเปญไม่สำเร็จ: " + error.message);
    } else {
      alert("เปิดรอบรางวัลใหม่เรียบร้อยค่ะ!");
      fetchCampaigns();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter">ศูนย์การตลาด</h2>
          <p className="text-gray-400 mt-2 font-bold text-sm uppercase tracking-widest">Marketing & Pong Jaroen</p>
        </div>
        <button 
          onClick={handleCreateCampaign}
          className="bg-[#EE4D2D] hover:bg-orange-600 text-white px-6 py-3.5 rounded-[1.2rem] text-sm font-black shadow-lg shadow-orange-500/30 active:scale-95 transition-all flex items-center gap-2"
        >
          <span>+</span> เปิดรอบรางวัลใหม่
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 pb-px">
        <button 
          onClick={() => setActiveTab('lottery')}
          className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all border-b-4 ${
            activeTab === 'lottery' ? 'border-[#EE4D2D] text-[#EE4D2D]' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          🎁 ปองเจริญ (หวยใบเสร็จ)
        </button>
        <button 
          onClick={() => setActiveTab('promo')}
          className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all border-b-4 ${
            activeTab === 'promo' ? 'border-[#EE4D2D] text-[#EE4D2D]' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          🎟️ โค้ดส่วนลด
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden min-h-[400px]">
        
        {/* --- TAB 1: ปองเจริญ (หวยใบเสร็จ) --- */}
        {activeTab === 'lottery' && (
          <div>
            <div className="p-8 border-b border-gray-50 bg-orange-50/50 flex justify-between items-center">
              <div>
                <h3 className="font-black text-gray-800 text-lg tracking-tight">ระบบแจกรางวัล ปองเจริญ</h3>
                <p className="text-xs font-bold text-gray-500 mt-1">กระตุ้นยอดจ้างงานด้วยการแจกสิทธิ์ลุ้นโชค</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">รอบรางวัล</th>
                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">ของรางวัล</th>
                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">แจกตั๋วไปแล้ว</th>
                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">ผู้โชคดี</th>
                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-400 font-bold">กำลังโหลดข้อมูล...</td></tr>
                  ) : campaigns.length === 0 ? (
                     <tr><td colSpan={5} className="p-8 text-center text-gray-400 font-bold">ยังไม่มีแคมเปญ กดปุ่มด้านบนเพื่อสร้างได้เลยค่ะ</td></tr>
                  ) : campaigns.map(camp => (
                    <tr key={camp.id} className="hover:bg-orange-50/20 transition-colors group">
                      <td className="p-6 font-black text-sm text-gray-800">{camp.period_name}</td>
                      <td className="p-6 font-bold text-sm text-[#EE4D2D]">{camp.prize_detail}</td>
                      <td className="p-6 font-mono text-sm font-bold text-gray-600">
                        {camp.pong_tickets?.[0]?.count || 0} ใบ
                      </td>
                      <td className="p-6 text-xs font-bold text-gray-500">
                        {camp.winner?.full_name || <span className="text-orange-400 animate-pulse">⏳ รอสุ่มรางวัล</span>}
                      </td>
                      <td className="p-6 text-right">
                        {camp.status === 'active' ? (
                          <button className="bg-gradient-to-r from-orange-400 to-[#EE4D2D] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:scale-105 transition-all">
                            🎲 สุ่มผู้โชคดี
                          </button>
                        ) : (
                          <span className="bg-gray-100 text-gray-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                            ✅ แจกแล้ว
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- TAB 2: โค้ดส่วนลด (เตรียมไว้ก่อน) --- */}
        {activeTab === 'promo' && (
          <div className="p-20 text-center">
            <div className="text-5xl mb-4">🚧</div>
            <h3 className="font-black text-gray-800">กำลังพัฒนาระบบคูปอง</h3>
            <p className="text-gray-400 text-sm mt-2 font-bold">ระบบนี้จะเปิดใช้งานในเฟสถัดไปค่ะ</p>
          </div>
        )}

      </div>
    </div>
  );
}

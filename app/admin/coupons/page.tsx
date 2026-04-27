'use client';

import { useState } from 'react';

export default function AdminCouponsPage() {
  const [activeTab, setActiveTab] = useState<'promo' | 'lottery'>('lottery');

  // ข้อมูลจำลองสำหรับหน้าตา UI (เดี๋ยวเราค่อยเชื่อม Supabase ทีหลังค่ะ)
  const [promos] = useState([
    { id: 1, code: 'NEWBIE50', discount: 50, type: 'fixed', usage: 12, limit: 100, status: 'active', expires: '2026-12-31' },
    { id: 2, code: 'FREERIDE', discount: 20, type: 'percent', usage: 150, limit: 500, status: 'active', expires: '2026-05-01' },
  ]);

  const [lotteries] = useState([
    { id: 1, period: 'งวด 16 พฤษภาคม 2026', prize: 'พัดลม Hatari 16 นิ้ว', tickets_issued: 342, status: 'active', winner: null },
    { id: 2, period: 'งวด 1 พฤษภาคม 2026', prize: 'ข้าวสารหอมมะลิ 5 กก.', tickets_issued: 512, status: 'completed', winner: 'คุณสมชาย (ID: #892)' },
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter">ศูนย์การตลาด</h2>
          <p className="text-gray-400 mt-2 font-bold text-sm uppercase tracking-widest">Marketing & Pong Jaroen</p>
        </div>
        <button className="bg-[#EE4D2D] hover:bg-orange-600 text-white px-6 py-3.5 rounded-[1.2rem] text-sm font-black shadow-lg shadow-orange-500/30 active:scale-95 transition-all flex items-center gap-2">
          <span>+</span> สร้างแคมเปญใหม่
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
                <h3 className="font-black text-gray-800 text-lg tracking-tight">ระบบสุ่มรางวัล ปองเจริญ</h3>
                <p className="text-xs font-bold text-gray-500 mt-1">กระตุ้นยอดจ้างงานด้วยการแจกสิทธิ์ลุ้นโชค</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">งวดรางวัล</th>
                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">ของรางวัล</th>
                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">สิทธิ์ที่แจกไป (ตั๋ว)</th>
                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">ผู้โชคดี</th>
                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lotteries.map(lottery => (
                    <tr key={lottery.id} className="hover:bg-orange-50/20 transition-colors group">
                      <td className="p-6 font-black text-sm text-gray-800">{lottery.period}</td>
                      <td className="p-6 font-bold text-sm text-[#EE4D2D]">{lottery.prize}</td>
                      <td className="p-6 font-mono text-sm font-bold text-gray-600">{lottery.tickets_issued} ใบ</td>
                      <td className="p-6 text-xs font-bold text-gray-500">
                        {lottery.winner || <span className="text-orange-400 animate-pulse">⏳ รอสุ่มรางวัล</span>}
                      </td>
                      <td className="p-6 text-right">
                        {lottery.status === 'active' ? (
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

        {/* --- TAB 2: โค้ดส่วนลด --- */}
        {activeTab === 'promo' && (
          <div>
            <div className="p-8 border-b border-gray-50 flex justify-between items-center">
              <h3 className="font-black text-gray-800 text-lg tracking-tight">รายการโค้ดส่วนลด</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">โค้ด (Code)</th>
                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">ส่วนลด</th>
                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">การใช้งาน</th>
                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">หมดอายุ</th>
                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {promos.map(promo => (
                    <tr key={promo.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="p-6 font-mono font-black text-lg text-gray-800 tracking-wider">
                        <span className="bg-gray-100 border border-gray-200 px-3 py-1 rounded-lg">{promo.code}</span>
                      </td>
                      <td className="p-6 font-black text-sm text-[#EE4D2D]">
                        {promo.type === 'fixed' ? `฿${promo.discount}` : `${promo.discount}%`}
                      </td>
                      <td className="p-6">
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1 max-w-[100px]">
                          <div className="bg-[#EE4D2D] h-1.5 rounded-full" style={{ width: `${(promo.usage / promo.limit) * 100}%` }}></div>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400">{promo.usage} / {promo.limit} สิทธิ์</span>
                      </td>
                      <td className="p-6 text-xs font-bold text-gray-500">{promo.expires}</td>
                      <td className="p-6 text-right">
                        <button className="text-gray-400 hover:text-[#EE4D2D] text-[10px] font-black uppercase tracking-widest transition-colors">
                          แก้ไข / ระงับ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

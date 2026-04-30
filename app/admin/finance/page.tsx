'use client';

import { useEffect, useState, useMemo } from 'react';
// ✅ เปลี่ยนมาใช้กุญแจตัวใหม่
import { createClient } from '@/lib/supabase/client';

export default function AdminFinancePage() {
  // ✅ สร้างตัวแปรเชื่อมต่อฐานข้อมูลเตรียมไว้สำหรับอนาคต
  const supabase = useMemo(() => createClient(), []);
  const [stats, setStats] = useState({ totalRevenue: 0, pendingPayouts: 0, completedPayouts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ในอนาคตเราจะดึงข้อมูลจริงจากตาราง transactions ค่ะ
    // ตอนนี้เจมทำ Mock Data สวยๆ ให้ดูเป็นไอเดียก่อนนะคะ
    setTimeout(() => {
      setStats({ totalRevenue: 15450, pendingPayouts: 3200, completedPayouts: 45200 });
      setLoading(false);
    }, 800);
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div>
        <h2 className="text-4xl font-black text-gray-900 tracking-tighter">การเงิน & รายได้</h2>
        <p className="text-gray-400 mt-2 font-bold text-sm uppercase tracking-widest">Financial Oversight Center</p>
      </div>

      {/* สรุปยอดเงินแบบพรีเมียม */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="รายได้ค่า GP (3%)" amount={stats.totalRevenue} color="text-[#EE4D2D]" icon="📈" />
        <StatCard title="ยอดรอจ่ายช่าง" amount={stats.pendingPayouts} color="text-orange-500" icon="⏳" />
        <StatCard title="จ่ายออกแล้วทั้งหมด" amount={stats.completedPayouts} color="text-green-600" icon="💰" />
      </div>

      {/* ตารางรายการรอกดจ่ายเงิน */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
          <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest">รายการรอกดจ่ายเงิน (Payout Requests)</h3>
          <button className="bg-gray-900 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">Export CSV</button>
        </div>
        <div className="p-20 text-center">
           <div className="text-5xl mb-4">💳</div>
           <p className="font-black text-gray-300 italic">ยังไม่มีรายการเบิกถอนในขณะนี้ค่ะ</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, amount, color, icon }: any) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 relative overflow-hidden group hover:shadow-lg transition-all">
      <div className="absolute -right-4 -top-4 text-6xl opacity-5 group-hover:scale-110 transition-transform">{icon}</div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{title}</p>
      <p className={`text-4xl font-black ${color} tracking-tighter`}>฿{amount.toLocaleString()}</p>
    </div>
  );
}

"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function RiderBoardPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [inputCode, setInputCode] = useState('');

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*, shops(name)').order('created_at', { ascending: false });
    setOrders(data || []);
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleAcceptJob = async (id: string) => {
    await supabase.from('orders').update({ status: 'accepted' }).eq('id', id);
    fetchOrders();
  };

  const handleCompleteJob = async (order: any) => {
    if (inputCode === order.receive_code) {
      await supabase.from('orders').update({ status: 'delivered' }).eq('id', order.id);
      alert('ปิดงานสำเร็จ! รับเงินค่าส่งเข้า Wallet เรียบร้อยค่ะ');
      setInputCode('');
      fetchOrders();
    } else {
      alert('รหัสรับของไม่ถูกต้อง กรุณาเช็คกับลูกค้าอีกครั้งค่ะ');
    }
  };

  return (
    <div className="bg-[#0f172a] min-h-screen text-white p-4">
      <h1 className="text-2xl font-bold mb-6 text-[#deff9a]">บอร์ดงานไรเดอร์</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-[#1e293b] p-5 rounded-3xl border border-[#334155]">
            <div className="flex justify-between mb-2">
              <h2 className="font-bold">{order.shops?.name}</h2>
              <span className="text-[#deff9a]">฿{order.delivery_fee}</span>
            </div>
            <p className="text-sm text-gray-400 mb-4 italic">📍 {order.delivery_address}</p>

            {order.status === 'pending_rider' && (
              <button onClick={() => handleAcceptJob(order.id)} className="w-full bg-[#deff9a] text-black py-3 rounded-xl font-bold">รับงานนี้</button>
            )}

            {order.status === 'accepted' && (
              <div className="space-y-3">
                <input 
                  type="text" placeholder="ใส่รหัสรับของจากลูกค้า" 
                  className="w-full bg-black border border-[#deff9a]/30 rounded-xl p-3 text-center text-xl tracking-widest"
                  value={inputCode} onChange={(e) => setInputCode(e.target.value)}
                />
                <button onClick={() => handleCompleteJob(order)} className="w-full bg-white text-black py-3 rounded-xl font-bold">ยืนยันการส่งของ</button>
              </div>
            )}

            {order.status === 'delivered' && (
              <div className="text-center py-2 text-gray-500 font-bold border border-dashed border-gray-700 rounded-xl">ส่งสำเร็จแล้ว ✅</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

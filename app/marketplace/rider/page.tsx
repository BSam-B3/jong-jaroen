"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function RiderBoardPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. ดึงออเดอร์ที่ยังไม่มีไรเดอร์รับ (สถานะ pending_rider)
  const fetchAvailableOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*, shops(name)')
      .eq('status', 'pending_rider')
      .order('created_at', { ascending: false });

    if (!error) setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAvailableOrders();
  }, []);

  // 2. ฟังก์ชันกดรับงาน
  const handleAcceptJob = async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'accepted' }) // เปลี่ยนสถานะเป็นรับงานแล้ว
      .eq('id', orderId);

    if (error) {
      alert('ไม่สามารถรับงานได้ กรุณาลองใหม่อีกครั้ง');
    } else {
      alert('รับงานสำเร็จ! กรุณาไปรับสินค้าที่ร้านค้า');
      fetchAvailableOrders(); // รีเฟรชรายการงานที่เหลือ
    }
  };

  return (
    <div className="bg-[#0f172a] min-h-screen text-white p-4 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#deff9a]">บอร์ดงานไรเดอร์</h1>
        <button onClick={fetchAvailableOrders} className="text-sm bg-[#1e293b] px-3 py-1 rounded-lg border border-[#334155]">
          <i className="fa-solid fa-rotate"></i> รีเฟรช
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 mt-10">กำลังควานหางานในตำบลแกลง...</p>
      ) : orders.length === 0 ? (
        <div className="text-center mt-20">
          <i className="fa-solid fa-mug-hot text-4xl text-gray-700 mb-4"></i>
          <p className="text-gray-500">ตอนนี้ยังไม่มีออเดอร์ใหม่เข้ามาค่ะ</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-[#1e293b] border border-[#334155] rounded-2xl p-5 shadow-xl">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-[#deff9a] text-xs font-bold uppercase tracking-wider">งานใหม่เข้ามา!</p>
                  <h2 className="text-xl font-bold mt-1">{order.shops?.name || 'ไม่ระบุชื่อร้าน'}</h2>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-white">฿{order.delivery_fee}</p>
                  <p className="text-[10px] text-gray-400">ค่าส่งที่คุณจะได้รับ</p>
                </div>
              </div>

              <div className="bg-[#0f172a]/50 rounded-xl p-3 mb-4 border border-[#334155]">
                <div className="flex gap-2 text-sm mb-2">
                  <i className="fa-solid fa-location-dot text-red-400 mt-1"></i>
                  <p><span className="text-gray-400">ส่งที่:</span> {order.delivery_address}</p>
                </div>
                <div className="flex gap-2 text-sm">
                  <i className="fa-solid fa-money-bill-1 text-green-400 mt-1"></i>
                  <p><span className="text-gray-400">ยอดเงินรวม:</span> {order.total_price} บาท</p>
                </div>
              </div>

              <button 
                onClick={() => handleAcceptJob(order.id)}
                className="w-full bg-[#deff9a] text-black py-3 rounded-xl font-bold hover:bg-white active:scale-95 transition-all"
              >
                กดรับงานนี้
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

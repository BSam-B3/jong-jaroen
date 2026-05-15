"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      // ดึงออเดอร์ทั้งหมด เรียงจากใหม่ไปเก่า
      const { data, error } = await supabase
        .from('orders')
        .select('*, shops(name)')
        .order('created_at', { ascending: false });

      if (!error) setOrders(data || []);
      setLoading(false);
    };

    fetchOrders();
  }, []);

  const statusBadge: any = {
    'pending_rider': { text: 'รอไรเดอร์', class: 'bg-yellow-500/20 text-yellow-400' },
    'accepted': { text: 'กำลังจัดส่ง', class: 'bg-blue-500/20 text-blue-400' },
    'delivered': { text: 'สำเร็จแล้ว', class: 'bg-[#deff9a]/20 text-[#deff9a]' }
  };

  return (
    <div className="bg-black min-h-screen text-white p-4 pb-24">
      <h1 className="text-2xl font-bold mb-6 text-[#deff9a]">ประวัติคำสั่งซื้อ</h1>

      {loading ? (
        <div className="text-center py-10">กำลังโหลดรายการ...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-gray-500">คุณยังไม่เคยสั่งซื้อสินค้าเลยค่ะ</div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div 
              key={order.id} 
              onClick={() => window.location.href = `/marketplace/orders/${order.id}`}
              className="bg-[#111] border border-[#333] rounded-3xl p-5 active:scale-95 transition-all"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h2 className="font-bold text-lg">{order.shops?.name}</h2>
                  <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString('th-TH')}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusBadge[order.status].class}`}>
                  {statusBadge[order.status].text}
                </span>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-gray-400">ยอดรวมทั้งหมด</p>
                <p className="text-xl font-bold text-[#deff9a]">{order.total_price} บาท</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

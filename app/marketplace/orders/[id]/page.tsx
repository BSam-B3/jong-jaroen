"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function OrderTrackingPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, shops(name)')
        .eq('id', id)
        .single();
      setOrder(data);
    };

    fetchOrder();
    // Subscribe การเปลี่ยนแปลงแบบ Real-time
    const channel = supabase.channel(`order-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` }, 
      (payload) => setOrder(payload.new))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  if (!order) return <div className="p-10 text-white bg-black min-h-screen text-center">กำลังโหลดสถานะออเดอร์...</div>;

  const statusMap: any = {
    'pending_rider': { text: 'รอไรเดอร์รับงาน', color: 'text-yellow-400', icon: 'fa-clock' },
    'accepted': { text: 'ไรเดอร์รับงานแล้ว', color: 'text-blue-400', icon: 'fa-motorcycle' },
    'delivered': { text: 'ส่งสำเร็จแล้ว', color: 'text-[#deff9a]', icon: 'fa-circle-check' }
  };

  return (
    <div className="bg-black min-h-screen text-white p-6 pb-24">
      <h1 className="text-2xl font-bold mb-8 text-[#deff9a]">ติดตามออเดอร์</h1>

      <div className="bg-[#111] p-8 rounded-[32px] border border-[#333] text-center mb-6">
        <div className={`text-5xl mb-4 ${statusMap[order.status].color}`}>
          <i className={`fa-solid ${statusMap[order.status].icon}`}></i>
        </div>
        <h2 className={`text-2xl font-bold ${statusMap[order.status].color}`}>
          {statusMap[order.status].text}
        </h2>
        <p className="text-gray-500 mt-2">ออเดอร์จากร้าน {order.shops?.name}</p>
      </div>

      {/* รหัสรับของ (Show เฉพาะลูกค้า) */}
      {order.status === 'accepted' && (
        <div className="bg-[#deff9a] text-black p-6 rounded-[24px] text-center mb-6">
          <p className="text-sm font-bold uppercase tracking-widest opacity-60">รหัสยืนยันการรับของ</p>
          <h3 className="text-4xl font-black tracking-[10px] mt-2">{order.receive_code}</h3>
          <p className="text-xs mt-3">แจ้งรหัสนี้กับไรเดอร์เมื่อได้รับของแล้วเท่านั้นนะคะ</p>
        </div>
      )}

      <button onClick={() => window.location.href = '/marketplace/shops'} className="w-full py-4 text-gray-400">
        กลับไปหน้าหลัก
      </button>
    </div>
  );
}

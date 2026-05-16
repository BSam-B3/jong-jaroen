"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/app/components/BottomNav';

export default function OrderTrackingPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      // ดึงข้อมูลออเดอร์ และข้อมูลรายการสินค้า (Join กับตาราง products)
      const { data: orderData } = await supabase
        .from('orders')
        .select(`*, order_items(*, products(name, image_url))`)
        .eq('id', id)
        .single();

      if (orderData) {
        setOrder(orderData);
        setItems(orderData.order_items || []);
      }
      setLoading(false);
    };

    fetchOrderDetail();

    // 📡 ดักฟังการอัปเดตสถานะจากไรเดอร์
    const channel = supabase.channel(`tracking-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` }, 
      (payload) => {
        setOrder((prev: any) => ({ ...prev, ...payload.new }));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  if (loading) return <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center font-black">กำลังติดตามออเดอร์...</div>;
  if (!order) return <div className="p-10 text-center">ไม่พบข้อมูลออเดอร์นี้ค่ะ</div>;

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-32 flex justify-center font-sans">
      <div className="w-full max-w-2xl bg-[#F8FAFC] min-h-screen relative flex flex-col shadow-2xl">
        
        <header className="bg-[#EE4D2D] p-6 pt-12 pb-10 rounded-b-[3rem] text-white shadow-lg relative overflow-hidden">
          <button onClick={() => router.back()} className="mb-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">←</button>
          <div className="relative z-10">
            <p className="text-xs font-black opacity-80 uppercase tracking-widest">สถานะปัจจุบัน</p>
            <h1 className="text-3xl font-black mt-1">
              {order.status === 'pending' && '⏳ กำลังหาไรเดอร์...'}
              {order.status === 'accepted' && '🛵 ไรเดอร์รับงานแล้ว'}
              {order.status === 'picking_up' && '🍱 กำลังรับสินค้า'}
              {order.status === 'delivering' && '📍 กำลังนำส่งให้คุณ'}
              {order.status === 'completed' && '✅ ส่งสำเร็จแล้ว!'}
            </h1>
          </div>
          {/* ลายน้ำเท่ๆ หลัง Header */}
          <div className="absolute top-[-20%] right-[-10%] text-[120px] opacity-10 rotate-12">🛵</div>
        </header>

        <main className="p-5 -mt-6 relative z-20 space-y-4">
          
          {/* 📍 แผนที่จำลอง (ในอนาคตใส่ Google Maps) */}
          <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 h-48 flex items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 opacity-20 grayscale">
                <img src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=1000" className="w-full h-full object-cover" />
             </div>
             <div className="relative z-10 flex flex-col items-center">
                <span className="text-4xl animate-bounce">🛵</span>
                <p className="text-[10px] font-black text-gray-400 mt-2">ไรเดอร์กำลังมุ่งหน้าไปร้านค้า</p>
             </div>
          </div>

          {/* 📋 รายละเอียดรายการอาหาร */}
          <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
             <h3 className="font-black text-gray-800 mb-4">รายการสินค้าที่สั่ง</h3>
             <div className="space-y-4">
                {items.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <img src={item.products?.image_url} className="w-12 h-12 rounded-xl object-cover" alt="" />
                    <div className="flex-1 font-bold text-sm text-gray-700">
                       {item.products?.name} <span className="text-gray-400">x{item.quantity}</span>
                    </div>
                    <div className="font-black text-gray-800 text-sm">฿{item.price_at_time * item.quantity}</div>
                  </div>
                ))}
             </div>
             <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400">ยอดรวมทั้งสิ้น (รวมค่าส่ง)</span>
                <span className="text-xl font-black text-[#EE4D2D]">฿{Number(order.total_price).toLocaleString()}</span>
             </div>
          </div>

          {/* 📞 ปุ่มติดต่อไรเดอร์ (จะโชว์เมื่อมีคนรับงานแล้ว) */}
          {order.status !== 'pending' && (
            <div className="flex gap-3">
              <button className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-black shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
                 <span>💬</span> แชทหาไรเดอร์
              </button>
              <button className="w-16 h-16 bg-[#00C300] text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg active:scale-95 transition-all">
                 📞
              </button>
            </div>
          )}

        </main>

        <BottomNav />
      </div>
    </div>
  );
}

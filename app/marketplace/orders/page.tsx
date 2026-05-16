"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BottomNav from '@/app/components/BottomNav';

interface Order {
  id: string;
  total_price: number;
  delivery_fee: number;
  status: string;
  shops_count: number;
  created_at: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: 'รอไรเดอร์รับงาน', color: 'text-orange-500 bg-orange-50', icon: '⏳' },
  accepted: { label: 'ไรเดอร์รับงานแล้ว', color: 'text-blue-500 bg-blue-50', icon: '🛵' },
  picking_up: { label: 'กำลังไปรับสินค้า', color: 'text-purple-500 bg-purple-50', icon: '🍱' },
  delivering: { label: 'กำลังนำส่ง', color: 'text-yellow-600 bg-yellow-50', icon: '📍' },
  completed: { label: 'ส่งสำเร็จแล้ว', color: 'text-green-600 bg-green-50', icon: '✅' },
};

export default function OrderHistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error) setOrders(data || []);
      setLoading(false);
    };

    fetchOrders();

    // ดักฟังการเปลี่ยนแปลงสถานะแบบ Real-time (สำคัญมาก!)
    const channel = supabase.channel('order-status-update')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        setOrders(prev => prev.map(order => 
          order.id === payload.new.id ? { ...order, ...payload.new } : order
        ));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-32 flex justify-center font-sans">
      <div className="w-full max-w-2xl bg-[#F8FAFC] min-h-screen relative flex flex-col shadow-2xl">
        
        <header className="bg-white p-6 pt-12 border-b border-gray-100 sticky top-0 z-30 flex items-center gap-4">
          <Link href="/marketplace/shops" className="text-xl">←</Link>
          <h1 className="text-xl font-black text-gray-800">ประวัติการสั่งซื้อ</h1>
        </header>

        <main className="p-5 space-y-4 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
              <div className="w-8 h-8 border-4 border-[#EE4D2D] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="font-bold">กำลังดึงข้อมูลออเดอร์...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📦</div>
              <p className="font-black text-gray-400">ยังไม่มีประวัติการสั่งซื้อค่ะ</p>
              <Link href="/marketplace/shops" className="mt-4 inline-block text-[#EE4D2D] font-black text-sm">ไปสั่งอาหารกันเลย ›</Link>
            </div>
          ) : (
            orders.map((order) => {
              const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
              return (
                <div key={order.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                        ID: {order.id.slice(0, 8)} • {new Date(order.created_at).toLocaleDateString('th-TH')}
                      </p>
                      <h3 className="font-black text-gray-800 mt-1">
                        สั่งจากทั้งหมด {order.shops_count} ร้าน
                      </h3>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 ${status.color}`}>
                      <span>{status.icon}</span>
                      {status.label}
                    </div>
                  </div>

                  <div className="flex justify-between items-end pt-2 border-t border-gray-50">
                    <div className="text-xs font-bold text-gray-400">
                      ราคารวมค่าส่ง
                    </div>
                    <div className="text-xl font-black text-[#EE4D2D]">
                      ฿{Number(order.total_price).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}

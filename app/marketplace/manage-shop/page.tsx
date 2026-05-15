"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import BottomNav from '@/app/components/BottomNav';

export default function MerchantDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMerchantData = async () => {
      // 1. ดึงข้อมูล User ปัจจุบัน
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 2. ดึงข้อมูลร้านค้าที่ User นี้เป็นเจ้าของ (สมมติใช้ owner_id ในตาราง shops)
      const { data: shopData } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', user.id)
        .single();
      
      if (shopData) {
        setShop(shopData);
        // 3. ดึงออเดอร์ของร้านนี้
        const { data: orderData } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('shop_id', shopData.id)
          .order('created_at', { ascending: false });
        
        setOrders(orderData || []);
      }
      setLoading(false);
    };

    fetchMerchantData();
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);
    
    if (!error) {
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      alert('อัปเดตสถานะออเดอร์แล้วค่ะ!');
    }
  };

  if (loading) return <div className="p-10 text-center">กำลังโหลดข้อมูลร้านค้า...</div>;
  if (!shop) return (
    <div className="p-10 text-center bg-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">คุณยังไม่มีร้านค้าในระบบ</h1>
      <Link href="/profile/edit" className="bg-[#EE4D2D] text-white px-6 py-2 rounded-full font-bold">ลงทะเบียนร้านค้า</Link>
      <BottomNav />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32">
      <div className="bg-[#EE4D2D] p-8 rounded-b-[3rem] shadow-lg text-white">
        <h1 className="text-2xl font-black">{shop.name}</h1>
        <p className="opacity-80 text-sm">แผงควบคุมเจ้าของร้าน (Merchant Dashboard)</p>
        
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
            <p className="text-xs font-bold uppercase opacity-70">ยอดขายวันนี้</p>
            <p className="text-2xl font-black">฿ {orders.filter(o => o.status === 'delivered').reduce((acc, curr) => acc + curr.total_price, 0)}</p>
          </div>
          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
            <p className="text-xs font-bold uppercase opacity-70">ออเดอร์ใหม่</p>
            <p className="text-2xl font-black">{orders.filter(o => o.status === 'pending_rider').length}</p>
          </div>
        </div>
      </div>

      <main className="px-5 mt-8 space-y-6">
        <div className="flex gap-4">
          <Link href="/marketplace/manage-shop/products" className="flex-1 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 text-center active:scale-95 transition-all">
            <span className="text-3xl block mb-2">🍱</span>
            <span className="font-black text-gray-800">จัดการเมนู</span>
          </Link>
          <div className="flex-1 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 text-center active:scale-95 transition-all">
            <span className="text-3xl block mb-2">📊</span>
            <span className="font-black text-gray-800">สรุปรายได้</span>
          </div>
        </div>

        <h2 className="text-xl font-black text-gray-800 px-2">ออเดอร์ล่าสุด</h2>
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase">Order ID: {order.id.slice(0, 8)}</p>
                  <p className="font-black text-gray-800 text-lg">฿ {order.total_price}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                  order.status === 'pending_rider' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                }`}>
                  {order.status === 'pending_rider' ? 'รอไรเดอร์' : 'เสร็จสิ้น'}
                </span>
              </div>
              
              {order.status === 'pending_rider' && (
                <button 
                  onClick={() => updateOrderStatus(order.id, 'accepted')}
                  className="w-full bg-[#EE4D2D] text-white py-3 rounded-xl font-bold text-sm"
                >
                  เริ่มเตรียมอาหาร
                </button>
              )}
            </div>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

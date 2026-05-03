'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function MyOrdersPage() {
  const supabase = createClient();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase.rpc('get_my_orders');
      if (!error) setOrders(data);
      setLoading(false);
    };
    fetchOrders();
  }, [supabase]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_acceptance': return 'bg-amber-100 text-amber-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending_acceptance': return 'รอช่างรับงาน';
      case 'in_progress': return 'กำลังดำเนินงาน';
      case 'completed': return 'งานเสร็จสิ้น';
      default: return status;
    }
  };

  if (loading) return <div className="p-20 text-center font-bold text-gray-400">กำลังโหลดรายการสั่งซื้อ...</div>;

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-24 font-sans flex justify-center">
      <div className="w-full sm:max-w-2xl bg-white min-h-screen shadow-xl p-4">
        <h1 className="text-2xl font-black text-gray-900 mb-6">งานที่ฉันจ้าง 🛍️</h1>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">💨</p>
            <p className="text-gray-500 font-bold">ยังไม่มีประวัติการจ้างงานค่ะ</p>
            <Link href="/services" className="text-[#EE4D2D] font-black mt-4 inline-block underline">ไปหาช่างกันเลย!</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white border border-gray-100 rounded-[2rem] p-5 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">
                    {new Date(order.created_at).toLocaleDateString('th-TH')}
                  </span>
                </div>

                <div className="flex gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden shrink-0">
                    <img src={order.cover_image_url} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-black text-gray-800 line-clamp-1">{order.service_title}</h3>
                    <p className="text-xs font-bold text-gray-500 mt-1">ช่าง: {order.provider_name}</p>
                    <p className="text-xs font-black text-[#EE4D2D] mt-1">{order.package_name} - {order.price.toLocaleString()} บาท</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-50 flex gap-2">
                  <button className="flex-1 py-2.5 bg-gray-50 text-gray-600 rounded-xl text-xs font-black">รายละเอียด</button>
                  <button className="flex-1 py-2.5 bg-orange-50 text-[#EE4D2D] rounded-xl text-xs font-black">ทักแชทช่าง</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

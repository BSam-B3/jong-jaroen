"use client";

import { useCart } from '@/app/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import BottomNav from '@/app/components/BottomNav';
import { createClient } from '@/lib/supabase/client'; // ใช้ Client ตัวเดียวกับหน้า Rider ค่ะ

export default function CheckoutPage() {
  const router = useRouter();
  const supabase = createClient();
  const { cart, subtotalPrice, deliveryFee, totalPrice, uniqueShopsCount, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const groupedCart = cart.reduce((acc, item) => {
    if (!acc[item.shop_id]) {
      acc[item.shop_id] = {
        name: item.name.split('จาก ')[1] || 'ร้านค้าสมาชิก',
        items: []
      };
    }
    acc[item.shop_id].items.push(item);
    return acc;
  }, {} as Record<string, { name: string, items: any[] }>);

  // --- ส่วนที่แก้ไข: ฟังก์ชันส่งออเดอร์ของจริง ---
  const handlePlaceOrder = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // 1. เช็ค User ก่อนสั่ง
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('กรุณาเข้าสู่ระบบก่อนสั่งซื้อค่ะ');
        router.push('/auth/login');
        return;
      }

      // 2. บันทึกข้อมูลลงตาราง orders (ออเดอร์หลัก)
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user.id,
          total_price: totalPrice,
          delivery_fee: deliveryFee,
          status: 'pending',
          delivery_address: "123/4 ตำบลแกลง อำเภอเมือง ระยอง", // ในอนาคตใช้พิกัดจริง
          shops_count: uniqueShopsCount
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 3. บันทึกรายการสินค้าลง order_items (วนลูปจากตะกร้า)
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.id,
        shop_id: item.shop_id,
        quantity: item.quantity,
        price_at_time: item.base_price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 4. 🔥 สร้างงานให้ไรเดอร์ (ลงตาราง jobs เพื่อให้ไปโชว์ที่หน้า Rider Dashboard)
      const { error: jobError } = await supabase
        .from('jobs')
        .insert([{
          title: `🛍️ ตลาดสดแกลง (แวะ ${uniqueShopsCount} ร้าน)`,
          job_type: 'buy',
          status: 'open',
          budget: deliveryFee, // รายได้ไรเดอร์
          pickup_location: `${uniqueShopsCount} ร้านในตลาด`,
          dropoff_location: "ที่อยู่ลูกค้าในแกลง",
          vehicle_type: 'motorcycle',
          employer_id: user.id,
          metadata: { order_id: order.id } // ผูกไอดีออเดอร์ไว้ดูรายละเอียด
        }]);

      if (jobError) throw jobError;

      // 5. จบงาน
      alert('สั่งซื้อสำเร็จ! งานของคุณถูกส่งไปที่บอร์ดไรเดอร์แล้วค่ะ 🛵');
      clearCart();
      router.push('/marketplace/orders'); // ไปหน้าประวัติการสั่งซื้อ

    } catch (error: any) {
      console.error('Checkout Error:', error);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  // ------------------------------------------

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex flex-col items-center justify-center p-5">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-xl font-black text-gray-800">ตะกร้าว่างเปล่าค่ะ</h2>
        <Link href="/marketplace/shops" className="mt-4 bg-[#EE4D2D] text-white px-8 py-3 rounded-full font-black shadow-lg">ไปช้อปปิ้งกันเลย</Link>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-40">
      <div className="w-full lg:max-w-4xl bg-[#F8FAFC] min-h-screen relative flex flex-col md:shadow-2xl overflow-x-hidden md:border-x border-gray-200/50">
        
        <header className="bg-white p-6 pt-12 border-b border-gray-100 flex items-center gap-4 sticky top-0 z-30">
          <button onClick={() => router.back()} className="text-xl">←</button>
          <h1 className="text-xl font-black text-gray-800">ยืนยันการสั่งซื้อ</h1>
        </header>

        <main className="p-5 space-y-6">
          <section className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 flex items-start gap-4">
            <div className="text-2xl mt-1">📍</div>
            <div className="flex-1">
              <h3 className="font-black text-gray-800">ที่อยู่จัดส่ง</h3>
              <p className="text-sm text-gray-500 font-bold mt-1">บ้านเลขที่ 123/4 ตำบลแกลง อำเภอเมือง ระยอง...</p>
            </div>
            <button className="text-[#EE4D2D] text-xs font-black">แก้ไข</button>
          </section>

          <div className="space-y-4">
            <h2 className="px-2 font-black text-gray-400 text-xs uppercase tracking-widest">รายการสินค้าของคุณ</h2>
            {Object.entries(groupedCart).map(([shopId, shopData]) => (
              <div key={shopId} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100">
                <div className="bg-orange-50/50 px-6 py-3 border-b border-orange-100 flex items-center gap-2">
                  <span className="text-lg">🏪</span>
                  <span className="font-black text-gray-700 text-sm">{shopData.name}</span>
                </div>
                <div className="p-4 space-y-4">
                  {shopData.items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl overflow-hidden shrink-0">
                        <img src={item.image_url || ''} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-800 text-sm line-clamp-1">{item.name}</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs font-bold text-gray-400">จำนวน {item.quantity} ชิ้น</span>
                          <span className="font-black text-gray-800">฿{item.base_price * item.quantity}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-black text-gray-800 mb-2">สรุปค่าใช้จ่าย</h3>
            <div className="flex justify-between text-sm font-bold text-gray-500">
              <span>รวมค่าสินค้า</span>
              <span>฿{subtotalPrice}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-blue-600">
              <div className="flex flex-col">
                <span>ค่าส่งแวะ {uniqueShopsCount} ร้าน</span>
                <span className="text-[10px] opacity-70">(เริ่มต้น 20 + แวะเพิ่มร้านละ 10)</span>
              </div>
              <span>฿{deliveryFee}</span>
            </div>
            <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
              <span className="font-black text-gray-800 text-lg">ยอดรวมสุทธิ</span>
              <span className="font-black text-[#EE4D2D] text-2xl">฿{totalPrice}</span>
            </div>
          </section>

          <section className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-xl">💵</div>
              <span className="font-bold text-gray-700">เงินสดเมื่อส่งถึง (COD)</span>
            </div>
            <span className="text-[#EE4D2D]">✓</span>
          </section>
        </main>

        <div className="fixed bottom-0 w-full lg:max-w-4xl bg-white/80 backdrop-blur-md border-t border-gray-100 p-6 z-40">
          <button 
            onClick={handlePlaceOrder}
            disabled={isSubmitting}
            className={`w-full py-4 rounded-2xl font-black text-lg shadow-xl shadow-[#EE4D2D]/20 transition-all active:scale-95 flex items-center justify-center gap-2 ${
              isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#EE4D2D] text-white'
            }`}
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'ยืนยันการสั่งซื้อ ฿' + totalPrice
            )}
          </button>
        </div>

        <BottomNav />
      </div>
    </div>
  );
}

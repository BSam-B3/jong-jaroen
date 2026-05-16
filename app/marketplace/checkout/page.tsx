"use client";

import { useCart } from '@/app/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import BottomNav from '@/app/components/BottomNav';
import { createClient } from '@/lib/supabase/client';

export default function CheckoutPage() {
  const router = useRouter();
  const supabase = createClient();
  const { cart, subtotalPrice, deliveryFee, totalPrice, uniqueShopsCount, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  // 💰 1. ดึงยอดเงินในกระเป๋า (JJWallet) ของบีสามมาโชว์
  useEffect(() => {
    async function getBalance() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('wallets').select('balance_satang').eq('owner_id', user.id).maybeSingle();
      if (data) setWalletBalance(data.balance_satang / 100); // แปลงสตางค์เป็นบาท
    }
    getBalance();
  }, [supabase]);

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

  // 🔥 2. ฟังก์ชันส่งออเดอร์และหักเงินของจริง
  const handlePlaceOrder = async () => {
    if (isSubmitting) return;

    // 🛡️ เช็คยอดเงินก่อนสั่ง
    if (walletBalance < totalPrice) {
      alert(`⚠️ ยอดเงินไม่พอค่ะ! ขาดอีก ${(totalPrice - walletBalance).toLocaleString()} บาท กรุณาเติมเงินก่อนนะคะ`);
      router.push('/wallet');
      return;
    }

    if (!confirm(`ยืนยันการชำระเงินจำนวน ฿${totalPrice.toLocaleString()} ใช่ไหมคะ?`)) return;

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('กรุณาเข้าสู่ระบบก่อนค่ะ');

      // 1. บันทึกข้อมูลลงตาราง orders
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user.id,
          total_price: totalPrice,
          delivery_fee: deliveryFee,
          status: 'pending',
          delivery_address: "123/4 ตำบลแกลง อำเภอเมือง ระยอง",
          shops_count: uniqueShopsCount
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. บันทึกรายการสินค้าลง order_items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.id,
        shop_id: item.shop_id,
        quantity: item.quantity,
        price_at_time: item.base_price
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // 3. สร้างงานให้ไรเดอร์ (เด้งไปที่ Rider Dashboard)
      const { error: jobError } = await supabase.from('jobs').insert([{
        title: `🛍️ ตลาดแกลง (แวะ ${uniqueShopsCount} ร้าน)`,
        job_type: 'buy',
        status: 'open',
        budget: deliveryFee,
        employer_id: user.id,
        metadata: { order_id: order.id }
      }]);

      if (jobError) throw jobError;

      // 💸 4. หักเงินใน Wallet บีสาม
      const newBalanceSatang = (walletBalance - totalPrice) * 100;
      await supabase.from('wallets').update({ balance_satang: newBalanceSatang }).eq('owner_id', user.id);

      alert('ชำระเงินและสั่งซื้อสำเร็จ! รอรับของอร่อยได้เลยค่ะ 🛵');
      clearCart();
      router.push(`/marketplace/orders/${order.id}`); // ไปหน้าติดตามออเดอร์แบบละเอียด

    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h1 className="text-xl font-black text-gray-800">ยืนยันการชำระเงิน</h1>
        </header>

        <main className="p-5 space-y-6">
          {/* 💳 ส่วนแสดงยอดเงินในกระเป๋า */}
          <section className={`p-6 rounded-[2.5rem] border-2 shadow-sm transition-all ${walletBalance < totalPrice ? 'bg-red-50 border-red-200' : 'bg-white border-green-100'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black text-gray-400 uppercase">JJWallet ของคุณ</span>
              <Link href="/wallet" className="text-[#EE4D2D] text-[10px] font-black underline">เติมเงิน</Link>
            </div>
            <div className="flex justify-between items-baseline">
              <h2 className="text-2xl font-black text-gray-800">฿ {walletBalance.toLocaleString()}</h2>
              {walletBalance < totalPrice && <span className="text-red-500 text-[10px] font-bold animate-pulse">ยอดเงินไม่พอสำหรับการสั่งซื้อ</span>}
            </div>
          </section>

          {/* สรุปรายการสินค้าแยกตามร้าน */}
          <div className="space-y-4">
            {Object.entries(groupedCart).map(([shopId, shopData]) => (
              <div key={shopId} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100">
                <div className="bg-orange-50/50 px-6 py-3 border-b border-orange-100 font-black text-gray-700 text-sm">🏪 {shopData.name}</div>
                <div className="p-4 space-y-3">
                  {shopData.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm font-bold text-gray-700">
                      <span>{item.name} x {item.quantity}</span>
                      <span>฿{item.base_price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* บิลค่าใช้จ่าย */}
          <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between text-sm font-bold text-gray-500"><span>ราคาสินค้า</span><span>฿{subtotalPrice}</span></div>
            <div className="flex justify-between text-sm font-bold text-blue-600"><span>ค่าส่ง ({uniqueShopsCount} ร้าน)</span><span>฿{deliveryFee}</span></div>
            <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
              <span className="font-black text-gray-800 text-lg">รวมทั้งสิ้น</span>
              <span className="font-black text-[#EE4D2D] text-2xl">฿{totalPrice}</span>
            </div>
          </section>
        </main>

        {/* ปุ่มกดยืนยันชำระเงิน */}
        <div className="fixed bottom-0 w-full lg:max-w-4xl bg-white p-6 border-t z-40">
          <button 
            onClick={handlePlaceOrder}
            disabled={isSubmitting || walletBalance < totalPrice}
            className={`w-full py-4 rounded-2xl font-black text-lg shadow-xl transition-all active:scale-95 ${
              isSubmitting || walletBalance < totalPrice ? 'bg-gray-300' : 'bg-[#EE4D2D] text-white shadow-[#EE4D2D]/20'
            }`}
          >
            {isSubmitting ? 'กำลังดำเนินการ...' : `ชำระเงิน ฿${totalPrice.toLocaleString()}`}
          </button>
        </div>

        <BottomNav />
      </div>
    </div>
  );
}

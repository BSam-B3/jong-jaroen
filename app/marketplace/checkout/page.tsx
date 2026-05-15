"use client";

import { useState } from 'react';
import { useCart } from '@/app/contexts/CartContext';
// ใช้ทางลัด @/ เพื่อวิ่งจากหน้าบ้านเข้าไปหา lib/supabase โดยตรง (แม่นยำ 100%)
import { supabase } from '@/lib/supabase';

export default function CheckoutPage() {
  const { cart, totalPrice, clearCart } = useCart();
  const [address, setAddress] = useState('');
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  const deliveryFee = 20;
  const finalTotal = totalPrice + deliveryFee;

  const handleConfirmOrder = async () => {
    if (!address.trim()) {
      alert('กรุณากรอกที่อยู่จัดส่งด้วยนะคะ!');
      return;
    }
    
    if (cart.length === 0) {
      alert('ตะกร้าว่างเปล่า กรุณาเลือกสินค้าก่อนค่ะ');
      return;
    }

    setIsOrdering(true);

    try {
      // 1. บันทึกข้อมูลลงตาราง orders
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          shop_id: cart[0].shop_id,
          total_price: finalTotal,
          delivery_fee: deliveryFee,
          delivery_address: address,
          status: 'pending_rider'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. บันทึกรายการสินค้าลงตาราง order_items
      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        product_id: item.id,
        quantity: item.quantity,
        price_per_unit: item.display_price || item.base_price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 3. เมื่อสำเร็จ ทำการเคลียร์ตะกร้าและเปลี่ยนสถานะหน้าจอ
      setOrderComplete(true);
      clearCart();
    } catch (error) {
      console.error('Order Error:', error);
      alert('เกิดข้อผิดพลาดในการสั่งซื้อ: ' + (error instanceof Error ? error.message : 'โปรดลองใหม่อีกครั้ง'));
    } finally {
      setIsOrdering(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="bg-black min-h-screen text-white flex flex-col items-center justify-center p-6 text-center pb-24">
        <div className="w-24 h-24 bg-[#deff9a] rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(222,255,154,0.3)]">
          <i className="fa-solid fa-check text-5xl text-black"></i>
        </div>
        <h1 className="text-3xl font-bold text-[#deff9a] mb-2">ส่งงานไปที่บอร์ดแล้ว!</h1>
        <p className="text-gray-400 mb-8">ออเดอร์ของคุณถูกส่งไปหาไรเดอร์ในพื้นที่ตำบลแกลงเรียบร้อย</p>
        <button 
          onClick={() => window.location.href = '/marketplace/shops'}
          className="bg-[#222] text-white px-6 py-3 rounded-xl font-bold border border-[#333] hover:bg-[#333] transition-all"
        >
          กลับไปหน้าตลาด
        </button>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-white p-4 pb-32">
      <h1 className="text-2xl font-bold mb-6 text-[#deff9a]">สรุปคำสั่งซื้อ</h1>

      <div className="bg-[#111] p-4 rounded-2xl border border-[#333] mb-6">
        <h2 className="font-bold text-lg mb-4 border-b border-[#333] pb-2 text-gray-300">รายการอาหาร</h2>
        {cart.map((item) => (
          <div key={item.id} className="flex justify-between items-center mb-4 last:mb-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#222] rounded flex items-center justify-center text-sm font-bold text-[#deff9a]">
                {item.quantity}x
              </div>
              <p>{item.name}</p>
            </div>
            <p className="font-bold">{(item.display_price || item.base_price) * item.quantity} บาท</p>
          </div>
        ))}
      </div>

      <div className="bg-[#111] p-4 rounded-2xl border border-[#333] mb-6">
        <h2 className="font-bold text-lg mb-4 border-b border-[#333] pb-2 text-gray-300">ที่อยู่จัดส่งในตำบลแกลง</h2>
        <textarea 
          className="w-full bg-[#222] border border-[#333] rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#deff9a] transition-colors"
          rows={3}
          placeholder="ระบุบ้านเลขที่, ซอย, จุดสังเกต (เช่น บ้านสีฟ้า ประตูรั้วสีขาว)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        ></textarea>
      </div>

      <div className="fixed bottom-0 left-0 w-full p-4 bg-black border-t border-[#333]">
        <div className="flex justify-between mb-4 px-2">
          <div className="text-gray-400 text-sm">
            <p>ค่าสินค้า: {totalPrice}.-</p>
            <p>ค่าส่ง: {deliveryFee}.-</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-xs uppercase tracking-widest">ยอดรวมสุทธิ</p>
            <p className="text-[#deff9a] font-bold text-2xl">{finalTotal} บาท</p>
          </div>
        </div>
        <button 
          onClick={handleConfirmOrder}
          disabled={isOrdering || cart.length === 0}
          className={`w-full py-4 rounded-2xl font-bold text-lg flex justify-center items-center gap-2 transition-all ${
            isOrdering || cart.length === 0 
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
            : 'bg-[#deff9a] text-black hover:bg-white active:scale-95 shadow-lg shadow-[#deff9a]/20'
          }`}
        >
          {isOrdering ? 'กำลังบันทึกออเดอร์...' : 'ยืนยันสั่งซื้อ'}
        </button>
      </div>
    </div>
  );
}

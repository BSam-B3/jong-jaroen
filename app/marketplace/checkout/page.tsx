"use client";

import { useState } from 'react';
import { useCart } from '@/app/contexts/CartContext';
// เรียกใช้ผ่าน @/lib/supabase ซึ่งจะไปดึงตัวแปร supabase จาก index.ts มาครับ
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
      alert('ไม่มีสินค้าในตะกร้า');
      return;
    }

    setIsOrdering(true);

    try {
      // 1. บันทึกข้อมูลลงตาราง orders ใน Supabase
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

      // สำเร็จ! เคลียร์ตะกร้าและโชว์หน้า Success
      setOrderComplete(true);
      clearCart();
    } catch (error) {
      console.error('Order Error:', error);
      alert('เกิดข้อผิดพลาดในการสั่งซื้อ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsOrdering(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="bg-black min-h-screen text-white flex flex-col items-center justify-center p-6 text-center pb-24">
        <div className="w-24 h-24 bg-[#deff9a] rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(222,255,154,0.1)]">
          <i className="fa-solid fa-check text-5xl text-black"></i>
        </div>
        <h1 className="text-3xl font-bold text-[#deff9a] mb-2">ส่งงานไปที่บอร์ดแล้ว!</h1>
        <p className="text-gray-400 mb-8 text-sm">ไรเดอร์ในตำบลแกลงกำลังเร่งมารับออเดอร์ของคุณ</p>
        <button 
          onClick={() => window.location.href = '/marketplace/shops'}
          className="bg-[#222] text-white px-8 py-3 rounded-2xl font-bold border border-[#333] hover:bg-[#333]"
        >
          กลับไปหน้าตลาด
        </button>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-white p-4 pb-32">
      <h1 className="text-2xl font-bold mb-6 text-[#deff9a]">สรุปคำสั่งซื้อ</h1>

      <div className="bg-[#111] p-5 rounded-[28px] border border-[#333] mb-6">
        <h2 className="font-bold text-lg mb-4 border-b border-[#333] pb-2 text-gray-400">รายการสั่งซื้อ</h2>
        {cart.map((item) => (
          <div key={item.id} className="flex justify-between items-center mb-4 last:mb-0">
            <p className="text-sm">{item.quantity}x {item.name}</p>
            <p className="font-bold text-[#deff9a]">{(item.display_price || item.base_price) * item.quantity}.-</p>
          </div>
        ))}
      </div>

      <div className="bg-[#111] p-5 rounded-[28px] border border-[#333] mb-6">
        <h2 className="font-bold text-lg mb-4 text-gray-400">ที่อยู่จัดส่ง</h2>
        <textarea 
          className="w-full bg-[#222] border border-[#333] rounded-2xl p-4 text-white focus:border-[#deff9a] outline-none transition-all"
          rows={3}
          placeholder="ระบุบ้านเลขที่, ซอย หรือจุดสังเกต..."
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>

      <div className="fixed bottom-0 left-0 w-full p-4 bg-black border-t border-[#333]">
        <div className="flex justify-between mb-4 px-2 items-end">
          <div className="text-gray-500 text-xs">รวมค่าส่ง 20.- แล้ว</div>
          <p className="text-[#deff9a] font-bold text-2xl">{finalTotal} บาท</p>
        </div>
        <button 
          onClick={handleConfirmOrder}
          disabled={isOrdering || cart.length === 0}
          className="w-full bg-[#deff9a] text-black py-4 rounded-2xl font-bold text-lg active:scale-95 transition-all shadow-lg shadow-[#deff9a]/10"
        >
          {isOrdering ? 'กำลังบันทึกข้อมูล...' : 'ยืนยันสั่งซื้อ'}
        </button>
      </div>
    </div>
  );
}

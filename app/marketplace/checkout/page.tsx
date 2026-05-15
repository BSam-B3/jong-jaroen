"use client";

import { useState } from 'react';
import { useCart } from '@/app/contexts/CartContext';
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
    
    setIsOrdering(true);

    try {
      // 1. บันทึกออเดอร์
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          shop_id: cart[0].shop_id,
          total_price: finalTotal,
          delivery_fee: deliveryFee,
          delivery_address: address,
          status: 'pending_rider'
        })
        .select().single();

      if (orderError) throw orderError;

      // 2. สร้างการแจ้งเตือนให้ไรเดอร์ (In-app Notification)
      await supabase.from('notifications').insert({
        title: 'มีงานใหม่ในตำบลแกลง!',
        message: `ร้าน ${cart[0].shop_name || 'ร้านค้า'} มีออเดอร์ใหม่ รอไรเดอร์มารับด่วนค่ะ`
      });

      setOrderComplete(true);
      clearCart();
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการสั่งซื้อค่ะ');
    } finally {
      setIsOrdering(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="bg-black min-h-screen text-white flex flex-col items-center justify-center p-6 text-center pb-24">
        <div className="w-24 h-24 bg-[#deff9a] rounded-full flex items-center justify-center mb-6 shadow-lg">
          <i className="fa-solid fa-check text-5xl text-black"></i>
        </div>
        <h1 className="text-3xl font-bold text-[#deff9a] mb-2">สั่งซื้อสำเร็จ!</h1>
        <p className="text-gray-400 mb-8">งานถูกส่งไปที่บอร์ดไรเดอร์แล้วค่ะ</p>
        <button onClick={() => window.location.href = '/marketplace/shops'} className="bg-[#222] text-white px-8 py-3 rounded-2xl font-bold border border-[#333]">กลับหน้าหลัก</button>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-white p-4 pb-32">
      <h1 className="text-2xl font-bold mb-6 text-[#deff9a]">สรุปคำสั่งซื้อ</h1>
      {/* ส่วนแสดงรายการสินค้าและที่อยู่ (เหมือนเดิม) */}
      <div className="bg-[#111] p-5 rounded-[28px] border border-[#333] mb-6">
        <textarea 
          className="w-full bg-[#222] border border-[#333] rounded-2xl p-4 text-white outline-none"
          rows={3} placeholder="ระบุที่อยู่จัดส่ง..." value={address} onChange={(e) => setAddress(e.target.value)}
        />
      </div>
      <div className="fixed bottom-0 left-0 w-full p-4 bg-black border-t border-[#333]">
        <button onClick={handleConfirmOrder} disabled={isOrdering || cart.length === 0} className="w-full bg-[#deff9a] text-black py-4 rounded-2xl font-bold">
          {isOrdering ? 'กำลังบันทึก...' : 'ยืนยันสั่งซื้อ'}
        </button>
      </div>
    </div>
  );
}

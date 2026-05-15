"use client";

import { useState } from 'react';
import { useCart } from '@/app/contexts/CartContext';

export default function CheckoutPage() {
  const { cart, totalPrice, clearCart } = useCart();
  const [address, setAddress] = useState('');
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  // สมมติค่าส่งคงที่ 20 บาท สำหรับวิ่งในชุมชน
  const deliveryFee = 20;
  const finalTotal = totalPrice + deliveryFee;

  const handleConfirmOrder = () => {
    if (!address.trim()) {
      alert('กรุณากรอกที่อยู่จัดส่งด้วยนะคะ!');
      return;
    }
    
    setIsOrdering(true);
    
    // จำลองการเรียก API เพื่อบันทึกคำสั่งซื้อ (รอ 2 วินาที)
    setTimeout(() => {
      setIsOrdering(false);
      setOrderComplete(true);
      clearCart(); // ล้างตะกร้าเมื่อสั่งซื้อสำเร็จ
    }, 2000);
  };

  if (orderComplete) {
    return (
      <div className="bg-black min-h-screen text-white flex flex-col items-center justify-center p-6 text-center pb-24">
        <div className="w-24 h-24 bg-[#deff9a] rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(222,255,154,0.3)]">
          <i className="fa-solid fa-check text-5xl text-black"></i>
        </div>
        <h1 className="text-3xl font-bold text-[#deff9a] mb-2">สั่งซื้อสำเร็จ!</h1>
        <p className="text-gray-400 mb-8">กำลังค้นหาไรเดอร์มารับออเดอร์ของคุณ</p>
        <button 
          onClick={() => window.location.href = '/marketplace/shops'}
          className="bg-[#222] text-white px-6 py-3 rounded-xl font-bold border border-[#333] hover:bg-[#333] transition-all"
        >
          กลับไปหน้าตลาด
        </button>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="bg-black min-h-screen text-white p-6 pb-24">
        <h1 className="text-2xl font-bold mb-4">สรุปคำสั่งซื้อ</h1>
        <div className="text-center text-gray-500 mt-20">ไม่มีสินค้าในตะกร้า</div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-white p-4 pb-32">
      <h1 className="text-2xl font-bold mb-6 text-[#deff9a]">สรุปคำสั่งซื้อ</h1>

      {/* รายการสินค้า */}
      <div className="bg-[#111] p-4 rounded-2xl border border-[#333] mb-6">
        <h2 className="font-bold text-lg mb-4 border-b border-[#333] pb-2">รายการสินค้า</h2>
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

      {/* ที่อยู่จัดส่ง */}
      <div className="bg-[#111] p-4 rounded-2xl border border-[#333] mb-6">
        <h2 className="font-bold text-lg mb-4 border-b border-[#333] pb-2">รายละเอียดจัดส่ง</h2>
        <textarea 
          className="w-full bg-[#222] border border-[#333] rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#deff9a] transition-colors"
          rows={3}
          placeholder="ระบุบ้านเลขที่, ซอย, จุดสังเกต (เช่น บ้านสีฟ้า ประตูรั้วสีขาว)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        ></textarea>
      </div>

      {/* สรุปยอดเงิน */}
      <div className="bg-[#111] p-4 rounded-2xl border border-[#333] mb-6">
        <div className="flex justify-between mb-2 text-gray-400">
          <p>ค่าสินค้า</p>
          <p>{totalPrice} บาท</p>
        </div>
        <div className="flex justify-between mb-4 text-gray-400">
          <p>ค่าจัดส่งโดยประมาณ</p>
          <p>{deliveryFee} บาท</p>
        </div>
        <div className="flex justify-between font-bold text-xl border-t border-[#333] pt-4 text-[#deff9a]">
          <p>ยอดชำระทั้งหมด</p>
          <p>{finalTotal} บาท</p>
        </div>
      </div>

      {/* ปุ่มยืนยัน */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black to-transparent">
        <button 
          onClick={handleConfirmOrder}
          disabled={isOrdering}
          className={`w-full py-4 rounded-2xl font-bold text-lg flex justify-center items-center gap-2 ${isOrdering ? 'bg-gray-600 text-gray-400' : 'bg-[#deff9a] text-black hover:bg-white active:scale-95 transition-all shadow-lg shadow-[#deff9a]/20'}`}
        >
          {isOrdering ? (
            <>
              <i className="fa-solid fa-circle-notch fa-spin"></i> กำลังดำเนินการ...
            </>
          ) : (
            'ยืนยันคำสั่งซื้อ (โอนเงินให้ไรเดอร์)'
          )}
        </button>
      </div>
    </div>
  );
}

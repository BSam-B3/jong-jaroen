'use client';
import { useState } from 'react';
import Link from 'next/link';

// ── Soft Shopee Palette ─────────────────────────────────────────
const themePalette = {
  primaryOrange: '#F05D40', 
  lightOrange: '#FF8769',   
  bgGray: '#F9FAFB',        
};

// 🌟 Mock Data: จำลองข้อมูลการจ้างงานที่ลูกค้ากดเลือกมา 🌟
const bookingDetails = {
  providerName: 'ป้าสมศรี รับทำความสะอาด',
  category: 'แม่บ้าน',
  avatar: '👩‍🍳',
  location: 'หมู่บ้านแถวปากน้ำประแส',
  date: '10 มี.ค. 2569',
  time: '09:00 - 12:00 น.',
  basePrice: 1000, 
};

export default function CheckoutPage() {
  // 🌟 State สำหรับระบบ โค้ดส่วนลด 🌟
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isApplying, setIsApplying] = useState(false);
  const [promoMessage, setPromoMessage] = useState({ text: '', type: '' }); // success หรือ error

  const handleApplyPromo = () => {
    if (!promoCode.trim()) return;
    
    setIsApplying(true);
    setPromoMessage({ text: '', type: '' });

    // จำลองการเช็กโค้ดกับฐานข้อมูล (ถ้ากรอก "ลด50" จะได้ลด 50 บาท)
    setTimeout(() => {
      if (promoCode.trim() === 'ลด50') {
        if (bookingDetails.basePrice >= 1000) {
          setDiscount(50);
          setPromoMessage({ text: '✅ ใช้โค้ดสำเร็จ! ลด 50 บาท', type: 'success' });
        } else {
          setDiscount(0);
          setPromoMessage({ text: '❌ ยอดจ้างขั้นต่ำต้องถึง 1,000 บาท', type: 'error' });
        }
      } else {
        setDiscount(0);
        setPromoMessage({ text: '❌ โค้ดส่วนลดไม่ถูกต้องหรือหมดอายุ', type: 'error' });
      }
      setIsApplying(false);
    }, 800);
  };

  const handleRemovePromo = () => {
    setDiscount(0);
    setPromoCode('');
    setPromoMessage({ text: '', type: '' });
  };

  const totalPrice = bookingDetails.basePrice - discount;

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: themePalette.bgGray }}>
      
      {/* ── Header ── */}
      <header className="pt-10 pb-4 px-4 bg-white shadow-sm flex items-center gap-4 sticky top-0 z-50">
        <Link href="/services" className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-600 hover:bg-orange-50 hover:text-orange-500 transition-colors">
          ❮
        </Link>
        <h1 className="text-lg font-black text-gray-800 tracking-tight">
          ยืนยันการจ้างงาน
        </h1>
      </header>

      <main className="max-w-xl mx-auto px-4 mt-4 space-y-4">
        
        {/* ── 1. ข้อมูลผู้ให้บริการ ── */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4 items-center">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl flex items-center justify-center text-3xl border border-blue-200 shrink-0">
            {bookingDetails.avatar}
          </div>
          <div>
            <span className="bg-orange-50 text-[#F05D40] px-2 py-0.5 rounded text-[10px] font-bold mb-1 inline-block">
              {bookingDetails.category}
            </span>
            <h2 className="text-sm font-bold text-gray-800 leading-tight">
              {bookingDetails.providerName}
            </h2>
          </div>
        </section>

        {/* ── 2. รายละเอียดงาน ── */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <h3 className="text-xs font-bold text-gray-800 border-b border-gray-50 pb-2">📋 รายละเอียดการนัดหมาย</h3>
          
          <div className="flex items-start gap-3">
            <span className="text-lg">📅</span>
            <div>
              <p className="text-[10px] text-gray-500 font-medium">วันที่และเวลา</p>
              <p className="text-xs font-bold text-gray-800">{bookingDetails.date} • {bookingDetails.time}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <span className="text-lg">📍</span>
            <div>
              <p className="text-[10px] text-gray-500 font-medium">สถานที่ปฏิบัติงาน</p>
              <p className="text-xs font-bold text-gray-800">{bookingDetails.location}</p>
            </div>
          </div>
        </section>

        {/* ── 3. 🌟 ส่วนลด (Promo Code) ตามแผน Omnichannel 🌟 ── */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100">
          <h3 className="text-xs font-bold text-gray-800 mb-3 flex items-center gap-1.5">
            <span className="text-base">🎟️</span> โค้ดส่วนลด (Promo Code)
          </h3>
          
          {discount === 0 ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="พิมพ์โค้ดส่วนลดที่นี่" 
                  className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#F05D40] bg-gray-50 uppercase font-bold"
                />
                <button 
                  onClick={handleApplyPromo}
                  disabled={!promoCode.trim() || isApplying}
                  className={`text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors
                    ${!promoCode.trim() || isApplying ? 'bg-gray-300' : 'bg-gray-800 hover:bg-black'}`}
                >
                  {isApplying ? 'กำลังเช็ก...' : 'ใช้งาน'}
                </button>
              </div>
              {promoMessage.text && (
                <p className={`text-[10px] font-bold ${promoMessage.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                  {promoMessage.text}
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <span className="text-green-600 text-lg">✅</span>
                <div>
                  <p className="text-xs font-bold text-green-700">ใช้งานโค้ด "{promoCode.toUpperCase()}" แล้ว</p>
                  <p className="text-[10px] text-green-600">ประหยัดไป {discount} บาท</p>
                </div>
              </div>
              <button 
                onClick={handleRemovePromo}
                className="text-[10px] text-gray-400 hover:text-red-500 underline font-medium"
              >
                เอาออก
              </button>
            </div>
          )}
        </section>

        {/* ── 4. สรุปยอดชำระ ── */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <h3 className="text-xs font-bold text-gray-800 border-b border-gray-50 pb-2">💰 สรุปยอดการจ้างงาน</h3>
          
          <div className="flex justify-between items-center text-xs text-gray-600">
            <span>ค่าบริการพื้นฐาน</span>
            <span>฿{bookingDetails.basePrice.toLocaleString()}</span>
          </div>
          
          {discount > 0 && (
            <div className="flex justify-between items-center text-xs text-green-600 font-bold">
              <span>ส่วนลดโปรโมชัน</span>
              <span>- ฿{discount.toLocaleString()}</span>
            </div>
          )}
          
          <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between items-end">
            <span className="text-sm font-bold text-gray-800">ยอดรวมทั้งหมด</span>
            <span className="text-xl font-black" style={{ color: themePalette.primaryOrange }}>
              ฿{totalPrice.toLocaleString()}
            </span>
          </div>
        </section>

      </main>

      {/* ── Sticky Bottom Bar (ปุ่มยืนยันจ้างงาน) ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-[100] shadow-[0_-10px_20px_rgba(0,0,0,0.05)] pb-safe">
        <div className="max-w-xl mx-auto flex gap-4 items-center">
          <div className="flex-1">
            <p className="text-[10px] text-gray-500 font-medium">ยอดที่ต้องชำระ</p>
            <p className="text-lg font-black leading-none" style={{ color: themePalette.primaryOrange }}>
              ฿{totalPrice.toLocaleString()}
            </p>
          </div>
          <button className="flex-none bg-[#F05D40] text-white text-sm font-bold px-8 py-3.5 rounded-xl shadow-md hover:bg-[#D95339] hover:shadow-lg hover:-translate-y-0.5 transition-all">
            ยืนยันการจ้างงาน
          </button>
        </div>
      </div>

    </div>
  );
}

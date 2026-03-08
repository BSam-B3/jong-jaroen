'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ข้อมูลจำลอง (Mock Data) เอาไว้ดู UI ก่อนเชื่อมหลังบ้าน
const mockServices = [
  { id: '1', title: 'ลุงชม รับซ่อมแอร์/เครื่องใช้ไฟฟ้า', category: 'งานช่าง', price: 500, desc: 'ซ่อมแอร์ ล้างแอร์ ซ่อมพัดลม ตู้เย็น ในเขตปากน้ำประแส' },
  { id: '2', title: 'ป้าศรี รับจ้างทำความสะอาดบ้าน', category: 'งานบ้าน', price: 300, desc: 'กวาด ถู ล้างห้องน้ำ ทำความสะอาดเหมาวัน ราคากันเอง' },
  { id: '3', title: 'พี่เอก รถกระบะรับจ้างขนของ', category: 'ขนส่ง', price: 400, desc: 'ย้ายหอ ขนของไปตลาด ขนส่งสินค้าเกษตร มีคนช่วยยก' },
  { id: '4', title: 'น้องเมย์ รับสอนการบ้านเด็ก', category: 'ทั่วไป', price: 150, desc: 'สอนการบ้านเด็กประถม อ่านออกเขียนได้ ตอนเย็นหลังเลิกเรียน' }
];

export default function ServicesMarketplacePage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('ทั้งหมด');

  const categories = ['ทั้งหมด', 'งานช่าง', 'งานบ้าน', 'ขนส่ง', 'ทั่วไป'];

  // กรองข้อมูลตามหมวดหมู่
  const filteredServices = activeCategory === 'ทั้งหมด' 
    ? mockServices 
    : mockServices.filter((s) => s.category === activeCategory);

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-md mx-auto pb-24">
      {/* Header */}
      <div className="flex justify-between items-center my-6 px-2">
        <h1 className="text-3xl font-extrabold text-blue-800">หาคนช่วยงาน 🛠️</h1>
        <button 
          onClick={() => router.push('/services/new')}
          className="bg-orange-500 text-white font-bold py-3 px-5 rounded-2xl shadow-md text-xl active:scale-95"
        >
          + ลงรับงาน
        </button>
      </div>

      {/* Categories Filter (ปุ่มเลือกหมวดหมู่) */}
      <div className="flex gap-3 overflow-x-auto pb-4 px-2 snap-x scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`snap-start whitespace-nowrap px-6 py-3 rounded-full text-xl font-bold transition-colors ${
              activeCategory === cat 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Service List (รายการผู้รับจ้าง) */}
      <div className="space-y-6 mt-4">
        {filteredServices.length === 0 ? (
          <p className="text-center text-gray-500 text-xl mt-10">ยังไม่มีบริการในหมวดหมู่นี้ค่ะ</p>
        ) : (
          filteredServices.map((service) => (
            <div key={service.id} className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 relative overflow-hidden">
              {/* ป้ายหมวดหมู่ */}
              <div className="absolute top-0 right-0 bg-blue-100 text-blue-700 px-4 py-2 rounded-bl-2xl font-bold">
                {service.category}
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mt-2 pr-16 leading-tight">
                {service.title}
              </h2>
              <p className="text-gray-500 text-lg mt-3 line-clamp-2 leading-relaxed">
                {service.desc}
              </p>
              
              <div className="flex items-end justify-between mt-6">
                <div>
                  <p className="text-sm text-gray-400 font-bold mb-1">เริ่มต้นที่</p>
                  <p className="text-3xl font-extrabold text-green-600">
                    {service.price} <span className="text-xl">บาท</span>
                  </p>
                </div>
                
                <button
                  onClick={() => router.push(`/services/${service.id}`)}
                  className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-extrabold py-4 px-6 rounded-2xl text-xl transition-colors"
                >
                  ดูโปรไฟล์ →
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

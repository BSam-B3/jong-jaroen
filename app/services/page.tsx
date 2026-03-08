'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Mock Data
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

  const filteredServices = activeCategory === 'ทั้งหมด' 
    ? mockServices 
    : mockServices.filter((s) => s.category === activeCategory);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 max-w-md mx-auto">
      {/* Header */}
      <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-lg font-bold text-gray-800">บริการทั้งหมด</h1>
        <button 
          onClick={() => router.push('/services/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-4 rounded-lg text-sm transition"
        >
          + ลงประกาศ
        </button>
      </div>

      {/* Categories Filter */}
      <div className="bg-white px-4 py-3 border-b border-gray-100 flex gap-2 overflow-x-auto scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Service List */}
      <div className="p-4 space-y-3">
        {filteredServices.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 text-sm">ยังไม่มีบริการในหมวดหมู่นี้</p>
          </div>
        ) : (
          filteredServices.map((service) => (
            <div 
              key={service.id} 
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col cursor-pointer hover:shadow-md transition" 
              onClick={() => router.push(`/services/${service.id}`)}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-2.5 py-1 rounded-md">
                  {service.category}
                </span>
                <span className="text-lg font-bold text-green-600">
                  ฿{service.price}
                </span>
              </div>
              
              <h2 className="text-base font-semibold text-gray-800 line-clamp-1 mb-1">
                {service.title}
              </h2>
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                {service.desc}
              </p>
              
              <div className="flex justify-end">
                <span className="text-blue-600 text-sm font-medium">ดูรายละเอียด →</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

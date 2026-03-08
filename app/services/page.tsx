'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Mock Data (คนในชุมชน)
const mockServices = [
  { id: '1', title: 'ลุงชม รับซ่อมแอร์/เครื่องใช้ไฟฟ้า', category: 'งานช่าง', price: 500, desc: 'ซ่อมแอร์ ล้างแอร์ ซ่อมพัดลม ในเขตปากน้ำประแส' },
  { id: '2', title: 'ป้าศรี รับจ้างทำความสะอาดบ้าน', category: 'งานบ้าน', price: 300, desc: 'กวาด ถู ล้างห้องน้ำ ทำความสะอาดเหมาวัน กันเอง' },
  { id: '3', title: 'พี่เอก รถกระบะรับจ้างขนของ', category: 'ขนส่ง', price: 400, desc: 'ย้ายหอ ขนของไปตลาด สินค้าเกษตร มีคนช่วยยก' },
  { id: '4', title: 'น้องเมย์ รับสอนการบ้านเด็ก', category: 'ทั่วไป', price: 150, desc: 'สอนการบ้านประถม อ่านออกเขียนได้ ตอนเย็น' }
];

export default function ServicesMarketplacePage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('ทั้งหมด');
  const categories = ['ทั้งหมด', 'งานช่าง', 'งานบ้าน', 'ขนส่ง', 'ทั่วไป'];

  const filteredServices = activeCategory === 'ทั้งหมด' 
    ? mockServices 
    : mockServices.filter((s) => s.category === activeCategory);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 max-w-md mx-auto relative">
      {/* Header สไตล์จงเจริญ (Blue Background) */}
      <div className="bg-blue-600 px-4 py-5 shadow-lg sticky top-0 z-10 rounded-b-2xl flex justify-between items-center">
        <h1 className="text-xl font-extrabold text-white">หาคนช่วยงาน ✨</h1>
        <button 
          onClick={() => router.push('/services/new')}
          className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold py-2 px-5 rounded-full text-sm transition shadow"
        >
          + ลงรับงาน
        </button>
      </div>

      {/* Categories Filter (ปุ่มเลือกหมวดหมู่สไตล์เป็นกันเอง) */}
      <div className="bg-white px-4 py-4 border-b border-gray-100 flex gap-2 overflow-x-auto scrollbar-hide snap-x mt-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`snap-start whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
              activeCategory === cat 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Service List (รายการผู้รับจ้างสไตล์ Modern Community) */}
      <div className="p-4 space-y-4 mt-2">
        {filteredServices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-base font-medium">ยังไม่มีบริการในหมวดหมู่นี้ค่ะ</p>
          </div>
        ) : (
          filteredServices.map((service) => (
            <div 
              key={service.id} 
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col cursor-pointer hover:shadow-xl hover:border-blue-100 transition-all active:scale-[0.98]" 
              onClick={() => router.push(`/services/${service.id}`)}
            >
              <div className="flex justify-between items-center mb-3">
                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full">
                  {service.category}
                </span>
                <span className="text-lg font-bold text-gray-400">
                  ID: {service.id}
                </span>
              </div>
              
              <h2 className="text-lg font-bold text-gray-800 line-clamp-1 mb-2 leading-tight">
                {service.title}
              </h2>
              <p className="text-base text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                {service.desc}
              </p>
              
              <div className="flex justify-between items-end border-t border-gray-100 pt-4 mt-1">
                <div>
                  <p className="text-xs text-gray-400 font-bold mb-0.5">ราคาเริ่มต้น</p>
                  <p className="text-2xl font-extrabold text-green-600">
                    {service.price} <span className="text-lg">บาท</span>
                  </p>
                </div>
                <span className="text-blue-600 text-sm font-bold flex items-center gap-1.5">ดูโปรไฟล์ →</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

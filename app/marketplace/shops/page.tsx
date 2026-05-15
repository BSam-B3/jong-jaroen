"use client"; // เพิ่มบรรทัดนี้เข้ามาบรรทัดแรกสุดเลยค่ะ

import { useEffect, useState } from 'react';
import { shopService } from '@/services/shopService';
import { Shop } from '@/types/shop';

export default function MarketplacePage() {
  const [shops, setShops] = useState<Shop[]>([]);

  useEffect(() => {
    shopService.getAllShops().then(setShops);
  }, []);

  return (
    <div className="p-4 bg-black min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6 text-[#deff9a]">ตลาดชุมชนแกลง</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shops.map((shop) => (
          <div key={shop.id} className="bg-[#111] border border-[#333] rounded-3xl p-5 relative overflow-hidden">
            {/* ป้าย Verified 100 บาท/เดือน */}
            {shop.is_verified && (
              <div className="absolute top-0 right-0 bg-[#deff9a] text-black px-3 py-1 rounded-bl-xl text-xs font-bold">
                <i className="fa-solid fa-check-circle mr-1"></i> ยืนยันแล้ว
              </div>
            )}
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#222] rounded-2xl overflow-hidden border border-[#333]">
                 <img src={shop.logo_url || '/placeholder-shop.png'} alt={shop.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{shop.name}</h2>
                <p className="text-sm text-[#daffde] line-clamp-1">{shop.description}</p>
              </div>
            </div>
            
            <button className="w-full mt-5 bg-[#deff9a] text-black py-3 rounded-2xl font-bold hover:bg-white transition-all">
               ดูเมนูสินค้า
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

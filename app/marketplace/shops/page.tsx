"use client";

import { useEffect, useState } from 'react';
// ใช้ Path ถอยหลัง 2 ขั้นเพื่อไปหาโฟลเดอร์ services
import { shopService, Shop } from '../../services/shopService';

export default function MarketplacePage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const data = await shopService.getAllShops();
        setShops(data);
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, []);

  if (loading) {
    return <div className="p-10 text-white bg-black min-h-screen">กำลังโหลดตลาดชุมชนแกลง...</div>;
  }

  return (
    <div className="p-4 bg-black min-h-screen text-white pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-[#deff9a]">ตลาดชุมชนแกลง</h1>
        <div className="bg-[#222] p-2 rounded-full">
           <i className="fa-solid fa-store text-[#deff9a]"></i>
        </div>
      </div>
      
      {shops.length === 0 ? (
        <div className="text-gray-500 text-center mt-20">ยังไม่มีร้านค้าในขณะนี้</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => (
            <div key={shop.id} className="bg-[#111] border border-[#333] rounded-[32px] p-5 relative overflow-hidden transition-all hover:border-[#deff9a]">
              {/* ป้ายการันตี (สำหรับร้านที่จ่าย 100 บาท/เดือน) */}
              {shop.is_verified && (
                <div className="absolute top-0 right-0 bg-[#deff9a] text-black px-4 py-1 rounded-bl-2xl text-[10px] font-bold uppercase tracking-wider">
                  <i className="fa-solid fa-circle-check mr-1"></i> ยืนยันแล้ว
                </div>
              )}
              
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-[#222] rounded-[24px] overflow-hidden border border-[#333] flex-shrink-0">
                   <img 
                    src={shop.logo_url || 'https://via.placeholder.com/150'} 
                    alt={shop.name} 
                    className="w-full h-full object-cover" 
                   />
                </div>
                <div className="flex-grow">
                  <h2 className="text-xl font-bold leading-tight mb-1">{shop.name}</h2>
                  <p className="text-sm text-gray-400 line-clamp-2">{shop.description || 'ไม่มีรายละเอียดร้านค้า'}</p>
                </div>
              </div>
              
              <button 
                onClick={() => window.location.href = `/marketplace/shops/${shop.id}`}
                className="w-full mt-6 bg-[#deff9a] text-black py-4 rounded-[20px] font-bold text-lg hover:bg-white active:scale-95 transition-all shadow-lg shadow-[#deff9a]/10"
              >
                 ดูเมนูสินค้า
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

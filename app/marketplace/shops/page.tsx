"use client";

import { useEffect, useState } from 'react';
import { shopService, Shop } from '../../services/shopService';
import BottomNav from '@/app/components/BottomNav';

export default function MarketplacePage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ทั้งหมด');

  const categories = [
    { id: 1, label: 'ทั้งหมด', icon: '🏪' },
    { id: 2, label: 'ของกิน', icon: '🍚' },
    { id: 3, label: 'ขนม', icon: '🍰' },
    { id: 4, label: 'เครื่องดื่ม', icon: '🥤' },
    { id: 5, label: 'ของใช้', icon: '🛒' },
  ];

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
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#EE4D2D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-32">
      <div className="w-full lg:max-w-5xl xl:max-w-6xl bg-[#F8FAFC] min-h-screen relative flex flex-col md:shadow-2xl overflow-x-hidden md:border-x border-gray-200/50">
        
        {/* 🟠 Top Header (Shopee Style) */}
        <div className="bg-[#EE4D2D] p-6 pt-10 rounded-b-[2rem] shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-white text-2xl font-black tracking-tight">ตลาดชุมชนแกลง</h1>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white">
              <i className="fa-solid fa-magnifying-glass"></i>
            </div>
          </div>
          
          {/* 🍎 Category Slider */}
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.label)}
                className={`flex flex-col items-center min-w-[70px] p-2 rounded-2xl transition-all ${
                  activeTab === cat.label ? 'bg-white shadow-md' : 'bg-transparent'
                }`}
              >
                <span className="text-2xl mb-1">{cat.icon}</span>
                <span className={`text-[10px] font-black ${activeTab === cat.label ? 'text-[#EE4D2D]' : 'text-white'}`}>
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <main className="px-5 mt-6 space-y-8">
          
          {/* 🔥 ส่วนที่ 1: ร้านค้าโปรโมท (Featured Section) */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-gray-800 text-lg flex items-center gap-2">
                <span className="text-[#EE4D2D]">🔥</span> ร้านเด็ดแนะนำ
              </h2>
              <span className="text-xs font-bold text-gray-400">ดูทั้งหมด ›</span>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
              {shops.filter(s => s.is_verified).map((shop) => (
                <div 
                  key={shop.id}
                  onClick={() => window.location.href = `/marketplace/shops/${shop.id}`}
                  className="min-w-[200px] bg-white rounded-3xl p-4 shadow-sm border border-orange-100 relative group cursor-pointer"
                >
                  <div className="w-full h-28 bg-gray-100 rounded-2xl mb-3 overflow-hidden">
                    <img src={shop.logo_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt={shop.name} />
                  </div>
                  <h3 className="font-black text-gray-800 text-sm truncate">{shop.name}</h3>
                  <p className="text-[10px] text-gray-400 font-bold mt-1 line-clamp-1">{shop.description}</p>
                  <div className="mt-2 text-[#EE4D2D] text-[10px] font-black uppercase">ยืนยันแล้ว ✅</div>
                </div>
              ))}
            </div>
          </section>

          {/* 🍱 ส่วนที่ 2: สินค้าในชุมชน (Product Grid - ลูกค้าเลือกดูได้) */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-gray-800 text-lg flex items-center gap-2">
                <span className="text-orange-400">🍱</span> สินค้าพร้อมส่ง
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* ตัวอย่างสินค้า (ในงานจริงควรดึงจาก products table) */}
              {shops.slice(0, 4).map((shop) => (
                <div key={shop.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 flex flex-col">
                  <div className="relative h-32 bg-gray-200">
                    <img src={shop.logo_url} className="w-full h-full object-cover" alt="product" />
                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white text-[9px] px-2 py-1 rounded-md">
                      ส่งจาก {shop.name}
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-black text-gray-800 line-clamp-1">เมนูยอดฮิตจากร้านนี้</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[#EE4D2D] font-black text-sm">฿ 20.-</span>
                      <button className="bg-[#EE4D2D] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-md">+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 🏪 ส่วนที่ 3: รายชื่อร้านค้าทั้งหมด (General Shops) */}
          <section className="pb-10">
             <h2 className="font-black text-gray-800 text-lg mb-4 flex items-center gap-2">
                <span className="text-blue-400">🏪</span> ร้านค้าทั่วไป
              </h2>
              <div className="space-y-4">
                {shops.map((shop) => (
                  <div 
                    key={shop.id}
                    onClick={() => window.location.href = `/marketplace/shops/${shop.id}`}
                    className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center gap-4 hover:border-orange-200 transition-colors cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0">
                      <img src={shop.logo_url} className="w-full h-full object-cover" alt={shop.name} />
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-1">
                        <h4 className="font-black text-gray-800 text-base">{shop.name}</h4>
                        {shop.is_verified && <span className="text-[10px]">✅</span>}
                      </div>
                      <p className="text-[11px] text-gray-400 font-bold line-clamp-1">{shop.description}</p>
                    </div>
                    <div className="text-gray-300">
                      <i className="fa-solid fa-chevron-right text-xs"></i>
                    </div>
                  </div>
                ))}
              </div>
          </section>

        </main>

        <BottomNav />
      </div>
    </div>
  );
}

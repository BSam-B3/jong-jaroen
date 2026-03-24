'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ---------------------------------------------------------------------------
// 📦 ข้อมูลจำลอง (Mock Data) โครงสร้างตรงกับที่บรีฟให้คุณ C
// ---------------------------------------------------------------------------
const mockProviders = [
  {
    id: '1',
    name: 'ช่างสมหมาย แอร์เย็นฉ่ำ',
    category: 'ล้างแอร์',
    avatar: '👨‍🔧',
    rating: 4.9,
    reviewCount: 128,
    completedJobs: 350,
    isSponsored: true, // 🌟 ผู้สนับสนุน
    isNew: false,
    price: 'เริ่มต้น 500.-',
  },
  {
    id: '2',
    name: 'ลุงชัย ซ่อมประปา',
    category: 'ซ่อมประปา',
    avatar: '👴',
    rating: 4.8,
    reviewCount: 85,
    completedJobs: 210,
    isSponsored: false,
    isNew: false,
    price: 'ประเมินหน้างาน',
  },
  {
    id: '3',
    name: 'พี่นก แม่บ้านเนี๊ยบ',
    category: 'แม่บ้าน',
    avatar: '👩‍🍳',
    rating: 5.0,
    reviewCount: 42,
    completedJobs: 105,
    isSponsored: true, // 🌟 ผู้สนับสนุน
    isNew: false,
    price: 'ชม. ละ 150.-',
  },
  {
    id: '4',
    name: 'เอกชัย ไฟฟ้าด่วน',
    category: 'ช่างไฟ',
    avatar: '👷',
    rating: 4.5,
    reviewCount: 12,
    completedJobs: 25,
    isSponsored: false,
    isNew: true, // 🌱 หน้าใหม่
    price: 'เริ่มต้น 300.-',
  },
  {
    id: '5',
    name: 'วัยรุ่น ตัดหญ้าซิ่ง',
    category: 'ตัดหญ้า',
    avatar: '👦',
    rating: 0,
    reviewCount: 0,
    completedJobs: 2,
    isSponsored: false,
    isNew: true, // 🌱 หน้าใหม่
    price: 'เริ่มต้น 200.-',
  },
  {
    id: '6',
    name: 'ช่างยอด ซ่อมทุกอย่าง',
    category: 'ซ่อมประปา',
    avatar: '👨‍🔧',
    rating: 4.9,
    reviewCount: 320,
    completedJobs: 890,
    isSponsored: false, // ⭐ ยอดนิยม (งานเยอะ เรทติ้งสูง)
    isNew: false,
    price: 'เริ่มต้น 400.-',
  }
];

export default function ServicesPage() {
  const router = useRouter();
  
  // State สำหรับควบคุม Tab ที่เลือก
  const [activeTab, setActiveTab] = useState<'all' | 'sponsored' | 'popular' | 'new'>('all');

  // ลอจิกการกรองข้อมูล (Filtering Algorithm) ตามที่บีสามออกแบบ
  const filteredProviders = mockProviders.filter((provider) => {
    if (activeTab === 'sponsored') return provider.isSponsored;
    if (activeTab === 'popular') return provider.rating >= 4.8 && provider.completedJobs > 100;
    if (activeTab === 'new') return provider.isNew;
    return true; // 'all'
  }).sort((a, b) => {
    // ลอจิกเรียงลำดับเวลาอยู่หน้า "ทั้งหมด"
    if (activeTab === 'all') {
      if (a.isSponsored && !b.isSponsored) return -1; // สปอนเซอร์ขึ้นก่อน
      if (!a.isSponsored && b.isSponsored) return 1;
      return b.rating - a.rating; // ตามด้วยเรทติ้ง
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pb-24">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-x-hidden">
        
        {/* 🟠 Header */}
        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-b-[2.5rem] p-6 pt-12 shadow-md relative z-20">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-white text-2xl font-black tracking-tight">ค้นหาช่าง / บริการ</h1>
          </div>
          
          {/* แถบค้นหา */}
          <div className="bg-white rounded-2xl p-1.5 flex items-center shadow-lg shadow-black/5">
            <div className="pl-3 pr-2 text-gray-400">🔍</div>
            <input 
              type="text" 
              placeholder="ค้นหาชื่อช่าง, บริการ..." 
              className="w-full bg-transparent text-sm py-2 outline-none font-medium placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* 📑 Filter Tabs (Bucketing Logic) */}
        <div className="bg-white px-4 py-3 shadow-sm border-b border-gray-100 sticky top-0 z-10 flex gap-2 overflow-x-auto scrollbar-hide">
          <FilterTab 
            label="ทั้งหมด" 
            active={activeTab === 'all'} 
            onClick={() => setActiveTab('all')} 
          />
          <FilterTab 
            label="🌟 ผู้สนับสนุน" 
            active={activeTab === 'sponsored'} 
            onClick={() => setActiveTab('sponsored')} 
          />
          <FilterTab 
            label="⭐ ยอดนิยม" 
            active={activeTab === 'popular'} 
            onClick={() => setActiveTab('popular')} 
          />
          <FilterTab 
            label="🌱 หน้าใหม่" 
            active={activeTab === 'new'} 
            onClick={() => setActiveTab('new')} 
          />
        </div>

        {/* 📋 รายชื่อช่าง (Provider List) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide pb-24">
          
          {filteredProviders.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <div className="text-4xl mb-2">🤷‍♂️</div>
              <p className="text-sm font-medium">ไม่พบช่างในหมวดหมู่นี้</p>
            </div>
          ) : (
            filteredProviders.map((provider) => (
              <div key={provider.id} className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-gray-50 flex gap-4 active:scale-[0.98] transition-transform cursor-pointer hover:border-orange-100 hover:shadow-md relative overflow-hidden">
                
                {/* Badge 🌟 สปอนเซอร์ */}
                {provider.isSponsored && (
                  <div className="absolute -right-6 top-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[8px] font-black px-8 py-0.5 transform rotate-45 shadow-sm">
                    แนะนำ
                  </div>
                )}

                {/* Avatar */}
                <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-3xl shrink-0 border border-orange-100 shadow-inner">
                  {provider.avatar}
                </div>

                {/* ข้อมูล */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="bg-gray-100 text-gray-600 text-[9px] font-bold px-2 py-0.5 rounded-md">
                      {provider.category}
                    </span>
                    {provider.isNew && <span className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">🌱 หน้าใหม่</span>}
                  </div>
                  
                  <h3 className="font-bold text-gray-800 text-sm truncate pr-4">{provider.name}</h3>
                  
                  {/* Rating & Jobs */}
                  <div className="flex items-center gap-2 mt-1 text-[10px] font-medium text-gray-500">
                    <span className="flex items-center text-orange-500 font-bold">
                      ⭐ {provider.rating > 0 ? provider.rating : 'ไม่มีคะแนน'}
                    </span>
                    <span>•</span>
                    <span>ผ่านงาน {provider.completedJobs} ครั้ง</span>
                  </div>

                  {/* ราคา */}
                  <div className="mt-2 text-[#EE4D2D] font-bold text-[11px]">
                    {provider.price}
                  </div>
                </div>
              </div>
            ))
          )}

        </div>

        {/* ✅ Bottom Navigation */}
        <div className="fixed bottom-0 w-full sm:max-w-2xl md:max-w-3xl bg-white/95 backdrop-blur-md border-t border-gray-100 px-1 py-4 flex justify-between items-center shadow-[0_-4px_25px_rgba(0,0,0,0.06)] rounded-[2.5rem] z-50 rounded-b-none">
          <NavItem icon="🏠" label="หน้าแรก" active={false} onClick={() => router.push('/')} />
          <NavItem icon="🛠️" label="บริการ" active={true} onClick={() => {}} />
          <NavItem icon="📋" label="งานด่วน" active={false} onClick={() => router.push('/win-online')} />
          <NavItem icon="📰" label="ข่าวสาร" active={false} onClick={() => router.push('/news')} />
          <NavItem icon="🎟️" label="ปองเจริญ" active={false} onClick={() => router.push('/coupons')} />
          <NavItem icon="👤" label="ฉัน" active={false} onClick={() => router.push('/profile')} />
        </div>

      </div>

      {/* CSS ซ่อน Scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}

// Component สำหรับปุ่ม Filter Tab
function FilterTab({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm border ${
        active 
          ? 'bg-[#EE4D2D] text-white border-[#EE4D2D]' 
          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );
}

function NavItem({ icon, label, active, onClick }: any) {
  return (
    <div onClick={onClick} className={`flex flex-col items-center gap-1.5 cursor-pointer transition-all ${active ? 'scale-110' : 'opacity-40 hover:opacity-100'} flex-1`}>
      <span className="text-[22px]">{icon}</span>
      <span className={`text-[9px] font-bold ${active ? 'text-[#EE4D2D]' : 'text-gray-500'} whitespace-nowrap`}>{label}</span>
      {active && <div className="w-1.5 h-1.5 bg-[#EE4D2D] rounded-full shadow-sm mt-0.5"></div>}
    </div>
  );
}

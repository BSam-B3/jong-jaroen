'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// --- สร้าง Component หลักแยกออกมาเพื่อใช้ Suspense ครอบ (แก้ Error ของ Next.js) ---
function ServicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // ดึงค่าการค้นหาจาก URL (ถ้ามาจากหน้าโฮม)
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'ทั้งหมด';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  const CATEGORIES = ['ทั้งหมด', 'ล้างแอร์', 'ช่างไฟ', 'ประปา', 'แม่บ้าน', 'ซ่อมรถ', 'ขนส่ง', 'ย้ายบ้าน', 'อื่นๆ'];

  // 🚧 Mock Data (จำลองข้อมูลจากตาราง services + profiles)
  const MOCK_SERVICES = [
    { id: '1', provider_name: 'ช่างสมหมาย', avatar: '👨‍🔧', title: 'รับล้างแอร์ ซ่อมแอร์ เติมน้ำยา', category: 'ล้างแอร์', starting_price: 500, avg_rating: 4.9, review_count: 124 },
    { id: '2', provider_name: 'พี่วินัย', avatar: '👷‍♂️', title: 'เดินสายไฟ ซ่อมไฟช็อต ไฟดับ', category: 'ช่างไฟ', starting_price: 300, avg_rating: 4.8, review_count: 89 },
    { id: '3', provider_name: 'ป้าศรี', avatar: '👩‍🍳', title: 'รับทำความสะอาดบ้าน คอนโด', category: 'แม่บ้าน', starting_price: 600, avg_rating: 5.0, review_count: 205 },
    { id: '4', provider_name: 'ช่างเอก', avatar: '🚰', title: 'ซ่อมท่อประปารั่ว ปั๊มน้ำไม่ทำงาน', category: 'ประปา', starting_price: 400, avg_rating: 4.5, review_count: 42 },
    { id: '5', provider_name: 'อู่ช่างแมว', avatar: '🔧', title: 'ปะยาง เปลี่ยนถ่ายน้ำมันเครื่อง นอกสถานที่', category: 'ซ่อมรถ', starting_price: 200, avg_rating: 4.7, review_count: 67 },
  ];

  // ฟิลเตอร์ข้อมูลตาม ค้นหา + หมวดหมู่
  const filteredServices = MOCK_SERVICES.filter(service => {
    const matchCategory = activeCategory === 'ทั้งหมด' || service.category === activeCategory;
    const matchSearch = service.title.includes(searchQuery) || service.provider_name.includes(searchQuery);
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pb-24">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-x-hidden rounded-t-[2.5rem]">
        
        {/* ✅ 🟠 Header ปรับไล่สีส้ม-ทอง และข้อความ (ตามโทนสีใหม่) */}
        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-b-[2.5rem] pt-12 pb-6 px-6 shadow-md relative z-10">
          <div className="flex items-center gap-3 mb-5 px-2">
            <button onClick={() => router.push('/')} className="text-white font-bold text-lg active:scale-90 transition-transform">←</button>
            <h1 className="text-xl font-black text-white tracking-tight">ค้นหาบริการ</h1>
          </div>

          {/* Search Box */}
          <div className="relative mx-2">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <span className="text-gray-400 text-lg">🔍</span>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาช่าง, บริการ..."
              className="w-full bg-white text-gray-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold shadow-lg outline-none focus:ring-4 focus:ring-white/30 transition-all placeholder:font-medium placeholder:text-gray-400"
            />
          </div>
        </div>

        <main className="flex-1 relative z-20 space-y-4">
          
          {/* 🏷️ หมวดหมู่ (Horizontal Scroll) */}
          <div className="pt-5 pb-2 pl-5">
            <div className="flex gap-2 overflow-x-auto pr-5 snap-x hide-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`snap-start whitespace-nowrap px-5 py-2 rounded-full text-[11px] font-bold border transition-all ${
                    activeCategory === cat 
                      ? 'bg-[#EE4D2D] text-white border-[#EE4D2D] shadow-md' 
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-orange-50 hover:text-[#EE4D2D] hover:border-orange-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 📋 รายการบริการ */}
          <div className="px-5 pb-6 space-y-4">
            <div className="flex justify-between items-end mb-2 px-1">
              <h2 className="text-sm font-black text-gray-800">
                {activeCategory === 'ทั้งหมด' ? 'บริการแนะนำสำหรับคุณ' : `บริการหมวด: ${activeCategory}`}
              </h2>
              <span className="text-[10px] text-gray-500 font-bold">เจอ {filteredServices.length} รายการ</span>
            </div>

            {filteredServices.length === 0 ? (
              <div className="bg-white rounded-[2rem] p-10 text-center shadow-sm border border-gray-100">
                <div className="text-5xl mb-3 opacity-40">🕵️‍♂️</div>
                <p className="font-bold text-gray-700">ไม่พบบริการที่ค้นหา</p>
                <p className="text-[10px] text-gray-500 mt-1">ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่ใหม่ดูนะคะ</p>
                <button 
                  onClick={() => {setSearchQuery(''); setActiveCategory('ทั้งหมด');}}
                  className="mt-4 text-[#EE4D2D] text-xs font-bold underline underline-offset-2"
                >
                  ดูบริการทั้งหมด
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredServices.map((service) => (
                  <div key={service.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex gap-4 hover:border-[#EE4D2D]/30 transition-all cursor-pointer active:scale-[0.98]">
                    
                    {/* รูปภาพ/อวาตาร์ */}
                    <div className="w-20 h-20 bg-orange-50 rounded-2xl flex flex-col items-center justify-center text-3xl border border-orange-100 shrink-0 relative">
                      {service.avatar}
                      <span className="absolute bottom-0 right-0 text-[7px] font-bold text-[#EE4D2D] bg-white px-1.5 py-0.5 rounded-full border border-orange-100">{service.category}</span>
                    </div>

                    {/* ข้อมูล */}
                    <div className="flex-1 min-w-0 py-1">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-black text-gray-800 text-sm leading-tight line-clamp-2">{service.title}</h3>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1 font-medium flex items-center gap-1">
                        👤 {service.provider_name}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-gray-50">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400 text-[11px]">★</span>
                          <span className="text-[11px] font-bold text-gray-700">{service.avg_rating.toFixed(1)}</span>
                          <span className="text-[9px] text-gray-400 ml-0.5">({service.review_count})</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-gray-400 font-medium shrink-0">เริ่มต้น</span>
                          <span className="text-sm font-black text-[#EE4D2D] ml-1">฿{service.starting_price.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* ✅ ✅ ✅ Bottom Nav ปรับปรุงใหม่เหลือ 4 ไอคอน คลีนๆ (Active: บริการ) ✅ ✅ ✅ */}
        <div className="fixed bottom-0 w-full sm:max-w-2xl md:max-w-3xl bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 py-4 flex justify-around items-center shadow-[0_-4px_25px_rgba(0,0,0,0.06)] rounded-t-[2.5rem] z-50">
          <NavItem icon="🏠" label="หน้าแรก" active={false} onClick={() => router.push('/')} />
          
          {/* ✅ Active: บริการ */}
          <NavItem icon="🛠️" label="บริการ" active={true} onClick={() => {}} />

          <NavItem icon="📋" label="งานด่วน" active={false} onClick={() => router.push('/win-online')} />
          {/* ยุบรวม ประวัติ ไปอยู่ใน ฉัน แล้ว */}
          <NavItem icon="👤" label="ฉัน" active={false} onClick={() => router.push('/profile')} />
        </div>

        <style dangerouslySetInnerHTML={{__html: `
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}} />
      </div>
    </div>
  );
}

// คอมโพเนนต์เมนูด้านล่าง ปรับปรุงใหม่
function NavItem({ icon, label, active, onClick }: any) {
  return (
    <div onClick={onClick} className={`flex flex-col items-center gap-1.5 cursor-pointer transition-all ${active ? 'scale-110' : 'opacity-40 hover:opacity-100'} w-16`}>
      <span className="text-2xl">{icon}</span>
      <span className={`text-[10px] font-bold ${active ? 'text-[#EE4D2D]' : 'text-gray-500'}`}>{label}</span>
      {active && <div className="w-1.5 h-1.5 bg-[#EE4D2D] rounded-full shadow-sm mt-0.5"></div>}
    </div>
  );
}

// ครอบด้วย Suspense ตามข้อบังคับของ Next.js เวลามีการใช้ useSearchParams
export default function ServicesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center rounded-t-[2.5rem]">
        <div className="text-center"><div className="text-4xl animate-bounce mb-2 text-[#EE4D2D]">🛠️</div><p className="font-bold text-gray-500">กำลังโหลดบริการ...</p></div>
      </div>
    }>
      <ServicesContent />
    </Suspense>
  );
}

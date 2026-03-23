'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HistoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all'); // all, active, completed, cancelled

  // 🚧 Mock Data สำหรับประวัติการจ้างงาน
  const MOCK_HISTORY = [
    {
      id: 'h1',
      service: 'ล้างแอร์',
      provider: 'ช่างสมหมาย',
      icon: '❄️',
      date: '20 มี.ค. 2569 - 14:00 น.',
      price: '500',
      status: 'completed',
      statusText: 'เสร็จสิ้น',
      color: 'bg-green-100 text-green-700',
      dot: 'bg-green-500'
    },
    {
      id: 'h2',
      service: 'วินมอเตอร์ไซค์',
      provider: 'พี่วินัย',
      icon: '🛵',
      date: '18 มี.ค. 2569 - 09:30 น.',
      price: '40',
      status: 'completed',
      statusText: 'เสร็จสิ้น',
      color: 'bg-green-100 text-green-700',
      dot: 'bg-green-500'
    },
    {
      id: 'h3',
      service: 'ซ่อมท่อประปา',
      provider: 'ช่างเอก',
      icon: '🚰',
      date: '23 มี.ค. 2569 - 10:00 น.',
      price: 'ประเมินราคาหน้างาน',
      status: 'active',
      statusText: 'กำลังดำเนินการ',
      color: 'bg-orange-100 text-orange-700',
      dot: 'bg-orange-500 animate-pulse'
    },
    {
      id: 'h4',
      service: 'แม่บ้านทำความสะอาด',
      provider: 'ป้าศรี',
      icon: '🧹',
      date: '15 มี.ค. 2569 - 13:00 น.',
      price: '600',
      status: 'cancelled',
      statusText: 'ยกเลิกแล้ว',
      color: 'bg-gray-100 text-gray-500',
      dot: 'bg-gray-400'
    }
  ];

  const filteredHistory = MOCK_HISTORY.filter(item => activeTab === 'all' || item.status === activeTab);

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pb-24">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-x-hidden">
        
        {/* ส่วนเนื้อหาที่ Scroll ได้ */}
        <div className="flex-1 overflow-y-auto pb-6 scrollbar-hide">
          
          {/* ✅ 🟠 Header ปรับเป็น "การ์ดลอย" สีส้ม-ทอง มุมมน 4 ด้าน */}
          <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-[2.5rem] p-6 pt-8 shadow-md relative z-10 m-3 mt-4 overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex items-center gap-3 mb-4 px-2 relative z-10">
              <button onClick={() => router.back()} className="text-white font-bold text-lg active:scale-90 transition-transform">←</button>
              <div className="space-y-0.5 text-left">
                <h1 className="text-white text-xl font-black drop-shadow-md tracking-tight flex items-center gap-2">
                  📜 ประวัติรายการ
                </h1>
                <p className="text-white/90 text-[11px] font-medium">
                  ประวัติการจ้างงานและเรียกใช้บริการของคุณ
                </p>
              </div>
            </div>

            {/* 🔘 Tabs ตัวกรองสถานะ */}
            <div className="flex gap-2 pl-2 relative z-10 overflow-x-auto hide-scrollbar pb-1">
              <button 
                onClick={() => setActiveTab('all')}
                className={`shrink-0 px-4 py-1.5 rounded-full text-[10px] font-bold transition-all shadow-sm ${activeTab === 'all' ? 'bg-white text-[#EE4D2D]' : 'bg-white/20 text-white border border-white/30 hover:bg-white/30'}`}
              >
                ทั้งหมด
              </button>
              <button 
                onClick={() => setActiveTab('active')}
                className={`shrink-0 px-4 py-1.5 rounded-full text-[10px] font-bold transition-all shadow-sm ${activeTab === 'active' ? 'bg-white text-orange-500' : 'bg-white/20 text-white border border-white/30 hover:bg-white/30'}`}
              >
                กำลังดำเนินการ
              </button>
              <button 
                onClick={() => setActiveTab('completed')}
                className={`shrink-0 px-4 py-1.5 rounded-full text-[10px] font-bold transition-all shadow-sm ${activeTab === 'completed' ? 'bg-white text-green-600' : 'bg-white/20 text-white border border-white/30 hover:bg-white/30'}`}
              >
                เสร็จสิ้น
              </button>
              <button 
                onClick={() => setActiveTab('cancelled')}
                className={`shrink-0 px-4 py-1.5 rounded-full text-[10px] font-bold transition-all shadow-sm ${activeTab === 'cancelled' ? 'bg-white text-gray-600' : 'bg-white/20 text-white border border-white/30 hover:bg-white/30'}`}
              >
                ยกเลิก
              </button>
            </div>
          </div>

          <main className="px-5 mt-2 relative z-20 space-y-3">
            
            {filteredHistory.length === 0 ? (
               <div className="text-center py-12 bg-white rounded-[2rem] border border-gray-100 shadow-sm mt-4">
                 <div className="text-4xl mb-3 opacity-40">📭</div>
                 <p className="font-bold text-gray-700 text-sm">ไม่มีประวัติรายการ</p>
                 <p className="text-[10px] text-gray-500 mt-1">ยังไม่มีการทำรายการในหมวดหมู่นี้</p>
               </div>
            ) : (
              filteredHistory.map((item) => (
                <div key={item.id} className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 relative overflow-hidden active:scale-[0.98] transition-transform cursor-pointer hover:border-[#EE4D2D]/30">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-gray-100 shrink-0">
                        {item.icon}
                      </div>
                      <div>
                        <h3 className="font-black text-gray-800 text-sm">{item.service}</h3>
                        <p className="text-[10px] text-gray-500 mt-0.5 font-medium">
                          👤 {item.provider}
                        </p>
                      </div>
                    </div>
                    {/* สถานะ */}
                    <div className={`px-2 py-1 rounded-full text-[9px] font-bold flex items-center gap-1.5 shadow-sm border border-white ${item.color}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${item.dot}`}></div>
                      {item.statusText}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-400">📅</span>
                      <span className="text-[10px] font-medium text-gray-500">{item.date}</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-black ${item.price === 'ประเมินราคาหน้างาน' ? 'text-orange-500 text-xs' : 'text-[#EE4D2D]'}`}>
                        {item.price !== 'ประเมินราคาหน้างาน' ? '฿' : ''}{item.price}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}

          </main>
        </div>

        {/* ✅ Bottom Navigation อัปเดตให้มี 6 ไอคอน (Active: ฉัน) */}
        <div className="fixed bottom-0 w-full sm:max-w-2xl md:max-w-3xl bg-white/95 backdrop-blur-md border-t border-gray-100 px-1 py-4 flex justify-between items-center shadow-[0_-4px_25px_rgba(0,0,0,0.06)] rounded-t-[2.5rem] z-50">
          <NavItem icon="🏠" label="หน้าแรก" active={false} onClick={() => router.push('/')} />
          <NavItem icon="🛠️" label="บริการ" active={false} onClick={() => router.push('/services')} />
          <NavItem icon="📋" label="งานด่วน" active={false} onClick={() => router.push('/win-online')} />
          <NavItem icon="📰" label="ข่าวสาร" active={false} onClick={() => router.push('/news')} />
          <NavItem icon="🎟️" label="ปองเจริญ" active={false} onClick={() => router.push('/coupons')} />
          <NavItem icon="👤" label="ฉัน" active={true} onClick={() => router.push('/profile')} />
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}

// คอมโพเนนต์เมนูด้านล่าง ปรับปรุงใหม่ใช้ flex-1
function NavItem({ icon, label, active, onClick }: any) {
  return (
    <div onClick={onClick} className={`flex flex-col items-center gap-1.5 cursor-pointer transition-all ${active ? 'scale-110' : 'opacity-40 hover:opacity-100'} flex-1`}>
      <span className="text-[22px]">{icon}</span>
      <span className={`text-[9px] font-bold ${active ? 'text-[#EE4D2D]' : 'text-gray-500'} whitespace-nowrap`}>{label}</span>
      {active && <div className="w-1.5 h-1.5 bg-[#EE4D2D] rounded-full shadow-sm mt-0.5"></div>}
    </div>
  );
}

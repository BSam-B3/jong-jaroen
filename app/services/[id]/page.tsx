'use client';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

// ── Soft Shopee Palette ─────────────────────────────────────────
const themePalette = {
  primaryOrange: '#F05D40', 
  lightOrange: '#FF8769',   
  bgGray: '#F4F6F8', // ปรับให้เทาอมฟ้าสว่างขึ้นนิดนึงเพื่อให้ Card ดูโดดเด่น     
};

// 🌟 Mock Data อัปเกรดรายละเอียดให้แน่นแบบ Fastwork 🌟
const mockProfile = {
  id: '1',
  name: 'ลุงชม ช่างแอร์ประแส',
  title: 'รับซ่อมแอร์ ล้างแอร์ เครื่องใช้ไฟฟ้าทุกชนิด เคลียร์จบทุกอาการ',
  rating: 4.8,
  reviews: 24,
  verified: true,
  price: 500,
  category: 'ช่าง / ล้างแอร์',
  deliveryTime: 'ภายใน 1 วัน',
  revisions: 'รับประกัน 30 วัน',
  workType: 'บริการรายครั้ง',
  desc: 'บริการล้างแอร์ ซ่อมแอร์ ย้ายแอร์ เติมน้ำยาแอร์ ในเขตพื้นที่ปากน้ำประแสและใกล้เคียง\n\n✓ ล้างแอร์สะอาดหมดจดด้วยปั๊มแรงดันสูง\n✓ ตรวจเช็คระบบไฟและน้ำยาแอร์ฟรีทุกครั้ง\n✓ รับประกันงานซ่อมนาน 30 วัน หากมีปัญหาเรียกซ้ำได้\n✓ ช่างในพื้นที่ ไว้ใจได้ ไม่ทิ้งงานแน่นอนครับ',
  steps: [
    'ลูกค้าทักแชทแจ้งอาการ หรือส่งรูปหน้างาน',
    'ช่างประเมินราคาเบื้องต้นและนัดหมายวันเวลา',
    'เข้าหน้างานเพื่อดำเนินการซ่อม/ล้าง',
    'ทดสอบระบบ ส่งมอบงาน และชำระเงิน'
  ],
  gallery: [
    'https://placehold.co/400x300/FFF3F0/F05D40?text=ผลงานที่+1',
    'https://placehold.co/400x300/FFF3F0/F05D40?text=ผลงานที่+2',
    'https://placehold.co/400x300/FFF3F0/F05D40?text=ผลงานที่+3'
  ]
};

export default function ServiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [loadingChat, setLoadingChat] = useState(false);

  const handleChatClick = () => {
    setLoadingChat(true);
    setTimeout(() => {
      alert('จำลองการเปิดห้องแชท (รอเชื่อมต่อ Backend)');
      setLoadingChat(false);
    }, 800);
  };

  return (
    <div className="min-h-screen pb-28 max-w-md mx-auto relative selection:bg-orange-200" style={{ backgroundColor: themePalette.bgGray }}>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* ── Header ── */}
      <div className="bg-white px-4 py-3 sticky top-0 z-10 border-b border-gray-100 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.back()} className="p-1.5 hover:bg-orange-50 rounded-full transition text-gray-600 hover:text-[#F05D40]">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-[17px] font-bold text-gray-800">รายละเอียดบริการ</h1>
      </div>

      <main className="px-3 mt-3 space-y-3">
        
        {/* ── Profile & Title Section ── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-orange-50 border border-orange-100 rounded-full flex items-center justify-center text-3xl shrink-0">
              👨‍🔧
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-gray-800 flex items-center gap-1.5">
                {mockProfile.name}
                {mockProfile.verified && (
                  <svg className="w-4 h-4 text-[#F05D40]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                )}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1 font-medium">
                <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                  ⭐ {mockProfile.rating} <span className="text-gray-400 font-medium">({mockProfile.reviews} รีวิว)</span>
                </span>
                <span>•</span>
                <span className="text-green-600 font-semibold bg-green-50 px-1.5 py-0.5 rounded">ออนไลน์</span>
              </div>
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900 leading-tight">{mockProfile.title}</h3>
        </div>

        {/* ── Metadata Grid (สไตล์ Fastwork) ── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h4 className="text-[15px] font-bold text-gray-800 mb-4 border-l-4 border-[#F05D40] pl-2">ข้อมูลเบื้องต้น</h4>
          <div className="grid grid-cols-2 gap-y-4 gap-x-4">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 mb-0.5">หมวดหมู่งาน</p>
              <p className="text-sm font-semibold text-gray-800">{mockProfile.category}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 mb-0.5">ลักษณะการจ้าง</p>
              <p className="text-sm font-semibold text-gray-800">{mockProfile.workType}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 mb-0.5">ระยะเวลาดำเนินการ</p>
              <p className="text-sm font-semibold text-gray-800">{mockProfile.deliveryTime}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 mb-0.5">การรับประกัน/แก้ไข</p>
              <p className="text-sm font-semibold text-gray-800">{mockProfile.revisions}</p>
            </div>
          </div>
        </div>

        {/* ── Detail Section ── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h4 className="text-[15px] font-bold text-gray-800 mb-3 border-l-4 border-[#F05D40] pl-2">รายละเอียดบริการ</h4>
          <p className="text-[14px] text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50/50 p-4 rounded-xl border border-gray-100">{mockProfile.desc}</p>
        </div>

        {/* ── Work Steps ── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h4 className="text-[15px] font-bold text-gray-800 mb-4 border-l-4 border-[#F05D40] pl-2">ขั้นตอนการทำงาน</h4>
          <div className="space-y-4">
            {mockProfile.steps.map((step, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-orange-100 text-[#F05D40] flex items-center justify-center text-xs font-bold shrink-0">
                    {index + 1}
                  </div>
                  {index !== mockProfile.steps.length - 1 && <div className="w-0.5 h-full bg-orange-100 mt-1"></div>}
                </div>
                <p className="text-sm text-gray-700 font-medium pt-0.5 pb-2">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Gallery ── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h4 className="text-[15px] font-bold text-gray-800 mb-3 border-l-4 border-[#F05D40] pl-2">ตัวอย่างผลงาน</h4>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x">
            {mockProfile.gallery.map((img, idx) => (
              <img 
                key={idx} 
                src={img} 
                alt={`ผลงาน ${idx + 1}`} 
                className="snap-start w-48 h-32 object-cover rounded-xl border border-gray-200 shrink-0 bg-gray-50" 
              />
            ))}
          </div>
        </div>

        {/* ── Trust Banner (เลียนแบบ Fastwork) ── */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 items-start mt-2">
          <div className="text-blue-500 mt-0.5">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
          </div>
          <p className="text-xs text-blue-800 font-medium leading-relaxed">
            <span className="font-bold">แนะนำ!</span> พูดคุยตกลงรายละเอียดและชำระเงินผ่านระบบ "จงเจริญ" เพื่อความปลอดภัย และรับการคุ้มครองหากเกิดปัญหา
          </p>
        </div>

      </main>

      {/* ── Bottom Action Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 max-w-md mx-auto flex items-center justify-between z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.04)] pb-safe">
        <div>
          <p className="text-[11px] text-gray-500 font-medium mb-0.5">ราคาเริ่มต้น</p>
          <div className="flex items-baseline gap-1">
            <p className="text-2xl font-black text-[#F05D40]">฿{mockProfile.price}</p>
          </div>
        </div>
        <button 
          onClick={handleChatClick}
          disabled={loadingChat}
          className="bg-[#F05D40] hover:bg-[#E04D30] active:scale-95 text-white px-8 py-3.5 rounded-xl font-bold text-[15px] transition-all flex items-center gap-2 shadow-lg shadow-orange-200/50 disabled:opacity-50"
        >
          {loadingChat ? 'กำลังโหลด...' : '💬 ทักแชทสอบถาม'}
        </button>
      </div>
    </div>
  );
}

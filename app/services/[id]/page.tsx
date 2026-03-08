'use client';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

// ── Soft Shopee Palette ─────────────────────────────────────────
const themePalette = {
  primaryOrange: '#F05D40', 
  lightOrange: '#FF8769',   
  bgGray: '#F9FAFB',        
};

// Mock Data
const mockProfile = {
  id: '1',
  name: 'ลุงชม ช่างแอร์ประแส',
  title: 'รับซ่อมแอร์ ล้างแอร์ เครื่องใช้ไฟฟ้าทุกชนิด',
  rating: 4.8,
  reviews: 24,
  verified: true,
  price: 500,
  desc: 'รับประกันงานซ่อม 30 วัน ล้างแอร์สะอาดหมดจด เติมน้ำยาแอร์เช็คระบบไฟฟรีครับ เรียกใช้บริการได้เลย',
  gallery: [
    'https://placehold.co/400x300/F9FAFB/F05D40?text=Portfolio+1',
    'https://placehold.co/400x300/F9FAFB/F05D40?text=Portfolio+2'
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
    <div className="min-h-screen pb-24 max-w-md mx-auto relative" style={{ backgroundColor: themePalette.bgGray }}>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* ── Header ── */}
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 hover:bg-orange-50 rounded-full transition text-gray-700 hover:text-[#F05D40]">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-base font-bold text-gray-800">รายละเอียดบริการ</h1>
      </div>

      {/* ── Profile Section ── */}
      <div className="bg-white p-5">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 bg-orange-50 border border-orange-100 rounded-full flex items-center justify-center text-3xl shrink-0">
            👨‍🔧
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-1.5">
              {mockProfile.name}
              {mockProfile.verified && (
                <svg className="w-4 h-4 text-[#F05D40]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              )}
            </h2>
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
              <span className="text-amber-500 text-base">⭐</span>
              <span className="font-bold text-gray-700">{mockProfile.rating}</span>
              <span>({mockProfile.reviews})</span>
            </div>
          </div>
        </div>
        
        <h3 className="text-base font-bold text-gray-900 mb-2 leading-tight">{mockProfile.title}</h3>
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{mockProfile.desc}</p>
      </div>

      {/* ── Gallery ── */}
      <div className="bg-white p-5 mt-2">
        <h3 className="text-base font-bold text-gray-900 mb-4">ผลงานที่ผ่านมา</h3>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x">
          {mockProfile.gallery.map((img, idx) => (
            <img 
              key={idx} 
              src={img} 
              alt={`ผลงาน ${idx + 1}`} 
              className="snap-start w-40 h-28 object-cover rounded-xl border border-gray-100 shrink-0 bg-gray-50" 
            />
          ))}
        </div>
      </div>

      {/* ── Bottom Action Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 max-w-md mx-auto flex items-center justify-between z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] pb-safe">
        <div>
          <p className="text-[11px] text-gray-500 font-medium mb-0.5">ราคาเริ่มต้น</p>
          <div className="flex items-baseline gap-1">
            <p className="text-xl font-black text-[#F05D40]">฿{mockProfile.price}</p>
          </div>
        </div>
        <button 
          onClick={handleChatClick}
          disabled={loadingChat}
          className="bg-[#F05D40] hover:bg-[#E04D30] active:scale-95 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-md shadow-orange-200 disabled:opacity-50"
        >
          {loadingChat ? 'กำลังโหลด...' : '💬 ทักแชทสอบถาม'}
        </button>
      </div>
    </div>
  );
}

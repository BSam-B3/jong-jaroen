'use client';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

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
    'https://placehold.co/400x300/e2e8f0/475569?text=Portfolio+1',
    'https://placehold.co/400x300/e2e8f0/475569?text=Portfolio+2'
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
    <div className="min-h-screen bg-gray-50 pb-24 max-w-md mx-auto relative">
      {/* Header */}
      <div className="bg-white px-4 py-3 sticky top-0 z-10 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 hover:bg-gray-100 rounded-full transition">
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <h1 className="text-base font-semibold text-gray-800 truncate">รายละเอียดบริการ</h1>
      </div>

      {/* Profile Section */}
      <div className="bg-white p-5 border-b border-gray-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl shrink-0">
            👨‍🔧
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-1.5">
              {mockProfile.name}
              {mockProfile.verified && (
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              )}
            </h2>
            <div className="flex items-center gap-1 text-sm text-gray-600 mt-0.5">
              <span className="text-yellow-400">★</span>
              <span className="font-medium">{mockProfile.rating}</span>
              <span className="text-gray-400">({mockProfile.reviews})</span>
            </div>
          </div>
        </div>
        
        <h3 className="text-base font-semibold text-gray-900 mb-2">{mockProfile.title}</h3>
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{mockProfile.desc}</p>
      </div>

      {/* Gallery */}
      <div className="bg-white p-5 mt-2 border-y border-gray-100">
        <h3 className="text-base font-semibold text-gray-900 mb-3">ผลงานที่ผ่านมา</h3>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {mockProfile.gallery.map((img, idx) => (
            <img 
              key={idx} 
              src={img} 
              alt={`ผลงาน ${idx + 1}`} 
              className="w-40 h-28 object-cover rounded-lg border border-gray-200 shrink-0" 
            />
          ))}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto flex items-center justify-between z-20">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">ราคาเริ่มต้น</p>
          <p className="text-xl font-bold text-green-600">฿{mockProfile.price}</p>
        </div>
        <button 
          onClick={handleChatClick}
          disabled={loadingChat}
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
        >
          {loadingChat ? 'กำลังโหลด...' : '💬 ทักแชทสอบถาม'}
        </button>
      </div>
    </div>
  );
}

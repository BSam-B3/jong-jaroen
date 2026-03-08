'use client';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

// Mock Data สำหรับหน้าโปรไฟล์ผู้รับจ้าง (UI ล้วนๆ)
const mockProfile = {
  id: '1',
  name: 'ลุงชม ช่างแอร์ประแส',
  title: 'รับซ่อมแอร์ ล้างแอร์ เครื่องใช้ไฟฟ้าทุกชนิด',
  rating: 4.8,
  reviews: 24,
  verified: true,
  price: 500,
  desc: 'ลุงชมเป็นช่างเก่าแก่ในพื้นที่ปากน้ำประแส รับประกันงานซ่อม 30 วัน ล้างแอร์สะอาดหมดจด เติมน้ำยาแอร์เช็คระบบไฟฟรีครับ เรียกใช้บริการได้เลย',
  gallery: [
    'https://placehold.co/400x300/e2e8f0/475569?text=Air+Conditioner+1',
    'https://placehold.co/400x300/e2e8f0/475569?text=Air+Conditioner+2'
  ]
};

export default function ServiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [loadingChat, setLoadingChat] = useState(false);

  // ฟังก์ชันกดทักแชทจำลอง
  const handleChatClick = () => {
    setLoadingChat(true);
    setTimeout(() => {
      alert('เจมจำลองการกดทักแชทค่ะ! ห้องแชทจะถูกสร้างขึ้นเมื่อเชื่อมระบบกับ C ค่ะ');
      setLoadingChat(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col mx-auto max-w-md relative pb-32">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <button onClick={() => router.back()} className="text-3xl font-bold text-gray-600 pr-2">←</button>
        <h1 className="text-xl font-extrabold text-gray-800 truncate">ข้อมูลผู้รับจ้าง</h1>
      </div>

      {/* ส่วนข้อมูลโปรไฟล์ */}
      <div className="bg-white p-6 shadow-sm mb-2 border-b border-gray-100">
        <div className="flex items-center gap-5 mb-5">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-5xl shadow-inner">
            👨‍🔧
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              {mockProfile.name}
              {mockProfile.verified && <span className="text-green-500 text-xl" title="ยืนยันตัวตนแล้ว">✅</span>}
            </h2>
            <div className="flex items-center gap-2 text-yellow-500 font-bold mt-2 text-lg">
              ⭐ {mockProfile.rating} <span className="text-gray-400 text-base">({mockProfile.reviews} รีวิว)</span>
            </div>
          </div>
        </div>
        <h3 className="text-2xl font-bold text-blue-700 mb-3 leading-tight">{mockProfile.title}</h3>
        <p className="text-gray-600 text-xl leading-relaxed">{mockProfile.desc}</p>
      </div>

      {/* ส่วนผลงาน (Gallery) */}
      <div className="bg-white p-6 shadow-sm mb-2 border-b border-gray-100">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">ผลงานที่ผ่านมา 📸</h3>
        <div className="flex gap-4 overflow-x-auto snap-x scrollbar-hide pb-2">
          {mockProfile.gallery.map((img, idx) => (
            <img 
              key={idx} 
              src={img} 
              alt="ผลงาน" 
              className="snap-center w-64 h-48 object-cover rounded-2xl border border-gray-200 shadow-sm flex-shrink-0" 
            />
          ))}
        </div>
      </div>

      {/* แถบด้านล่างสำหรับกดจ้างงาน (Sticky Bottom Bar) */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 p-5 shadow-2xl flex items-center justify-between z-20">
        <div>
          <p className="text-base text-gray-500 font-bold mb-1">ราคาเริ่มต้น</p>
          <p className="text-3xl font-extrabold text-green-600">{mockProfile.price} <span className="text-xl">บาท</span></p>
        </div>
        <button 
          onClick={handleChatClick}
          disabled={loadingChat}
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-95 transition-all text-white text-2xl font-bold py-5 px-8 rounded-2xl shadow-xl disabled:opacity-50 flex items-center gap-2"
        >
          {loadingChat ? 'รอสักครู่...' : '💬 ทักแชทเลย'}
        </button>
      </div>
    </div>
  );
}

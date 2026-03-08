'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewServicePage() {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const router = useRouter();

  // ฟังก์ชันนี้เดี๋ยวคุณ C จะมาเขียนต่อให้เชื่อม Supabase ค่ะ
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('เจมจำลองการกดส่งข้อมูลค่ะ! เดี๋ยวรอคุณ C มาต่อท่อ Supabase ให้นะคะ');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-md mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="text-3xl font-bold text-gray-600">←</button>
        <h1 className="text-3xl font-extrabold text-blue-700">ลงประกาศรับงาน ✨</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <label className="block text-2xl font-bold text-gray-800 mb-3">คุณรับทำอะไร?</label>
          <input 
            type="text" 
            placeholder="เช่น รับซ่อมแอร์, รับตัดหญ้า"
            className="w-full p-5 text-2xl border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <label className="block text-2xl font-bold text-gray-800 mb-3">รายละเอียดงาน</label>
          <textarea 
            rows={4}
            placeholder="อธิบายสิ่งที่คุณถนัด หรือเงื่อนไขต่างๆ..."
            className="w-full p-5 text-xl border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <label className="block text-2xl font-bold text-gray-800 mb-3">ราคาเริ่มต้น (บาท)</label>
          <input 
            type="number" 
            placeholder="0"
            className="w-full p-5 text-3xl font-bold border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none text-blue-600"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>

        <button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-3xl font-extrabold py-8 rounded-3xl shadow-xl transition-transform active:scale-95 mt-4"
        >
          ลงประกาศเลย! 🚀
        </button>
      </form>
    </div>
  );
}

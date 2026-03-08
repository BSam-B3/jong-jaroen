'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// ── Soft Shopee Palette ───────────────────────────────────────────────────────────────────────────────────────
const themePalette = {
  primaryOrange: '#F05D40', 
  bgGray: '#F9FAFB',         
};

export default function NewServicePage() {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('aircon');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('กรุณาเข้าสู่ระบบก่อนลงประกาศ');
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('provider_services')
      .insert({
        provider_id: user.id,
        category,
        title,
        description: desc,
        price_start: Number(price),
      });

    setLoading(false);
    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } else {
      router.push('/services');
    }
  };

  return (
    <div className="min-h-screen pb-24 max-w-md mx-auto relative" style={{ backgroundColor: themePalette.bgGray }}>
      
      {/* ── Header ── */}
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.back()} className="p-1 hover:bg-orange-50 rounded-full transition text-gray-700 hover:text-[#F05D40]">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-base font-bold text-gray-800">ลงประกาศรับงาน</h1>
      </div>

      {/* ── Form Section ── */}
      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* หมวดหมู่ */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <label className="block text-sm font-bold text-gray-700 mb-2">หมวดหมู่บริการ</label>
            <div className="relative">
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 text-sm font-medium border border-gray-200 rounded-xl focus:border-[#F05D40] focus:ring-1 focus:ring-[#F05D40] outline-none bg-gray-50 appearance-none"
              >
                <option value="aircon">❄️ ล้างแอร์/ซ่อมแอร์</option>
                <option value="electrician">⚡ ช่างไฟฟ้า</option>
                <option value="plumbing">💧 ช่างประปา</option>
                <option value="cleaning">🧹 แม่บ้าน/ทำความสะอาด</option>
                <option value="transport">🚚 รถรับจ้าง/ขนส่ง</option>
                <option value="others">✨ ทั่วไป</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          {/* ชื่อบริการ */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <label className="block text-sm font-bold text-gray-700 mb-2">ชื่อบริการที่ท่านรับทำ</label>
            <input 
              type="text" 
              placeholder="เช่น รับซ่อมแอร์บ้าน, รับตัดหญ้า"
              className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:border-[#F05D40] focus:ring-1 focus:ring-[#F05D40] outline-none bg-gray-50"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* รายละเอียด */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <label className="block text-sm font-bold text-gray-700 mb-2">รายละเอียดงาน</label>
            <textarea 
              rows={4}
              placeholder="อธิบายสิ่งที่คุณถนัด เงื่อนไข หรือพื้นที่รับงานในปากน้ำประแส..."
              className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:border-[#F05D40] focus:ring-1 focus:ring-[#F05D40] outline-none bg-gray-50"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>

          {/* ราคา */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <label className="block text-sm font-bold text-gray-700 mb-2">ราคาเริ่มต้น (บาท)</label>
            <input 
              type="number" 
              placeholder="0"
              className="w-full p-3 text-xl font-black border border-gray-200 rounded-xl focus:border-[#F05D40] focus:ring-1 focus:ring-[#F05D40] outline-none bg-gray-50 text-[#F05D40]"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          {/* ปุ่ม Submit */}
          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#F05D40] hover:bg-[#E04D30] text-white text-base font-bold py-3.5 rounded-xl shadow-md shadow-orange-200 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'กำลังบันทึก...' : 'บันทึกการลงประกาศ'}
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
}

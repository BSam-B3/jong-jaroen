"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/app/components/BottomNav';

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: '',
    image_url: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user?.id).single();

      if (shop) {
        const { error } = await supabase.from('products').insert({
          shop_id: shop.id,
          name: formData.name,
          description: formData.description,
          base_price: parseFloat(formData.base_price),
          image_url: formData.image_url,
          is_available: true
        });

        if (error) throw error;
        alert('เพิ่มเมนูเรียบร้อยแล้วค่ะ!');
        router.push('/marketplace/manage-shop/products');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-32">
      <header className="p-6 bg-white border-b sticky top-0 z-10 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-xl">←</button>
        <h1 className="text-xl font-black">เพิ่มเมนูใหม่</h1>
      </header>

      <main className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2">ชื่อเมนูอาหาร</label>
            <input 
              required
              className="w-full p-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:border-[#EE4D2D] outline-none transition-all"
              placeholder="เช่น ข้าวกะเพราทะเล"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2">รายละเอียด (ตัวเลือก)</label>
            <textarea 
              className="w-full p-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:border-[#EE4D2D] outline-none transition-all"
              placeholder="ใส่รายละเอียดวัตถุดิบ หรือรสชาติ"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase mb-2">ราคาพื้นฐาน (บาท)</label>
              <input 
                required
                type="number"
                className="w-full p-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:border-[#EE4D2D] outline-none transition-all"
                placeholder="0"
                value={formData.base_price}
                onChange={(e) => setFormData({...formData, base_price: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase mb-2">ลิงก์รูปภาพ</label>
              <input 
                className="w-full p-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:border-[#EE4D2D] outline-none transition-all"
                placeholder="https://..."
                value={formData.image_url}
                onChange={(e) => setFormData({...formData, image_url: e.target.value})}
              />
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-[#EE4D2D] text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-[#EE4D2D]/20 active:scale-95 transition-all mt-8"
          >
            {loading ? 'กำลังบันทึก...' : 'บันทึกเมนูนี้'}
          </button>
        </form>
      </main>
      <BottomNav />
    </div>
  );
}

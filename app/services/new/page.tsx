'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const CATEGORIES = [
  "แม่บ้าน", "ช่างแอร์", "ช่างซ่อม", "ขนย้าย", "วินส่งของ", 
  "ทำสวน", "ผู้สูงอายุ", "สัตว์เลี้ยง", "นวด", "เสริมสวย", 
  "ทำอาหาร", "เอกสาร", "อื่นๆ"
];

export default function NewServicePage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Form States
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [priceStart, setPriceStart] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/auth/login?next=/services/new');
      else setUser(data.user);
    });
  }, [router, supabase]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !priceStart) {
      setError('กรุณากรอกข้อมูลสำคัญให้ครบถ้วนนะคะ');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let coverUrl = null;

      // ถ้ามีการอัปโหลดรูปภาพหน้าปก
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `service_${user.id}_${Date.now()}.${fileExt}`;
        
        // 🌟 บีสามต้องไปสร้าง Bucket ชื่อ 'service-covers' ใน Supabase Storage ก่อนนะคะ
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('service-covers') 
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage.from('service-covers').getPublicUrl(uploadData.path);
        coverUrl = publicUrlData.publicUrl;
      }

      // บันทึกลงตาราง provider_services
      const { data, error: insertError } = await supabase.from('provider_services').insert({
        provider_id: user.id,
        title,
        category,
        description,
        price_start: Number(priceStart),
        cover_image_url: coverUrl,
        rating: 0,
        reviews_count: 0
      }).select().single();

      if (insertError) throw insertError;

      alert('เปิดร้านสำเร็จ! 🎉 บริการของคุณพร้อมให้ลูกค้าเลือกช้อปแล้วค่ะ');
      router.push(`/services/${data.id}`); // พาช่างไปดูหน้าร้านตัวเองที่เพิ่งสร้างเสร็จ

    } catch (err: any) {
      setError('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-24">
      <div className="w-full sm:max-w-2xl bg-white min-h-screen shadow-xl relative flex flex-col">
        
        {/* 🌟 Header */}
        <div className="bg-gradient-to-r from-[#EE4D2D] to-[#FF7337] px-6 pt-10 pb-6 shadow-md relative z-20 rounded-b-[2rem]">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm text-white text-xl active:scale-95 transition-transform">←</button>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">ลงประกาศรับงาน 🛠️</h1>
              <p className="text-[11px] font-bold text-white/80 mt-0.5">สร้างโปรไฟล์ให้โดดเด่น ลูกค้าเห็นแล้วอยากจ้าง</p>
            </div>
          </div>
        </div>

        {/* 🌟 Form */}
        <main className="px-6 mt-8 flex-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-black border border-red-100">{error}</div>}

            {/* 1. รูปหน้าปกบริการ */}
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase mb-2 ml-1">รูปหน้าปก (Cover Image)</label>
              <label className={`flex flex-col items-center justify-center w-full aspect-video border-4 border-dashed rounded-[2rem] transition-all cursor-pointer overflow-hidden ${imagePreview ? 'border-orange-200' : 'hover:bg-gray-50 border-gray-200'}`}>
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <span className="text-4xl">📸</span>
                    <p className="text-xs font-bold">อัปโหลดรูปผลงาน หรือรูปบริการ</p>
                  </div>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              </label>
            </div>

            {/* 2. ชื่อบริการ */}
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase mb-2 ml-1">ชื่อบริการ / ชื่องาน</label>
              <input 
                type="text" 
                placeholder="เช่น รับล้างแอร์ติดผนัง สะอาดหมดจด, รับแปลเอกสาร" 
                value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#EE4D2D] focus:bg-white transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* 3. หมวดหมู่ */}
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase mb-2 ml-1">หมวดหมู่</label>
                <select 
                  value={category} onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#EE4D2D]"
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              {/* 4. ราคาเริ่มต้น */}
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase mb-2 ml-1">ราคาเริ่มต้น (บาท)</label>
                <input 
                  type="number" 
                  min="50"
                  placeholder="เช่น 500" 
                  value={priceStart} onChange={(e) => setPriceStart(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#EE4D2D] focus:bg-white"
                  required
                />
              </div>
            </div>

            {/* 5. รายละเอียด */}
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase mb-2 ml-1">รายละเอียดและขอบเขตงาน</label>
              <textarea 
                rows={5}
                placeholder="อธิบายว่าคุณรับทำอะไรบ้าง มีขั้นตอนอย่างไร ข้อจำกัดต่างๆ..." 
                value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#EE4D2D] focus:bg-white transition-all resize-none"
                required
              />
            </div>

            {/* 🌟 Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-6 bg-[#EE4D2D] text-white py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'เปิดร้านรับงานเลย! 🚀'}
            </button>
            <p className="text-center text-[10px] font-bold text-gray-400 mt-4 mb-8">
              การลงประกาศถือว่าคุณยอมรับเงื่อนไขการให้บริการของแพลตฟอร์มแล้ว
            </p>

          </form>
        </main>
      </div>
    </div>
  );
}

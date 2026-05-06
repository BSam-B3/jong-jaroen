'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

// หมวดหมู่ให้ตรงกับหน้า Services
const CATEGORIES = [
  "เกษตรกรรม", "งานใช้แรง", "ช่างชุมชน", "ปศุสัตว์", 
  "ขนส่ง", "รับเหมา", "แม่บ้าน", "อื่นๆ"
];

export default function CreateJobsCardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // 🌟 Form States สำหรับ Jobs-Card
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[2]); // Default ช่างชุมชน
  const [description, setDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState(''); // ลิงก์รูปภาพ/วิดีโอ
  const [startingPrice, setStartingPrice] = useState('');
  const [packageDetails, setPackageDetails] = useState(''); // รายละเอียดแพ็กเกจ
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/auth/login?next=/jobs/create');
      else setUser(data.user);
    });
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !startingPrice) {
      setError('กรุณากรอกชื่องาน รายละเอียด และราคาเริ่มต้นให้ครบนะคะ');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 🌟 บันทึกลงตาราง services (แทน jobs เพราะนี่คือการสร้าง Card บริการของช่าง)
      const { data, error: insertError } = await supabase.from('services').insert({
        provider_id: user.id,
        title,
        category,
        description,
        cover_image_url: coverImageUrl || null,
        starting_price: Number(startingPrice),
        package_details: packageDetails || null, // ถ้าในฐานข้อมูลยังไม่มีคอลัมน์นี้ อาจจะต้องสร้างเพิ่มนะคะ
        is_active: true
      }).select().single();

      if (insertError) throw insertError;

      alert('🎉 สร้าง Jobs-Card สำเร็จแล้ว! นามบัตรของคุณพร้อมรับลูกค้าแล้วค่ะ');
      router.push(`/services/${data.id}`); // พาไปดูหน้า Card ที่เพิ่งสร้าง
    } catch (err: any) {
      setError('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-24 selection:bg-blue-100">
      <div className="w-full sm:max-w-2xl bg-[#F4F6F8] min-h-screen relative flex flex-col md:shadow-2xl md:border-x border-gray-200/50">
        
        {/* 🔵 Header สไตล์พรีเมียม (สีเปลี่ยนให้ดูแตกต่างจากฝั่งลูกค้าจ้างงาน) */}
        <div className="bg-gradient-to-r from-[#0082FA] to-[#00A3FF] px-6 pt-12 pb-24 shadow-md relative z-10 rounded-b-[3rem]">
          <div className="flex items-center gap-4 relative z-20">
            <button onClick={() => router.back()} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm text-white text-xl active:scale-95 transition-transform hover:bg-white/30">←</button>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">สร้าง Jobs-Card 💼</h1>
              <p className="text-xs font-bold text-white/80 mt-0.5 uppercase tracking-widest">พรีเซนต์ตัวคุณ ให้ลูกค้ารู้จัก</p>
            </div>
          </div>
          <div className="absolute right-[-20px] top-4 text-[120px] opacity-10 pointer-events-none">💼</div>
        </div>

        {/* 📋 Form Content (ดึงขึ้นไปทับ Header เล็กน้อย) */}
        <main className="px-5 -mt-16 relative z-20 flex-1 w-full max-w-xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-black border border-red-100 shadow-sm animate-pulse">{error}</div>}

            {/* --- Section 1: ข้อมูลบริการ --- */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
              <h2 className="text-sm font-black text-gray-800 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
                <span>📑</span> ข้อมูลบริการพื้นฐาน
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase mb-2 ml-1">ชื่องาน / บริการของคุณ <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    placeholder="เช่น รับล้างแอร์บ้าน, รับเหมาต่อเติมหลังคา" 
                    value={title} onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    required
                  />
                  <p className="text-[10px] text-gray-400 font-bold mt-2 ml-1">เทคนิค: ตั้งชื่อให้สั้น กระชับ และมีคำค้นหาที่ลูกค้ามักจะพิมพ์หา</p>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase mb-2 ml-1">หมวดหมู่งาน <span className="text-red-500">*</span></label>
                  <select 
                    value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 font-bold text-blue-600 outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* --- Section 2: แกลเลอรีผลงาน --- */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
              <h2 className="text-sm font-black text-gray-800 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
                <span>📸</span> แกลเลอรีผลงาน
              </h2>

              <div>
                <label className="block text-[11px] font-black text-gray-500 uppercase mb-2 ml-1">ลิงก์รูปภาพปก หรือ วิดีโอสั้น</label>
                <div className="flex flex-col gap-3">
                  <input 
                    type="url" 
                    placeholder="วางลิงก์รูปภาพ (เช่น https://.../image.jpg)" 
                    value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 font-medium text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                  {/* กล่องแสดงตัวอย่างรูปภาพ */}
                  <div className={`w-full aspect-[4/3] rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${coverImageUrl ? 'border-transparent bg-slate-100' : 'border-gray-200 bg-gray-50'}`}>
                    {coverImageUrl ? (
                      <img src={coverImageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    ) : (
                      <div className="text-center">
                        <span className="text-3xl">🖼️</span>
                        <p className="text-[10px] text-gray-400 font-bold mt-2">ยังไม่มีรูปภาพปก</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* --- Section 3: ราคาและรายละเอียด --- */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
              <h2 className="text-sm font-black text-gray-800 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
                <span>💸</span> ราคาและแพ็กเกจ
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase mb-2 ml-1">ราคาเริ่มต้น (บาท) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-4 font-black text-blue-500">฿</span>
                    <input 
                      type="number" 
                      placeholder="เช่น 500" 
                      value={startingPrice} onChange={(e) => setStartingPrice(e.target.value)}
                      className="w-full bg-blue-50 border border-blue-100 rounded-2xl pl-10 pr-5 py-4 font-black text-blue-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-lg"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase mb-2 ml-1">รายละเอียดแพ็กเกจ</label>
                  <textarea 
                    rows={3}
                    placeholder="เช่น ล้างแอร์ 1 เครื่อง 500 บ. | 2 เครื่อง 900 บ." 
                    value={packageDetails} onChange={(e) => setPackageDetails(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 font-medium text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase mb-2 ml-1">อธิบายความเชี่ยวชาญของคุณ <span className="text-red-500">*</span></label>
                  <textarea 
                    rows={5}
                    placeholder="แนะนำตัว ประสบการณ์ และทำไมลูกค้าถึงต้องเลือกคุณ..." 
                    value={description} onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 font-medium text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 pb-8">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-200 active:scale-95 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : '✅ บันทึก Jobs-Card พร้อมรับงาน!'}
              </button>
              <p className="text-center text-[10px] font-bold text-gray-400 mt-4">แพลตฟอร์ม "จงเจริญ" เป็นเพียงตัวกลางรับประกันการชำระเงิน</p>
            </div>

          </form>
        </main>
      </div>
    </div>
  );
}

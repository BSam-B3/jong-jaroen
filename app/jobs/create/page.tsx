'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const CATEGORIES = ["เกษตรกรรม", "งานใช้แรง", "ช่างชุมชน", "ปศุสัตว์", "ขนส่ง", "รับเหมา", "แม่บ้าน", "อื่นๆ"];

export default function CreateJobsCardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(0); // สำหรับเลือกแพ็กเกจ 0,1,2

  // 🌟 State: ข้อมูลพื้นฐาน
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[2]);
  const [description, setDescription] = useState('');
  
  // 🌟 State: แกลเลอรี (สูงสุด 5 รูป)
  const [images, setImages] = useState<string[]>(['', '', '', '', '']);

  // 🌟 State: แพ็กเกจ 3 ระดับ
  const [packages, setPackages] = useState([
    { name: 'Basic', price: '', content: 'บริการเริ่มต้น...', delivery: '1' },
    { name: 'Standard', price: '', content: 'บริการยอดนิยม...', delivery: '3' },
    { name: 'Premium', price: '', content: 'บริการครบวงจร...', delivery: '5' },
  ]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/auth/login?next=/jobs/create');
      else setUser(data.user);
    });
  }, [router, supabase]);

  const handlePackageChange = (index: number, field: string, value: string) => {
    const newPackages = [...packages];
    newPackages[index] = { ...newPackages[index], [field]: value };
    setPackages(newPackages);
  };

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...images];
    newImages[index] = value;
    setImages(newImages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.from('services').insert({
        provider_id: user.id,
        title,
        category,
        description,
        cover_image_url: images[0] || null, // รูปแรกเป็นรูปปก
        images: images.filter(img => img !== ''), // เก็บเฉพาะที่มีข้อมูล
        packages: packages,
        starting_price: Number(packages[0].price),
        is_active: true
      }).select().single();

      if (error) throw error;
      alert('สร้าง Jobs-Card พรีเมียมของคุณสำเร็จแล้ว!');
      router.push(`/services/${data.id}`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F0] flex justify-center font-sans pb-24">
      <div className="w-full sm:max-w-4xl bg-white min-h-screen shadow-2xl relative flex flex-col md:flex-row overflow-hidden">
        
        {/* 🟢 Left Side: Preview & Theme (Desktop Only) */}
        <div className="hidden md:flex md:w-1/3 bg-gradient-to-b from-[#064E3B] to-[#065F46] p-10 text-white flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-[#F59E0B] rounded-2xl mb-6 flex items-center justify-center shadow-lg transform rotate-12">
              <span className="text-2xl">💼</span>
            </div>
            <h1 className="text-3xl font-black leading-tight mb-4">ตกแต่ง <br/><span className="text-[#F59E0B]">Jobs-Card</span><br/> ของคุณ</h1>
            <p className="text-sm text-emerald-100 font-medium">ภาพลักษณ์ที่ดี มีชัยไปกว่าครึ่ง <br/>จงเจริญช่วยให้คุณดูเป็นมืออาชีพที่สุด</p>
          </div>
          <div className="bg-white/10 p-6 rounded-[2rem] border border-white/20 backdrop-blur-md">
            <p className="text-xs font-bold uppercase tracking-widest text-[#F59E0B] mb-2">Pro Tip</p>
            <p className="text-xs leading-relaxed text-emerald-50">การแบ่งแพ็กเกจ 3 ระดับ ช่วยให้ลูกค้าตัดสินใจจ้างงานได้ง่ายขึ้นถึง 70%</p>
          </div>
        </div>

        {/* 📋 Right Side: Form Content */}
        <main className="flex-1 p-6 md:p-12 overflow-y-auto">
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-10">
            
            <div className="flex items-center justify-between">
               <button type="button" onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">← ย้อนกลับ</button>
               <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase tracking-tighter">Premium Creator</span>
            </div>

            {/* --- Section 1: Visual Gallery --- */}
            <section>
              <h2 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm">1</span>
                แกลเลอรีผลงาน (สูงสุด 5 รูป)
              </h2>
              <div className="grid grid-cols-5 gap-2">
                {images.map((img, idx) => (
                  <div key={idx} className="flex flex-col gap-2">
                    <div className={`aspect-square rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${img ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
                      {img ? <img src={img} className="w-full h-full object-cover" /> : <span className="text-xl opacity-20">📸</span>}
                    </div>
                    <input 
                      type="url" 
                      placeholder="URL รูป" 
                      className="text-[9px] p-1 border rounded bg-gray-50 outline-none focus:border-emerald-500"
                      value={img}
                      onChange={(e) => handleImageChange(idx, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-3">* รูปแรกจะถูกใช้เป็นรูปปก Jobs-Card ของคุณ</p>
            </section>

            {/* --- Section 2: Service Info --- */}
            <section className="space-y-4">
              <h2 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm">2</span>
                ข้อมูลบริการหลัก
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase">ชื่องานพรีเซนต์</label>
                  <input 
                    className="w-full border-b-2 border-gray-100 py-3 text-lg font-bold outline-none focus:border-[#F59E0B] transition-all"
                    placeholder="เช่น รับตัดแต่งกิ่งไม้ใหญ่ด้วยเครื่องมือทันสมัย"
                    value={title} onChange={e => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase">หมวดหมู่</label>
                  <select 
                    className="w-full bg-gray-50 p-3 rounded-xl font-bold mt-1 outline-none border border-transparent focus:border-emerald-500"
                    value={category} onChange={e => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </section>

            {/* --- Section 3: 3-Tier Packages (เหมือน Fastwork) --- */}
            <section className="bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100 shadow-inner">
              <h2 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-[#F59E0B] text-white rounded-full flex items-center justify-center text-sm">3</span>
                ออกแบบแพ็กเกจราคา
              </h2>
              
              {/* Tab Switcher */}
              <div className="flex bg-white p-1 rounded-2xl mb-6 shadow-sm">
                {packages.map((pkg, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveTab(idx)}
                    className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${activeTab === idx ? 'bg-[#065F46] text-white shadow-md' : 'text-gray-400'}`}
                  >
                    {pkg.name}
                  </button>
                ))}
              </div>

              {/* Package Inputs */}
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase">ราคา (บาท)</label>
                    <input 
                      type="number"
                      className="w-full p-3 rounded-xl font-black text-emerald-700 outline-none border-2 border-transparent focus:border-emerald-500"
                      value={packages[activeTab].price}
                      onChange={e => handlePackageChange(activeTab, 'price', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase">เวลาทำงาน (วัน)</label>
                    <input 
                      type="number"
                      className="w-full p-3 rounded-xl font-black outline-none border-2 border-transparent focus:border-emerald-500"
                      value={packages[activeTab].delivery}
                      onChange={e => handlePackageChange(activeTab, 'delivery', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase">รายละเอียดที่ลูกค้าจะได้รับ</label>
                  <textarea 
                    rows={4}
                    className="w-full p-3 rounded-xl font-medium outline-none border-2 border-transparent focus:border-emerald-500 resize-none"
                    value={packages[activeTab].content}
                    onChange={e => handlePackageChange(activeTab, 'content', e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* --- Section 4: Bio / Expert --- */}
            <section>
              <label className="text-[11px] font-black text-gray-400 uppercase">อธิบายความเชี่ยวชาญ / ผลงานที่ผ่านมา</label>
              <textarea 
                rows={5}
                className="w-full mt-2 p-5 rounded-[2rem] bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all font-medium"
                placeholder="พิมพ์บรรยายความเป็นตัวคุณ เพื่อสร้างความมั่นใจให้ลูกค้า..."
                value={description} onChange={e => setDescription(e.target.value)}
              />
            </section>

            {/* Submit */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-5 bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-[2rem] font-black text-lg shadow-xl shadow-amber-100 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'กำลังบันทึกข้อมูล...' : '✨ ยืนยันการสร้าง Jobs-Card'}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}

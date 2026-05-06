'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

// 🌟 ปรับปรุงหมวดหมู่ให้ครอบคลุมและค้นหาง่าย
const CATEGORIES = [
  "ทำสวน/เกษตรกรรม", "ช่างแอร์/เครื่องใช้ไฟฟ้า", "ช่างไฟ/ประปา", "รับเหมาก่อสร้าง",
  "ซ่อมยานพาหนะ", "ดูแลปศุสัตว์", "ขนส่ง/ย้ายของ", "แม่บ้าน/ทำความสะอาด",
  "ดูแลเด็ก/ผู้สูงอายุ", "นวด/สปา", "ทำอาหาร/จัดเลี้ยง", "เอกสาร/แอดมิน",
  "ออกแบบ/ไอที", "งานใช้แรงทั่วไป", "อื่นๆ"
];

export default function CreateJobsCardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // Form States
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[2]);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>(['', '', '', '', '']); 
  
  // แพ็กเกจ 3 ระดับ พร้อมช่องแก้ไขงาน (revisions)
  const [packages, setPackages] = useState([
    { name: 'เริ่มต้น (Basic)', price: '', delivery: '', revisions: 'ไม่จำกัด', content: '' },
    { name: 'มาตรฐาน (Standard)', price: '', delivery: '', revisions: 'ไม่จำกัด', content: '' },
    { name: 'พรีเมียม (Premium)', price: '', delivery: '', revisions: 'ไม่จำกัด', content: '' },
  ]);

  // 🌟 ระบบเช็คความถูกต้อง (Validation)
  const isFormValid = 
    title.trim() !== '' && 
    description.trim() !== '' && 
    packages[0].price !== '' && Number(packages[0].price) >= 0 &&
    packages[0].delivery !== '' && Number(packages[0].delivery) >= 0 &&
    packages[0].content.trim() !== '';

  useEffect(() => {
    const initData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth/login?next=/jobs/create');
        return;
      }
      setUser(session.user);
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (data) setProfile(data);
    };
    initData();
  }, [router, supabase]);

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...images];
    newImages[index] = value;
    setImages(newImages);
  };

  const handlePackageChange = (index: number, field: string, value: string) => {
    // 🌟 ป้องกันการกรอกค่าติดลบในช่องตัวเลข
    if ((field === 'price' || field === 'delivery') && Number(value) < 0) return;
    
    const newPackages = [...packages];
    newPackages[index] = { ...newPackages[index], [field]: value };
    setPackages(newPackages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return; // กันเหนียวเผื่อ User ฝืนกด
    
    setLoading(true);
    try {
      const { data, error } = await supabase.from('services').insert({
        provider_id: user.id,
        title,
        category,
        description,
        cover_image_url: images.find(img => img.trim() !== '') || null,
        images: images.filter(img => img.trim() !== ''),
        packages: packages,
        starting_price: Number(packages[0].price),
        is_active: true
      }).select().single();

      if (error) throw error;
      alert('🎉 สร้าง Jobs-Card สำเร็จแล้ว!');
      router.push(`/services/${data.id}`);
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 100; // เผื่อระยะ Header
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F0] flex justify-center font-sans pb-32">
      <div className="w-full max-w-4xl bg-white min-h-screen shadow-xl relative flex flex-col">
        
        {/* 🟢 Sticky Menu สไตล์ Fastwork (ปรับมาอยู่ข้างบน) */}
        <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="flex gap-4 md:gap-8 overflow-x-auto scrollbar-hide text-sm font-bold text-gray-500 whitespace-nowrap">
            <button type="button" onClick={() => scrollTo('gallery')} className="hover:text-[#00C300] transition-colors focus:text-[#00C300]">รูปภาพ</button>
            <button type="button" onClick={() => scrollTo('overview')} className="hover:text-[#00C300] transition-colors focus:text-[#00C300]">ภาพรวม</button>
            <button type="button" onClick={() => scrollTo('packages')} className="hover:text-[#00C300] transition-colors focus:text-[#00C300]">แพ็กเกจ</button>
            <button type="button" onClick={() => scrollTo('profile')} className="hover:text-[#00C300] transition-colors focus:text-[#00C300]">ฟรีแลนซ์</button>
            <button type="button" onClick={() => scrollTo('reviews')} className="hover:text-[#00C300] transition-colors focus:text-[#00C300]">รีวิว</button>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => router.back()} className="hidden md:block w-8 h-8 bg-gray-100 rounded-full text-gray-500 font-bold hover:bg-red-100 hover:text-red-500">✕</button>
            {/* 🌟 แสดงปุ่ม Create ด้านบนด้วย เพื่อ UX ที่ดีขึ้น */}
            <button 
              onClick={handleSubmit}
              disabled={loading || !isFormValid}
              className={`hidden md:flex px-6 py-2.5 rounded-xl font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-2 ${
                isFormValid 
                  ? 'bg-gradient-to-r from-[#EE4D2D] to-[#FF7337] text-white hover:shadow-orange-200' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              }`}
            >
              {loading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : '✨ สร้าง Cards'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-8 space-y-12">
          
          {/* --- 1. Gallery Block --- */}
          <section id="gallery" className="scroll-mt-24">
            <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 shadow-inner">
              <h2 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-[#00C300]">1.</span> อัปโหลดรูปภาพผลงาน <span className="text-xs font-medium text-gray-400 font-normal ml-2">(สูงสุด 5 รูป)</span>
              </h2>
              
              {/* แกลเลอรีจำลองเหมือนหน้าแสดงผลจริง พร้อมลูกเล่น Hover */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                {/* รูปปกใหญ่ */}
                <div className="md:col-span-3 aspect-video md:aspect-[21/9] bg-gray-200 rounded-2xl overflow-hidden relative border-2 border-dashed border-gray-300 group hover:border-[#00C300] hover:bg-green-50/50 transition-colors">
                  {images[0] ? (
                    <img src={images[0]} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-2 transition-colors group-hover:text-[#00C300]">
                      <span className="text-3xl">🖼️</span>
                      <span className="font-bold text-sm">รูปปกหลัก (รูปที่ 1)</span>
                    </div>
                  )}
                </div>
                {/* รูปเล็ก 4 รูป */}
                <div className="grid grid-cols-4 md:grid-cols-1 gap-3">
                  {[1, 2, 3, 4].map(idx => (
                    <div key={idx} className="aspect-square md:aspect-auto md:h-full bg-gray-200 rounded-2xl overflow-hidden relative border-2 border-dashed border-gray-300 group hover:border-[#00C300] transition-colors">
                      {images[idx] ? (
                        <img src={images[idx]} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs font-bold group-hover:text-[#00C300]">รูป {idx + 1}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ช่องใส่ URL รูป พร้อม Focus Ring สีเขียว */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {images.map((img, idx) => (
                  <input key={idx} type="url" placeholder={`ลิงก์รูปที่ ${idx + 1}`} value={img} onChange={(e) => handleImageChange(idx, e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#00C300] focus:ring-2 focus:ring-green-100 transition-all" />
                ))}
              </div>
            </div>
          </section>

          {/* --- 2. Overview Block --- */}
          <section id="overview" className="scroll-mt-24">
            <h2 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-[#00C300]">2.</span> ภาพรวมบริการ
            </h2>
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-gray-500">หัวข้อ Jobs-Card ของคุณ <span className="text-xs font-medium text-gray-400 font-normal">(เช่น รับทำสวนทุเรียน ครบวงจร วางระบบน้ำ...)</span></label>
                <input 
                  type="text" 
                  placeholder="เช่น รับตัดแต่งกิ่งไม้ใหญ่สูงชัน, วางระบบน้ำเกษตรอัจฉริยะ" 
                  value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full border-b-2 border-gray-200 py-3 text-xl md:text-3xl font-black text-gray-800 outline-none focus:border-[#EE4D2D] transition-colors placeholder:text-gray-300"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block">หมวดหมู่งาน</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-800 font-bold rounded-xl px-4 py-3 outline-none focus:border-[#EE4D2D] focus:ring-2 focus:ring-orange-100 w-full md:w-1/3 transition-all cursor-pointer">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block">รายละเอียดทั้งหมด</label>
                <textarea 
                  rows={8}
                  placeholder="อธิบายสิ่งที่คุณทำ ประสบการณ์ ขั้นตอนการทำงาน และผลลัพธ์ที่จะได้... (ยิ่งละเอียดยิ่งน่าจ้าง)" 
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-5 text-sm md:text-base font-medium text-gray-700 outline-none focus:border-[#EE4D2D] focus:ring-2 focus:ring-orange-100 resize-none transition-all"
                  required
                />
              </div>
            </div>
          </section>

          {/* --- 3. Packages Block (แบบ 3 ช่อง ปรับสีสันให้เด่น) --- */}
          <section id="packages" className="scroll-mt-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                <span className="text-[#F59E0B]">3.</span> แพ็กเกจราคา <span className="text-xs font-medium text-gray-400 font-normal ml-2">(แบ่ง 3 ระดับ เพื่อเพิ่มยอดขาย)</span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {packages.map((pkg, idx) => (
                <div key={idx} className={`rounded-[2rem] border-2 p-5 flex flex-col group transition-all hover:shadow-xl ${idx === 2 ? 'border-[#F59E0B] bg-orange-50/30' : idx === 1 ? 'border-[#00C300] bg-green-50/30' : 'border-gray-200 bg-white'}`}>
                  {/* 🌟 เปลี่ยนไอคอนแบรนด์เล็กน้อย */}
                  <div className={`w-8 h-8 rounded-full mb-3 flex items-center justify-center text-white font-black text-xs ${idx === 2 ? 'bg-[#F59E0B]' : idx === 1 ? 'bg-[#00C300]' : 'bg-gray-400'}`}>{idx + 1}</div>
                  <h3 className={`text-base font-black text-center mb-4 transition-colors ${idx === 2 ? 'text-[#F59E0B]' : idx === 1 ? 'text-[#00C300]' : 'text-gray-600 group-hover:text-gray-900'}`}>{pkg.name}</h3>
                  
                  <div className="space-y-4 flex-1">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400">ราคา (บาท)</label>
                      <div className="relative">
                        <span className="absolute left-0 bottom-2 text-gray-400 font-black">฿</span>
                        <input type="number" placeholder="เช่น 1500" value={pkg.price} onChange={e => handlePackageChange(idx, 'price', e.target.value)} className={`w-full bg-transparent border-b-2 border-gray-200 py-2 pl-6 text-xl font-black outline-none text-center transition-colors placeholder:text-gray-200 ${idx === 0 ? 'focus:border-gray-500' : idx === 1 ? 'focus:border-[#00C300]' : 'focus:border-[#F59E0B]'}`} required={idx === 0} />
                      </div>
                    </div>
                    
                    {/* 🌟 แบ่งช่องเป็น 2 ส่วน (ระยะเวลา / แก้ไขงาน) */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                        <label className="text-[10px] font-bold text-gray-400 block text-center mb-1">ระยะเวลา (วัน)</label>
                        <input type="number" placeholder="เช่น 3" value={pkg.delivery} onChange={e => handlePackageChange(idx, 'delivery', e.target.value)} className="w-full bg-transparent p-1 text-sm font-bold outline-none text-center text-gray-800" />
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                        <label className="text-[10px] font-bold text-gray-400 block text-center mb-1">แก้ไขงาน (ครั้ง)</label>
                        <select 
                          value={pkg.revisions} 
                          onChange={e => handlePackageChange(idx, 'revisions', e.target.value)} 
                          className="w-full bg-transparent p-1 text-sm font-bold outline-none text-center appearance-none cursor-pointer text-gray-800"
                        >
                          <option value="0">0</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="5">5</option>
                          <option value="ไม่จำกัด">ไม่จำกัด</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-400">รายละเอียดที่ได้รับ</label>
                      <textarea rows={4} placeholder={`รายละเอียดแพ็กเกจ ${pkg.name}... (เช่น ตัดแต่งสวน 1 ไร่, ปูหญ้าใหม่)`} value={pkg.content} onChange={e => handlePackageChange(idx, 'content', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs outline-none resize-none focus:border-gray-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* --- 4. Freelance Profile Preview --- */}
          <section id="profile" className="scroll-mt-24 pt-8 border-t border-gray-100">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">ข้อมูลช่าง / ฟรีแลนซ์</h2>
            <div className="bg-white border-4 border-[#00C300] rounded-[2rem] p-6 flex flex-col md:flex-row items-center gap-6 shadow-xl relative overflow-hidden group">
              {/* 🌟 ลายน้ำ "จงเจริญ" สีเขียวอ่อน */}
              <div className="absolute right-[-30px] bottom-[-40px] opacity-10 transition-transform group-hover:scale-110">
                <img src="/logo.png" className="w-56 h-56 grayscale brightness-125" />
              </div>
              <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-[#00C300] overflow-hidden shrink-0 shadow-lg relative z-10">
                {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>}
              </div>
              <div className="text-center md:text-left flex-1 relative z-10">
                <h3 className="text-xl font-black text-gray-800">{profile?.full_name || 'ช่าง/ฟรีแลนซ์หน้าใหม่'}</h3>
                <p className="text-sm font-bold text-gray-500 mt-1">{profile?.bio || 'ยินดีต้อนรับ! แนะนำตัวเองสั้นๆ ในหน้าโปรไฟล์เพื่อสร้างความน่าเชื่อถือนะคะ'}</p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4">
                  <div className="bg-green-50 px-4 py-2 rounded-xl text-center border border-green-100"><p className="text-xs text-[#00A300] font-bold">รีวิว</p><p className="font-black text-gray-800">⭐ 0.0</p></div>
                  <div className="bg-orange-50 px-4 py-2 rounded-xl text-center border border-orange-100"><p className="text-xs text-[#EE4D2D] font-bold">ขายได้</p><p className="font-black text-gray-800">0 ครั้ง</p></div>
                  <div className="bg-gray-50 px-4 py-2 rounded-xl text-center border border-gray-100"><p className="text-xs text-gray-400 font-bold">จ้างซ้ำ</p><p className="font-black text-gray-800">0 ครั้ง</p></div>
                </div>
              </div>
            </div>
          </section>

          {/* --- 5. Reviews Placeholder (ปรับเฉดสีส้มเหลือง) --- */}
          <section id="reviews" className="scroll-mt-24 pt-4">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">รีวิวจากผู้ว่าจ้าง</h2>
            <div className="space-y-3 opacity-60 pointer-events-none">
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                    <p className="text-xs font-bold text-gray-600">***** (ลูกค้า)</p>
                  </div>
                  <span className="text-xs font-black text-[#F59E0B]">⭐ 5.0</span>
                </div>
                <div className="h-3 w-3/4 bg-gray-200 rounded-full mb-1"></div>
                <div className="h-3 w-1/2 bg-gray-200 rounded-full"></div>
              </div>
              <p className="text-center text-xs font-bold text-[#00C300] mt-2 cursor-pointer">อ่านรีวิวทั้งหมด (หน้าถัดไป) ❯</p>
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-4">รีวิวจริงจากลูกค้าจะแสดงตรงนี้เมื่องานของคุณสำเร็จค่ะ</p>
          </section>

        </form>

        {/* 🌟 Floating Bottom Bar ปรับเฉดสีเขียว LINE */}
        <div className="fixed bottom-[80px] md:bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t-4 border-[#00C300] p-4 md:px-8 z-[100] flex justify-center shadow-[0_-10px_20px_rgba(0,195,0,0.08)]">
          <div className="w-full max-w-4xl flex items-center justify-between gap-4">
            <div className="hidden md:block">
              <p className="text-xs font-bold text-gray-500">ตรวจสอบข้อมูลให้ครบถ้วนก่อนบันทึก</p>
              <p className="text-[10px] text-gray-400">สร้าง Jobs-Card ฟรี ไม่มีค่าใช้จ่าย (จงเจริญ)</p>
            </div>
            <button 
              onClick={handleSubmit}
              disabled={loading || !isFormValid}
              className={`w-full md:w-auto px-10 py-4 bg-[#00C300] text-white rounded-2xl font-black text-sm md:text-base Shadow-xl active:scale-95 transition-all flex justify-center items-center gap-2 ${
                isFormValid 
                  ? 'bg-gradient-to-r from-[#00C300] to-[#00A300] hover:shadow-green-200' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              }`}
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : '✨ สร้าง Jobs-Card (ฟรี)'}
            </button>
          </div>
        </div>

      </div>
      <style dangerouslySetInnerHTML={{__html: `
        html { scroll-behavior: smooth; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// 🌟 เพิ่มหมวดหมู่ให้หลากหลายและครอบคลุมมากขึ้น เพื่อให้ค้นหาได้ง่าย
const CATEGORIES = [
  "ทำสวน/เกษตรกรรม", 
  "ช่างแอร์/เครื่องใช้ไฟฟ้า", 
  "ช่างไฟ/ประปา", 
  "รับเหมาก่อสร้าง",
  "ซ่อมยานพาหนะ", 
  "ดูแลปศุสัตว์", 
  "ขนส่ง/ย้ายของ", 
  "แม่บ้าน/ทำความสะอาด",
  "ดูแลเด็ก/ผู้สูงอายุ", 
  "นวด/สปา", 
  "ทำอาหาร/จัดเลี้ยง", 
  "เอกสาร/แอดมิน",
  "ออกแบบ/ไอที", 
  "งานใช้แรงทั่วไป",
  "อื่นๆ"
];

export default function CreateJobsCardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // 🌟 Form States
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>(['', '', '', '', '']); // สูงสุด 5 รูป
  
  // 🌟 แพ็กเกจ 3 ระดับ พร้อมช่องแก้ไขงาน (revisions)
  const [packages, setPackages] = useState([
    { name: 'เริ่มต้น (Basic)', price: '', delivery: '', revisions: 'ไม่จำกัด', content: '' },
    { name: 'มาตรฐาน (Standard)', price: '', delivery: '', revisions: 'ไม่จำกัด', content: '' },
    { name: 'พรีเมียม (Premium)', price: '', delivery: '', revisions: 'ไม่จำกัด', content: '' },
  ]);

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
    const newPackages = [...packages];
    newPackages[index] = { ...newPackages[index], [field]: value };
    setPackages(newPackages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !packages[0].price) {
      alert('กรุณากรอกข้อมูลสำคัญ (ชื่อ, รายละเอียด, และราคาเริ่มต้น) ให้ครบถ้วนค่ะ');
      return;
    }
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
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-40 md:pb-32">
      <div className="w-full max-w-4xl bg-white min-h-screen shadow-xl relative flex flex-col">
        
        <form onSubmit={handleSubmit} className="p-4 md:p-8 space-y-12">
          
          {/* --- 1. Gallery Block --- */}
          <section id="gallery" className="scroll-mt-24">
            <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
              <h2 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-[#00C300]">1.</span> อัปโหลดรูปภาพผลงาน <span className="text-xs font-medium text-gray-400 font-normal ml-2">(สูงสุด 5 รูป)</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <div className="md:col-span-3 aspect-video md:aspect-[21/9] bg-gray-200 rounded-2xl overflow-hidden relative border-2 border-dashed border-gray-300">
                  {images[0] ? <img src={images[0]} className="w-full h-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-bold text-sm">รูปปกหลัก (รูปที่ 1)</div>}
                </div>
                <div className="grid grid-cols-4 md:grid-cols-1 gap-3">
                  {[1, 2, 3, 4].map(idx => (
                    <div key={idx} className="aspect-square md:aspect-auto md:h-full bg-gray-200 rounded-2xl overflow-hidden relative border-2 border-dashed border-gray-300">
                      {images[idx] ? <img src={images[idx]} className="w-full h-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">รูป {idx + 1}</div>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {images.map((img, idx) => (
                  <input key={idx} type="url" placeholder={`ลิงก์รูปที่ ${idx + 1}`} value={img} onChange={(e) => handleImageChange(idx, e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#00C300]" />
                ))}
              </div>
            </div>
          </section>

          {/* 🌟 Sticky Menu (ย้ายมาไว้ใต้ส่วน Gallery) */}
          <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-y border-gray-200 shadow-sm px-4 md:px-8 py-3 flex items-center justify-between -mx-4 md:-mx-8">
            <div className="flex gap-4 md:gap-8 overflow-x-auto scrollbar-hide text-sm font-bold text-gray-500 whitespace-nowrap">
              <button type="button" onClick={() => scrollTo('gallery')} className="hover:text-[#00C300] transition-colors focus:text-[#00C300]">รูปภาพ</button>
              <button type="button" onClick={() => scrollTo('overview')} className="hover:text-[#00C300] transition-colors focus:text-[#00C300]">ภาพรวม</button>
              <button type="button" onClick={() => scrollTo('packages')} className="hover:text-[#00C300] transition-colors focus:text-[#00C300]">แพ็กเกจ</button>
              <button type="button" onClick={() => scrollTo('profile')} className="hover:text-[#00C300] transition-colors focus:text-[#00C300]">ฟรีแลนซ์</button>
              <button type="button" onClick={() => scrollTo('reviews')} className="hover:text-[#00C300] transition-colors focus:text-[#00C300]">รีวิว</button>
            </div>
          </div>

          {/* --- 2. Overview Block --- */}
          <section id="overview" className="scroll-mt-24">
            <h2 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-[#00C300]">2.</span> ภาพรวมบริการ
            </h2>
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-gray-500">หัวข้อ Jobs-Card ของคุณ</label>
                <input 
                  type="text" 
                  placeholder="เช่น รับทำสวนทุเรียน ครบวงจร วางระบบน้ำ ตัดแต่งกิ่ง..." 
                  value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full border-b-2 border-gray-200 py-3 text-xl md:text-3xl font-black text-gray-800 outline-none focus:border-[#00C300] transition-colors placeholder:text-gray-300"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block">หมวดหมู่งาน</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-800 font-bold rounded-xl px-4 py-3 outline-none focus:border-[#00C300] w-full md:w-1/3">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block">รายละเอียดทั้งหมด</label>
                <textarea 
                  rows={8}
                  placeholder="อธิบายสิ่งที่คุณทำ ประสบการณ์ และขั้นตอนการทำงานให้ลูกค้าเข้าใจง่ายๆ..." 
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-5 text-sm md:text-base font-medium text-gray-700 outline-none focus:border-[#00C300] resize-none"
                  required
                />
              </div>
            </div>
          </section>

          {/* --- 3. Packages Block --- */}
          <section id="packages" className="scroll-mt-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                <span className="text-[#F59E0B]">3.</span> แพ็กเกจราคา <span className="text-xs font-medium text-gray-400 font-normal ml-2">(แบ่ง 3 ระดับ)</span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {packages.map((pkg, idx) => (
                <div key={idx} className={`rounded-[2rem] border-2 p-5 flex flex-col ${idx === 2 ? 'border-[#F59E0B] bg-orange-50/30' : idx === 1 ? 'border-[#00C300] bg-green-50/30' : 'border-gray-200 bg-white'}`}>
                  <h3 className={`text-base font-black text-center mb-4 ${idx === 2 ? 'text-[#F59E0B]' : idx === 1 ? 'text-[#00C300]' : 'text-gray-600'}`}>{pkg.name}</h3>
                  
                  <div className="space-y-4 flex-1">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400">ราคา (บาท)</label>
                      <input type="number" placeholder="เช่น 1500" value={pkg.price} onChange={e => handlePackageChange(idx, 'price', e.target.value)} className={`w-full bg-transparent border-b border-gray-300 py-2 text-xl font-black outline-none text-center ${idx === 0 ? 'focus:border-gray-500' : idx === 1 ? 'focus:border-[#00C300]' : 'focus:border-[#F59E0B]'}`} required={idx === 0} />
                    </div>
                    
                    {/* 🌟 แบ่งช่องเป็น 2 ส่วน (ระยะเวลา / แก้ไขงาน) */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400">ระยะเวลา (วัน)</label>
                        <input type="number" placeholder="เช่น 3" value={pkg.delivery} onChange={e => handlePackageChange(idx, 'delivery', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold outline-none text-center" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400">แก้ไขงาน (ครั้ง)</label>
                        <select 
                          value={pkg.revisions} 
                          onChange={e => handlePackageChange(idx, 'revisions', e.target.value)} 
                          className="w-full bg-white border border-gray-200 rounded-xl px-2 py-2 text-sm font-bold outline-none text-center appearance-none"
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
                      <textarea rows={4} placeholder={`รายละเอียดแพ็กเกจ ${pkg.name}...`} value={pkg.content} onChange={e => handlePackageChange(idx, 'content', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs outline-none resize-none" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* --- 4. Freelance Profile Preview --- */}
          <section id="profile" className="scroll-mt-24 pt-8 border-t border-gray-100">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">ข้อมูลช่าง / ฟรีแลนซ์</h2>
            <div className="bg-white border border-gray-200 rounded-[2rem] p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
              <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-[#00C300] overflow-hidden shrink-0">
                {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>}
              </div>
              <div className="text-center md:text-left flex-1">
                <h3 className="text-xl font-black text-gray-800">{profile?.full_name || 'ชื่อของคุณ'}</h3>
                <p className="text-sm font-bold text-gray-500 mt-1">{profile?.bio || 'เพิ่มคำอธิบายตัวเองในหน้าโปรไฟล์เพื่อสร้างความน่าเชื่อถือ'}</p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4">
                  <div className="bg-gray-50 px-4 py-2 rounded-xl text-center"><p className="text-xs text-gray-400 font-bold">รีวิว</p><p className="font-black text-gray-800">⭐ 0.0</p></div>
                  <div className="bg-gray-50 px-4 py-2 rounded-xl text-center"><p className="text-xs text-gray-400 font-bold">ขายได้</p><p className="font-black text-gray-800">0 ครั้ง</p></div>
                  <div className="bg-gray-50 px-4 py-2 rounded-xl text-center"><p className="text-xs text-gray-400 font-bold">จ้างซ้ำ</p><p className="font-black text-gray-800">0 ครั้ง</p></div>
                </div>
              </div>
            </div>
          </section>

          {/* --- 5. Reviews Placeholder --- */}
          <section id="reviews" className="scroll-mt-24 pt-4">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">รีวิวจากผู้ว่าจ้าง</h2>
            <div className="space-y-3 opacity-60 pointer-events-none">
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                    <p className="text-xs font-bold text-gray-600">***** (ลูกค้า)</p>
                  </div>
                  <span className="text-xs font-black text-yellow-500">⭐ 5.0</span>
                </div>
                <div className="h-3 w-3/4 bg-gray-200 rounded-full mb-1"></div>
                <div className="h-3 w-1/2 bg-gray-200 rounded-full"></div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                    <p className="text-xs font-bold text-gray-600">***** (ลูกค้า)</p>
                  </div>
                  <span className="text-xs font-black text-yellow-500">⭐ 5.0</span>
                </div>
                <div className="h-3 w-full bg-gray-200 rounded-full"></div>
              </div>
              <p className="text-center text-xs font-bold text-[#00C300] mt-2 cursor-pointer">อ่านรีวิวทั้งหมด (หน้าถัดไป) ❯</p>
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-4">รีวิวจริงจากลูกค้าจะแสดงตรงนี้เมื่องานของคุณสำเร็จค่ะ</p>
          </section>

        </form>

        {/* 🌟 Floating Bottom Bar (ปรับระยะ bottom-20 สำหรับมือถือเพื่อหลบ Navigation Bar) */}
        <div className="fixed bottom-[80px] md:bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-4 md:px-8 z-[100] flex justify-center shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
          <div className="w-full max-w-4xl flex items-center justify-between gap-4">
            <div className="hidden md:block">
              <p className="text-xs font-bold text-gray-500">ตรวจสอบข้อมูลให้ครบถ้วนก่อนบันทึก</p>
              <p className="text-[10px] text-gray-400">สร้าง Jobs-Card ฟรี ไม่มีค่าใช้จ่าย</p>
            </div>
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="w-full md:w-auto px-10 py-4 bg-[#00C300] hover:bg-[#00A300] text-white rounded-2xl font-black text-sm md:text-base shadow-xl shadow-green-200 active:scale-95 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
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

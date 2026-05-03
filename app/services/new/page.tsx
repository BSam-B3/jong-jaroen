'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const CATEGORIES = [
  "แม่บ้าน/ทำความสะอาด", "ช่างแอร์", "ช่างไฟ/ประปา", "รับจ้างขนย้าย", 
  "วิน/ส่งของ", "ดูแลสวน", "ดูแลผู้สูงอายุ/เด็ก", "ดูแลสัตว์เลี้ยง", 
  "นวดแผนไทย", "ตัดผม/เสริมสวย", "ทำอาหาร", "ทำเว็บ/กราฟิก", "อื่นๆ"
];

export default function CreateGigPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // ข้อมูลทั่วไป
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  
  // ระบบรูปภาพ (สูงสุด 10 รูป)
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // แพ็กเกจราคา 3 ระดับ
  const [packages, setPackages] = useState({
    basic: { name: 'เริ่มต้น', desc: '', price: '', delivery: '3' },
    standard: { name: 'มาตรฐาน', desc: '', price: '', delivery: '5' },
    premium: { name: 'มืออาชีพ', desc: '', price: '', delivery: '7' }
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/auth/login?next=/services/new');
      else setUser(data.user);
    });
  }, [router, supabase]);

  // ระบบจัดการรูปภาพ
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (imageFiles.length + files.length > 10) {
      alert('อัปโหลดได้สูงสุด 10 รูปค่ะ');
      return;
    }
    
    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);
    
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    const newFiles = [...imageFiles];
    newFiles.splice(index, 1);
    setImageFiles(newFiles);

    const newPreviews = [...previews];
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageFiles.length === 0) return alert('กรุณาลงรูปผลงานอย่างน้อย 1 รูปค่ะ');
    
    setLoading(true);
    try {
      const uploadedUrls = [];

      // 1. อัปโหลดรูปภาพทั้งหมดเข้า Storage
      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}_${Date.now()}_${Math.random()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('service-covers') // 🌟 อย่าลืมสร้าง Bucket นี้ใน Supabase นะคะ
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('service-covers').getPublicUrl(uploadData.path);
        uploadedUrls.push(publicUrl);
      }

      // 2. บันทึกข้อมูลลง Database
      const { data, error } = await supabase.from('provider_services').insert({
        provider_id: user?.id,
        title,
        category,
        description,
        packages,
        gallery_urls: uploadedUrls, // 🌟 เพิ่มคอลัมน์นี้ใน SQL (text[])
        cover_image_url: uploadedUrls[0], // รูปแรกเป็นหน้าปก
        price_start: Number(packages.basic.price),
        status: 'active'
      }).select().single();

      if (error) throw error;
      router.push(`/services/${data.id}`);

    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-24 font-sans">
      <div className="max-w-4xl mx-auto p-4 sm:p-8">
        
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="text-2xl font-black text-gray-400">←</button>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">สร้างแพ็กเกจบริการใหม่ 🚀</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* ส่วนที่ 1: รูปภาพผลงาน */}
          <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h2 className="text-xl font-black mb-2 flex items-center gap-2"><span>🖼️</span> รูปภาพผลงาน ({imageFiles.length}/10)</h2>
            <p className="text-xs text-gray-400 font-bold mb-6 uppercase tracking-wider">รูปแรกจะถูกใช้เป็นหน้าปกบริการ</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {previews.map((src, index) => (
                <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-orange-100 group">
                  <img src={src} className="w-full h-full object-cover" />
                  <button 
                    type="button" 
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                  >✕</button>
                  {index === 0 && <div className="absolute bottom-0 left-0 right-0 bg-[#EE4D2D] text-white text-[8px] font-black text-center py-1 uppercase">หน้าปก</div>}
                </div>
              ))}
              
              {imageFiles.length < 10 && (
                <label className="aspect-square rounded-2xl border-4 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer hover:bg-orange-50 transition-colors">
                  <span className="text-3xl text-gray-300">+</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              )}
            </div>
          </div>

          {/* ส่วนที่ 2: ข้อมูลทั่วไป */}
          <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2"><span>📝</span> ข้อมูลทั่วไป</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">ชื่องาน/หัวข้อบริการ</label>
                <input 
                  type="text" placeholder="เช่น รับทำความสะอาดบ้าน คอนโด สไตล์โรงแรม" value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-[#EE4D2D] focus:bg-white transition-all"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">หมวดหมู่บริการ</label>
                <select 
                  value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-[#EE4D2D]"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">รายละเอียดบริการ</label>
                <textarea 
                  placeholder="อธิบายขั้นตอนการทำงาน สิ่งที่ลูกค้าจะได้รับ..." value={description} onChange={e => setDescription(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl h-40 font-medium outline-none focus:ring-2 focus:ring-[#EE4D2D] focus:bg-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* ส่วนที่ 3: แพ็กเกจราคาแบบ 3 ระดับ */}
          <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2"><span>💎</span> ตั้งค่าแพ็กเกจราคา</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(['basic', 'standard', 'premium'] as const).map((tier) => (
                <div key={tier} className={`p-6 rounded-[2rem] border-2 transition-all ${tier === 'standard' ? 'border-orange-200 bg-orange-50/30' : 'border-gray-50 bg-gray-50/50'}`}>
                  <p className="font-black text-[#EE4D2D] mb-4 uppercase text-center tracking-widest">{tier}</p>
                  
                  <div className="space-y-4">
                    <input 
                      type="number" placeholder="ราคา (บาท)" required
                      className="w-full p-3 rounded-xl text-center font-black text-lg shadow-sm border border-gray-100"
                      value={packages[tier].price}
                      onChange={e => setPackages({...packages, [tier]: {...packages[tier], price: e.target.value}})}
                    />
                    <input 
                      type="text" placeholder="ชื่อแพ็กเกจ (เช่น เริ่มต้น)" 
                      className="w-full p-3 rounded-xl text-xs font-bold text-center"
                      value={packages[tier].name}
                      onChange={e => setPackages({...packages, [tier]: {...packages[tier], name: e.target.value}})}
                    />
                    <textarea 
                      placeholder="แพ็กเกจนี้ทำอะไรให้บ้าง?" 
                      className="w-full p-3 rounded-xl text-xs h-28 font-medium"
                      value={packages[tier].desc}
                      onChange={e => setPackages({...packages, [tier]: {...packages[tier], desc: e.target.value}})}
                    />
                    <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-gray-100">
                      <span className="text-[10px] font-black text-gray-400 pl-2">🚚 ส่งงานใน (วัน)</span>
                      <input 
                        type="number" className="w-12 text-center font-black text-[#EE4D2D]"
                        value={packages[tier].delivery}
                        onChange={e => setPackages({...packages, [tier]: {...packages[tier], delivery: e.target.value}})}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-6 bg-[#EE4D2D] text-white rounded-[2rem] font-black text-xl shadow-xl hover:shadow-orange-200 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'กำลังบันทึกร้านค้าของคุณ...' : 'เปิดร้านรับงานเลย! ✨'}
          </button>
        </form>
      </div>
    </div>
  );
}

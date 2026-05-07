'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ServiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [service, setService] = useState<any>(null);
  const [provider, setProfile] = useState<any>(null);
  const [selectedPkg, setSelectedPkg] = useState(0); // 0: Basic, 1: Standard, 2: Premium
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!params?.id) return;

      // 1. ดึงข้อมูลบริการ
      const { data: sData } = await supabase
        .from('services')
        .select('*')
        .eq('id', params.id)
        .single();

      if (sData) {
        setService(sData);
        // 2. ดึงข้อมูลคนขาย (Provider)
        const { data: pData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sData.provider_id)
          .single();
        if (pData) setProfile(pData);
      }
      setLoading(false);
    };
    fetchDetail();
  }, [params?.id, supabase]);

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#00C300] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!service) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-5 text-center">
      <h1 className="text-4xl mb-4">🔍</h1>
      <p className="font-black text-gray-800">ไม่พบหน้านามบัตรที่ท่านเรียกหา</p>
      <Link href="/services" className="mt-4 text-[#00C300] font-bold">กลับไปหน้าค้นหา</Link>
    </div>
  );

  const images = service.images || [service.cover_image_url];
  const packages = service.packages || [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-32">
      
      {/* 🟢 Navigation Top Bar */}
      <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center gap-4">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full text-gray-600">←</button>
        <div className="flex-1 truncate">
           <h1 className="font-black text-gray-800 truncate text-sm">{service.title}</h1>
           <p className="text-[10px] font-bold text-[#00C300] uppercase tracking-widest">{service.category}</p>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto md:pt-8 md:px-5">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* 📸 Left Side: Gallery & Description */}
          <div className="flex-1 space-y-8">
            
            {/* Gallery Section */}
            <section className="bg-white md:rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100">
              <div className="aspect-video bg-gray-900 relative">
                {images[activeImg] ? (
                  <img src={images[activeImg]} className="w-full h-full object-contain" alt="gallery" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">ไม่มีรูปภาพประกอบ</div>
                )}
              </div>
              <div className="p-4 flex gap-2 overflow-x-auto scrollbar-hide bg-gray-50/50">
                {images.map((img: string, idx: number) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveImg(idx)}
                    className={`w-20 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${activeImg === idx ? 'border-[#00C300] scale-105 shadow-md' : 'border-transparent opacity-60'}`}
                  >
                    <img src={img} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </section>

            {/* Overview Section */}
            <section className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-3">
                <span className="w-2 h-8 bg-[#00C300] rounded-full"></span>
                รายละเอียดบริการ
              </h2>
              <div className="prose max-w-none text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">
                {service.description}
              </div>
            </section>

            {/* Provider Profile Card */}
            <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
               <div className="absolute right-[-20px] bottom-[-20px] opacity-10 rotate-12">
                 <img src="/logo.png" className="w-48 h-48 brightness-0 invert" />
               </div>
               <div className="flex items-center gap-6 relative z-10">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-[#00C300] overflow-hidden shrink-0 shadow-lg">
                    {provider?.avatar_url ? <img src={provider.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-700 flex items-center justify-center text-3xl">👤</div>}
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-black">{provider?.full_name || 'ช่างผู้เชี่ยวชาญ'}</h3>
                    <p className="text-gray-400 text-sm font-medium mt-1">{provider?.bio || 'พร้อมให้บริการด้วยใจครับ'}</p>
                    <div className="flex gap-4 mt-4">
                      <div className="text-center bg-white/10 px-4 py-2 rounded-2xl border border-white/10">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">รีวิว</p>
                        <p className="font-black text-[#F59E0B]">⭐ 5.0</p>
                      </div>
                      <div className="text-center bg-white/10 px-4 py-2 rounded-2xl border border-white/10">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">สำเร็จ</p>
                        <p className="font-black">12 งาน</p>
                      </div>
                    </div>
                  </div>
               </div>
            </section>
          </div>

          {/* 💳 Right Side: Pricing Packages (Sticky on Desktop) */}
          <div className="md:w-[380px]">
            <div className="sticky top-24 space-y-6">
              
              {/* Package Selector Card */}
              <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                <div className="flex border-b border-gray-50">
                  {packages.map((pkg: any, idx: number) => (
                    <button 
                      key={idx}
                      onClick={() => setSelectedPkg(idx)}
                      className={`flex-1 py-4 text-xs font-black transition-all ${selectedPkg === idx ? 'text-[#00C300] bg-green-50/30' : 'text-gray-400 bg-white hover:text-gray-600'}`}
                    >
                      {pkg.name.split(' ')[0]}
                      {selectedPkg === idx && <div className="h-1 w-8 bg-[#00C300] mx-auto mt-1 rounded-full"></div>}
                    </button>
                  ))}
                </div>

                <div className="p-8">
                  <div className="flex justify-between items-baseline mb-6">
                    <span className="text-3xl font-black text-gray-800">฿{Number(packages[selectedPkg]?.price || 0).toLocaleString()}</span>
                    <span className="text-xs font-bold text-gray-400 uppercase">ราคาแพ็กเกจ</span>
                  </div>

                  <p className="text-sm font-bold text-gray-600 mb-8 leading-relaxed h-20 overflow-y-auto">
                    {packages[selectedPkg]?.content}
                  </p>

                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3 text-xs font-bold text-gray-500">
                      <span className="text-lg">⏱️</span> ส่งมอบงานภายใน {packages[selectedPkg]?.delivery} วัน
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-gray-500">
                      <span className="text-lg">✏️</span> แก้ไขงานได้ {packages[selectedPkg]?.revisions} ครั้ง
                    </div>
                  </div>

                  <button className="w-full py-5 bg-gradient-to-r from-[#00C300] to-[#00A300] text-white rounded-2xl font-black text-lg shadow-xl shadow-green-200 hover:shadow-green-300 active:scale-95 transition-all">
                    จ้างงานทันที 🤝
                  </button>
                  
                  <button className="w-full mt-3 py-3 border-2 border-gray-100 text-gray-500 rounded-2xl font-black text-sm hover:bg-gray-50 transition-colors">
                    สอบถามข้อมูลเพิ่มเติม 💬
                  </button>
                </div>
              </div>

              {/* Secure Transaction Badge */}
              <div className="bg-emerald-50 rounded-2xl p-4 flex items-center gap-4 border border-emerald-100">
                 <span className="text-2xl">🛡️</span>
                 <p className="text-[10px] font-bold text-emerald-800 leading-tight">
                   จ้างงานผ่านระบบจงเจริญ ปลอดภัย 100%<br/>เราจะโอนเงินให้ช่างเมื่อท่านยืนยันรับงานเท่านั้น
                 </p>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* 📱 Mobile Floating Button (แสดงเฉพาะมือถือ) */}
      <div className="md:hidden fixed bottom-6 left-5 right-5 z-[110]">
         <button className="w-full py-4 bg-[#EE4D2D] text-white rounded-2xl font-black text-lg shadow-2xl flex items-center justify-between px-8">
            <span className="text-sm opacity-90 font-bold">เริ่มต้น ฿{Number(packages[0]?.price).toLocaleString()}</span>
            <span>จ้างเลย ➔</span>
         </button>
      </div>

    </div>
  );
}

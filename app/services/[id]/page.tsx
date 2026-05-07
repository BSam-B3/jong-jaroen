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
  
  // 🌟 States สำหรับเจ้าของการ์ด
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!params?.id) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
      }

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

  // 🌟 ฟังก์ชัน เปิด/ปิด โพสต์
  const togglePostStatus = async () => {
    setIsToggling(true);
    const newStatus = !service.is_active;
    
    const { error } = await supabase
      .from('services')
      .update({ is_active: newStatus })
      .eq('id', service.id);

    if (!error) {
      setService({ ...service, is_active: newStatus });
      alert(newStatus ? '📢 เปิดโพสต์ Jobs-Card แล้ว!' : '🔒 ปิดโพสต์ Jobs-Card แล้ว (ตอนนี้สามารถแก้ไขข้อมูลได้)');
    } else {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
    setIsToggling(false);
  };

  // 🌟 ฟังก์ชันก๊อปปี้ลิงก์แชร์
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
  const isOwner = currentUserId === service.provider_id;

  // ฟังก์ชันช่วยกำหนดสีแพ็กเกจ
  const getPkgColorClass = (idx: number, isActive: boolean) => {
    if (idx === 0) return isActive ? 'border-gray-800 text-gray-800 bg-gray-50' : 'border-transparent text-gray-400 hover:bg-gray-50';
    if (idx === 1) return isActive ? 'border-[#00C300] text-[#00C300] bg-green-50/30' : 'border-transparent text-gray-400 hover:bg-green-50/20';
    if (idx === 2) return isActive ? 'border-[#F59E0B] text-[#F59E0B] bg-orange-50/30' : 'border-transparent text-gray-400 hover:bg-orange-50/20';
    return '';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-32">
      
      {/* 🟢 Navigation Top Bar */}
      <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4 truncate">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors">←</button>
          <div className="truncate">
             <h1 className="font-black text-gray-800 truncate text-sm">{service.title}</h1>
             <div className="flex items-center gap-2 mt-0.5">
               <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{service.category}</span>
               {/* Badge แสดงสถานะการ์ด */}
               <span className={`text-[9px] font-black px-2 py-0.5 rounded-sm text-white ${service.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`}>
                 {service.is_active ? 'LIVE' : 'CLOSED'}
               </span>
             </div>
          </div>
        </div>
        <button onClick={handleShare} className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors shrink-0" title="แชร์ Jobs-Card">
          {copied ? '✅' : '🔗'}
        </button>
      </nav>

      <main className="max-w-6xl mx-auto md:pt-6 md:px-5">
        
        {/* 🌟 Owner Control Panel (เห็นเฉพาะเจ้าของการ์ด) */}
        {isOwner && (
          <div className="mx-4 md:mx-0 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center text-xl">🛠️</div>
              <div>
                <p className="font-black text-blue-900 text-sm">การจัดการ Jobs-Card (มุมมองเจ้าของ)</p>
                <p className="text-xs text-blue-600 font-medium">
                  {service.is_active ? 'ขณะนี้ลูกค้าสามารถกดจ้างงานคุณได้' : 'ขณะนี้การ์ดถูกปิดซ่อนไว้ ลูกค้าจะไม่เห็นการ์ดนี้'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button 
                onClick={togglePostStatus}
                disabled={isToggling}
                className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-black text-xs text-white transition-all shadow-sm ${service.is_active ? 'bg-gray-800 hover:bg-gray-700' : 'bg-[#00C300] hover:bg-[#00A300]'}`}
              >
                {isToggling ? 'กำลังอัปเดต...' : (service.is_active ? '🔒 ปิดโพสต์' : '📢 เปิดโพสต์')}
              </button>
              
              <button 
                onClick={() => router.push(`/profile/jobs-cards/edit/${service.id}`)}
                disabled={service.is_active}
                className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-sm border ${
                  service.is_active 
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                    : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
                }`}
                title={service.is_active ? "ต้องปิดโพสต์ก่อนจึงจะแก้ไขได้" : ""}
              >
                ✏️ แก้ไขข้อมูล
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8 px-4 md:px-0">
          
          {/* 📸 Left Side: Gallery & Description */}
          <div className="flex-1 space-y-8">
            
            {/* Gallery Section */}
            <section className="bg-white md:rounded-[2.5rem] rounded-2xl overflow-hidden shadow-sm border border-gray-100">
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
                    className={`w-20 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${activeImg === idx ? 'border-[#00C300] scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
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
              
              {/* 🌟 Package Selector Card (ปรับสีสันตามที่บีสามรีเควส) */}
              <div className={`bg-white rounded-[2.5rem] shadow-2xl border-4 overflow-hidden transition-colors duration-300 ${selectedPkg === 0 ? 'border-gray-800' : selectedPkg === 1 ? 'border-[#00C300]' : 'border-[#F59E0B]'}`}>
                
                {/* Tabs เลือกแพ็กเกจ */}
                <div className="flex p-2 gap-2 bg-gray-50/50 border-b border-gray-100">
                  {packages.map((pkg: any, idx: number) => (
                    <button 
                      key={idx}
                      onClick={() => setSelectedPkg(idx)}
                      className={`flex-1 py-3 text-xs font-black rounded-2xl border-2 transition-all duration-300 ${getPkgColorClass(idx, selectedPkg === idx)}`}
                    >
                      {pkg.name.split(' ')[0]}
                    </button>
                  ))}
                </div>

                <div className="p-8 relative overflow-hidden">
                  {/* พื้นหลังตกแต่งมุมขวาบนเบาๆ */}
                  <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-20 ${selectedPkg === 0 ? 'bg-gray-800' : selectedPkg === 1 ? 'bg-[#00C300]' : 'bg-[#F59E0B]'}`}></div>

                  <div className="flex justify-between items-baseline mb-4 relative z-10">
                    <span className={`text-4xl font-black ${selectedPkg === 0 ? 'text-gray-800' : selectedPkg === 1 ? 'text-[#00C300]' : 'text-[#F59E0B]'}`}>
                      ฿{Number(packages[selectedPkg]?.price || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="inline-block px-3 py-1 bg-gray-100 rounded-lg mb-6">
                    <span className="text-xs font-bold text-gray-600">{packages[selectedPkg]?.name}</span>
                  </div>

                  <p className="text-sm font-bold text-gray-700 mb-8 leading-relaxed min-h-[80px]">
                    {packages[selectedPkg]?.content}
                  </p>

                  <div className="space-y-4 mb-8 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                      <span className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-lg">⏱️</span> 
                      ส่งมอบภายใน {packages[selectedPkg]?.delivery} วัน
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                      <span className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-lg">✏️</span> 
                      แก้ไขงานได้ {packages[selectedPkg]?.revisions} ครั้ง
                    </div>
                  </div>

                  {/* ปุ่มจ้างงาน / แจ้งเตือนปิดรับงาน */}
                  {service.is_active ? (
                    <button className={`w-full py-5 text-white rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all ${selectedPkg === 0 ? 'bg-gray-800 hover:bg-gray-700 shadow-gray-200' : selectedPkg === 1 ? 'bg-gradient-to-r from-[#00C300] to-[#00A300] hover:shadow-green-200' : 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:shadow-orange-200'}`}>
                      จ้างงานแพ็กเกจนี้ 🤝
                    </button>
                  ) : (
                    <div className="w-full py-5 bg-gray-100 text-gray-400 rounded-2xl font-black text-center border border-gray-200">
                      🔒 ช่างปิดรับงานชั่วคราว
                    </div>
                  )}
                  
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

      {/* 📱 Mobile Floating Button (แสดงเฉพาะมือถือ และเปิดรับงานอยู่) */}
      {service.is_active && (
        <div className="md:hidden fixed bottom-6 left-5 right-5 z-[110]">
           <button className={`w-full py-4 text-white rounded-2xl font-black text-lg shadow-2xl flex items-center justify-between px-8 ${selectedPkg === 0 ? 'bg-gray-800' : selectedPkg === 1 ? 'bg-[#00C300]' : 'bg-[#F59E0B]'}`}>
              <span className="text-sm opacity-90 font-bold">เลือกแพ็กเกจนี้</span>
              <span>฿{Number(packages[selectedPkg]?.price || 0).toLocaleString()} ➔</span>
           </button>
        </div>
      )}

    </div>
  );
}

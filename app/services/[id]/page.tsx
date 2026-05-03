'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

// ── Soft Shopee Palette ───────────────────────────────────────────────────────
const themePalette = {
  primaryOrange: '#EE4D2D', 
  lightOrange: '#FF8769',
  bgGray: '#F4F6F8',
};

type ServiceDetail = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  price_start: number;
  rating: number;
  reviews_count: number;
  provider_id: string;
  created_at: string;
  cover_image_url: string | null;
  packages: any; // 🌟 เพิ่มสำหรับเก็บข้อมูล 3 แพ็กเกจ
  profiles: {
    full_name: string | null;
    location: string | null;
    kyc_status?: string | null;
    avatar_url?: string | null;
  } | null;
};

export default function ServiceDetailPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // 🌟 State สำหรับระบบ Tab (Fastwork Style)
  const [activeTab, setActiveTab] = useState<'overview' | 'packages' | 'freelancer' | 'reviews'>('overview');

  useEffect(() => {
    const fetchServiceAndUser = async () => {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setCurrentUser(session.user);

      const { data, error } = await supabase
        .from('provider_services')
        .select(`*, profiles(full_name, location, kyc_status, avatar_url)`)
        .eq('id', params.id as string)
        .single();

      if (!error && data) setService(data as ServiceDetail);
      setLoading(false);
    };

    if (params.id) fetchServiceAndUser();
  }, [params.id, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: themePalette.bgGray }}>
        <div className="text-center">
          <span className="text-4xl block mb-3 animate-bounce">⏳</span>
          <p className="text-gray-500 text-sm font-medium">กำลังโหลดข้อมูลช่าง...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: themePalette.bgGray }}>
        <div className="text-center">
          <span className="text-6xl block mb-3">🔍</span>
          <p className="text-gray-700 font-bold">ไม่พบข้อมูลบริการ</p>
          <button onClick={() => router.back()} className="mt-4 text-[#EE4D2D] text-sm font-bold underline">
            กลับหน้าค้นหา
          </button>
        </div>
      </div>
    );
  }

  const isOwner = currentUser?.id === service.provider_id;
  const isVerified = service.profiles?.kyc_status === 'approved';
  
  // จำลองข้อมูล Packages ถ้าช่างยังไม่ได้สร้างแบบ 3 ระดับ
  const displayPackages = service.packages || {
    basic: { name: 'เริ่มต้น', desc: 'บริการขั้นพื้นฐาน ตามรายละเอียดที่ระบุ', price: service.price_start },
  };

  return (
    <div className="min-h-screen pb-28 w-full sm:max-w-2xl md:max-w-3xl mx-auto relative selection:bg-orange-200 shadow-xl" style={{ backgroundColor: themePalette.bgGray }}>
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
      
      {/* ── Header ── */}
      <div className="bg-white px-4 py-3 sticky top-0 z-40 border-b border-gray-100 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.back()} className="p-1.5 hover:bg-orange-50 rounded-full transition text-gray-600 hover:text-[#EE4D2D]">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-[17px] font-bold text-gray-800 line-clamp-1 flex-1">{service.title}</h1>
        {/* ปุ่มแชร์ / โปรด */}
        <button className="text-gray-400 hover:text-[#EE4D2D]"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg></button>
      </div>

      {/* ── Cover Image ── */}
      <div className="relative w-full aspect-video bg-slate-200 overflow-hidden">
        {service.cover_image_url ? (
          <img src={service.cover_image_url} alt={service.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-300">
            <span className="text-6xl mb-2">🛠️</span>
            <span className="text-sm font-bold">ไม่มีรูปผลงานประกอบ</span>
          </div>
        )}
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/10">
          <span className="text-yellow-400 text-xs">⭐</span>
          <span className="text-white font-bold text-xs">{Number(service.rating || 0).toFixed(1)}</span>
        </div>
      </div>

      {/* ── Tabs Navigation (Fastwork Style) ── */}
      <div className="bg-white border-b border-gray-200 sticky top-[53px] z-30 overflow-x-auto hide-scrollbar">
        <div className="flex w-max min-w-full">
          {[
            { id: 'overview', label: 'ภาพรวม' },
            { id: 'packages', label: 'แพ็กเกจ' },
            { id: 'freelancer', label: 'ช่าง/ฟรีแลนซ์' },
            { id: 'reviews', label: `รีวิว (${service.reviews_count || 0})` },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[90px] text-center px-4 py-3.5 text-[13px] font-black transition-all border-b-2 ${
                activeTab === tab.id ? 'border-[#EE4D2D] text-[#EE4D2D]' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="px-3 mt-3 space-y-3 pb-6">
        
        {/* 🌟 TAB: ภาพรวม (Overview) */}
        {activeTab === 'overview' && (
          <div className="animate-in fade-in duration-300 space-y-3">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <span className="bg-orange-50 text-[#EE4D2D] px-2.5 py-1 rounded-md text-[10px] font-black uppercase mb-3 inline-block">
                {service.category}
              </span>
              <h3 className="text-[17px] font-black text-gray-900 leading-snug mb-3">{service.title}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500 font-bold border-t border-gray-50 pt-3">
                <span className="text-[#EE4D2D]">📍</span> {service.profiles?.location || 'ปากน้ำประแส'}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h4 className="text-[15px] font-bold text-gray-800 mb-3 border-l-4 border-[#EE4D2D] pl-2">รายละเอียดบริการ</h4>
              <div className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50/80 p-4 rounded-xl border border-gray-100 font-medium">
                {service.description || 'ช่างยังไม่ได้ระบุรายละเอียดเพิ่มเติมค่ะ'}
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 items-start">
              <div className="text-blue-500 mt-0.5 shrink-0">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
              </div>
              <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
                <span className="font-bold">แนะนำ!</span> พูดคุยตกลงรายละเอียดและชำระเงินผ่านระบบ "จงเจริญ" เพื่อความปลอดภัย และรับการคุ้มครองหากเกิดปัญหา
              </p>
            </div>
          </div>
        )}

        {/* 🌟 TAB: แพ็กเกจ (Packages) */}
        {activeTab === 'packages' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
             {Object.entries(displayPackages).map(([key, pkg]: any) => (
                <div key={key} className="bg-white rounded-2xl p-5 shadow-sm border-2 border-transparent hover:border-orange-100 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-black text-gray-800 uppercase bg-gray-100 px-3 py-1 rounded-full">{pkg.name || key}</h4>
                    <span className="text-lg font-black text-[#EE4D2D]">฿{Number(pkg.price).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-gray-600 font-medium leading-relaxed mt-4 bg-gray-50 p-3 rounded-xl border border-gray-100 whitespace-pre-line">
                    {pkg.desc || 'ให้บริการตามขอบเขตงานพื้นฐาน'}
                  </p>
                  
                  {/* ปุ่มเลือกแพ็กเกจ (จำลองการทักแชทพร้อมส่งไอดีแพ็กเกจ) */}
                  {!isOwner && (
                    <Link 
                      href={`/chat/new?provider_id=${service.provider_id}&service_id=${service.id}&package=${key}`}
                      className="mt-4 w-full block text-center py-3 bg-orange-50 text-[#EE4D2D] rounded-xl font-black text-xs active:scale-95 transition-transform"
                    >
                      สนใจแพ็กเกจนี้
                    </Link>
                  )}
                </div>
             ))}
          </div>
        )}

        {/* 🌟 TAB: ฟรีแลนซ์/ช่าง (Freelancer) */}
        {activeTab === 'freelancer' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-orange-50 border-4 border-white shadow-md rounded-full flex items-center justify-center text-4xl mb-3 relative overflow-hidden">
                {service.profiles?.avatar_url ? (
                  <img src={service.profiles.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  '👷'
                )}
                {isVerified && (
                  <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-1 border-2 border-white" title="ยืนยันตัวตนแล้ว">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={4} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                )}
              </div>
              
              <h2 className="text-lg font-black text-gray-900">{service.profiles?.full_name || 'ผู้ให้บริการ'}</h2>
              <div className="flex items-center gap-2 mt-1 mb-4">
                <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> ตอบกลับไวมาก
                </span>
              </div>
              
              <p className="text-xs text-gray-500 font-medium px-4">
                "มุ่งมั่นให้บริการที่ดีที่สุด ใส่ใจทุกรายละเอียด เพื่อความพึงพอใจของลูกค้า"
              </p>
            </div>
          </div>
        )}

        {/* 🌟 TAB: รีวิว (Reviews) */}
        {activeTab === 'reviews' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
              <div className="text-5xl mb-3 opacity-50">⭐</div>
              <p className="text-sm font-black text-gray-800">ยังไม่มีรีวิวสำหรับบริการนี้</p>
              <p className="text-xs text-gray-400 font-medium mt-1">จ้างช่างคนนี้เป็นคนแรกสิคะ!</p>
            </div>
          </div>
        )}
      </main>

      {/* ── Bottom Action Bar ── */}
      <div className="fixed bottom-0 w-full sm:max-w-2xl md:max-w-3xl bg-white/95 backdrop-blur-xl border-t border-gray-100 p-4 flex items-center justify-between z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.06)] pb-safe">
        
        {isOwner ? (
          <div className="w-full">
            <Link 
              href={`/services/manage/${service.id}`}
              className="block w-full bg-gray-900 hover:bg-black active:scale-95 text-white py-3.5 rounded-xl font-black text-sm text-center transition-all shadow-md"
            >
              ⚙️ จัดการบริการของคุณ
            </Link>
          </div>
        ) : (
          <>
            <div className="pr-3">
              <p className="text-[10px] text-gray-500 font-bold mb-0.5 uppercase tracking-wide">ราคาเริ่มต้น</p>
              <div className="flex items-baseline gap-1">
                <p className="text-xl font-black text-[#EE4D2D]">฿{service.price_start.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="flex gap-2 flex-1 justify-end">
              {/* ปุ่มแชท */}
              <Link 
                href={`/chat/new?provider_id=${service.provider_id}&service_id=${service.id}`}
                className="bg-orange-50 hover:bg-orange-100 text-[#EE4D2D] border border-orange-200 active:scale-95 px-4 py-3 rounded-xl font-black text-[13px] transition-all flex items-center justify-center shadow-sm whitespace-nowrap"
              >
                💬 แชท
              </Link>
              
              {/* ปุ่มจ้างงาน */}
              <Link 
                href={`/checkout/service/${service.id}`}
                className="bg-[#EE4D2D] hover:bg-[#d64528] active:scale-95 text-white flex-1 py-3 rounded-xl font-black text-[13px] transition-all flex items-center justify-center shadow-lg shadow-orange-200/50"
              >
                🚀 จ้างเลย
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

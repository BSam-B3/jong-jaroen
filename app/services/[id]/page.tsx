'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

// ── Soft Shopee Palette ───────────────────────────────────────────────────────
const themePalette = {
  primaryOrange: '#EE4D2D', // ปรับให้ตรงกับสีหลักจงเจริญ
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
  profiles: {
    full_name: string | null;
    location: string | null;
    kyc_status?: string | null;
  } | null;
};

export default function ServiceDetailPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServiceAndUser = async () => {
      setLoading(true);
      
      // 1. ดึงข้อมูล User ปัจจุบัน
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setCurrentUser(session.user);

      // 2. ดึงข้อมูลบริการ
      const { data, error } = await supabase
        .from('provider_services')
        .select(`*, profiles(full_name, location, kyc_status)`)
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

  return (
    <div className="min-h-screen pb-28 max-w-md mx-auto relative selection:bg-orange-200" style={{ backgroundColor: themePalette.bgGray }}>
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
      
      {/* ── Header ── */}
      <div className="bg-white px-4 py-3 sticky top-0 z-40 border-b border-gray-100 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.back()} className="p-1.5 hover:bg-orange-50 rounded-full transition text-gray-600 hover:text-[#EE4D2D]">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-[17px] font-bold text-gray-800 line-clamp-1">รายละเอียดบริการ</h1>
      </div>

      <main className="px-3 mt-3 space-y-3">
        {/* ── Profile & Title Section ── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-orange-50 border border-orange-100 rounded-full flex items-center justify-center text-3xl shrink-0 relative">
              👷
              {isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-white" title="ยืนยันตัวตนแล้ว">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={4} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-gray-800 flex items-center gap-1.5">
                {service.profiles?.full_name || 'ผู้ให้บริการ'}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1 font-medium">
                <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                  ⭐ {Number(service.rating || 0).toFixed(1)}
                  <span className="text-gray-400 font-medium">({service.reviews_count || 0} รีวิว)</span>
                </span>
                <span>•</span>
                <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">พร้อมรับงาน</span>
              </div>
            </div>
          </div>
          <h3 className="text-lg font-black text-gray-900 leading-tight">{service.title}</h3>
        </div>

        {/* ── Metadata Grid ── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h4 className="text-[15px] font-bold text-gray-800 mb-4 border-l-4 border-[#EE4D2D] pl-2">ข้อมูลเบื้องต้น</h4>
          <div className="grid grid-cols-2 gap-y-4 gap-x-4">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 mb-0.5 uppercase tracking-wide">หมวดหมู่งาน</p>
              <p className="text-sm font-bold text-gray-800">{service.category}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 mb-0.5 uppercase tracking-wide">พื้นที่บริการ</p>
              <p className="text-sm font-bold text-gray-800">{service.profiles?.location || 'ปากน้ำประแส'}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 mb-0.5 uppercase tracking-wide">ลักษณะการจ้าง</p>
              <p className="text-sm font-bold text-gray-800">บริการรายครั้ง</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 mb-0.5 uppercase tracking-wide">ราคาเริ่มต้น</p>
              <p className="text-sm font-black text-[#EE4D2D]">฿{service.price_start.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* ── Detail Section ── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h4 className="text-[15px] font-bold text-gray-800 mb-3 border-l-4 border-[#EE4D2D] pl-2">รายละเอียดบริการ</h4>
          <div className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50/80 p-4 rounded-xl border border-gray-100 font-medium">
            {service.description || 'ช่างยังไม่ได้ระบุรายละเอียดเพิ่มเติมค่ะ'}
          </div>
        </div>

        {/* ── Trust Banner ── */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 items-start mt-2">
          <div className="text-blue-500 mt-0.5 shrink-0">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
          </div>
          <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
            <span className="font-bold">แนะนำ!</span> พูดคุยตกลงรายละเอียดและชำระเงินผ่านระบบ "จงเจริญ" เพื่อความปลอดภัย และรับการคุ้มครองหากเกิดปัญหา
          </p>
        </div>
      </main>

      {/* ── Bottom Action Bar (แยกปุ่มแชท และ ปุ่มจ้าง) ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 p-4 max-w-md mx-auto flex items-center justify-between z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.06)] pb-safe">
        
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
              <p className="text-[10px] text-gray-500 font-bold mb-0.5 uppercase tracking-wide">เริ่มต้น</p>
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

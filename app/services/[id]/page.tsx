'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// ── Soft Shopee Palette ───────────────────────────────────────────────────────
const themePalette = {
  primaryOrange: '#F05D40',
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
  } | null;
};

export default function ServiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchService = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('provider_services')
        .select(`*, profiles(full_name, location)`)
        .eq('id', params.id as string)
        .single();

      if (!error && data) setService(data as ServiceDetail);
      setLoading(false);
    };

    if (params.id) fetchService();
  }, [params.id]);

  const handleChatClick = () => {
    setLoadingChat(true);
    setTimeout(() => {
      alert('จำลองการเปิดห้องแชท (รอเชื่อมต่อ Backend)');
      setLoadingChat(false);
    }, 800);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: themePalette.bgGray }}>
        <div className="text-center">
          <span className="text-4xl animate-spin block mb-3">⚙️</span>
          <p className="text-gray-500 text-sm font-medium">กำลังโหลดข้อมูล...</p>
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
          <button onClick={() => router.back()} className="mt-4 text-[#F05D40] text-sm font-bold underline">
            กลับหน้าก่อน
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 max-w-md mx-auto relative selection:bg-orange-200" style={{ backgroundColor: themePalette.bgGray }}>
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
      {/* ── Header ── */}
      <div className="bg-white px-4 py-3 sticky top-0 z-10 border-b border-gray-100 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.back()} className="p-1.5 hover:bg-orange-50 rounded-full transition text-gray-600 hover:text-[#F05D40]">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-[17px] font-bold text-gray-800">รายละเอียดบริการ</h1>
      </div>

      <main className="px-3 mt-3 space-y-3">
        {/* ── Profile & Title Section ── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-orange-50 border border-orange-100 rounded-full flex items-center justify-center text-3xl shrink-0">
              👷
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-gray-800 flex items-center gap-1.5">
                {service.profiles?.full_name || 'ผู้ให้บริการ'}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1 font-medium">
                <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                  ⭐ {service.rating}
                  <span className="text-gray-400 font-medium">({service.reviews_count} รีวิว)</span>
                </span>
                <span>•</span>
                <span className="text-green-600 font-semibold bg-green-50 px-1.5 py-0.5 rounded">ออนไลน์</span>
              </div>
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900 leading-tight">{service.title}</h3>
        </div>

        {/* ── Metadata Grid ── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h4 className="text-[15px] font-bold text-gray-800 mb-4 border-l-4 border-[#F05D40] pl-2">ข้อมูลเบื้องต้น</h4>
          <div className="grid grid-cols-2 gap-y-4 gap-x-4">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 mb-0.5">หมวดหมู่งาน</p>
              <p className="text-sm font-semibold text-gray-800">{service.category}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 mb-0.5">พื้นที่</p>
              <p className="text-sm font-semibold text-gray-800">{service.profiles?.location || 'ปากน้ำประแส'}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 mb-0.5">ลักษณะการจ้าง</p>
              <p className="text-sm font-semibold text-gray-800">บริการรายครั้ง</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 mb-0.5">ราคาเริ่มต้น</p>
              <p className="text-sm font-semibold text-[#F05D40]">฿{service.price_start.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* ── Detail Section ── */}
        {service.description && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h4 className="text-[15px] font-bold text-gray-800 mb-3 border-l-4 border-[#F05D40] pl-2">รายละเอียดบริการ</h4>
            <p className="text-[14px] text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              {service.description}
            </p>
          </div>
        )}

        {/* ── Trust Banner ── */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 items-start mt-2">
          <div className="text-blue-500 mt-0.5">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
          </div>
          <p className="text-xs text-blue-800 font-medium leading-relaxed">
            <span className="font-bold">แนะนำ!</span> พูดคุยตกลงรายละเอียดและชำระเงินผ่านระบบ "จงเจริญ" เพื่อความปลอดภัย และรับการคุ้มครองหากเกิดปัญหา
          </p>
        </div>
      </main>

      {/* ── Bottom Action Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 max-w-md mx-auto flex items-center justify-between z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.04)] pb-safe">
        <div>
          <p className="text-[11px] text-gray-500 font-medium mb-0.5">ราคาเริ่มต้น</p>
          <div className="flex items-baseline gap-1">
            <p className="text-2xl font-black text-[#F05D40]">฿{service.price_start.toLocaleString()}</p>
          </div>
        </div>
        <button
          onClick={handleChatClick}
          disabled={loadingChat}
          className="bg-[#F05D40] hover:bg-[#E04D30] active:scale-95 text-white px-8 py-3.5 rounded-xl font-bold text-[15px] transition-all flex items-center gap-2 shadow-lg shadow-orange-200/50 disabled:opacity-50"
        >
          {loadingChat ? 'กำลังโหลด...' : '💬 ทักแชทสอบถาม'}
        </button>
      </div>
    </div>
  );
}

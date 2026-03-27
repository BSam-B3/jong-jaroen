'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/app/components/BottomNav';

interface ProviderService {
  id: string;
  title: string;
  price_starting: number;
  rating: number;
  review_count: number;
  completed_jobs: number;
  is_sponsored: boolean;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
  service_categories?: {
    title: string;
    icon: string;
  };
}

export default function ServicesPage() {
  const router = useRouter();
  
  const [providers, setProviders] = useState<ProviderService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    const fetchProviders = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('provider_services')
          .select(`*, profiles:provider_id (first_name, last_name), service_categories:category_id (title, icon)`)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setProviders(data);
      } catch (error) {
        console.error('Error fetching providers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProviders();
  }, []);

  const filteredProviders = providers.filter((provider) => {
    const isNew = new Date(provider.created_at).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000;
    if (activeTab === 'sponsored') return provider.is_sponsored;
    if (activeTab === 'popular') return provider.rating >= 4.5 && provider.completed_jobs > 10;
    if (activeTab === 'new') return isNew;
    return true; 
  }).sort((a, b) => {
    if (activeTab === 'all') {
      if (a.is_sponsored && !b.is_sponsored) return -1;
      if (!a.is_sponsored && b.is_sponsored) return 1;
      return b.rating - a.rating;
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pb-24">
      {/* ✅ ปรับขอบมน (rounded-t-[2.5rem]) ที่ container หลัก */}
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-x-hidden rounded-t-[2.5rem]">
        
        {/* 🟠 Header ปรับ rounded-[2.5rem] ให้มนทั้ง 4 มุม */}
        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-[2.5rem] p-6 pt-10 shadow-md relative z-20">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-white text-2xl font-black tracking-tight">ค้นหาช่าง / บริการ</h1>
          </div>
          
          <div className="bg-white rounded-2xl p-1.5 flex items-center shadow-lg shadow-black/5">
            <div className="pl-3 pr-2 text-gray-400">🔍</div>
            <input 
              type="text" 
              placeholder="ค้นหาชื่อช่าง, บริการ..." 
              className="w-full bg-transparent text-sm py-2 outline-none font-medium placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="bg-white px-4 py-3 shadow-sm border-b border-gray-100 sticky top-0 z-10 flex gap-2 overflow-x-auto scrollbar-hide mt-[-20px] pt-8 rounded-t-[2rem]">
          <FilterTab label="ทั้งหมด" active={activeTab === 'all'} onClick={() => setActiveTab('all')} />
          <FilterTab label="🌟 ผู้สนับสนุน" active={activeTab === 'sponsored'} onClick={() => setActiveTab('sponsored')} />
          <FilterTab label="⭐ ยอดนิยม" active={activeTab === 'popular'} onClick={() => setActiveTab('popular')} />
          <FilterTab label="🌱 หน้าใหม่" active={activeTab === 'new'} onClick={() => setActiveTab('new')} />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide pb-24">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-gray-50 flex gap-4 animate-pulse">
                <div className="w-16 h-16 bg-gray-200 rounded-2xl shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                </div>
              </div>
            ))
          ) : filteredProviders.length === 0 ? (
            <div className="text-center py-10 text-gray-400 mt-8">
              <div className="text-4xl mb-2">🤷‍♂️</div>
              <p className="text-sm font-bold text-gray-600">ยังไม่มีช่างในหมวดหมู่นี้</p>
            </div>
          ) : (
            filteredProviders.map((provider) => {
              const isNew = new Date(provider.created_at).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000;
              return (
                <div key={provider.id} className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-gray-50 flex gap-4 active:scale-[0.98] transition-transform cursor-pointer hover:border-orange-100 hover:shadow-md relative overflow-hidden">
                  {provider.is_sponsored && (
                    <div className="absolute -right-6 top-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[8px] font-black px-8 py-0.5 transform rotate-45 shadow-sm">
                      แนะนำ
                    </div>
                  )}
                  <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-3xl shrink-0 border border-orange-100 shadow-inner">
                    {provider.service_categories?.icon || '👨‍🔧'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="bg-gray-100 text-gray-600 text-[9px] font-bold px-2 py-0.5 rounded-md">
                        {provider.service_categories?.title || 'บริการทั่วไป'}
                      </span>
                      {isNew && <span className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">🌱 หน้าใหม่</span>}
                    </div>
                    <h3 className="font-bold text-gray-800 text-sm truncate pr-4">
                      {provider.title || `ช่าง${provider.profiles?.first_name || 'ทั่วไป'}`}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-[10px] font-medium text-gray-500">
                      <span className="flex items-center text-orange-500 font-bold">
                        ⭐ {provider.rating > 0 ? provider.rating : 'ไม่มีคะแนน'}
                      </span>
                      <span>•</span>
                      <span>ผ่านงาน {provider.completed_jobs || 0} ครั้ง</span>
                    </div>
                    <div className="mt-2 text-[#EE4D2D] font-bold text-[11px]">
                      เริ่มต้น {provider.price_starting ? `${provider.price_starting} บาท` : 'ประเมินหน้างาน'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <BottomNav />

      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  </div>
  );
}

function FilterTab({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm border ${
        active ? 'bg-[#EE4D2D] text-white border-[#EE4D2D]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );
}

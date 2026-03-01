'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const CATEGORIES = [
  { id: 'all', label: 'ทั้งหมด', emoji: '🔍' },
  { id: 'electric', label: 'ช่างไฟ', emoji: '⚡' },
  { id: 'plumbing', label: 'ช่างน้ำ', emoji: '🚿' },
  { id: 'carpenter', label: 'ช่างไม้', emoji: '🪚' },
  { id: 'paint', label: 'ทาสี', emoji: '🎨' },
  { id: 'transport', label: 'ขนส่ง', emoji: '🚚' },
  { id: 'garden', label: 'ตัดหญ้า', emoji: '🌿' },
  { id: 'other', label: 'อื่นๆ', emoji: '🔧' },
];

interface Service {
  id: string;
  title: string;
  price_thb: number;
  category: string;
  provider_id: string;
  created_at: string;
  profiles: {
    full_name: string;
    location: string;
    avg_rating: number;
    total_jobs: number;
    is_verified: boolean;
    avatar_url: string | null;
  };
}

function StarDisplay({ rating }: { rating: number }) {
  const r = Math.round(rating || 0);
  return (
    <span className="text-yellow-400 text-sm">
      {'★'.repeat(r)}{'☆'.repeat(5 - r)}
      <span className="text-gray-400 text-xs ml-1">{(rating || 0).toFixed(1)}</span>
    </span>
  );
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [filtered, setFiltered] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'price_asc' | 'price_desc' | 'jobs'>('rating');
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      // Get user role for nav link
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        setUserRole(profile?.role || null);
      }

      const { data } = await supabase
        .from('services')
        .select(`
          id, title, price_thb, category, provider_id, created_at,
          profiles ( full_name, location, avg_rating, total_jobs, is_verified, avatar_url )
        `)
        .order('created_at', { ascending: false });

      setServices((data as unknown as Service[]) || []);
      setFiltered((data as unknown as Service[]) || []);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    let result = [...services];

    // Filter by category
    if (activeCategory !== 'all') {
      result = result.filter(s => s.category === activeCategory);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.profiles?.full_name?.toLowerCase().includes(q) ||
        s.profiles?.location?.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === 'rating') {
      result.sort((a, b) => (b.profiles?.avg_rating || 0) - (a.profiles?.avg_rating || 0));
    } else if (sortBy === 'price_asc') {
      result.sort((a, b) => a.price_thb - b.price_thb);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.price_thb - a.price_thb);
    } else if (sortBy === 'jobs') {
      result.sort((a, b) => (b.profiles?.total_jobs || 0) - (a.profiles?.total_jobs || 0));
    }

    setFiltered(result);
  }, [services, activeCategory, searchQuery, sortBy]);

  const dashboardLink = userRole === 'freelancer' ? '/dashboard/freelancer' : '/dashboard/customer';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-500 text-white">
        <div className="max-w-xl mx-auto px-4 pt-6 pb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">จงเจริญ 🌟</h1>
              <p className="text-green-100 text-sm">ค้นหาช่างในชุมชนปากน้ำประแส</p>
            </div>
            {userRole && (
              <Link
                href={dashboardLink}
                className="bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1.5 rounded-xl transition-colors"
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ค้นหา ช่างไฟ, ซ่อมท่อ, ตัดหญ้า..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl text-gray-800 text-sm focus:outline-none shadow-lg"
            />
          </div>

          {/* Promo Banner */}
          <div className="mt-4 bg-white/15 backdrop-blur rounded-xl px-4 py-2.5 text-center">
            <p className="text-sm font-medium">
              🎟️ จ้างผ่านเรา ปลอดภัย 100% พร้อมลุ้นรางวัลรัฐบาลทุกงวด!
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 -mt-2">
        {/* Category Filter — Horizontal Scroll */}
        <div className="flex gap-2 overflow-x-auto pb-2 pt-4 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                activeCategory === cat.id
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-white text-gray-600 shadow-sm hover:bg-green-50'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Sort + Count Bar */}
        <div className="flex items-center justify-between mt-3 mb-3">
          <p className="text-sm text-gray-500">
            พบ <span className="font-semibold text-gray-800">{filtered.length}</span> บริการ
          </p>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
          >
            <option value="rating">⭐ คะแนนสูงสุด</option>
            <option value="jobs">🏆 งานมากสุด</option>
            <option value="price_asc">฿ ราคาต่ำ-สูง</option>
            <option value="price_desc">฿ ราคาสูง-ต่ำ</option>
          </select>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3 animate-bounce">🔧</div>
            <p className="text-gray-400">กำลังโหลดบริการ...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <div className="text-5xl mb-3">🔍</div>
            <h3 className="text-gray-700 font-semibold mb-1">ไม่พบบริการ</h3>
            <p className="text-gray-400 text-sm">ลองเปลี่ยนหมวดหมู่หรือคำค้นหา</p>
          </div>
        )}

        {/* Service Cards */}
        <div className="space-y-3 pb-24">
          {filtered.map((service) => {
            const profile = service.profiles;
            const catEmoji = CATEGORIES.find(c => c.id === service.category)?.emoji || '🔧';
            const gpFee = Math.ceil(service.price_thb * 0.03);
            const total = service.price_thb + gpFee;

            return (
              <div key={service.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Card Header */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                      {profile?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profile.avatar_url} alt="" className="w-full h-full rounded-2xl object-cover" />
                      ) : (
                        catEmoji
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-base font-bold text-gray-800 truncate">{service.title}</h3>
                        {profile?.is_verified && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                            ✅ ยืนยัน
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 font-medium">{profile?.full_name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-gray-400">📍 {profile?.location || 'ปากน้ำประแส'}</span>
                        <span className="text-xs text-gray-300">•</span>
                        <span className="text-xs text-gray-400">{profile?.total_jobs || 0} งาน</span>
                      </div>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="mt-2">
                    <StarDisplay rating={profile?.avg_rating || 0} />
                  </div>
                </div>

                {/* Price Section */}
                <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-green-600">฿{service.price_thb.toLocaleString()}</span>
                      <span className="text-xs text-gray-400">ค่าจ้างช่าง</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      รวม GP 3% = <span className="font-medium text-gray-600">฿{total.toLocaleString()}</span>
                    </p>
                  </div>
                  <Link
                    href={`/jobs/new?freelancer=${service.provider_id}&service=${service.id}&price=${service.price_thb}`}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
                  >
                    จ้างเลย!
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom CTA for Freelancers */}
      {userRole === 'freelancer' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg">
          <Link
            href="/services/manage"
            className="block w-full max-w-xl mx-auto bg-blue-600 hover:bg-blue-700 text-white text-center font-bold py-3 rounded-2xl transition-colors"
          >
            ✏️ จัดการบริการของฉัน
          </Link>
        </div>
      )}
      {userRole === 'customer' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg">
          <Link
            href="/jobs/new"
            className="block w-full max-w-xl mx-auto bg-green-600 hover:bg-green-700 text-white text-center font-bold py-3 rounded-2xl transition-colors"
          >
            + จ้างงานใหม่
          </Link>
        </div>
      )}
    </div>
  );
}

'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface LuckyCoupon {
  id: string;
  draw_period: string;
  lucky_number: string;
  earned_as: string;
  milestone_thb: number;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

interface Profile {
  full_name: string;
  spending_total: number;
  earning_total: number;
  lottery_count_this_month: number;
  mode: string;
}

// ── Angpao Card Component ──────────────────────────────────────
function AngpaoCard({ coupon, isHistory = false }: { coupon: LuckyCoupon; isHistory?: boolean }) {
  const expires = new Date(coupon.expires_at);
  const now = new Date();
  const isExpired = expires < now || !coupon.is_active;
  const daysLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Format period: '2569-03' -> 'มี.ค. 2569'
  const [year, month] = coupon.draw_period.split('-');
  const monthNames = ['','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  const periodLabel = `${monthNames[parseInt(month)]} ${year}`;

  // Format expires: e.g. "16 มี.ค. 69 เวลา 16.00 น."
  const expDay = expires.getDate();
  const expMon = monthNames[expires.getMonth() + 1];
  const expYr = (expires.getFullYear() + 543).toString().slice(2);
  const expTime = expires.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  const expiresLabel = `${expDay} ${expMon} ${expYr} เวลา ${expTime} น.`;

  return (
    <div className={`relative rounded-3xl overflow-hidden shadow-xl ${isExpired ? 'opacity-50 grayscale' : ''}`}>
      {/* Main Angpao body - Red gradient */}
      <div className="bg-gradient-to-br from-red-600 via-red-700 to-red-800 p-5 text-white">
        {/* Top decorative border - Gold pattern */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500" />

        {/* Header */}
        <div className="flex items-center justify-between mb-3 mt-1">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-red-800 font-black text-sm">JJ</span>
            </div>
            <div>
              <p className="text-yellow-300 font-black text-sm leading-none">จงเจริญ</p>
              <p className="text-red-200 text-xs">Jong Jaroen</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-yellow-300 text-xs font-medium">งวดประจำ</p>
            <p className="text-white font-bold text-sm">{periodLabel}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-red-500/50 border-dashed my-3" />

        {/* Lucky Number */}
        <div className="text-center py-2">
          <p className="text-yellow-300 text-xs font-medium mb-1">🎯 หมายเลขโชคดีของคุณ</p>
          <div className="flex justify-center gap-1.5 mt-1">
            {coupon.lucky_number.split('').map((digit, i) => (
              <div key={i} className="w-9 h-11 bg-yellow-400 rounded-lg flex items-center justify-center">
                <span className="text-red-800 font-black text-xl">{digit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-red-500/50 border-dashed my-3" />

        {/* Details */}
        <div className="flex justify-between items-end text-xs">
          <div>
            <p className="text-red-200">ประเภท</p>
            <p className="text-white font-medium">
              {coupon.earned_as === 'customer' ? '🏠 จ้างงาน' : '🔧 รับงาน'}
            </p>
            <p className="text-red-200 mt-1">ยอดสะสม</p>
            <p className="text-white font-medium">฿{coupon.milestone_thb.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-red-200">วันหมดอายุ</p>
            <p className="text-yellow-300 font-bold text-xs">{expiresLabel}</p>
            {!isExpired && daysLeft > 0 && (
              <p className="text-red-200 text-xs mt-0.5">เหลือ {daysLeft} วัน</p>
            )}
            {isExpired && (
              <p className="text-red-300 text-xs mt-0.5 font-medium">หมดอายุแล้ว</p>
            )}
          </div>
        </div>

        {/* Bottom gold bar */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-500 via-yellow-300 to-yellow-500" />
      </div>
    </div>
  );
}

// ── Milestone Progress ─────────────────────────────────────────
function MilestoneProgress({ profile }: { profile: Profile }) {
  const spendPct = Math.min(100, Math.round((profile.spending_total / 3000) * 100));
  const earnPct  = Math.min(100, Math.round((profile.earning_total / 5000) * 100));

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-gray-800">📊 ความคืบหน้าสู่คูปอง</h3>

      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-600">🏠 จ้างงาน (เป้า 3,000 ฿)</span>
          <span className="text-gray-500">฿{profile.spending_total.toLocaleString()} / ฿3,000</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div className="h-3 rounded-full bg-gradient-to-r from-red-500 to-yellow-400 transition-all duration-700"
               style={{ width: `${spendPct}%` }} />
        </div>
        <p className="text-xs text-right text-gray-400 mt-0.5">{spendPct}%</p>
      </div>

      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-600">🔧 รับงาน (เป้า 5,000 ฿)</span>
          <span className="text-gray-500">฿{profile.earning_total.toLocaleString()} / ฿5,000</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-yellow-400 transition-all duration-700"
               style={{ width: `${earnPct}%` }} />
        </div>
        <p className="text-xs text-right text-gray-400 mt-0.5">{earnPct}%</p>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-xl p-3">
        <p className="text-xs text-red-700 font-medium">
          🧧 ระบบจะออกคูปองจงเจริญให้คุณโดยอัตโนมัติเมื่อยอดถึงเป้า
          (1 ใบ / งวด / บัญชี)
        </p>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
function CouponsContent() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeCoupons, setActiveCoupons]   = useState<LuckyCoupon[]>([]);
  const [historyCoupons, setHistoryCoupons] = useState<LuckyCoupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      // Load profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('full_name,spending_total,earning_total,lottery_count_this_month,mode')
        .eq('id', user.id)
        .single();
      if (prof) setProfile(prof as Profile);

      // Load coupons - active ones
      const { data: active } = await supabase
        .from('lucky_coupons')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      setActiveCoupons((active || []) as LuckyCoupon[]);

      // Load last 2 expired periods for history
      const { data: history } = await supabase
        .from('lucky_coupons')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', false)
        .order('created_at', { ascending: false })
        .limit(2);
      setHistoryCoupons((history || []) as LuckyCoupon[]);

      setLoading(false);
    };
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-3 animate-bounce">🧧</div>
          <p className="text-red-600 font-medium">กำลังโหลดคูปองมงคล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 pb-24">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-700 to-red-800 shadow-lg sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard" className="text-red-200 hover:text-white text-sm">← กลับ</Link>
          <div className="flex-1 text-center">
            <h1 className="text-white font-black text-lg">🧧 คูปองจงเจริญ</h1>
            <p className="text-red-200 text-xs">คูปองมงคล • ร่วมลุ้นรางวัล</p>
          </div>
          <div className="text-right">
            <p className="text-yellow-300 text-xs font-bold">มี {activeCoupons.length} ใบ</p>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-5 space-y-5">

        {/* Milestone Progress */}
        {profile && <MilestoneProgress profile={profile} />}

        {/* Active Coupons */}
        <div>
          <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            คูปองใช้งานได้ ({activeCoupons.length})
          </h2>

          {activeCoupons.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <div className="text-5xl mb-3">🎴</div>
              <p className="text-gray-500 font-medium">ยังไม่มีคูปอง</p>
              <p className="text-gray-400 text-sm mt-1">
                จ้างงานครบ ฿3,000 หรือรับงานครบ ฿5,000 เพื่อรับคูปองมงคล
              </p>
              <Link href="/jobs/new"
                className="mt-4 inline-block bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-5 py-2 rounded-xl transition-colors">
                🔧 จ้างงานเลย
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {activeCoupons.map(c => (
                <AngpaoCard key={c.id} coupon={c} />
              ))}
            </div>
          )}
        </div>

        {/* History (last 2 periods) */}
        {historyCoupons.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-gray-500 mb-3">
              📁 ประวัติ 2 งวดล่าสุด
            </h2>
            <div className="space-y-4">
              {historyCoupons.map(c => (
                <AngpaoCard key={c.id} coupon={c} isHistory />
              ))}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-yellow-200">
          <h3 className="text-sm font-bold text-gray-800 mb-2">📋 กติกาคูปองมงคล</h3>
          <ul className="text-xs text-gray-600 space-y-1.5">
            <li>🏠 <strong>จ้างงาน:</strong> สะสมครบ ฿3,000 รับคูปอง 1 ใบ/งวด</li>
            <li>🔧 <strong>รับงาน:</strong> สะสมครบ ฿5,000 รับคูปอง 1 ใบ/งวด</li>
            <li>🎯 หมายเลข 6 หลักไม่ซ้ำกับผู้ใช้คนอื่นในงวดเดียวกัน</li>
            <li>⏰ คูปองหมดอายุสิ้นเดือน เวลา 16:00 น.</li>
            <li>🗂️ ดูประวัติได้สูงสุด 2 งวดล่าสุด</li>
            <li>🏛️ หมายเลขโชคดีอิงจากรูปแบบสลากกินแบ่งรัฐบาล (6 หลัก)</li>
          </ul>
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 z-50">
        <Link href="/" className="flex flex-col items-center text-gray-400 text-xs gap-0.5"><span>🏠</span>หน้าหลัก</Link>
        <Link href="/services" className="flex flex-col items-center text-gray-400 text-xs gap-0.5"><span>🔍</span>ค้นหา</Link>
        <Link href="/coupons" className="flex flex-col items-center text-red-600 text-xs gap-0.5"><span>🧧</span>คูปอง</Link>
        <Link href="/dashboard" className="flex flex-col items-center text-gray-400 text-xs gap-0.5"><span>📋</span>งาน</Link>
        <Link href="/profile" className="flex flex-col items-center text-gray-400 text-xs gap-0.5"><span>👤</span>โปรไฟล์</Link>
      </nav>
    </div>
  );
}

export default function CouponsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-5xl animate-bounce">🧧</div>
      </div>
    }>
      <CouponsContent />
    </Suspense>
  );
}

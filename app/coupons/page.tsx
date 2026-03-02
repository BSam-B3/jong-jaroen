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

interface DrawResult {
  period: string;
  first_prize: string;
  front3a: string;
  front3b: string;
  back3a: string;
  back3b: string;
  back2: string;
}

interface Profile {
  full_name: string;
  spending_total: number;
  earning_total: number;
  lottery_count_this_month: number;
  mode: string;
}

const monthNames = ['','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

function formatPeriod(period: string) {
  const [year, month] = period.split('-');
  return `${monthNames[parseInt(month)]} ${year}`;
}

// ── Results Card (แบบเดิม) ─────────────────────────────
function ResultsCard({ result, userNumber }: { result: DrawResult | null; userNumber?: string }) {
  if (!result) {
    return (
      <div className="rounded-3xl overflow-hidden shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
        <div className="bg-gradient-to-r from-amber-500 to-yellow-500 px-5 py-3 flex items-center justify-between">
          <div>
            <p className="text-white font-black text-sm">🏆 ผลรางวัลคูปองจงเจริญ</p>
            <p className="text-amber-100 text-xs">ยังไม่มีการประกาศผลงวดนี้</p>
          </div>
          <span className="text-3xl">🎟️</span>
        </div>
        <div className="p-6 text-center">
          <div className="text-5xl mb-3">⏳</div>
          <p className="text-amber-700 font-medium text-sm">รอประกาศผลสิ้นเดือน</p>
          <p className="text-amber-500 text-xs mt-1">Admin จะประกาศผลภายในสิ้นเดือน</p>
        </div>
      </div>
    );
  }

  const isWinner = userNumber && (
    userNumber === result.first_prize ||
    userNumber.slice(-3) === result.back3a ||
    userNumber.slice(-3) === result.back3b ||
    userNumber.slice(-2) === result.back2 ||
    userNumber.slice(0,3) === result.front3a ||
    userNumber.slice(0,3) === result.front3b
  );

  return (
    <div className={`rounded-3xl overflow-hidden shadow-xl ${isWinner ? 'ring-4 ring-amber-400' : ''}`}>
      <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-400 px-5 py-3 flex items-center justify-between">
        <div>
          <p className="text-white font-black text-sm">🏆 ผลรางวัลคูปองจงเจริญ</p>
          <p className="text-amber-900 text-xs font-medium">งวด {formatPeriod(result.period)}</p>
        </div>
        {isWinner && (
          <span className="bg-white text-amber-600 font-black text-xs px-3 py-1 rounded-full animate-bounce">
            🎉 คุณถูกรางวัล!
          </span>
        )}
      </div>

      <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5">
        <div className="text-center mb-5">
          <p className="text-amber-700 text-xs font-bold uppercase tracking-widest mb-2">รางวัลที่ 1</p>
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-white rounded-full blur-xl opacity-80 scale-110" />
            <div className="relative bg-white rounded-2xl px-6 py-3 shadow-md inline-flex gap-2">
              {result.first_prize.split('').map((digit, i) => (
                <span
                  key={i}
                  className="text-4xl font-black leading-none"
                  style={{ color: '#E53935' }}
                >
                  {digit}
                </span>
              ))}
            </div>
          </div>
          {userNumber && (
            <p className="text-xs text-amber-600 mt-2 font-medium">
              หมายเลขคุณ: <span className="font-black">{userNumber}</span>
              {userNumber === result.first_prize ? ' 🎉' : ''}
            </p>
          )}
        </div>

        <div className="border-t border-amber-200 border-dashed my-4" />

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-amber-100">
            <p className="text-amber-600 text-xs font-bold mb-2">เลขหน้า 3 ตัว</p>
            <div className="space-y-1.5">
              {[result.front3a, result.front3b].filter(Boolean).map((n, i) => (
                <div key={i} className="bg-amber-50 rounded-lg py-1 px-2">
                  <span className="font-black text-amber-800 text-base">{n}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-amber-100">
            <p className="text-amber-600 text-xs font-bold mb-2">เลขท้าย 3 ตัว</p>
            <div className="space-y-1.5">
              {[result.back3a, result.back3b].filter(Boolean).map((n, i) => (
                <div key={i} className="bg-amber-50 rounded-lg py-1 px-2">
                  <span className="font-black text-amber-800 text-base">{n}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-amber-100">
            <p className="text-amber-600 text-xs font-bold mb-2">เลขท้าย 2 ตัว</p>
            <div className="bg-amber-50 rounded-lg py-2 px-2 mt-1">
              <span className="font-black text-amber-800 text-xl">{result.back2}</span>
            </div>
          </div>
        </div>

        {isWinner && (
          <div className="mt-4 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-2xl p-3 text-center">
            <p className="text-white font-black text-sm">🎊 ยินดีด้วย! คุณถูกรางวัล</p>
            <p className="text-amber-100 text-xs mt-0.5">ติดต่อ Admin เพื่อรับรางวัล</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Coupon Card (แบบเดิม) ──────────────────────────────────
function CouponCard({ coupon, result, isHistory = false }: { coupon: LuckyCoupon; result?: DrawResult; isHistory?: boolean }) {
  const expires = new Date(coupon.expires_at);
  const now = new Date();
  const isExpired = expires < now || !coupon.is_active;
  const daysLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const periodLabel = formatPeriod(coupon.draw_period);

  const expDay = expires.getDate();
  const expMon = monthNames[expires.getMonth() + 1];
  const expYr = (expires.getFullYear() + 543).toString().slice(2);
  const expTime = expires.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  const expiresLabel = `${expDay} ${expMon} ${expYr} เวลา ${expTime} น.`;

  return (
    <div className={`relative rounded-3xl overflow-hidden shadow-lg ${isExpired ? 'opacity-60' : ''}`}>
      <div className="h-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
      <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 p-5 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow">
              <span className="text-amber-700 font-black text-sm">JJ</span>
            </div>
            <div>
              <p className="font-black text-sm leading-none">จงเจริญ</p>
              <p className="text-amber-200 text-xs">Lucky Rewards</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-amber-200 text-xs">งวดประจำ</p>
            <p className="font-bold text-sm">{periodLabel}</p>
          </div>
        </div>

        <div className="border-t border-amber-400/50 border-dashed my-3" />

        <div className="text-center py-2">
          <p className="text-amber-200 text-xs font-medium mb-2">🎯 หมายเลขโชคดีของคุณ</p>
          <div className="flex justify-center gap-1.5">
            {coupon.lucky_number.split('').map((digit, i) => (
              <div key={i} className="w-9 h-11 bg-white rounded-xl flex items-center justify-center shadow-md">
                <span className="font-black text-xl" style={{ color: '#E53935' }}>{digit}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-amber-400/50 border-dashed my-3" />

        <div className="flex justify-between items-end text-xs">
          <div>
            <p className="text-amber-200">ประเภท</p>
            <p className="font-medium">{coupon.earned_as === 'customer' ? '🏠 จ้างงาน' : '🔧 รับงาน'}</p>
            <p className="text-amber-200 mt-1">ยอดสะสม</p>
            <p className="font-medium">฿{coupon.milestone_thb.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-amber-200">วันหมดอายุ</p>
            <p className="text-yellow-200 font-bold">{expiresLabel}</p>
            {!isExpired && daysLeft > 0 && <p className="text-amber-200 text-xs mt-0.5">เหลือ {daysLeft} วัน</p>}
          </div>
        </div>
      </div>
      <div className="h-2 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500" />
    </div>
  );
}

// ── Milestone Progress ────────────────────────────────────────
function MilestoneProgress({ profile }: { profile: Profile }) {
  const spendPct = Math.min(100, Math.round((profile.spending_total / 3000) * 100));
  const earnPct  = Math.min(100, Math.round((profile.earning_total  / 5000) * 100));
  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-amber-100 space-y-4">
      <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2">
        <span className="text-lg">📊</span> ความคืบหน้าสู่คูปอง
      </h3>
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-amber-700">🏠 จ้างงาน (เป้า ฿3,000)</span>
          <span className="text-amber-600 font-medium">฿{profile.spending_total.toLocaleString()} / ฿3,000</span>
        </div>
        <div className="w-full bg-amber-100 rounded-full h-3 overflow-hidden">
          <div className="h-3 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 transition-all duration-700" style={{ width: `${spendPct}%` }} />
        </div>
      </div>
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-amber-700">🔧 รับงาน (เป้า ฿5,000)</span>
          <span className="text-amber-600 font-medium">฿{profile.earning_total.toLocaleString()} / ฿5,000</span>
        </div>
        <div className="w-full bg-amber-100 rounded-full h-3 overflow-hidden">
          <div className="h-3 rounded-full bg-gradient-to-r from-orange-400 to-amber-400 transition-all duration-700" style={{ width: `${earnPct}%` }} />
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────
function CouponsContent() {
  const router = useRouter();
  const [profile, setProfile]           = useState<Profile | null>(null);
  const [activeCoupons, setActiveCoupons] = useState<LuckyCoupon[]>([]);
  const [allCoupons, setAllCoupons]     = useState<LuckyCoupon[]>([]);
  const [results, setResults]           = useState<DrawResult[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showAll, setShowAll]           = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<string>('all');

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data: prof } = await supabase
        .from('profiles')
        .select('full_name,spending_total,earning_total,lottery_count_this_month,mode')
        .eq('id', user.id).single();
      if (prof) setProfile(prof as Profile);

      const { data: active } = await supabase
        .from('lucky_coupons').select('*')
        .eq('user_id', user.id).eq('is_active', true)
        .order('created_at', { ascending: false });
      setActiveCoupons((active || []) as LuckyCoupon[]);

      const { data: all } = await supabase
        .from('lucky_coupons').select('*')
        .eq('user_id', user.id)
        .order('draw_period', { ascending: false });
      setAllCoupons((all || []) as LuckyCoupon[]);

      const { data: res } = await supabase
        .from('draw_results').select('*')
        .order('period', { ascending: false }).limit(6);
      if (res) setResults(res as DrawResult[]);

      setLoading(false);
    };
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FFF8E1' }}>
        <div className="text-center">
          <div className="text-5xl mb-3 animate-bounce">🎟️</div>
          <p className="text-amber-600 font-medium">กำลังโหลดคูปองมงคล...</p>
        </div>
      </div>
    );
  }

  // ใช้ Array.from เพื่อแก้ปัญหา Type Error บน Vercel ค๊ะ
  const periods = Array.from(new Set(allCoupons.map(c => c.draw_period))).sort((a,b) => b.localeCompare(a));
  const filteredCoupons = filterPeriod === 'all' ? allCoupons : allCoupons.filter(c => c.draw_period === filterPeriod);
  const displayCoupons  = showAll ? filteredCoupons : filteredCoupons.slice(0, 3);
  const latestResult = results[0] || null;
  const currentCoupon = activeCoupons.find(c => c.draw_period === latestResult?.period) || activeCoupons[0];

  return (
    <div className="min-h-screen pb-24" style={{ background: '#FFF8E1' }}>
      <header className="sticky top-0 z-10 shadow-lg" style={{ background: 'linear-gradient(135deg, #F9A825 0%, #D4AF37 100%)' }}>
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard" className="text-amber-900 text-sm font-medium hover:text-white">← กลับ</Link>
          <div className="flex-1 text-center">
            <h1 className="text-amber-900 font-black text-lg">🎟️ คูปองจงเจริญ</h1>
            <p className="text-amber-800 text-xs">Lucky Rewards • ร่วมลุ้นรางวัล</p>
          </div>
          <div className="text-right">
            <p className="text-amber-900 text-xs font-bold">มี {activeCoupons.length} ใบ</p>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-5 space-y-5">
        <ResultsCard result={latestResult} userNumber={currentCoupon?.lucky_number} />
        {profile && <MilestoneProgress profile={profile} />}

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-amber-800 flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              คูปองของฉัน ({allCoupons.length})
            </h2>
            {allCoupons.length > 3 && (
              <button onClick={() => setShowAll(!showAll)} className="text-xs font-bold text-amber-600 bg-white border border-amber-200 px-3 py-1 rounded-full">
                {showAll ? 'ย่อ' : 'ดูทั้งหมด →'}
              </button>
            )}
          </div>

          <div className="space-y-4">
            {displayCoupons.map(c => (
              <CouponCard key={c.id} coupon={c} />
            ))}
          </div>
        </div>

        {results.length > 1 && (
          <div>
            <h2 className="text-sm font-bold text-amber-800 mb-3">📁 ผลรางวัลย้อนหลัง</h2>
            <div className="space-y-3">
              {results.slice(1).map(r => (
                <ResultsCard key={r.period} result={r} />
              ))}
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-amber-100 flex justify-around py-2 z-50">
        <Link href="/" className="flex flex-col items-center text-gray-400 text-xs gap-0.5"><span>🏠</span>หน้าหลัก</Link>
        <Link href="/services" className="flex flex-col items-center text-gray-400 text-xs gap-0.5"><span>🔍</span>ค้นหา</Link>
        <Link href="/coupons" className="flex flex-col items-center text-xs gap-0.5" style={{ color: '#F9A825' }}><span>🎟️</span>คูปอง</Link>
        <Link href="/dashboard" className="flex flex-col items-center text-gray-400 text-xs gap-0.5"><span>📋</span>งาน</Link>
        <Link href="/profile" className="flex flex-col items-center text-gray-400 text-xs gap-0.5"><span>👤</span>โปรไฟล์</Link>
      </nav>
    </div>
  );
}

export default function CouponsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: '#FFF8E1' }}><div className="text-5xl animate-bounce">🎟️</div></div>}>
      <CouponsContent />
    </Suspense>
  );
}

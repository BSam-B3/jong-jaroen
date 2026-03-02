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

const monthNames = ['','มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

function formatPeriod(period: string) {
  const [year, month] = period.split('-');
  return `${parseInt(year) + 543} ${monthNames[parseInt(month)]}`; // แปลงเป็นรูปแบบ ปี พ.ศ. เดือน แบบ LINE TODAY
}

function formatShortPeriod(period: string) {
  const shortMonths = ['','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  const [year, month] = period.split('-');
  return `${shortMonths[parseInt(month)]} ${year}`;
}

// ── Results Card (LINE TODAY style) ─────────────────────────────
function ResultsCard({ result, userNumber }: { result: DrawResult | null; userNumber?: string }) {
  if (!result) {
    return (
      <div className="rounded-xl overflow-hidden shadow-sm bg-orange-50/30 border border-orange-100 pb-8 pt-6 text-center">
        <div className="text-5xl mb-3 opacity-50">⏳</div>
        <p className="text-amber-800 font-medium text-lg">รอประกาศผลรางวัล</p>
        <p className="text-amber-600 text-sm mt-1">Admin จะประกาศผลภายในสิ้นเดือน</p>
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
    <div className={`bg-rose-50/40 rounded-xl overflow-hidden shadow-sm border ${isWinner ? 'border-amber-400 ring-2 ring-amber-300' : 'border-rose-100'}`}>
      
      {/* Header - Date & Prize Name */}
      <div className="text-center pt-6 pb-2">
        <h2 className="text-lg font-bold text-gray-800">
          {formatPeriod(result.period).split(' ').reverse().join(' ')}
        </h2>
        <p className="text-sm text-gray-600 mt-1 mb-3">รางวัลที่ 1</p>
      </div>

      {/* 1st Prize Numbers - Huge & Red/Pinkish */}
      <div className="text-center pb-6 border-b border-rose-100/60 mx-4">
        <span className="text-6xl font-black tracking-widest text-[#FF6B6B]">
          {result.first_prize}
        </span>
        
        {/* User Checking Result */}
        {userNumber && (
          <div className="mt-4 inline-flex items-center justify-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-orange-100">
            <span className="text-xs text-gray-500">หมายเลขคุณ:</span>
            <span className="text-sm font-bold text-gray-800 tracking-wider">{userNumber}</span>
            {userNumber === result.first_prize && <span className="text-sm animate-bounce">🎉🏆</span>}
          </div>
        )}
      </div>

      {/* Sub prizes grid */}
      <div className="grid grid-cols-3 gap-2 px-4 py-6 text-center">
        
        {/* Front 3 */}
        <div>
          <p className="text-xs text-gray-500 font-medium mb-3">เลขหน้า 3 ตัว</p>
          <div className="space-y-2">
            <p className="font-bold text-xl text-gray-800">{result.front3a || '---'}</p>
            <p className="font-bold text-xl text-gray-800">{result.front3b || '---'}</p>
          </div>
        </div>

        {/* Back 3 */}
        <div>
          <p className="text-xs text-gray-500 font-medium mb-3">เลขท้าย 3 ตัว</p>
          <div className="space-y-2">
            <p className="font-bold text-xl text-gray-800">{result.back3a || '---'}</p>
            <p className="font-bold text-xl text-gray-800">{result.back3b || '---'}</p>
          </div>
        </div>

        {/* Back 2 */}
        <div>
          <p className="text-xs text-gray-500 font-medium mb-3">เลขท้าย 2 ตัว</p>
          <div className="flex items-center justify-center h-full pb-6">
             <span className="font-bold text-4xl text-[#FF6B6B]">{result.back2 || '--'}</span>
          </div>
        </div>
      </div>

      {/* Winner Banner */}
      {isWinner && (
        <div className="bg-gradient-to-r from-amber-400 to-yellow-500 p-3 text-center">
          <p className="text-white font-black text-sm drop-shadow-sm">🎊 ยินดีด้วย! คุณถูกรางวัลในงวดนี้</p>
          <p className="text-amber-50 text-xs mt-0.5 opacity-90">กรุณาติดต่อ Admin เพื่อรับรางวัล</p>
        </div>
      )}
    </div>
  );
}

// ── Coupon Card (ส้มทอง style) ──────────────────────────────────
function CouponCard({ coupon, result, isHistory = false }: { coupon: LuckyCoupon; result?: DrawResult; isHistory?: boolean }) {
  const expires = new Date(coupon.expires_at);
  const now = new Date();
  const isExpired = expires < now || !coupon.is_active;
  const daysLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const periodLabel = formatShortPeriod(coupon.draw_period);

  const expDay = expires.getDate();
  const expMon = monthNames[expires.getMonth() + 1];
  const expYr = (expires.getFullYear() + 543).toString().slice(2);
  const expTime = expires.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  const expiresLabel = `${expDay} ${expMon} ${expYr} เวลา ${expTime} น.`;

  const isWinner = result && (
    coupon.lucky_number === result.first_prize ||
    coupon.lucky_number.slice(-3) === result.back3a ||
    coupon.lucky_number.slice(-3) === result.back3b ||
    coupon.lucky_number.slice(-2) === result.back2 ||
    coupon.lucky_number.slice(0,3) === result.front3a ||
    coupon.lucky_number.slice(0,3) === result.front3b
  );

  return (
    <div className={`relative rounded-2xl overflow-hidden shadow-sm border border-amber-200 ${isExpired ? 'opacity-60' : ''} ${isWinner ? 'ring-2 ring-amber-400' : ''}`}>
      {/* Main card - clean white with slight gold tint */}
      <div className="bg-gradient-to-br from-white to-amber-50/30 p-4">
        
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F9A825] to-[#D4AF37] flex items-center justify-center text-white font-black text-xs shadow-sm">
              JJ
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 leading-none">คูปองจงเจริญ</p>
              <p className="text-xs text-amber-600 mt-1">งวด {periodLabel}</p>
            </div>
          </div>
          {isWinner ? (
             <span className="text-[10px] bg-amber-100 text-amber-700 font-black px-2 py-1 rounded-full border border-amber-300">🎉 ถูกรางวัล</span>
          ) : (
            <span className="text-[10px] bg-gray-100 text-gray-500 font-medium px-2 py-1 rounded-full">{coupon.earned_as === 'customer' ? '🏠 ผู้จ้าง' : '🔧 ช่าง'}</span>
          )}
        </div>

        <div className="flex items-center justify-center py-3 bg-white border border-amber-100 rounded-xl shadow-inner mb-3">
           <span className="text-3xl font-black tracking-[0.3em] text-gray-800 ml-[0.3em]">{coupon.lucky_number}</span>
        </div>

        <div className="flex justify-between items-end text-xs text-gray-500">
           <div>
             <p>หมดอายุ: <span className="text-amber-700 font-medium">{expiresLabel}</span></p>
           </div>
           {!isExpired && daysLeft > 0 && <span className="text-orange-500 font-medium">เหลือ {daysLeft} วัน</span>}
           {isExpired && <span>หมดอายุแล้ว</span>}
        </div>
      </div>
    </div>
  );
}

// ── Milestone Progress ────────────────────────────────────────
function MilestoneProgress({ profile }: { profile: Profile }) {
  const spendPct = Math.min(100, Math.round((profile.spending_total / 3000) * 100));
  const earnPct  = Math.min(100, Math.round((profile.earning_total  / 5000) * 100));
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100 space-y-4">
      <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
        <span className="text-[#F9A825]">📊</span> ความคืบหน้าสู่คูปองใบต่อไป
      </h3>
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-600">🏠 จ้างงาน</span>
          <span className="text-amber-600 font-medium">฿{profile.spending_total.toLocaleString()} / ฿3,000</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${spendPct}%`, background: 'linear-gradient(90deg, #F9A825, #D4AF37)' }} />
        </div>
      </div>
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-600">🔧 รับงาน</span>
          <span className="text-amber-600 font-medium">฿{profile.earning_total.toLocaleString()} / ฿5,000</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${earnPct}%`, background: 'linear-gradient(90deg, #F9A825, #D4AF37)' }} />
        </div>
      </div>
    </div>
  );
}

// ── Period Filter ─────────────────────────────────────────────
function PeriodFilter({
  periods, selected, onChange
}: {
  periods: string[]; selected: string; onChange: (p: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onChange('all')}
        className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
          selected === 'all'
            ? 'bg-[#FFF8E1] text-[#F9A825] border-[#F9A825]'
            : 'bg-white text-gray-500 border-gray-200'
        }`}
      >
        ทั้งหมด
      </button>
      {periods.map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
            selected === p
              ? 'bg-[#FFF8E1] text-[#F9A825] border-[#F9A825]'
              : 'bg-white text-gray-500 border-gray-200'
          }`}
        >
          {formatShortPeriod(p)}
        </button>
      ))}
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

      // Active coupons
      const { data: active } = await supabase
        .from('lucky_coupons').select('*')
        .eq('user_id', user.id).eq('is_active', true)
        .order('created_at', { ascending: false });
      setActiveCoupons((active || []) as LuckyCoupon[]);

      // All history coupons
      const { data: all } = await supabase
        .from('lucky_coupons').select('*')
        .eq('user_id', user.id)
        .order('draw_period', { ascending: false });
      setAllCoupons((all || []) as LuckyCoupon[]);

      // Draw results — try to load from draw_results table
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
      <div className="min-h-screen flex items-center justify-center bg-[#FFFDF9]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#F9A825] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 font-medium text-sm">กำลังตรวจสอบความเฮง...</p>
        </div>
      </div>
    );
  }

  // แก้ไขตรงนี้แล้วค๊ะ! เปลี่ยนจาก [...new Set()] เป็น Array.from(new Set())
  const periods = Array.from(new Set(allCoupons.map(c => c.draw_period))).sort((a,b) => b.localeCompare(a));
  
  const filteredCoupons = filterPeriod === 'all' ? allCoupons : allCoupons.filter(c => c.draw_period === filterPeriod);
  const displayCoupons  = showAll ? filteredCoupons : filteredCoupons.slice(0, 3);

  // Latest result
  const latestResult = results[0] || null;
  // Current user's active coupon for the latest period
  const currentCoupon = activeCoupons.find(c => c.draw_period === latestResult?.period) || activeCoupons[0];

  return (
    <div className="min-h-screen pb-24 bg-[#FFFDF9]">

      {/* Header (Clean white with shadow) */}
      <header className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-800 p-2 -ml-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Link>
          <h1 className="text-gray-800 font-bold text-base flex items-center gap-2">
             🎟️ ผลรางวัลจงเจริญ
          </h1>
          <div className="w-8" /> {/* Spacer for centering */}
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-5 space-y-6">

        {/* Results Card - LINE TODAY STYLE */}
        <section>
           <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
             <span className="w-1.5 h-4 bg-[#F9A825] rounded-full"></span>
             ผลสลากจงเจริญล่าสุด
           </h2>
           <ResultsCard result={latestResult} userNumber={currentCoupon?.lucky_number} />
        </section>

        {/* Milestone */}
        {profile && (
          <section>
            <MilestoneProgress profile={profile} />
          </section>
        )}

        {/* My Coupons Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-[#F9A825] rounded-full"></span>
              สลากของฉัน ({allCoupons.length})
            </h2>
          </div>

          {/* Period Filter */}
          {periods.length > 1 && (
            <div className="mb-4">
              <PeriodFilter periods={periods} selected={filterPeriod} onChange={setFilterPeriod} />
            </div>
          )}

          {/* Coupon list */}
          {displayCoupons.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-300">
              <div className="text-4xl mb-3 opacity-40">📭</div>
              <p className="text-gray-600 font-medium text-sm">ยังไม่มีสลากในงวดนี้</p>
              <p className="text-gray-400 text-xs mt-1">
                สะสมยอดจ้างงานหรือรับงานเพื่อรับสลากฟรี
              </p>
              {filterPeriod === 'all' && (
                <Link href="/jobs/new" className="mt-4 inline-block text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all bg-[#F9A825] hover:bg-[#D4AF37] shadow-sm">
                  เริ่มจ้างงาน
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {displayCoupons.map(c => {
                const matchResult = results.find(r => r.period === c.draw_period);
                return <CouponCard key={c.id} coupon={c} result={matchResult} isHistory={!c.is_active} />;
              })}
            </div>
          )}

          {/* Show all toggle */}
          {!showAll && filteredCoupons.length > 3 && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full mt-3 py-2.5 rounded-xl text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 transition"
            >
              ดูสลากทั้งหมด ({filteredCoupons.length} ใบ) ⬇
            </button>
          )}
        </section>

        {/* Past Results */}
        {results.length > 1 && (
          <section>
            <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-gray-300 rounded-full"></span>
              ตรวจผลย้อนหลัง
            </h2>
            <div className="space-y-4">
              {results.slice(1).map(r => {
                const myCoupon = allCoupons.find(c => c.draw_period === r.period);
                return <ResultsCard key={r.period} result={r} userNumber={myCoupon?.lucky_number} />;
              })}
            </div>
          </section>
        )}

      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-3 z-50 pb-safe">
        <Link href="/" className="flex flex-col items-center text-gray-400 text-[10px] gap-1 hover:text-[#F9A825] transition-colors"><span className="text-lg">🏠</span>หน้าหลัก</Link>
        <Link href="/services" className="flex flex-col items-center text-gray-400 text-[10px] gap-1 hover:text-[#F9A825] transition-colors"><span className="text-lg">🔍</span>ค้นหา</Link>
        <Link href="/coupons" className="flex flex-col items-center text-[10px] gap-1 font-bold" style={{ color: '#F9A825' }}><span className="text-lg">🎟️</span>ผลรางวัล</Link>
        <Link href="/dashboard" className="flex flex-col items-center text-gray-400 text-[10px] gap-1 hover:text-[#F9A825] transition-colors"><span className="text-lg">📋</span>งาน</Link>
        <Link href="/profile" className="flex flex-col items-center text-gray-400 text-[10px] gap-1 hover:text-[#F9A825] transition-colors"><span className="text-lg">👤</span>โปรไฟล์</Link>
      </nav>
    </div>
  );
}

export default function CouponsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FFFDF9]">
        <div className="w-8 h-8 border-4 border-[#F9A825] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CouponsContent />
    </Suspense>
  );
}

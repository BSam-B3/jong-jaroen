'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  status: string;
  customer_id: string;
  freelancer_id: string | null;
  payment_proof_url: string | null;
  rating: number | null;
  review_text: string | null;
  created_at: string;
  lat: number | null;
  lng: number | null;
  location_name: string | null;
}

interface Profile {
  id: string;
  full_name: string;
  avg_rating: number;
  total_jobs: number;
  is_verified: boolean;
  kyc_status: string;
  phone: string;
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  pending:     { label: 'รอรับงาน',      color: 'text-yellow-700', bg: 'bg-yellow-100', emoji: '⏳' },
  accepted:    { label: 'รับงานแล้ว',    color: 'text-blue-700',   bg: 'bg-blue-100',   emoji: '✅' },
  in_progress: { label: 'กำลังดำเนินการ', color: 'text-purple-700', bg: 'bg-purple-100', emoji: '🔨' },
  paid:        { label: 'โอนเงินแล้ว',   color: 'text-indigo-700', bg: 'bg-indigo-100', emoji: '💸' },
  completed:   { label: 'เสร็จสิ้น',     color: 'text-green-700',  bg: 'bg-green-100',  emoji: '🎉' },
  cancelled:   { label: 'ยกเลิก',        color: 'text-red-700',    bg: 'bg-red-100',    emoji: '❌' },
};

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [customer, setCustomer] = useState<Profile | null>(null);
  const [freelancer, setFreelancer] = useState<Profile | null>(null);
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [showRating, setShowRating] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const slipRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }
      setUserId(user.id);

      const { data: jobData } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (!jobData) { router.push('/dashboard'); return; }
      setJob(jobData as Job);

      // Load profiles
      const [custResp, freResp] = await Promise.all([
        supabase.from('profiles').select('id,full_name,avg_rating,total_jobs,is_verified,kyc_status,phone').eq('id', jobData.customer_id).single(),
        jobData.freelancer_id
          ? supabase.from('profiles').select('id,full_name,avg_rating,total_jobs,is_verified,kyc_status,phone').eq('id', jobData.freelancer_id).single()
          : Promise.resolve({ data: null }),
      ]);

      if (custResp.data) setCustomer(custResp.data as Profile);
      if (freResp.data) setFreelancer(freResp.data as Profile);
      setLoading(false);
    };
    load();
  }, [jobId, router]);

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };
  const showErr = (e: string) => { setError(e); setTimeout(() => setError(''), 4000); };

  // Award coupon when job completed
  const tryAwardCoupon = async (customerId: string, freelancerId: string) => {
    try {
      // Get updated totals after job completion
      const [custProfile, freProfile] = await Promise.all([
        supabase.from('profiles').select('spending_total').eq('id', customerId).single(),
        supabase.from('profiles').select('earning_total').eq('id', freelancerId).single(),
      ]);
      
      // Customer milestone: 3000 THB spending
      if (custProfile.data && custProfile.data.spending_total >= 3000) {
        await supabase.rpc('award_coupon_if_eligible', { p_user_id: customerId });
      }
      // Freelancer milestone: 5000 THB earning
      if (freProfile.data && freProfile.data.earning_total >= 5000) {
        await supabase.rpc('award_coupon_if_eligible', { p_user_id: freelancerId });
      }
    } catch (e) {
      console.warn('Coupon award skipped:', e);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!job) return;
    setActionLoading(true);
    setError('');
    try {
      const updates: Record<string, unknown> = { status: newStatus };
      
      // When completing: update totals + send notification + award coupon
      if (newStatus === 'completed' && job.freelancer_id) {
        // Update spending/earning totals
        await Promise.all([
          supabase.rpc('increment_spending', { p_user_id: job.customer_id, p_amount: job.budget }),
          supabase.rpc('increment_earning', { p_user_id: job.freelancer_id, p_amount: job.budget }),
        ]).catch(() => null); // non-blocking

        // Insert notifications
        await supabase.from('notifications').insert([
          {
            user_id: job.customer_id,
            title: '🎉 งานเสร็จสมบูรณ์!',
            body: job.title + ' เสร็จแล้ว กรุณาให้คะแนนรีวิว',
            type: 'job_completed',
            job_id: job.id,
          },
          {
            user_id: job.freelancer_id,
            title: '✅ งานได้รับการยืนยัน',
            body: 'ลูกค้ายืนยันว่า ' + job.title + ' เสร็จสมบูรณ์',
            type: 'job_completed',
            job_id: job.id,
          },
        ]).catch(() => null);

        // Try to award coupons
        await tryAwardCoupon(job.customer_id, job.freelancer_id);
      }

      const { error: updateErr } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', job.id);

      if (updateErr) throw updateErr;
      setJob(prev => prev ? { ...prev, status: newStatus } : null);
      showMsg(newStatus === 'completed' ? '🎉 ยืนยันงานเสร็จสิ้นแล้ว! ตรวจสอบคูปองที่ /coupons' : '✅ อัปเดตสถานะแล้ว');
      if (newStatus === 'completed') setShowRating(true);
    } catch (err: unknown) {
      showErr(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setActionLoading(false);
    }
  };

  const uploadSlip = async (file: File) => {
    if (!job || !userId) return;
    if (file.size > 5 * 1024 * 1024) { showErr('ไฟล์ต้องไม่เกิน 5MB'); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = 'slips/' + job.id + '-' + Date.now() + '.' + ext;
      const { error: upErr } = await supabase.storage.from('job-images').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('job-images').getPublicUrl(path);
      const { error: updateErr } = await supabase.from('jobs').update({ payment_proof_url: publicUrl, status: 'paid' }).eq('id', job.id);
      if (updateErr) throw updateErr;
      setJob(prev => prev ? { ...prev, payment_proof_url: publicUrl, status: 'paid' } : null);
      showMsg('📤 อัปโหลดสลิปสำเร็จ! สถานะ: โอนเงินแล้ว');
    } catch (err: unknown) {
      showErr(err instanceof Error ? err.message : 'Upload ไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  };

  const submitRating = async () => {
    if (!job || rating === 0) { showErr('กรุณาเลือกคะแนน 1-5 ดาว'); return; }
    setActionLoading(true);
    try {
      const { error: rateErr } = await supabase
        .from('jobs')
        .update({ rating, review_text: reviewText.trim() || null })
        .eq('id', job.id);
      if (rateErr) throw rateErr;

      // Update freelancer avg_rating
      if (job.freelancer_id) {
        const { data: allJobs } = await supabase
          .from('jobs')
          .select('rating')
          .eq('freelancer_id', job.freelancer_id)
          .not('rating', 'is', null);
        if (allJobs && allJobs.length > 0) {
          const avgRating = allJobs.reduce((s, j) => s + (j.rating || 0), 0) / allJobs.length;
          await supabase.from('profiles').update({ avg_rating: Math.round(avgRating * 10) / 10, total_jobs: allJobs.length }).eq('id', job.freelancer_id);
        }
      }

      setJob(prev => prev ? { ...prev, rating, review_text: reviewText } : null);
      setShowRating(false);
      showMsg('⭐ ให้คะแนนสำเร็จ ขอบคุณ!');
    } catch (err: unknown) {
      showErr(err instanceof Error ? err.message : 'ให้คะแนนไม่สำเร็จ');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center"><div className="text-4xl animate-bounce mb-2">🔨</div><p className="text-gray-500 text-sm">กำลังโหลด...</p></div>
      </div>
    );
  }

  if (!job) return null;

  const isCustomer = userId === job.customer_id;
  const isFreelancer = userId === job.freelancer_id;
  const statusInfo = STATUS_LABEL[job.status] || { label: job.status, color: 'text-gray-600', bg: 'bg-gray-100', emoji: '•' };
  const canChat = (isCustomer || isFreelancer) && job.status !== 'cancelled' && job.status !== 'pending';

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">← กลับ</button>
          <h1 className="text-base font-bold text-gray-800 flex-1 truncate">{job.title}</h1>
          {canChat && (
            <Link
              href={'/jobs/' + job.id + '/chat'}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
            >
              💬 แชท
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-5 space-y-4">
        {/* Messages */}
        {msg && <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl p-3 text-sm font-medium">{msg}</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-3 text-sm">⚠️ {error}</div>}

        {/* Status Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className={'inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium mb-2 ' + statusInfo.bg + ' ' + statusInfo.color}>
                {statusInfo.emoji} {statusInfo.label}
              </div>
              <h2 className="text-lg font-bold text-gray-800">{job.title}</h2>
              <p className="text-xs text-gray-400 mt-0.5">📁 {job.category}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-green-600">฿{job.budget?.toLocaleString()}</p>
              <p className="text-xs text-gray-400">งบประมาณ</p>
            </div>
          </div>

          {job.description && (
            <div className="bg-gray-50 rounded-xl p-3 mb-3">
              <p className="text-sm text-gray-600">{job.description}</p>
            </div>
          )}

          {/* Location */}
          {(job.lat && job.lng) && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-3">
              <p className="text-xs text-blue-700 font-medium mb-1">📍 ตำแหน่งงาน</p>
              {job.location_name && <p className="text-sm text-blue-800">{job.location_name}</p>}
              <a
                href={'https://www.google.com/maps?q=' + job.lat + ',' + job.lng}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 underline mt-1 inline-block"
              >
                🗺️ เปิดใน Google Maps →
              </a>
            </div>
          )}

          <p className="text-xs text-gray-400">สร้างเมื่อ {new Date(job.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Profiles */}
        <div className="grid grid-cols-2 gap-3">
          {customer && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-gray-400 mb-1">👤 ลูกค้า</p>
              <p className="font-bold text-sm text-gray-800">{customer.full_name}</p>
              {customer.phone && <p className="text-xs text-gray-500 mt-0.5">📞 {customer.phone}</p>}
            </div>
          )}
          {freelancer && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-gray-400 mb-1">🔨 ช่าง</p>
              <div className="flex items-center gap-1">
                <p className="font-bold text-sm text-gray-800">{freelancer.full_name}</p>
                {freelancer.kyc_status === 'approved' && <span className="text-xs text-blue-600">✓</span>}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">⭐ {freelancer.avg_rating?.toFixed(1)} · {freelancer.total_jobs} งาน</p>
            </div>
          )}
        </div>

        {/* Payment Slip */}
        {job.payment_proof_url && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-3">💸 หลักฐานการโอนเงิน</h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={job.payment_proof_url} alt="Payment slip" className="w-full max-h-60 object-contain rounded-xl border border-gray-100" />
          </div>
        )}

        {/* Upload Slip (customer, in_progress only) */}
        {isCustomer && job.status === 'in_progress' && !job.payment_proof_url && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-3">💸 อัปโหลดสลิปการโอนเงิน</h3>
            <div
              onClick={() => slipRef.current?.click()}
              className="border-2 border-dashed border-gray-200 hover:border-blue-300 rounded-xl p-5 text-center cursor-pointer transition-colors"
            >
              {uploading ? (
                <div><div className="text-2xl animate-spin inline-block">⏳</div><p className="text-xs text-gray-500 mt-1">กำลังอัปโหลด...</p></div>
              ) : (
                <div><div className="text-3xl mb-1">📎</div><p className="text-sm text-gray-500">แตะเพื่ออัปโหลดสลิป</p><p className="text-xs text-gray-400 mt-1">PNG, JPG ไม่เกิน 5MB</p></div>
              )}
            </div>
            <input ref={slipRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadSlip(f); }} />
          </div>
        )}

        {/* Rating Section - show after completed */}
        {job.status === 'completed' && isCustomer && !job.rating && showRating && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-3">⭐ ให้คะแนนช่าง</h3>
            <div className="flex gap-2 justify-center mb-3">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)} className={'text-3xl transition-transform ' + (s <= rating ? 'scale-110' : 'opacity-30 hover:opacity-60')}>
                  ⭐
                </button>
              ))}
            </div>
            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="รีวิวเพิ่มเติม (ไม่บังคับ)..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              rows={3}
            />
            <button
              onClick={submitRating}
              disabled={actionLoading || rating === 0}
              className="w-full mt-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-200 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
            >
              {actionLoading ? '⏳...' : '⭐ ส่งคะแนน'}
            </button>
          </div>
        )}

        {/* Existing rating */}
        {job.rating && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-gray-400 mb-1">⭐ คะแนนที่ให้</p>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(s => (
                <span key={s} className={s <= job.rating! ? 'text-yellow-400' : 'text-gray-200'}>⭐</span>
              ))}
              <span className="text-sm font-bold text-gray-700 ml-1">{job.rating}/5</span>
            </div>
            {job.review_text && <p className="text-sm text-gray-600 mt-1 italic">"{job.review_text}"</p>}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Freelancer: Accept job */}
          {isFreelancer && job.status === 'pending' && (
            <button
              onClick={() => updateStatus('accepted')}
              disabled={actionLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl text-sm transition-colors"
            >
              {actionLoading ? '⏳...' : '✅ รับงานนี้'}
            </button>
          )}

          {/* Freelancer: Start work */}
          {isFreelancer && job.status === 'accepted' && (
            <button
              onClick={() => updateStatus('in_progress')}
              disabled={actionLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl text-sm transition-colors"
            >
              {actionLoading ? '⏳...' : '🔨 เริ่มทำงาน'}
            </button>
          )}

          {/* Customer: Confirm complete after paid */}
          {isCustomer && (job.status === 'paid' || job.status === 'in_progress') && (
            <button
              onClick={() => updateStatus('completed')}
              disabled={actionLoading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl text-sm transition-colors"
            >
              {actionLoading ? '⏳...' : '🎉 ยืนยันงานเสร็จสิ้น'}
            </button>
          )}

          {/* Chat Button (visible to both parties) */}
          {canChat && (
            <Link
              href={'/jobs/' + job.id + '/chat'}
              className="flex items-center justify-center gap-2 w-full bg-green-50 border-2 border-green-200 hover:bg-green-100 text-green-700 font-bold py-3 rounded-xl text-sm transition-colors"
            >
              💬 เปิดห้องแชท
            </Link>
          )}

          {/* Cancel */}
          {(isCustomer || isFreelancer) && ['pending', 'accepted'].includes(job.status) && (
            <button
              onClick={() => { if (window.confirm('ยืนยันการยกเลิกงานนี้?')) updateStatus('cancelled'); }}
              disabled={actionLoading}
              className="w-full bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 font-medium py-2.5 rounded-xl text-sm transition-colors"
            >
              ❌ ยกเลิกงาน
            </button>
          )}
        </div>

        {/* Coupon hint when completed */}
        {job.status === 'completed' && (
          <div className="bg-gradient-to-r from-red-50 to-yellow-50 border border-yellow-200 rounded-2xl p-4">
            <p className="text-sm font-bold text-yellow-800 mb-1">🎁 ตรวจสอบคูปองจงเจริญ!</p>
            <p className="text-xs text-yellow-700">ถ้าสะสมยอดครบ (จ้างงาน ฿3,000 / รับงาน ฿5,000) คุณอาจได้รับคูปองโชคดี</p>
            <Link href="/coupons" className="inline-block mt-2 text-xs text-yellow-700 font-bold underline">
              ดูคูปองของฉัน →
            </Link>
          </div>
        )}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 z-50">
        <Link href="/" className="flex flex-col items-center text-gray-400 text-xs gap-0.5"><span>🏠</span>หน้าหลัก</Link>
        <Link href="/services" className="flex flex-col items-center text-gray-400 text-xs gap-0.5"><span>🔍</span>ค้นหา</Link>
        <Link href="/dashboard" className="flex flex-col items-center text-gray-400 text-xs gap-0.5"><span>📋</span>งานของฉัน</Link>
        <Link href="/coupons" className="flex flex-col items-center text-gray-400 text-xs gap-0.5"><span>🎁</span>คูปอง</Link>
        <Link href="/profile" className="flex flex-col items-center text-gray-400 text-xs gap-0.5"><span>👤</span>โปรไฟล์</Link>
      </nav>
    </div>
  );
  }

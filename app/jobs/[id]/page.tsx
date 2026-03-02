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
  location_name: string | null;
  lat: number | null;
  lng: number | null;
}

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: string | null;
  is_kyc_verified: boolean;
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [customer, setCustomer] = useState<Profile | null>(null);
  const [freelancer, setFreelancer] = useState<Profile | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [showReview, setShowReview] = useState(false);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (jobId) loadData();
  }, [jobId]);

  async function loadData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const { data: jobData, error: jobErr } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();
      if (jobErr || !jobData) {
        setError('ไม่พบงานนี้');
        setLoading(false);
        return;
      }
      setJob(jobData);

      const { data: cust } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role, is_kyc_verified')
        .eq('id', jobData.customer_id)
        .single();
      setCustomer(cust);

      if (jobData.freelancer_id) {
        const { data: free } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, role, is_kyc_verified')
          .eq('id', jobData.freelancer_id)
          .single();
        setFreelancer(free);
      }
    } catch (_e) {
      setError('เกิดข้อผิดพลาด');
    }
    setLoading(false);
  }

  async function handleAcceptJob() {
    if (!currentUser || !job) return;
    setActionLoading(true);
    try {
      const { error: err } = await supabase
        .from('jobs')
        .update({ freelancer_id: currentUser.id, status: 'in_progress' })
        .eq('id', job.id)
        .eq('status', 'open');
      if (err) {
        setError(err.message);
      } else {
        // Send notification to customer
        try {
          await supabase.from('notifications').insert({
            user_id: job.customer_id,
            title: 'ช่างรับงานแล้ว',
            body: `ช่างได้รับงาน "${job.title}" แล้ว`,
            link: `/jobs/${job.id}`
          });
        } catch (_ne) { /* non-blocking */ }
        setSuccessMsg('รับงานสำเร็จ!');
        await loadData();
      }
    } catch (_e) {
      setError('เกิดข้อผิดพลาด');
    }
    setActionLoading(false);
  }

  async function handleUploadPayment() {
    if (!currentUser || !job || !paymentFile) return;
    setActionLoading(true);
    try {
      const ext = paymentFile.name.split('.').pop();
      const filePath = `payment/${job.id}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('payments')
        .upload(filePath, paymentFile);
      if (upErr) {
        setError(upErr.message);
        setActionLoading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('payments').getPublicUrl(filePath);
      const { error: updateErr } = await supabase
        .from('jobs')
        .update({ payment_proof_url: urlData.publicUrl, status: 'payment_uploaded' })
        .eq('id', job.id);
      if (updateErr) {
        setError(updateErr.message);
      } else {
        // Notify freelancer
        try {
          await supabase.from('notifications').insert({
            user_id: job.freelancer_id,
            title: 'ลูกค้าอัปโหลดหลักฐานชำระเงินแล้ว',
            body: `งาน "${job.title}" - รอยืนยันจากช่าง`,
            link: `/jobs/${job.id}`
          });
        } catch (_ne) { /* non-blocking */ }
        setSuccessMsg('อัปโหลดหลักฐานการชำระเงินสำเร็จ!');
        await loadData();
      }
    } catch (_e) {
      setError('เกิดข้อผิดพลาด');
    }
    setActionLoading(false);
  }

  async function handleConfirmComplete() {
    if (!currentUser || !job) return;
    setActionLoading(true);
    try {
      const { error: err } = await supabase
        .from('jobs')
        .update({ status: 'completed' })
        .eq('id', job.id);
      if (err) {
        setError(err.message);
        setActionLoading(false);
        return;
      }

      // Award coupons if spending/earning milestone reached
      try {
        // Update customer spending
        const { data: custProfile } = await supabase
          .from('profiles')
          .select('spending_total')
          .eq('id', job.customer_id)
          .single();
        const newSpending = ((custProfile?.spending_total as number) || 0) + job.budget;
        await supabase.from('profiles').update({ spending_total: newSpending }).eq('id', job.customer_id);

        if (newSpending >= 3000) {
          const period = new Date().toISOString().slice(0, 7);
          const luckyNum = String(Math.floor(100000 + Math.random() * 900000));
          await supabase.from('lucky_coupons').upsert({
            user_id: job.customer_id,
            draw_period: period,
            lucky_number: luckyNum,
            expires_at: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 15).toISOString()
          }, { onConflict: 'user_id,draw_period', ignoreDuplicates: true });
          await supabase.from('notifications').insert({
            user_id: job.customer_id,
            title: '🎁 ได้รับอั่งเปา!',
            body: 'ยินดีด้วย! คุณได้รับอั่งเปาดิจิทัลจากการใช้บริการ',
            link: '/coupons'
          });
        }
      } catch (_ce) { /* non-blocking */ }

      try {
        // Update freelancer earning
        if (job.freelancer_id) {
          const { data: freeProfile } = await supabase
            .from('profiles')
            .select('earning_total')
            .eq('id', job.freelancer_id)
            .single();
          const newEarning = ((freeProfile?.earning_total as number) || 0) + job.budget;
          await supabase.from('profiles').update({ earning_total: newEarning }).eq('id', job.freelancer_id);

          if (newEarning >= 5000) {
            const period = new Date().toISOString().slice(0, 7);
            const luckyNum = String(Math.floor(100000 + Math.random() * 900000));
            await supabase.from('lucky_coupons').upsert({
              user_id: job.freelancer_id,
              draw_period: period,
              lucky_number: luckyNum,
              expires_at: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 15).toISOString()
            }, { onConflict: 'user_id,draw_period', ignoreDuplicates: true });
            await supabase.from('notifications').insert({
              user_id: job.freelancer_id,
              title: '🎁 ได้รับอั่งเปา!',
              body: 'ยินดีด้วย! คุณได้รับอั่งเปาดิจิทัลจากรายได้สะสม',
              link: '/coupons'
            });
          }
        }
      } catch (_fe) { /* non-blocking */ }

      // Notify customer
      try {
        await supabase.from('notifications').insert({
          user_id: job.customer_id,
          title: 'งานเสร็จสมบูรณ์!',
          body: `งาน "${job.title}" เสร็จเรียบร้อยแล้ว`,
          link: `/jobs/${job.id}`
        });
      } catch (_ne) { /* non-blocking */ }

      setSuccessMsg('ยืนยันงานเสร็จสมบูรณ์!');
      setShowReview(true);
      await loadData();
    } catch (_e) {
      setError('เกิดข้อผิดพลาด');
    }
    setActionLoading(false);
  }

  async function handleSubmitReview() {
    if (!currentUser || !job) return;
    setActionLoading(true);
    try {
      const targetId = currentUser.id === job.customer_id ? job.freelancer_id : job.customer_id;
      const { error: err } = await supabase
        .from('jobs')
        .update({ rating, review_text: reviewText })
        .eq('id', job.id);
      if (!err && targetId) {
        try {
          await supabase.from('notifications').insert({
            user_id: targetId,
            title: 'มีรีวิวใหม่!',
            body: `คุณได้รับรีวิว ${rating} ดาว`,
            link: `/jobs/${job.id}`
          });
        } catch (_ne) { /* non-blocking */ }
        setSuccessMsg('ส่งรีวิวสำเร็จ!');
        setShowReview(false);
        await loadData();
      } else if (err) {
        setError(err.message);
      }
    } catch (_e) {
      setError('เกิดข้อผิดพลาด');
    }
    setActionLoading(false);
  }

  const statusLabel: Record<string, string> = {
    open: '🟡 รับสมัคร',
    in_progress: '🔵 กำลังดำเนินการ',
    payment_uploaded: '💳 รอยืนยันชำระ',
    completed: '✅ เสร็จสมบูรณ์',
    cancelled: '❌ ยกเลิก'
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-500">กำลังโหลด...</div>
    </div>
  );

  if (error && !job) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-red-500">{error}</div>
    </div>
  );

  const isCustomer = currentUser?.id === job?.customer_id;
  const isFreelancer = currentUser?.id === job?.freelancer_id;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-600">
          ← กลับ
        </button>
        <h1 className="font-bold text-lg text-gray-800 flex-1 truncate">{job?.title}</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm">
            {successMsg}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
            {error}
          </div>
        )}

        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">สถานะ</span>
            <span className="font-semibold text-sm">
              {statusLabel[job?.status || ''] || job?.status}
            </span>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">{job?.title}</h2>
          <p className="text-gray-600 text-sm mb-3">{job?.description}</p>
          <div className="flex items-center gap-4 text-sm">
            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg">{job?.category}</span>
            <span className="font-bold text-green-600 text-lg">฿{job?.budget?.toLocaleString()}</span>
          </div>
          {job?.location_name && (
            <div className="mt-2 text-sm text-gray-500">
              📍 {job.location_name}
            </div>
          )}
        </div>

        {/* Map Display */}
        {job?.lat && job?.lng && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-700 mb-3">📍 ตำแหน่งงาน</h3>
            <div className="rounded-xl overflow-hidden">
              <iframe
                width="100%"
                height="200"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={`https://www.google.com/maps?q=${job.lat},${job.lng}&z=15&output=embed`}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              {job.lat.toFixed(6)}, {job.lng.toFixed(6)}
            </p>
          </div>
        )}

        {/* Customer Info */}
        {customer && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-700 mb-3">👤 ลูกค้า</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                {customer.full_name?.[0] || '?'}
              </div>
              <div>
                <div className="font-medium">{customer.full_name}</div>
                {customer.is_kyc_verified && (
                  <span className="text-xs text-green-600">✅ ยืนยันตัวตนแล้ว</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Freelancer Info */}
        {freelancer && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-700 mb-3">🔧 ช่าง</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-600">
                  {freelancer.full_name?.[0] || '?'}
                </div>
                <div>
                  <div className="font-medium">{freelancer.full_name}</div>
                  {freelancer.is_kyc_verified && (
                    <span className="text-xs text-green-600">✅ ยืนยันตัวตนแล้ว</span>
                  )}
                </div>
              </div>
              {/* Chat Link - only for involved parties */}
              {(isCustomer || isFreelancer) && (
                <Link
                  href={`/jobs/${job?.id}/chat`}
                  className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-600 transition"
                >
                  💬 แชท
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Chat Link when no freelancer assigned yet (after accepting) */}
        {!freelancer && isFreelancer === false && job?.status === 'in_progress' && (isCustomer || isFreelancer) && (
          <Link
            href={`/jobs/${job?.id}/chat`}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-blue-600 transition w-full justify-center"
          >
            💬 แชทกับคู่สัญญา
          </Link>
        )}

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <h3 className="font-semibold text-gray-700">การดำเนินการ</h3>

          {/* Accept Job - shown to logged in users who are not the customer and job is open */}
          {currentUser && !isCustomer && !isFreelancer && job?.status === 'open' && (
            <button
              onClick={handleAcceptJob}
              disabled={actionLoading}
              className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition disabled:opacity-50"
            >
              {actionLoading ? 'กำลังดำเนินการ...' : '✅ รับงานนี้'}
            </button>
          )}

          {/* Upload Payment - shown to customer when job is in_progress */}
          {isCustomer && job?.status === 'in_progress' && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">อัปโหลดหลักฐานการชำระเงิน</p>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700"
              />
              {paymentFile && (
                <button
                  onClick={handleUploadPayment}
                  disabled={actionLoading}
                  className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition disabled:opacity-50"
                >
                  {actionLoading ? 'กำลังอัปโหลด...' : '💳 อัปโหลดหลักฐาน'}
                </button>
              )}
            </div>
          )}

          {/* View Payment Proof */}
          {job?.payment_proof_url && (
            <a
              href={job.payment_proof_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-blue-600 text-sm underline"
            >
              ดูหลักฐานการชำระเงิน
            </a>
          )}

          {/* Confirm Complete - shown to freelancer when payment uploaded */}
          {isFreelancer && job?.status === 'payment_uploaded' && (
            <button
              onClick={handleConfirmComplete}
              disabled={actionLoading}
              className="w-full bg-purple-500 text-white py-3 rounded-xl font-semibold hover:bg-purple-600 transition disabled:opacity-50"
            >
              {actionLoading ? 'กำลังดำเนินการ...' : '🎉 ยืนยันงานเสร็จสมบูรณ์'}
            </button>
          )}

          {/* Review Section */}
          {(isCustomer || isFreelancer) && job?.status === 'completed' && !job.rating && (
            <button
              onClick={() => setShowReview(true)}
              className="w-full bg-yellow-400 text-white py-3 rounded-xl font-semibold hover:bg-yellow-500 transition"
            >
              ⭐ ให้คะแนนและรีวิว
            </button>
          )}

          {showReview && (
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700">ให้คะแนน (1-5 ดาว)</p>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(s => (
                  <button
                    key={s}
                    onClick={() => setRating(s)}
                    className={`text-2xl ${s <= rating ? 'opacity-100' : 'opacity-30'}`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="เขียนรีวิว..."
                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none"
                rows={3}
              />
              <button
                onClick={handleSubmitReview}
                disabled={actionLoading}
                className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition disabled:opacity-50"
              >
                {actionLoading ? 'กำลังส่ง...' : 'ส่งรีวิว'}
              </button>
            </div>
          )}

          {/* Display existing review */}
          {job?.rating && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-1">รีวิว</p>
              <div className="flex items-center gap-1 mb-1">
                {'⭐'.repeat(job.rating)}
                <span className="text-sm text-gray-500">({job.rating}/5)</span>
              </div>
              {job.review_text && <p className="text-sm text-gray-600">{job.review_text}</p>}
            </div>
          )}
        </div>

        {/* Created Date */}
        <div className="text-center text-xs text-gray-400">
          สร้างเมื่อ {job?.created_at ? new Date(job.created_at).toLocaleDateString('th-TH') : ''}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 px-4 z-50">
        <Link href="/dashboard" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-blue-600 text-xs">
          <span className="text-lg">🏠</span>หน้าหลัก
        </Link>
        <Link href="/jobs" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-blue-600 text-xs">
          <span className="text-lg">💼</span>งาน
        </Link>
        <Link href="/services" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-blue-600 text-xs">
          <span className="text-lg">🔧</span>บริการ
        </Link>
        <Link href="/coupons" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-blue-600 text-xs">
          <span className="text-lg">🎁</span>อั่งเปา
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-blue-600 text-xs">
          <span className="text-lg">👤</span>โปรไฟล์
        </Link>
      </nav>
    </div>
  );
}

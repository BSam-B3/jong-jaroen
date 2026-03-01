'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { createNotification } from '@/lib/useNotifications';

const GP_RATE = 0.03;

interface JobDetail {
  id: string;
  title: string;
  description: string;
  status: string;
  base_price: number;
  fee_amount: number;
  location_from: string;
  location_to: string;
  submit_photo_url: string | null;
  payment_slip_url: string | null;
  payment_status: string | null;
  created_at: string;
  customer_id: string;
  freelancer_id: string | null;
  customer: { full_name: string; phone: string } | null;
  freelancer: { full_name: string; phone: string; avg_rating: number } | null;
}

const STATUS_LABEL: Record<string, { label: string; color: string; emoji: string }> = {
  pending: { label: 'รอดำเนินการ', color: 'bg-orange-100 text-orange-700', emoji: '⏳' },
  in_progress: { label: 'กำลังดำเนินการ', color: 'bg-blue-100 text-blue-700', emoji: '🔄' },
  completed: { label: 'เสร็จสิ้น', color: 'bg-green-100 text-green-700', emoji: '✅' },
  cancelled: { label: 'ยกเลิก', color: 'bg-red-100 text-red-700', emoji: '❌' },
};

const PAYMENT_STATUS_LABEL: Record<string, { label: string; color: string; emoji: string }> = {
  unpaid: { label: 'ยังไม่ชำระ', color: 'bg-red-100 text-red-700', emoji: '💳' },
  pending_confirm: { label: 'รอยืนยันการชำระ', color: 'bg-yellow-100 text-yellow-700', emoji: '⏳' },
  paid: { label: 'ชำระแล้ว', color: 'bg-green-100 text-green-700', emoji: '✅' },
};

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;
  const slipInputRef = useRef<HTMLInputElement>(null);

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [uploadingSlip, setUploadingSlip] = useState(false);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const loadJob = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      setCurrentUserId(user.id);
      setCurrentUserRole(profile?.role || '');

      const { data: jobData, error: jobErr } = await supabase
        .from('jobs')
        .select(`
          *,
          customer:profiles!jobs_customer_id_fkey(full_name, phone),
          freelancer:profiles!jobs_freelancer_id_fkey(full_name, phone, avg_rating)
        `)
        .eq('id', jobId)
        .single();

      if (jobErr || !jobData) {
        setError('ไม่พบข้อมูลงาน');
        setLoading(false);
        return;
      }

      // Security: only customer or assigned freelancer can view
      if (jobData.customer_id !== user.id && jobData.freelancer_id !== user.id) {
        router.push(profile?.role === 'customer' ? '/dashboard/customer' : '/dashboard/freelancer');
        return;
      }

      setJob(jobData as JobDetail);
      setLoading(false);
    };
    if (jobId) loadJob();
  }, [jobId, router]);

  const handleSlipChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('ไฟล์สลิปต้องไม่เกิน 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => setSlipPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploadingSlip(true);
    setError('');
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `slips/${jobId}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('job-images')
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('job-images')
        .getPublicUrl(fileName);

      // Update job with slip URL and set payment_status to pending_confirm
      const { error: updateError } = await supabase
        .from('jobs')
        .update({
          payment_slip_url: publicUrl,
          payment_status: 'pending_confirm',
        })
        .eq('id', jobId);

      if (updateError) throw updateError;

      // Notify freelancer about payment slip
      if (job?.freelancer_id) {
        await createNotification({
          userId: job.freelancer_id,
          type: 'payment',
          title: '💰 ลูกค้าอัปโหลดสลิปการชำระแล้ว',
          body: `งาน "${job.title}" รอยืนยันการชำระ ฿${((job.base_price || 0) + (job.fee_amount || 0)).toLocaleString()}`,
          data: { job_id: jobId, payment_slip_url: publicUrl },
        });
      }

      setJob(prev => prev ? {
        ...prev,
        payment_slip_url: publicUrl,
        payment_status: 'pending_confirm',
      } : null);
      setSuccessMsg('✅ อัปโหลดสลิปสำเร็จ! กำลังรอยืนยันจากช่าง');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload สลิปไม่สำเร็จ');
      setSlipPreview(null);
    } finally {
      setUploadingSlip(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!job) return;
    setUpdating(true);
    setError('');
    try {
      const { error: updateError } = await supabase
        .from('jobs')
        .update({
          payment_status: 'paid',
          status: 'in_progress',
        })
        .eq('id', jobId);

      if (updateError) throw updateError;

      // Notify customer that payment confirmed
      await createNotification({
        userId: job.customer_id,
        type: 'payment',
        title: '✅ การชำระเงินได้รับการยืนยันแล้ว',
        body: `งาน "${job.title}" ช่างยืนยันรับเงินแล้ว กำลังดำเนินงาน`,
        data: { job_id: jobId },
      });

      setJob(prev => prev ? { ...prev, payment_status: 'paid', status: 'in_progress' } : null);
      setSuccessMsg('✅ ยืนยันการชำระเงินสำเร็จ! งานเริ่มดำเนินการแล้ว');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'ยืนยันการชำระไม่สำเร็จ');
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!job) return;
    setUpdating(true);
    setError('');
    try {
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ status: 'completed' })
        .eq('id', jobId);

      if (updateError) throw updateError;

      // Notify freelancer job completed
      if (job.freelancer_id) {
        await createNotification({
          userId: job.freelancer_id,
          type: 'job_completed',
          title: '🎉 งานเสร็จสิ้นแล้ว!',
          body: `ลูกค้ายืนยันว่างาน "${job.title}" เสร็จสิ้นแล้ว`,
          data: { job_id: jobId },
        });
      }

      setJob(prev => prev ? { ...prev, status: 'completed' } : null);
      setSuccessMsg('🎉 ยืนยันงานเสร็จสิ้นแล้ว!');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'อัปเดตสถานะไม่สำเร็จ');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">📋</div>
          <p className="text-green-700 font-medium">กำลังโหลดข้อมูลงาน...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-gray-600 font-medium">{error || 'ไม่พบข้อมูลงาน'}</p>
          <button onClick={() => router.back()} className="mt-4 text-green-600 hover:underline text-sm">← กลับ</button>
        </div>
      </div>
    );
  }

  const total = (job.base_price || 0) + (job.fee_amount || 0);
  const isCustomer = currentUserId === job.customer_id;
  const isFreelancer = currentUserId === job.freelancer_id;
  const statusInfo = STATUS_LABEL[job.status] || STATUS_LABEL['pending'];
  const paymentStatusInfo = PAYMENT_STATUS_LABEL[job.payment_status || 'unpaid'] || PAYMENT_STATUS_LABEL['unpaid'];
  const backHref = isCustomer ? '/dashboard/customer' : '/dashboard/freelancer';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href={backHref} className="text-gray-400 hover:text-gray-600 transition-colors">
            ← กลับ
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-green-700 leading-none truncate">{job.title}</h1>
            <p className="text-xs text-gray-400">จงเจริญ - รายละเอียดงาน</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusInfo.color}`}>
            {statusInfo.emoji} {statusInfo.label}
          </span>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">⚠️ {error}</div>
        )}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm font-medium">{successMsg}</div>
        )}

        {/* Job Summary Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-3">📋 รายละเอียดงาน</h2>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500">ชื่องาน</p>
              <p className="text-sm font-semibold text-gray-800">{job.title}</p>
            </div>
            {job.description && (
              <div>
                <p className="text-xs text-gray-500">รายละเอียด</p>
                <p className="text-sm text-gray-700">{job.description}</p>
              </div>
            )}
            {job.location_from && (
              <div>
                <p className="text-xs text-gray-500">📍 สถานที่</p>
                <p className="text-sm text-gray-700">{job.location_from}{job.location_to ? ` → ${job.location_to}` : ''}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500">วันที่สร้าง</p>
              <p className="text-sm text-gray-700">{new Date(job.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </div>

        {/* People Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-3">👥 ผู้เกี่ยวข้อง</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
              <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center text-xl">🏠</div>
              <div>
                <p className="text-xs text-gray-500">ผู้ว่าจ้าง</p>
                <p className="text-sm font-semibold text-gray-800">{job.customer?.full_name || 'ลูกค้า'}</p>
                {job.customer?.phone && <p className="text-xs text-gray-500">📞 {job.customer.phone}</p>}
              </div>
              {isCustomer && <span className="ml-auto text-xs bg-green-200 text-green-700 px-2 py-0.5 rounded-full font-medium">คุณ</span>}
            </div>
            {job.freelancer && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-xl">🔧</div>
                <div>
                  <p className="text-xs text-gray-500">ช่าง</p>
                  <p className="text-sm font-semibold text-gray-800">{job.freelancer.full_name}</p>
                  {job.freelancer.phone && <p className="text-xs text-gray-500">📞 {job.freelancer.phone}</p>}
                  <p className="text-xs text-yellow-500">{'★'.repeat(Math.round(job.freelancer.avg_rating || 0))} {job.freelancer.avg_rating?.toFixed(1) || '0.0'}</p>
                </div>
                {isFreelancer && <span className="ml-auto text-xs bg-blue-200 text-blue-700 px-2 py-0.5 rounded-full font-medium">คุณ</span>}
              </div>
            )}
          </div>
        </div>

        {/* Payment Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-800">💰 การชำระเงิน</h2>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${paymentStatusInfo.color}`}>
              {paymentStatusInfo.emoji} {paymentStatusInfo.label}
            </span>
          </div>

          {/* Price Breakdown */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">ค่าจ้างช่าง</span>
              <span className="text-sm font-medium">฿{(job.base_price || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                ค่าบริการ
                <span className="bg-amber-100 text-amber-700 text-xs px-1 rounded font-medium">3%</span>
              </span>
              <span className="text-sm font-medium text-orange-600">+฿{(job.fee_amount || 0).toLocaleString()}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
              <span className="text-base font-bold text-gray-800">ยอดรวม</span>
              <span className="text-2xl font-bold text-green-600">฿{total.toLocaleString()}</span>
            </div>
          </div>

          {/* Bank Transfer Info */}
          {isCustomer && job.payment_status !== 'paid' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <h3 className="text-sm font-bold text-blue-800 mb-2">🏦 ข้อมูลการโอนเงิน</h3>
              <div className="space-y-1 text-sm">
                <p className="text-gray-700"><span className="text-gray-500">ธนาคาร:</span> กสิกรไทย (KBANK)</p>
                <p className="text-gray-700"><span className="text-gray-500">เลขบัญชี:</span> <span className="font-mono font-bold">XXX-X-XXXXX-X</span></p>
                <p className="text-gray-700"><span className="text-gray-500">ชื่อบัญชี:</span> บริษัท PandVHappiness</p>
                <p className="text-xl font-bold text-green-600 text-center mt-2">฿{total.toLocaleString()}</p>
              </div>
              <p className="text-xs text-blue-600 mt-2 text-center">
                💡 กรุณาโอนเงินแล้วอัปโหลดสลิปด้านล่าง
              </p>
            </div>
          )}

          {/* Submit Photo Preview */}
          {job.submit_photo_url && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">📸 รูปหน้างาน</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={job.submit_photo_url} alt="Job photo" className="w-full rounded-xl max-h-48 object-cover" />
            </div>
          )}

          {/* Slip Upload - Customer Only, when not paid */}
          {isCustomer && (job.payment_status === 'unpaid' || job.payment_status === null) && (
            <div>
              <p className="text-sm font-bold text-gray-700 mb-2">📄 อัปโหลดสลิปการโอนเงิน</p>
              <div
                onClick={() => slipInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                  slipPreview ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                }`}
              >
                {uploadingSlip ? (
                  <div className="py-4">
                    <div className="text-2xl mb-2 animate-spin inline-block">⏳</div>
                    <p className="text-sm text-gray-500">กำลังอัปโหลด...</p>
                  </div>
                ) : slipPreview ? (
                  <div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={slipPreview} alt="Slip preview" className="max-h-40 mx-auto rounded-lg object-cover mb-2" />
                    <p className="text-xs text-green-600 font-medium">✅ คลิกเพื่อเปลี่ยนสลิป</p>
                  </div>
                ) : (
                  <div className="py-4">
                    <div className="text-3xl mb-2">🧾</div>
                    <p className="text-sm text-gray-500">แตะเพื่ออัปโหลดสลิป</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG ไม่เกิน 5MB</p>
                  </div>
                )}
              </div>
              <input
                ref={slipInputRef} type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleSlipChange} className="hidden"
              />
            </div>
          )}

          {/* Show uploaded slip */}
          {job.payment_slip_url && (
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-700 mb-2">🧾 สลิปที่อัปโหลด</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={job.payment_slip_url} alt="Payment slip" className="w-full rounded-xl max-h-48 object-cover border border-gray-200" />
            </div>
          )}

          {/* Freelancer: Confirm Payment */}
          {isFreelancer && job.payment_status === 'pending_confirm' && (
            <button
              onClick={handleConfirmPayment}
              disabled={updating}
              className="mt-4 w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition-colors"
            >
              {updating ? '⏳ กำลังยืนยัน...' : '✅ ยืนยันรับเงินแล้ว'}
            </button>
          )}

          {/* Payment confirmed display */}
          {job.payment_status === 'paid' && (
            <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <p className="text-green-700 font-bold">✅ ชำระเงินเรียบร้อยแล้ว</p>
              <p className="text-xs text-green-500 mt-1">฿{total.toLocaleString()} — งานกำลังดำเนินการ</p>
            </div>
          )}
        </div>

        {/* Customer: Mark complete button */}
        {isCustomer && job.status === 'in_progress' && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="text-base font-bold text-gray-800 mb-2">🎉 ยืนยันงานเสร็จสิ้น</h2>
            <p className="text-sm text-gray-500 mb-3">เมื่อช่างทำงานเสร็จแล้ว กดยืนยันเพื่อปิดงาน</p>
            <button
              onClick={handleMarkComplete}
              disabled={updating}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition-colors"
            >
              {updating ? '⏳ กำลังอัปเดต...' : '🎉 ยืนยันงานเสร็จสิ้น'}
            </button>
          </div>
        )}

        <div className="pb-6" />
      </main>
    </div>
  );
}

'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const GP_RATE = 0.03; // 3% platform fee

interface Freelancer {
  id: string;
  full_name: string;
  location: string;
  avg_rating: number;
  total_jobs: number;
}

function GPCalculator({ basePrice }: { basePrice: number }) {
  const fee = Math.ceil(basePrice * GP_RATE);
  const total = basePrice + fee;

  if (basePrice <= 0) return null;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 mt-3">
      <h4 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
        🧮 สรุปยอดชำระ
      </h4>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">ค่าจ้างช่าง</span>
          <span className="text-sm font-medium text-gray-800">฿{basePrice.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 flex items-center gap-1">
            ค่าบริการแพลตฟอร์ม
            <span className="bg-amber-200 text-amber-800 text-xs px-1.5 py-0.5 rounded-full font-medium">3%</span>
          </span>
          <span className="text-sm font-medium text-orange-600">+฿{fee.toLocaleString()}</span>
        </div>
        <div className="border-t border-amber-200 pt-2 flex justify-between items-center">
          <span className="text-base font-bold text-gray-800">ยอดรวมที่ต้องโอน</span>
          <span className="text-xl font-bold text-green-600">฿{total.toLocaleString()}</span>
        </div>
      </div>
      <p className="text-xs text-amber-600 mt-2 text-center">
        💡 ค่าบริการ 3% ช่วยพัฒนาชุมชนปากน้ำประแส
      </p>
    </div>
  );
}

export default function NewJobPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customerId, setCustomerId] = useState('');
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    freelancer_id: '',
    base_price: '',
    location_from: '',
    location_to: '',
    submit_photo_url: '',
  });

  const basePrice = parseFloat(formData.base_price) || 0;
  const fee = Math.ceil(basePrice * GP_RATE);
  const total = basePrice + fee;

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'customer') {
        router.push('/dashboard/freelancer');
        return;
      }

      setCustomerId(user.id);

      const { data: freelancerList } = await supabase
        .from('profiles')
        .select('id, full_name, location, avg_rating, total_jobs')
        .eq('role', 'freelancer')
        .order('avg_rating', { ascending: false });

      setFreelancers(freelancerList || []);
      setLoading(false);
    };
    init();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('ไฟล์รูปต้องไม่เกิน 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to Supabase Storage
    setUploadingPhoto(true);
    setError('');
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${customerId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('job-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('job-images')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, submit_photo_url: publicUrl }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload รูปไม่สำเร็จ');
      setPhotoPreview(null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) { setError('กรุณาใส่ชื่องาน'); return; }
    if (basePrice <= 0) { setError('กรุณาใส่ราคาค่าจ้าง'); return; }
    if (!formData.freelancer_id) { setError('กรุณาเลือกช่าง'); return; }

    setSubmitting(true);
    try {
      const { error: jobError } = await supabase.from('jobs').insert({
        customer_id: customerId,
        freelancer_id: formData.freelancer_id || null,
        title: formData.title.trim(),
        description: formData.description.trim(),
        base_price: basePrice,
        fee_amount: fee,
        location_from: formData.location_from.trim(),
        location_to: formData.location_to.trim(),
        submit_photo_url: formData.submit_photo_url || null,
        status: 'pending',
      });

      if (jobError) throw jobError;

      router.push('/dashboard/customer?success=job_created');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'สร้างงานไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">📋</div>
          <p className="text-green-700 font-medium">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard/customer" className="text-gray-400 hover:text-gray-600 transition-colors">
            ← กลับ
          </Link>
          <div>
            <h1 className="text-lg font-bold text-green-700 leading-none">จ้างงานใหม่</h1>
            <p className="text-xs text-gray-400">จงเจริญ - ปากน้ำประแส</p>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Job Title */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-3">📝 รายละเอียดงาน</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">ชื่องาน *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="เช่น ซ่อมท่อน้ำ, ทาสีบ้าน, ตัดหญ้า..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">รายละเอียดเพิ่มเติม</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="อธิบายงานที่ต้องการ เช่น จำนวน, ขนาด, เวลา..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm resize-none"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-3">📍 สถานที่</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">สถานที่ทำงาน / จุดรับ</label>
                <input
                  type="text"
                  name="location_from"
                  value={formData.location_from}
                  onChange={handleChange}
                  placeholder="เช่น บ้านเลขที่ 123 หมู่ 5 ปากน้ำประแส"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">จุดส่ง (ถ้ามี)</label>
                <input
                  type="text"
                  name="location_to"
                  value={formData.location_to}
                  onChange={handleChange}
                  placeholder="เช่น ตลาดปากน้ำประแส (สำหรับงานขนส่ง)"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Freelancer Selection */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-3">👷 เลือกช่าง *</h3>
            {freelancers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีช่างในระบบ</p>
            ) : (
              <div className="space-y-2">
                {freelancers.map((f) => (
                  <label
                    key={f.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.freelancer_id === f.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-100 hover:border-green-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="freelancer_id"
                      value={f.id}
                      checked={formData.freelancer_id === f.id}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                      🔧
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{f.full_name}</p>
                      <p className="text-xs text-gray-500">📍 {f.location || 'ปากน้ำประแส'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-medium text-yellow-500">
                        {'★'.repeat(Math.round(f.avg_rating || 0))}{'☆'.repeat(5 - Math.round(f.avg_rating || 0))}
                      </div>
                      <div className="text-xs text-gray-400">{f.total_jobs || 0} งาน</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Price + GP Calculator */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-3">💰 ค่าจ้างและค่าบริการ</h3>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">ค่าจ้างช่าง (บาท) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">฿</span>
                <input
                  type="number"
                  name="base_price"
                  value={formData.base_price}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
                />
              </div>
            </div>

            {/* GP Calculator */}
            <GPCalculator basePrice={basePrice} />
          </div>

          {/* Photo Upload */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-1">📸 รูปภาพหน้างาน</h3>
            <p className="text-xs text-gray-400 mb-3">อัปโหลดรูปสถานที่หรือรายละเอียดงาน (ไม่บังคับ, max 5MB)</p>

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                photoPreview
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
              }`}
            >
              {uploadingPhoto ? (
                <div className="py-4">
                  <div className="text-2xl mb-2 animate-spin inline-block">⏳</div>
                  <p className="text-sm text-gray-500">กำลังอัปโหลด...</p>
                </div>
              ) : photoPreview ? (
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="max-h-40 mx-auto rounded-lg object-cover mb-2"
                  />
                  <p className="text-xs text-green-600 font-medium">✅ อัปโหลดสำเร็จ — คลิกเพื่อเปลี่ยน</p>
                </div>
              ) : (
                <div className="py-4">
                  <div className="text-3xl mb-2">📷</div>
                  <p className="text-sm text-gray-500">แตะเพื่อเลือกรูป</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP ไม่เกิน 5MB</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          {/* Summary before submit */}
          {basePrice > 0 && (
            <div className="bg-green-600 rounded-2xl p-4 text-white">
              <h3 className="text-sm font-bold mb-2">📋 สรุปก่อนยืนยัน</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-200">งาน</span>
                  <span className="font-medium">{formData.title || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-200">ช่าง</span>
                  <span className="font-medium">
                    {freelancers.find(f => f.id === formData.freelancer_id)?.full_name || '—'}
                  </span>
                </div>
                <div className="flex justify-between border-t border-green-500 pt-1 mt-1">
                  <span className="text-green-200">ยอดโอน</span>
                  <span className="text-xl font-bold">฿{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || uploadingPhoto || basePrice <= 0}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-colors text-lg shadow-lg"
          >
            {submitting ? '⏳ กำลังสร้างงาน...' : `✅ ยืนยันจ้างงาน ฿${total.toLocaleString()}`}
          </button>

          <p className="text-xs text-center text-gray-400 pb-6">
            การยืนยันถือว่าคุณตกลงชำระ ฿{total.toLocaleString()} ให้แก่ช่างและแพลตฟอร์ม
          </p>
        </form>
      </main>
    </div>
  );
}

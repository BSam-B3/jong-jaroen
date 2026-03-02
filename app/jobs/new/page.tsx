'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { MapPinPicker } from '@/app/components/MapPinPicker';
import { createNotification } from '@/lib/useNotifications';

const GP_RATE = 0.03; // 3% platform fee

interface Freelancer {
  id: string;
  full_name: string;
  location: string;
  avg_rating: number;
  total_jobs: number;
  skills: string[];
  is_verified: boolean;
}

function GPCalculator({ basePrice }: { basePrice: number }) {
  const fee = Math.ceil(basePrice * GP_RATE);
  const total = basePrice + fee;
  if (basePrice <= 0) return null;
  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 mt-3">
      <h4 className="text-sm font-bold text-amber-800 mb-3">🧮 สรุปยอดชำระ</h4>
      <div className="space-y-2">
        <div className="flex justify-between"><span className="text-sm text-gray-600">ค่าจ้างช่าง</span><span className="text-sm font-medium">฿{basePrice.toLocaleString()}</span></div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 flex items-center gap-1">ค่าบริการ <span className="bg-amber-200 text-amber-800 text-xs px-1.5 py-0.5 rounded-full">3%</span></span>
          <span className="text-sm font-medium text-orange-600">+฿{fee.toLocaleString()}</span>
        </div>
        <div className="border-t border-amber-200 pt-2 flex justify-between">
          <span className="font-bold text-gray-800">รวมที่ต้องโอน</span>
          <span className="text-xl font-bold text-green-600">฿{total.toLocaleString()}</span>
        </div>
      </div>
      <p className="text-xs text-amber-600 mt-2 text-center">💡 ค่าบริการ 3% ช่วยพัฒนาชุมชน</p>
    </div>
  );
}

export default function NewJobPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [mapLat, setMapLat] = useState<number | null>(null);
  const [mapLng, setMapLng] = useState<number | null>(null);
  const [mapAddress, setMapAddress] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    freelancer_id: '',
    base_price: '',
    category: '',
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
        .from('profiles').select('full_name').eq('id', user.id).single();
      setCustomerId(user.id);
      setCustomerName(profile?.full_name || 'ลูกค้า');

      // Load verified freelancers (kyc_status = approved)
      const { data: freelancerList } = await supabase
        .from('profiles')
        .select('id, full_name, location, avg_rating, total_jobs, skills, is_verified')
        .eq('kyc_status', 'approved')
        .order('avg_rating', { ascending: false });
      setFreelancers((freelancerList || []) as Freelancer[]);
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
    if (file.size > 5 * 1024 * 1024) { setError('ไฟล์รูปต้องไม่เกิน 5MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setUploadingPhoto(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${customerId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('job-images').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('job-images').getPublicUrl(path);
      setFormData(prev => ({ ...prev, submit_photo_url: publicUrl }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload ไม่สำเร็จ');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.title.trim()) { setError('กรุณาใส่ชื่องาน'); return; }
    if (basePrice <= 0) { setError('กรุณาใส่ราคาค่าจ้าง'); return; }
    setSubmitting(true);
    try {
      const { data: jobData, error: jobError } = await supabase.from('jobs').insert({
        customer_id: customerId,
        freelancer_id: formData.freelancer_id || null,
        title: formData.title.trim(),
        description: formData.description.trim(),
        base_price: basePrice,
        category: formData.category || null,
        lat: mapLat,
        lng: mapLng,
        address_label: mapAddress || null,
        image_urls: formData.submit_photo_url ? [formData.submit_photo_url] : [],
        status: 'pending',
      }).select('id').single();
      if (jobError) throw jobError;

      // Notify selected freelancer
      if (formData.freelancer_id && jobData?.id) {
        await createNotification({
          userId: formData.freelancer_id,
          type: 'new_job',
          title: '📋 มีงานใหม่สำหรับคุณ!',
          body: `${customerName} ต้องการจ้าง "${formData.title.trim()}" ราคา ฿${basePrice.toLocaleString()}`,
          data: { job_id: jobData.id },
        });
      }
      router.push('/dashboard?success=job_created');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'สร้างงานไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  const CATEGORIES = ['ช่างไฟ','ช่างประปา','ช่างไม้','ช่างทาสี','ทำสวน','แม่บ้าน','ขับรถ/ส่งของ','ซ่อมเรือ','ประมง/เกษตร','อื่นๆ'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="text-center"><div className="text-4xl animate-bounce mb-2">📋</div>
        <p className="text-green-700">กำลังโหลด...</p></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 pb-10">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">← กลับ</Link>
          <div>
            <h1 className="text-lg font-bold text-green-700">จ้างงานใหม่</h1>
            <p className="text-xs text-gray-400">จงเจริญ - ปากน้ำประแส</p>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-5 pb-24">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">⚠️ {error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Job Details */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-3">📝 รายละเอียดงาน</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">ชื่องาน *</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} required
                  placeholder="เช่น ซ่อมท่อน้ำ, ทาสีบ้าน, ตัดหญ้า..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">ประเภทงาน</label>
                <select name="category" value={formData.category} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
                  <option value="">-- เลือกประเภท --</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">รายละเอียด</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={3}
                  placeholder="อธิบายงาน เช่น จำนวน, ขนาด, เวลาที่ต้องการ..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
              </div>
            </div>
          </div>

          {/* Map Pin Location */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-1">📍 ปักหมุดสถานที่</h3>
            <p className="text-xs text-gray-400 mb-3">แตะแผนที่หรือลากหมุดเพื่อระบุตำแหน่งงาน</p>
            <MapPinPicker
              onLocationSelect={(lat, lng, label) => {
                setMapLat(lat);
                setMapLng(lng);
                setMapAddress(label);
              }}
            />
            {mapAddress && (
              <p className="text-xs text-green-700 mt-2 font-medium">✅ ตำแหน่ง: {mapAddress}</p>
            )}
          </div>

          {/* Freelancer Selection */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-3">👷 เลือกช่าง (ไม่บังคับ)</h3>
            <p className="text-xs text-gray-400 mb-3">แสดงเฉพาะช่างที่ยืนยัน KYC แล้ว</p>
            {freelancers.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-400 text-sm">ยังไม่มีช่างที่ผ่าน KYC</p>
                <p className="text-gray-300 text-xs mt-1">ระบบจะจับคู่อัตโนมัติ</p>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer border-gray-100 hover:border-green-300">
                  <input type="radio" name="freelancer_id" value="" checked={!formData.freelancer_id}
                    onChange={handleChange} className="sr-only" />
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">🎲</div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">จับคู่อัตโนมัติ</p>
                    <p className="text-xs text-gray-400">ระบบจะหาช่างที่เหมาะสม</p>
                  </div>
                </label>
                {freelancers.map(f => (
                  <label key={f.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.freelancer_id === f.id ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-green-300'}`}>
                    <input type="radio" name="freelancer_id" value={f.id}
                      checked={formData.freelancer_id === f.id} onChange={handleChange} className="sr-only" />
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700">
                      {f.full_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                        {f.full_name}
                        {f.is_verified && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 rounded-full">✓</span>}
                      </p>
                      <p className="text-xs text-gray-500">📍 {f.location || 'ปากน้ำประแส'}</p>
                      {f.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {f.skills.slice(0,3).map((s,i) => (
                            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-1.5 rounded-full">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-yellow-500">⭐ {(f.avg_rating || 0).toFixed(1)}</p>
                      <p className="text-xs text-gray-400">{f.total_jobs || 0} งาน</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Price */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-3">💰 ค่าจ้าง</h3>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">฿</span>
              <input type="number" name="base_price" value={formData.base_price} onChange={handleChange}
                min="0" step="1" placeholder="0"
                className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <GPCalculator basePrice={basePrice} />
          </div>

          {/* Photo */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-1">📸 รูปหน้างาน (ไม่บังคับ)</h3>
            <div onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors mt-2 ${
                photoPreview ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}>
              {uploadingPhoto ? (
                <div className="py-3"><div className="text-2xl animate-spin inline-block">⏳</div></div>
              ) : photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview} alt="preview" className="max-h-36 mx-auto rounded-lg object-cover" />
              ) : (
                <div className="py-3"><div className="text-3xl mb-1">📷</div>
                <p className="text-sm text-gray-400">แตะเพื่ออัปโหลดรูป</p></div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          </div>

          {/* Summary + Submit */}
          {basePrice > 0 && (
            <div className="bg-green-600 rounded-2xl p-4 text-white">
              <h3 className="text-sm font-bold mb-2">📋 สรุปก่อนยืนยัน</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-green-200">งาน</span><span>{formData.title || '—'}</span></div>
                <div className="flex justify-between"><span className="text-green-200">ช่าง</span>
                  <span>{freelancers.find(f => f.id === formData.freelancer_id)?.full_name || 'จับคู่อัตโนมัติ'}</span></div>
                {mapAddress && <div className="flex justify-between"><span className="text-green-200">ที่</span><span className="text-xs">{mapAddress.substring(0,30)}...</span></div>}
                <div className="border-t border-green-500 pt-1 flex justify-between">
                  <span className="text-green-200">รวม</span><span className="text-xl font-bold">฿{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          <button type="submit" disabled={submitting || uploadingPhoto || basePrice <= 0}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl text-lg shadow-lg transition-colors">
            {submitting ? '⏳ กำลังสร้างงาน...' : `✅ ยืนยันจ้างงาน ฿${total.toLocaleString()}`}
          </button>
          <p className="text-xs text-center text-gray-400 pb-4">การยืนยันถือว่าตกลงชำระ ฿{total.toLocaleString()}</p>
        </form>
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 px-4 z-50">
        <a href="/dashboard" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-blue-600 text-xs">
          <span className="text-lg">🏠</span>หน้าหลัก
        </a>
        <a href="/jobs/new" className="flex flex-col items-center gap-0.5 text-blue-600 text-xs">
          <span className="text-lg">💼</span>งาน
        </a>
        <a href="/services" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-blue-600 text-xs">
          <span className="text-lg">🔧</span>บริการ
        </a>
        <a href="/coupons" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-blue-600 text-xs">
          <span className="text-lg">🎁</span>คูปอง
        </a>
        <a href="/profile" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-blue-600 text-xs">
          <span className="text-lg">👤</span>โปรไฟล์
        </a>
      </nav>
      </main>
    </div>
  );
          }

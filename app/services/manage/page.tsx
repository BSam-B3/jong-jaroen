'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// ✅ เปลี่ยนมาใช้กุญแจตัวใหม่
import { createClient } from '@/lib/supabase/client';

const CATEGORIES = [
  { id: 'electric', label: 'ช่างไฟ', emoji: '⚡' },
  { id: 'plumbing', label: 'ช่างน้ำ', emoji: '🚿' },
  { id: 'carpenter', label: 'ช่างไม้', emoji: '🪚' },
  { id: 'paint', label: 'ทาสี', emoji: '🎨' },
  { id: 'transport', label: 'ขนส่ง', emoji: '🚚' },
  { id: 'garden', label: 'ตัดหญ้า', emoji: '🌿' },
  { id: 'other', label: 'อื่นๆ', emoji: '🔧' },
];

const GP_RATE = 0.03;

interface ServiceItem {
  id: string;
  title: string;
  price_thb: number;
  category: string;
  created_at: string;
}

function GPPreview({ price }: { price: number }) {
  if (price <= 0) return null;
  const fee = Math.ceil(price * GP_RATE);
  const total = price + fee;
  const freelancerNet = price;
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mt-2">
      <p className="text-xs font-bold text-blue-700 mb-2">💡 ลูกค้าจะเห็นยอดนี้</p>
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">คุณได้รับ</span>
          <span className="font-semibold text-green-600">฿{freelancerNet.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">ค่า GP แพลตฟอร์ม (3%)</span>
          <span className="text-orange-500">+฿{fee.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-xs border-t border-blue-200 pt-1">
          <span className="font-bold text-gray-700">ลูกค้าจ่ายรวม</span>
          <span className="font-bold text-blue-700">฿{total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

export default function ManageServicesPage() {
  // ✅ สร้างตัวแปรเชื่อมต่อฐานข้อมูล
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [providerId, setProviderId] = useState('');
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    title: '',
    category: 'other',
    price_thb: '',
  });

  const previewPrice = parseFloat(form.price_thb) || 0;

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'freelancer') {
        router.push('/dashboard/customer');
        return;
      }

      setProviderId(user.id);

      const { data } = await supabase
        .from('services')
        .select('id, title, price_thb, category, created_at')
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });

      setServices(data || []);
      setLoading(false);
    };
    init();
  }, [router, supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.title.trim()) { setError('กรุณาใส่ชื่อบริการ'); return; }
    if (previewPrice <= 0) { setError('กรุณาใส่ราคาเริ่มต้น'); return; }

    setSaving(true);
    try {
      const { data, error: saveError } = await supabase
        .from('services')
        .insert({
          provider_id: providerId,
          title: form.title.trim(),
          category: form.category,
          price_thb: previewPrice,
        })
        .select()
        .single();

      if (saveError) throw saveError;

      setServices(prev => [data, ...prev]);
      setForm({ title: '', category: 'other', price_thb: '' });
      setShowForm(false);
      setSuccess('เพิ่มบริการสำเร็จ! 🎉');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('ต้องการลบบริการนี้?')) return;
    setDeleting(serviceId);
    try {
      const { error: delError } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId)
        .eq('provider_id', providerId);

      if (delError) throw delError;
      setServices(prev => prev.filter(s => s.id !== serviceId));
      setSuccess('ลบบริการแล้ว');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'ลบไม่สำเร็จ');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">✏️</div>
          <p className="text-blue-700 font-medium">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard/freelancer" className="text-gray-400 hover:text-gray-600">
            ← กลับ
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-blue-700 leading-none">จัดการบริการ</h1>
            <p className="text-xs text-gray-400">ตั้งราคาและหมวดหมู่บริการของคุณ</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3 py-1.5 rounded-xl transition-colors"
          >
            + เพิ่ม
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-5 space-y-4">

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm">
            ✅ {success}
          </div>
        )}

        {/* Add Service Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="text-base font-bold text-gray-800 mb-4">➕ เพิ่มบริการใหม่</h3>
            <form onSubmit={handleSave} className="space-y-3">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">ชื่อบริการ *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="เช่น ซ่อมไฟฟ้า, ล้างแอร์, ตัดต้นไม้..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">หมวดหมู่ *</label>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setForm({ ...form, category: cat.id })}
                      className={`p-2 rounded-xl border-2 text-center transition-all ${
                        form.category === cat.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-100 hover:border-blue-200'
                      }`}
                    >
                      <div className="text-xl">{cat.emoji}</div>
                      <div className="text-xs text-gray-600 mt-0.5 truncate">{cat.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  ราคาเริ่มต้น (บาท) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">฿</span>
                  <input
                    type="number"
                    value={form.price_thb}
                    onChange={e => setForm({ ...form, price_thb: e.target.value })}
                    min="0"
                    step="1"
                    placeholder="0"
                    className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                {/* GP Preview */}
                <GPPreview price={previewPrice} />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
                >
                  {saving ? 'กำลังบันทึก...' : '💾 บันทึกบริการ'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Services List */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-800">
              บริการของคุณ
              <span className="ml-2 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                {services.length}
              </span>
            </h3>
            <Link href="/services" className="text-sm text-blue-600 hover:underline">
              ดูหน้า Marketplace →
            </Link>
          </div>

          {services.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-gray-500 text-sm">ยังไม่มีบริการ</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-3 bg-blue-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-blue-700"
              >
                เพิ่มบริการแรกของคุณ!
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {services.map(service => {
                const cat = CATEGORIES.find(c => c.id === service.category);
                const fee = Math.ceil(service.price_thb * GP_RATE);
                const total = service.price_thb + fee;

                return (
                  <div key={service.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                          {cat?.emoji || '🔧'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{service.title}</p>
                          <p className="text-xs text-gray-400">{cat?.label || 'อื่นๆ'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(service.id)}
                        disabled={deleting === service.id}
                        className="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40 flex-shrink-0"
                      >
                        {deleting === service.id ? '...' : '🗑️ ลบ'}
                      </button>
                    </div>

                    {/* Price breakdown */}
                    <div className="mt-3 bg-gray-50 rounded-xl px-3 py-2 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400">คุณได้รับ</p>
                        <p className="text-base font-bold text-green-600">฿{service.price_thb.toLocaleString()}</p>
                      </div>
                      <div className="text-gray-300 text-lg">→</div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">ลูกค้าจ่าย (รวม GP 3%)</p>
                        <p className="text-base font-bold text-blue-600">฿{total.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 pb-8">
          <h4 className="text-sm font-bold text-amber-800 mb-2">💡 เคล็ดลับสำหรับช่าง</h4>
          <ul className="text-xs text-amber-700 space-y-1">
            <li>• ตั้งราคาที่สมเหตุสมผลเพื่อดึงดูดลูกค้าในชุมชน</li>
            <li>• ลูกค้าจะเห็นยอดรวม GP 3% — ราคาของคุณยังคงเดิม</li>
            <li>• ยิ่งรีวิวดี ยิ่งขึ้นอันดับ Marketplace</li>
            <li>• รับงานครบ 20 งาน รับ badge "ช่างมืออาชีพ"!</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

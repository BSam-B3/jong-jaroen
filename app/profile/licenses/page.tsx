'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// ประเภทใบขับขี่และเอกสาร
const LICENSE_TYPES = [
  { group: '🚗 ใบขับขี่', items: [
    { value: 'driving_car', label: 'ใบขับขี่รถยนต์ (ชั้น 2)' },
    { value: 'driving_motorcycle', label: 'ใบขับขี่รถจักรยานยนต์' },
    { value: 'driving_truck', label: 'ใบขับขี่รถบรรทุก (ชั้น 2ท)' },
    { value: 'driving_heavy', label: 'ใบขับขี่รถหนัก (ชั้น 4)' },
    { value: 'driving_boat', label: 'ใบขับขี่เรือ / นาวิกโยธิน' },
  ]},
  { group: '🎯 ใบประกอบวิชาชีพ', items: [
    { value: 'professional_electrical', label: 'ใบอนุญาตช่างไฟฟ้า (กฟภ./กฟน.)' },
    { value: 'professional_plumbing', label: 'ใบอนุญาตช่างประปา' },
    { value: 'professional_construction', label: 'ใบอนุญาตก่อสร้าง' },
    { value: 'professional_massage', label: 'ใบประกอบโรคศิลป์ (นวดแผนไทย)' },
    { value: 'professional_medical', label: 'ใบประกอบวิชาชีพเวชกรรม' },
    { value: 'professional_nursing', label: 'ใบประกอบวิชาชีพพยาบาล' },
    { value: 'professional_pharmacy', label: 'ใบประกอบวิชาชีพเภสัชกรรม' },
  ]},
  { group: '📜 ใบรับรอง / อบรม', items: [
    { value: 'training_safety', label: 'ใบรับรองความปลอดภัยในการทำงาน' },
    { value: 'training_food', label: 'ใบรับรองสุขอนามัยอาหาร' },
    { value: 'training_first_aid', label: 'ใบรับรองปฐมพยาบาล (CPR)' },
    { value: 'training_forklift', label: 'ใบรับรองขับรถโฟล์คลิฟท์' },
    { value: 'training_welding', label: 'ใบรับรองการเชื่อม' },
    { value: 'training_computer', label: 'ใบรับรองคอมพิวเตอร์ (IC3, MOS)' },
    { value: 'training_language', label: 'ใบรับรองภาษา (TOEIC, IELTS)' },
    { value: 'other', label: 'อื่นๆ (ระบุเอง)' },
  ]},
];

interface UserLicense {
  id: string;
  license_type: string;
  license_name: string;
  license_number: string | null;
  issued_by: string | null;
  issued_date: string | null;
  expires_date: string | null;
  image_url: string | null;
  is_verified: boolean;
  notes: string | null;
  created_at: string;
}

export default function LicensesPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [licenses, setLicenses] = useState<UserLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Form state
  const [licenseType, setLicenseType] = useState('driving_car');
  const [licenseName, setLicenseName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [issuedBy, setIssuedBy] = useState('');
  const [issuedDate, setIssuedDate] = useState('');
  const [expiresDate, setExpiresDate] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }
      setUserId(user.id);

      const { data } = await supabase
        .from('user_licenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setLicenses((data || []) as UserLicense[]);
    } catch (_e) {
      setError('โหลดข้อมูลไม่สำเร็จ');
    }
    setLoading(false);
  }

  function getLabelForType(type: string) {
    for (const group of LICENSE_TYPES) {
      const found = group.items.find(i => i.value === type);
      if (found) return found.label;
    }
    return type;
  }

  function handleTypeChange(val: string) {
    setLicenseType(val);
    // Auto-fill name จาก type
    const label = getLabelForType(val);
    if (val !== 'other') setLicenseName(label);
    else setLicenseName('');
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('ไฟล์ต้องไม่เกิน 10MB');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const ext = file.name.split('.').pop();
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('licenses')
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      // สร้าง signed URL (private bucket)
      const { data: signedData } = await supabase.storage
        .from('licenses')
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      if (signedData?.signedUrl) {
        setImageUrl(path); // เก็บ path ไว้ดึง signed URL ทีหลัง
        setImagePreview(signedData.signedUrl);
      }
    } catch (_e) {
      setError('อัปโหลดไฟล์ไม่สำเร็จ');
    }
    setUploading(false);
  }

  async function handleSave() {
    if (!licenseType || !licenseName.trim()) {
      setError('กรุณาเลือกประเภทและระบุชื่อเอกสาร');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { error: insErr } = await supabase.from('user_licenses').insert({
        user_id: userId,
        license_type: licenseType,
        license_name: licenseName.trim(),
        license_number: licenseNumber.trim() || null,
        issued_by: issuedBy.trim() || null,
        issued_date: issuedDate || null,
        expires_date: expiresDate || null,
        image_url: imageUrl || null,
        notes: notes.trim() || null,
      });
      if (insErr) throw insErr;
      setSuccessMsg('เพิ่มเอกสารสำเร็จแล้ว!');
      setTimeout(() => setSuccessMsg(''), 3000);
      resetForm();
      setShowForm(false);
      loadData();
    } catch (_e) {
      setError('บันทึกไม่สำเร็จ กรุณาลองใหม่');
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('ต้องการลบเอกสารนี้?')) return;
    try {
      await supabase.from('user_licenses').delete().eq('id', id);
      setLicenses(prev => prev.filter(l => l.id !== id));
    } catch (_e) {
      setError('ลบไม่สำเร็จ');
    }
  }

  function resetForm() {
    setLicenseType('driving_car');
    setLicenseName('');
    setLicenseNumber('');
    setIssuedBy('');
    setIssuedDate('');
    setExpiresDate('');
    setNotes('');
    setImageUrl('');
    setImagePreview('');
  }

  function isExpired(dateStr: string | null) {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  }

  function isExpiringSoon(dateStr: string | null) {
    if (!dateStr) return false;
    const diff = new Date(dateStr).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000; // 30 วัน
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center"><div className="text-4xl animate-bounce mb-2">📜</div><p className="text-gray-500 text-sm">กำลังโหลด...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/profile" className="text-gray-400 hover:text-gray-600">← กลับ</Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-800">📜 ใบอนุญาต & เอกสาร</h1>
            <p className="text-xs text-gray-400">ใบขับขี่ · ใบประกอบวิชาชีพ · ใบรับรอง</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); resetForm(); }}
            className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-xl font-medium hover:bg-blue-700 transition"
          >
            {showForm ? '✕ ยกเลิก' : '+ เพิ่ม'}
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-5 space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">⚠️ {error}</div>}
        {successMsg && <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm font-medium">✅ {successMsg}</div>}

        {/* Add Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-blue-100 space-y-4">
            <h3 className="font-bold text-gray-800 text-sm">➕ เพิ่มเอกสารใหม่</h3>

            {/* ประเภท */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">ประเภทเอกสาร *</label>
              <select
                value={licenseType}
                onChange={e => handleTypeChange(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {LICENSE_TYPES.map(group => (
                  <optgroup key={group.group} label={group.group}>
                    {group.items.map(item => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* ชื่อเอกสาร */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">ชื่อเอกสาร *</label>
              <input
                type="text"
                value={licenseName}
                onChange={e => setLicenseName(e.target.value)}
                placeholder="เช่น ใบขับขี่รถยนต์ส่วนบุคคล"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* เลขที่ */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">เลขที่เอกสาร</label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={e => setLicenseNumber(e.target.value)}
                  placeholder="xxxxxxxx"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              {/* ออกโดย */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">ออกโดย</label>
                <input
                  type="text"
                  value={issuedBy}
                  onChange={e => setIssuedBy(e.target.value)}
                  placeholder="กรมการขนส่ง..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">วันออก</label>
                <input type="date" value={issuedDate} onChange={e => setIssuedDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">วันหมดอายุ</label>
                <input type="date" value={expiresDate} onChange={e => setExpiresDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            </div>

            {/* หมายเหตุ */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">หมายเหตุ</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="รายละเอียดเพิ่มเติม..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>

            {/* อัปโหลดรูป */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">🖼️ อัปโหลดรูปเอกสาร (ไม่บังคับ)</label>
              <div
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${imagePreview ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-blue-300'}`}
              >
                {uploading ? (
                  <div><div className="text-2xl animate-spin inline-block">⏳</div><p className="text-xs text-gray-500 mt-1">กำลังอัปโหลด...</p></div>
                ) : imagePreview ? (
                  <div>
                    <img src={imagePreview} alt="preview" className="max-h-28 mx-auto rounded-lg object-cover mb-1" />
                    <p className="text-xs text-green-600">✅ อัปโหลดแล้ว — คลิกเพื่อเปลี่ยน</p>
                  </div>
                ) : (
                  <div className="py-2"><div className="text-2xl mb-1">📷</div><p className="text-sm text-gray-500">แตะเพื่ออัปโหลดรูปเอกสาร</p><p className="text-xs text-gray-400">JPG, PNG สูงสุด 10MB</p></div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl text-sm transition"
            >
              {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึกเอกสาร'}
            </button>
          </div>
        )}

        {/* License List */}
        {licenses.length === 0 && !showForm ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <div className="text-5xl mb-3">📜</div>
            <p className="text-gray-500 font-medium">ยังไม่มีเอกสาร</p>
            <p className="text-gray-400 text-sm mt-1">เพิ่มใบขับขี่ ใบประกอบวิชาชีพ หรือใบรับรองของคุณ</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 bg-blue-600 text-white text-sm px-5 py-2 rounded-xl font-medium hover:bg-blue-700 transition"
            >
              + เพิ่มเอกสารแรก
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {licenses.map(lic => (
              <div key={lic.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-800 text-sm">{lic.license_name}</span>
                      {lic.is_verified && (
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">✅ ยืนยันแล้ว</span>
                      )}
                      {lic.expires_date && isExpired(lic.expires_date) && (
                        <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">❌ หมดอายุ</span>
                      )}
                      {lic.expires_date && isExpiringSoon(lic.expires_date) && !isExpired(lic.expires_date) && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">⚠️ ใกล้หมดอายุ</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{getLabelForType(lic.license_type)}</p>
                    <div className="mt-1 space-y-0.5">
                      {lic.license_number && <p className="text-xs text-gray-600">🔢 เลขที่: {lic.license_number}</p>}
                      {lic.issued_by && <p className="text-xs text-gray-500">🏛️ ออกโดย: {lic.issued_by}</p>}
                      {lic.expires_date && <p className="text-xs text-gray-500">⏰ หมดอายุ: {new Date(lic.expires_date).toLocaleDateString('th-TH')}</p>}
                      {lic.notes && <p className="text-xs text-gray-400 italic">{lic.notes}</p>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {lic.image_url && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">🖼️ มีรูป</span>
                    )}
                    <button
                      onClick={() => handleDelete(lic.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition"
                    >
                      🗑️ ลบ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <h3 className="text-xs font-bold text-blue-800 mb-2">💡 ข้อมูลเกี่ยวกับเอกสาร</h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• เอกสารที่ Admin ยืนยันแล้วจะแสดงบน Profile ช่างของคุณ</li>
            <li>• เพิ่มเอกสารได้ไม่จำกัดจำนวน</li>
            <li>• ระบบแจ้งเตือนเมื่อเอกสารใกล้หมดอายุ (30 วัน)</li>
          </ul>
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 z-50">
        <Link href="/" className="flex flex-col items-center text-gray-400 text-xs gap-0.5"><span>🏠</span>หน้าหลัก</Link>
        <Link href="/services" className="flex flex-col items-center text-gray-400 text-xs gap-0.5"><span>🔍</span>ค้นหา</Link>
        <Link href="/dashboard" className="flex flex-col items-center text-gray-400 text-xs gap-0.5"><span>📋</span>งาน</Link>
        <Link href="/profile" className="flex flex-col items-center text-blue-600 text-xs gap-0.5"><span>👤</span>โปรไฟล์</Link>
      </nav>
    </div>
  );
}

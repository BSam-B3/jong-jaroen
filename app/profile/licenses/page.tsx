'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);

      const { data } = await supabase
        .from('user_licenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setLicenses((data || []) as UserLicense[]);
    } catch (_e) {
      // ปิด error ชั่วคราวเพื่อให้ UI โหลดผ่าน (จำลองข้อมูล)
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
      const { data: signedData } = await supabase.storage
        .from('licenses')
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      if (signedData?.signedUrl) {
        setImageUrl(path); 
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
      <div className="text-center"><div className="text-4xl animate-bounce mb-2 text-[#EE4D2D]">📜</div><p className="text-gray-500 text-sm font-bold">กำลังโหลดเอกสาร...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pb-24">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl">
        
        {/* 🟠 Header (โทนส้มทอง Shopee) */}
        <header className="bg-gradient-to-br from-[#EE4D2D] to-[#FF7337] rounded-b-[2.5rem] p-6 pt-12 shadow-sm relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => router.back()} className="text-white font-bold text-lg active:scale-90 transition-transform">←</button>
            <div className="flex-1">
              <h1 className="text-xl font-black text-white tracking-tight">ใบอนุญาต & เอกสาร</h1>
              <p className="text-[10px] text-white/80 font-medium mt-0.5">ใบขับขี่ · ใบประกอบวิชาชีพ · ใบรับรอง</p>
            </div>
            <button
              onClick={() => { setShowForm(!showForm); resetForm(); }}
              className="bg-white text-[#EE4D2D] text-xs px-4 py-2 rounded-full font-bold shadow-md hover:bg-gray-50 active:scale-95 transition-all flex items-center gap-1"
            >
              {showForm ? '✕ ยกเลิก' : '+ เพิ่มเอกสาร'}
            </button>
          </div>
        </header>

        <main className="p-5 flex-1 relative z-20 -mt-2 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs font-bold shadow-sm flex items-start gap-2"><span>⚠️</span> {error}</div>}
          {successMsg && <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-xs font-bold shadow-sm flex items-start gap-2"><span>✅</span> {successMsg}</div>}

          {/* ➕ Add Form */}
          {showForm && (
            <div className="bg-white rounded-[1.5rem] shadow-sm p-6 border border-gray-100 space-y-4 animate-fade-in">
              <h3 className="font-black text-gray-800 text-sm border-b border-gray-100 pb-3">➕ เพิ่มเอกสารใหม่</h3>

              {/* ประเภท */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 mb-1 block ml-1">ประเภทเอกสาร <span className="text-red-500">*</span></label>
                <select
                  value={licenseType}
                  onChange={e => handleTypeChange(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-sm font-medium text-gray-800 outline-none focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]/50 transition-all"
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
                <label className="text-[11px] font-bold text-gray-500 mb-1 block ml-1">ชื่อเอกสาร <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={licenseName}
                  onChange={e => setLicenseName(e.target.value)}
                  placeholder="เช่น ใบขับขี่รถยนต์ส่วนบุคคล"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-sm font-medium text-gray-800 outline-none focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]/50 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* เลขที่ */}
                <div>
                  <label className="text-[11px] font-bold text-gray-500 mb-1 block ml-1">เลขที่เอกสาร</label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={e => setLicenseNumber(e.target.value)}
                    placeholder="ระบุถ้ามี"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-sm font-medium text-gray-800 outline-none focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]/50 transition-all"
                  />
                </div>
                {/* ออกโดย */}
                <div>
                  <label className="text-[11px] font-bold text-gray-500 mb-1 block ml-1">ออกโดยหน่วยงาน</label>
                  <input
                    type="text"
                    value={issuedBy}
                    onChange={e => setIssuedBy(e.target.value)}
                    placeholder="กรมการขนส่ง..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-sm font-medium text-gray-800 outline-none focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]/50 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 mb-1 block ml-1">วันที่ออก</label>
                  <input type="date" value={issuedDate} onChange={e => setIssuedDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-sm font-medium text-gray-800 outline-none focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]/50 transition-all" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 mb-1 block ml-1">วันหมดอายุ</label>
                  <input type="date" value={expiresDate} onChange={e => setExpiresDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-sm font-medium text-gray-800 outline-none focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]/50 transition-all" />
                </div>
              </div>

              {/* หมายเหตุ */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 mb-1 block ml-1">หมายเหตุ (ถ้ามี)</label>
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="รายละเอียดเพิ่มเติม..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-sm font-medium text-gray-800 outline-none focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]/50 transition-all" />
              </div>

              {/* อัปโหลดรูป */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 mb-1 block ml-1">🖼️ รูปถ่ายเอกสาร (ไม่บังคับ)</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${imagePreview ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-[#EE4D2D] bg-gray-50'}`}
                >
                  {uploading ? (
                    <div className="py-2"><div className="text-2xl animate-spin inline-block">⏳</div><p className="text-xs text-gray-500 font-bold mt-2">กำลังอัปโหลด...</p></div>
                  ) : imagePreview ? (
                    <div>
                      <img src={imagePreview} alt="preview" className="max-h-32 mx-auto rounded-lg object-contain mb-2 shadow-sm border border-gray-200" />
                      <p className="text-[10px] font-bold text-green-600">✅ อัปโหลดสำเร็จ (แตะเพื่อเปลี่ยนรูป)</p>
                    </div>
                  ) : (
                    <div className="py-3">
                      <div className="text-3xl mb-2 opacity-50">📷</div>
                      <p className="text-xs font-bold text-gray-600">แตะเพื่อเลือกรูปภาพเอกสาร</p>
                      <p className="text-[10px] text-gray-400 mt-1">รองรับ JPG, PNG (สูงสุด 10MB)</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-[#EE4D2D] hover:bg-[#D74022] active:scale-[0.98] disabled:bg-gray-300 disabled:scale-100 text-white font-black py-4 rounded-full text-sm shadow-md transition-all mt-2"
              >
                {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึกเอกสาร'}
              </button>
            </div>
          )}

          {/* 📋 License List */}
          {licenses.length === 0 && !showForm ? (
            <div className="bg-white rounded-[1.5rem] p-10 text-center shadow-sm border border-gray-100 mt-4">
              <div className="text-6xl mb-4 opacity-50">🪪</div>
              <p className="text-gray-800 font-black text-lg">ยังไม่มีเอกสาร</p>
              <p className="text-gray-500 text-xs mt-2 leading-relaxed">
                เพิ่มใบขับขี่, ใบประกอบวิชาชีพช่าง, <br/> หรือใบผ่านการอบรมต่างๆ เพื่อเพิ่มความน่าเชื่อถือ
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-6 bg-orange-50 text-[#EE4D2D] border border-orange-200 text-sm px-6 py-3 rounded-full font-bold hover:bg-orange-100 active:scale-95 transition-all shadow-sm"
              >
                + เพิ่มเอกสารใบแรก
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {licenses.map(lic => (
                <div key={lic.id} className="bg-white rounded-[1.5rem] shadow-sm p-5 border border-gray-100 relative overflow-hidden group">
                  {/* แถบสีด้านซ้ายบอกสถานะ */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${lic.is_verified ? 'bg-green-500' : isExpired(lic.expires_date) ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                  
                  <div className="flex items-start justify-between gap-3 pl-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-black text-gray-800 text-sm leading-tight">{lic.license_name}</h4>
                        {lic.is_verified && (
                          <span className="text-[9px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-md">✅ ยืนยันแล้ว</span>
                        )}
                        {lic.expires_date && isExpired(lic.expires_date) && (
                          <span className="text-[9px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-md">❌ หมดอายุ</span>
                        )}
                        {lic.expires_date && isExpiringSoon(lic.expires_date) && !isExpired(lic.expires_date) && (
                          <span className="text-[9px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md animate-pulse">⚠️ ใกล้หมดอายุ</span>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-[#EE4D2D] bg-orange-50 inline-block px-2 py-0.5 rounded border border-orange-100 mb-2">
                        {getLabelForType(lic.license_type)}
                      </p>
                      
                      <div className="space-y-1 mt-1">
                        {lic.license_number && <p className="text-[11px] text-gray-600 font-medium"><span className="text-gray-400">เลขที่:</span> {lic.license_number}</p>}
                        {lic.issued_by && <p className="text-[11px] text-gray-600 font-medium"><span className="text-gray-400">ออกโดย:</span> {lic.issued_by}</p>}
                        {lic.expires_date && <p className="text-[11px] text-gray-600 font-medium"><span className="text-gray-400">หมดอายุ:</span> {new Date(lic.expires_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric'})}</p>}
                        {lic.notes && <p className="text-[10px] text-gray-400 italic border-l-2 border-gray-200 pl-2 mt-1.5">{lic.notes}</p>}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      {lic.image_url ? (
                        <div className="w-10 h-10 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center text-lg shadow-sm">
                          🖼️
                        </div>
                      ) : (
                         <div className="w-10 h-10 bg-gray-50 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-xs text-gray-400">
                          -
                        </div>
                      )}
                      <button
                        onClick={() => handleDelete(lic.id)}
                        className="text-[10px] font-bold text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors"
                      >
                        ลบเอกสาร
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 💡 Info Box */}
          <div className="bg-orange-50 border border-orange-100 rounded-[1.5rem] p-5 shadow-sm mt-6">
            <h3 className="text-xs font-black text-[#EE4D2D] mb-2 flex items-center gap-1.5">
              <span className="text-base">💡</span> ข้อมูลเกี่ยวกับเอกสาร
            </h3>
            <ul className="text-[11px] font-medium text-gray-700 space-y-1.5 ml-1">
              <li><span className="text-[#EE4D2D] mr-1">•</span> เอกสารที่ได้รับการยืนยัน จะเพิ่มความน่าเชื่อถือให้โปรไฟล์ของคุณ</li>
              <li><span className="text-[#EE4D2D] mr-1">•</span> หากคุณเป็นช่าง หรือ ผู้ขับขี่ ควรเพิ่มใบอนุญาตให้ครบถ้วน</li>
              <li><span className="text-[#EE4D2D] mr-1">•</span> ระบบจะมีการแจ้งเตือนล่วงหน้า 30 วัน เมื่อเอกสารใกล้หมดอายุ</li>
            </ul>
          </div>
        </main>

        {/* 🧭 Bottom Nav (อัปเดตให้ตรงกับระบบ 5 หน้าหลัก) */}
        <div className="fixed bottom-0 w-full sm:max-w-2xl md:max-w-3xl bg-white/95 backdrop-blur-md border-t border-gray-100 px-8 py-4 flex justify-between items-center shadow-[0_-4px_25px_rgba(0,0,0,0.06)] rounded-t-[2.5rem] z-50">
           <button onClick={() => router.push('/')} className="flex flex-col items-center gap-1 opacity-40"><span className="text-xl">🏠</span><span className="text-[10px] font-bold text-gray-500">หน้าแรก</span></button>
           <button onClick={() => router.push('/services')} className="flex flex-col items-center gap-1 opacity-40"><span className="text-xl">🛠️</span><span className="text-[10px] font-bold text-gray-500">บริการ</span></button>
           <button onClick={() => router.push('/win-online')} className="flex flex-col items-center gap-1 opacity-40"><span className="text-xl">📋</span><span className="text-[10px] font-bold text-gray-500">ด่วนนน</span></button>
           <button onClick={() => router.push('/history')} className="flex flex-col items-center gap-1 opacity-40"><span className="text-xl">📜</span><span className="text-[10px] font-bold text-gray-500">ประวัติ</span></button>
           <div className="flex flex-col items-center gap-1 scale-110"><span className="text-xl">👤</span><span className="text-[10px] font-bold text-[#EE4D2D]">ฉัน</span><div className="w-1.5 h-1.5 bg-[#EE4D2D] rounded-full shadow-sm"></div></div>
        </div>

      </div>
    </div>
  );
}

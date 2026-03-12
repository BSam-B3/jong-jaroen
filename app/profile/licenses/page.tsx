'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// ✅ อัปเดต: เพิ่มหมวดหมู่ การศึกษา, ใบเกรด และ ประกาศนียบัตร
const LICENSE_TYPES = [
  { group: '🚗 ใบขับขี่ / ยานพาหนะ', items: [
    { value: 'driving_car', label: 'ใบขับขี่รถยนต์ส่วนบุคคล' },
    { value: 'driving_motorcycle', label: 'ใบขับขี่รถจักรยานยนต์' },
    { value: 'driving_public_car', label: 'ใบขับขี่รถยนต์สาธารณะ' },
    { value: 'driving_truck', label: 'ใบขับขี่รถบรรทุก (ท.2 / ท.3 / ท.4)' },
    { value: 'driving_boat', label: 'ใบประกาศนียบัตรคนประจำเรือ' },
  ]},
  { group: '🎓 ประวัติการศึกษา', items: [
    { value: 'edu_degree', label: 'วุฒิการศึกษา (ปริญญาตรี/โท/เอก)' },
    { value: 'edu_highschool', label: 'วุฒิการศึกษา (ม.3/ม.6/ปวช./ปวส.)' },
    { value: 'edu_transcript', label: 'ใบรายงานผลการศึกษา (Transcript / ใบเกรด)' },
  ]},
  { group: '🎯 ใบประกอบวิชาชีพ', items: [
    { value: 'professional_electrical', label: 'ใบอนุญาตช่างไฟฟ้า (กฟภ./กฟน.)' },
    { value: 'professional_plumbing', label: 'ใบอนุญาตช่างประปา' },
    { value: 'professional_construction', label: 'ใบอนุญาตวิศวกร / ก่อสร้าง' },
    { value: 'professional_massage', label: 'ใบประกอบโรคศิลป์ (นวดแผนไทย)' },
    { value: 'professional_medical', label: 'ใบประกอบวิชาชีพเวชกรรม / พยาบาล' },
  ]},
  { group: '📜 ใบรับรอง / อบรม', items: [
    { value: 'cert_general', label: 'ประกาศนียบัตรทั่วไป (Certificate)' },
    { value: 'training_safety', label: 'ใบรับรอง จป. (ความปลอดภัยในการทำงาน)' },
    { value: 'training_food', label: 'ใบรับรองผู้สัมผัสอาหาร' },
    { value: 'training_first_aid', label: 'ใบรับรองปฐมพยาบาล (CPR)' },
    { value: 'training_forklift', label: 'ใบผ่านการอบรมขับรถโฟล์คลิฟท์' },
    { value: 'training_language', label: 'ผลสอบวัดระดับภาษา (TOEIC, IELTS ฯลฯ)' },
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
    } catch (_e) {}
    setLoading(false);
  }

  // ✅ Helper functions สำหรับหา Label และ Group
  function getLabelForType(type: string) {
    for (const group of LICENSE_TYPES) {
      const found = group.items.find(i => i.value === type);
      if (found) return found.label;
    }
    return type;
  }

  function getGroupForType(type: string) {
    for (const group of LICENSE_TYPES) {
      if (group.items.some(i => i.value === type)) return group.group;
    }
    return '📁 อื่นๆ';
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
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000; 
  }

  // ✅ จัดกลุ่มเอกสารเพื่อแสดงผลให้ดูง่ายขึ้น
  const groupedLicenses = licenses.reduce((acc: any, lic) => {
    const groupName = getGroupForType(lic.license_type);
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(lic);
    return acc;
  }, {});

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center"><div className="text-4xl animate-bounce mb-2 text-[#EE4D2D]">📁</div><p className="text-gray-500 text-sm font-bold">กำลังเปิดแฟ้มเอกสาร...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pb-24">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl">
        
        {/* 🟠 Header */}
        <header className="bg-gradient-to-br from-[#EE4D2D] to-[#FF7337] rounded-b-[2.5rem] p-6 pt-12 shadow-sm relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => router.back()} className="text-white font-bold text-lg active:scale-90 transition-transform">←</button>
            <div className="flex-1">
              <h1 className="text-xl font-black text-white tracking-tight">แฟ้มเอกสารส่วนตัว</h1>
              <p className="text-[10px] text-white/90 font-medium mt-0.5">ใบขับขี่ · การศึกษา · ประกาศนียบัตร</p>
            </div>
            {!showForm && (
              <button
                onClick={() => { setShowForm(true); resetForm(); }}
                className="bg-white text-[#EE4D2D] text-xs px-4 py-2 rounded-full font-bold shadow-md hover:bg-gray-50 active:scale-95 transition-all flex items-center gap-1"
              >
                + เพิ่มเอกสาร
              </button>
            )}
          </div>
        </header>

        <main className="p-4 flex-1 relative z-20 -mt-2 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs font-bold shadow-sm flex items-start gap-2"><span>⚠️</span> {error}</div>}
          {successMsg && <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-xs font-bold shadow-sm flex items-start gap-2"><span>✅</span> {successMsg}</div>}

          {/* ➕ Add Form */}
          {showForm && (
            <div className="bg-white rounded-[1.5rem] shadow-sm p-6 border border-gray-100 space-y-4 animate-fade-in relative">
              <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 font-bold">✕</button>
              
              <h3 className="font-black text-[#EE4D2D] text-base border-b border-gray-100 pb-3 flex items-center gap-2">
                <span>📁</span> นำเข้าเอกสารใหม่
              </h3>

              {/* ประเภท */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 mb-1 block ml-1">ประเภทเอกสาร <span className="text-red-500">*</span></label>
                <select
                  value={licenseType}
                  onChange={e => handleTypeChange(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3.5 text-sm font-bold text-gray-800 outline-none focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]/50 transition-all"
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
                  placeholder="ระบุชื่อเอกสารให้ชัดเจน"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3.5 text-sm font-medium text-gray-800 outline-none focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]/50 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 mb-1 block ml-1">เลขที่เอกสาร / รหัสนักศึกษา</label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={e => setLicenseNumber(e.target.value)}
                    placeholder="ระบุถ้ามี"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3.5 text-sm font-medium text-gray-800 outline-none focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 mb-1 block ml-1">ออกโดยสถาบัน/หน่วยงาน</label>
                  <input
                    type="text"
                    value={issuedBy}
                    onChange={e => setIssuedBy(e.target.value)}
                    placeholder="เช่น มหาวิทยาลัย..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3.5 text-sm font-medium text-gray-800 outline-none focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]/50 transition-all"
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
                  <label className="text-[11px] font-bold text-gray-500 mb-1 block ml-1">วันหมดอายุ (เว้นว่างได้)</label>
                  <input type="date" value={expiresDate} onChange={e => setExpiresDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-sm font-medium text-gray-800 outline-none focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]/50 transition-all" />
                </div>
              </div>

              {/* หมายเหตุ */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 mb-1 block ml-1">เกรดเฉลี่ย (GPA) หรือ หมายเหตุ</label>
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="เช่น GPA: 3.50 หรือรายละเอียดอื่นๆ..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3.5 text-sm font-medium text-gray-800 outline-none focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]/50 transition-all" />
              </div>

              {/* อัปโหลดรูป */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 mb-1 block ml-1">🖼️ แนบไฟล์สแกน / รูปถ่าย (ไม่บังคับ)</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-[1.5rem] p-6 text-center cursor-pointer transition-colors ${imagePreview ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-[#EE4D2D] bg-gray-50'}`}
                >
                  {uploading ? (
                    <div className="py-2"><div className="text-2xl animate-spin inline-block">⏳</div><p className="text-xs text-gray-500 font-bold mt-2">กำลังอัปโหลดไฟล์...</p></div>
                  ) : imagePreview ? (
                    <div>
                      <img src={imagePreview} alt="preview" className="max-h-40 mx-auto rounded-xl object-contain mb-3 shadow-md border border-gray-200 bg-white" />
                      <p className="text-xs font-bold text-green-600 bg-white inline-block px-3 py-1 rounded-full shadow-sm">✅ แนบไฟล์สำเร็จ (แตะเพื่อเปลี่ยน)</p>
                    </div>
                  ) : (
                    <div className="py-4">
                      <div className="text-4xl mb-2 opacity-40 text-[#EE4D2D]">📄</div>
                      <p className="text-sm font-bold text-gray-600">แตะเพื่อแนบไฟล์เอกสาร</p>
                      <p className="text-[10px] text-gray-400 mt-1">รองรับ JPG, PNG (สูงสุด 10MB)</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-[#EE4D2D] hover:bg-[#D74022] active:scale-[0.98] disabled:bg-gray-300 disabled:scale-100 text-white font-black py-4 rounded-full text-base shadow-lg transition-all mt-4"
              >
                {saving ? '⏳ กำลังจัดเก็บเข้าแฟ้ม...' : '💾 บันทึกเอกสารเข้าแฟ้ม'}
              </button>
            </div>
          )}

          {/* 📋 Document Vault List (จัดกลุ่ม) */}
          {licenses.length === 0 && !showForm ? (
            <div className="bg-white rounded-[1.5rem] p-10 text-center shadow-sm border border-gray-100 mt-2">
              <div className="text-6xl mb-4 opacity-50">🗂️</div>
              <p className="text-gray-800 font-black text-lg">แฟ้มเอกสารยังว่างเปล่า</p>
              <p className="text-gray-500 text-xs mt-2 leading-relaxed">
                สร้างโปรไฟล์ให้โดดเด่น ด้วยการเพิ่มวุฒิการศึกษา,<br/> ใบขับขี่ หรือประกาศนียบัตรต่างๆ ของคุณ
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-6 bg-orange-50 text-[#EE4D2D] border border-orange-200 text-sm px-6 py-3 rounded-full font-bold hover:bg-orange-100 active:scale-95 transition-all shadow-sm"
              >
                + ฝากเอกสารใบแรก
              </button>
            </div>
          ) : (
            <div className="space-y-6 mt-2 pb-4">
              {Object.keys(groupedLicenses).map((group) => (
                <div key={group} className="space-y-3">
                  {/* หัวข้อกลุ่มเอกสาร */}
                  <h3 className="font-black text-gray-700 text-sm ml-2 border-b border-gray-200 pb-1 inline-block">
                    {group}
                  </h3>
                  
                  {/* รายการเอกสารในกลุ่มนั้นๆ */}
                  <div className="space-y-3">
                    {groupedLicenses[group].map((lic: UserLicense) => (
                      <div key={lic.id} className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100 relative overflow-hidden group hover:border-[#EE4D2D]/30 transition-colors">
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${lic.is_verified ? 'bg-green-500' : isExpired(lic.expires_date) ? 'bg-red-500' : 'bg-[#EE4D2D]'}`}></div>
                        
                        <div className="flex items-start justify-between gap-3 pl-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
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
                            
                            <div className="space-y-1 mt-2 bg-gray-50 p-2.5 rounded-xl">
                              {lic.license_number && <p className="text-[11px] text-gray-700 font-bold"><span className="text-gray-400 font-medium">รหัส/เลขที่:</span> {lic.license_number}</p>}
                              {lic.issued_by && <p className="text-[11px] text-gray-700 font-medium"><span className="text-gray-400">สถาบัน/หน่วยงาน:</span> {lic.issued_by}</p>}
                              {lic.issued_date && <p className="text-[11px] text-gray-600 font-medium"><span className="text-gray-400">วันที่ออก:</span> {new Date(lic.issued_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric'})}</p>}
                              {lic.notes && <p className="text-[11px] text-[#EE4D2D] font-bold mt-1.5 pt-1.5 border-t border-gray-200">{lic.notes}</p>}
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-3 shrink-0">
                            {lic.image_url ? (
                              <div className="w-12 h-12 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center text-xl shadow-sm text-[#EE4D2D]">
                                📄
                              </div>
                            ) : (
                               <div className="w-12 h-12 bg-gray-50 border border-dashed border-gray-300 rounded-xl flex items-center justify-center text-xs text-gray-400">
                                -
                              </div>
                            )}
                            <button
                              onClick={() => handleDelete(lic.id)}
                              className="text-[10px] font-bold text-gray-400 hover:text-red-500 bg-white hover:bg-red-50 px-2 py-1 rounded-md transition-colors border border-gray-200 hover:border-red-200"
                            >
                              🗑️ ลบ
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

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

'use client';
import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const SKILL_OPTIONS = [
  'ช่างไฟ', 'ช่างประปา', 'ช่างไม้', 'ช่างเชื่อม', 'ช่างทาสี',
  'แม่บ้าน', 'ทำสวน', 'ซ่อมเรือ', 'ประมง', 'เกษตร',
  'ขับรถ', 'ส่งของ', 'ทำอาหาร', 'นวดแผนไทย', 'ดูแลผู้สูงอายุ',
  'สอนพิเศษ', 'ภาษาอังกฤษ', 'คอมพิวเตอร์', 'ช่างภาพ', 'รับจ้างทั่วไป',
];

interface Profile {
  id: string;
  full_name: string;
  phone: string;
  location: string;
  bio: string | null;
  skills: string[];
  is_verified: boolean;
  kyc_status: string;
  avg_rating: number;
  total_jobs: number;
  mode: string;
  id_card_url: string | null;
  selfie_with_id_url: string | null;
  bank_account_number: string | null;
  bank_name: string | null;
}

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams?.get('tab') || 'profile';
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const idCardRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  const [bio, setBio] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankName, setBankName] = useState('');
  const [idCardUrl, setIdCardUrl] = useState('');
  const [selfieUrl, setSelfieUrl] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }
      setUserId(user.id);
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(data as Profile);
        setBio(data.bio || '');
        setSelectedSkills(data.skills || []);
        setPhone(data.phone || '');
        setLocation(data.location || '');
        setBankAccount(data.bank_account_number || '');
        setBankName(data.bank_name || '');
        setIdCardUrl(data.id_card_url || '');
        setSelfieUrl(data.selfie_with_id_url || '');
      }
      setLoading(false);
    };
    load();
  }, [router]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const saveProfile = async () => {
    setSaving(true); setError('');
    try {
      const { error: updateError } = await supabase.from('profiles').update({
        bio: bio.trim() || null,
        skills: selectedSkills,
        phone: phone.trim(),
        location: location.trim(),
      }).eq('id', userId);
      if (updateError) throw updateError;
      setProfile(prev => prev ? { ...prev, bio, skills: selectedSkills, phone, location } : null);
      setSuccessMsg('✅ บันทึกโปรไฟล์สำเร็จ!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ');
    } finally { setSaving(false); }
  };

  const saveKYC = async () => {
    if (!bankAccount.trim()) { setError('กรุณาใส่เลขบัญชีธนาคาร'); return; }
    if (!idCardUrl) { setError('กรุณาอัปโหลดรูปบัตรประชาชน'); return; }
    if (!selfieUrl) { setError('กรุณาอัปโหลดรูปถ่ายคู่บัตร'); return; }
    setSaving(true); setError('');
    try {
      const { error: updateError } = await supabase.from('profiles').update({
        bank_account_number: bankAccount.trim(),
        bank_name: bankName.trim() || 'ไม่ระบุ',
        id_card_url: idCardUrl,
        selfie_with_id_url: selfieUrl,
        kyc_status: 'pending',
      }).eq('id', userId);
      if (updateError) throw updateError;
      setProfile(prev => prev ? { ...prev, kyc_status: 'pending' } : null);
      setSuccessMsg('✅ ส่งข้อมูล KYC สำเร็จ! Admin จะตรวจสอบภายใน 24 ชั่วโมง');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'ส่ง KYC ไม่สำเร็จ');
    } finally { setSaving(false); }
  };

  const uploadFile = async (file: File, field: 'id_card' | 'selfie'): Promise<string | null> => {
    if (file.size > 5 * 1024 * 1024) { setError('ไฟล์ต้องไม่เกิน 5MB'); return null; }
    setUploading(field);
    try {
      const ext = file.name.split('.').pop();
      const path = `kyc/${userId}/${field}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('job-images').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('job-images').getPublicUrl(path);
      return publicUrl;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload ไม่สำเร็จ');
      return null;
    } finally { setUploading(null); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center"><div className="text-4xl animate-bounce mb-2">👤</div><p className="text-gray-500 text-sm">กำลังโหลด...</p></div>
      </div>
    );
  }

  const kycStatusInfo = {
    none: { label: 'ยังไม่ยื่น KYC', color: 'text-gray-500', bg: 'bg-gray-100', emoji: '📋' },
    pending: { label: 'รอ Admin ตรวจสอบ', color: 'text-yellow-700', bg: 'bg-yellow-100', emoji: '⏳' },
    approved: { label: 'ผ่านการยืนยันแล้ว', color: 'text-green-700', bg: 'bg-green-100', emoji: '✅' },
    rejected: { label: 'ไม่ผ่าน — กรุณายื่นใหม่', color: 'text-red-700', bg: 'bg-red-100', emoji: '❌' },
  }[profile?.kyc_status || 'none'] || { label: 'ไม่ทราบสถานะ', color: 'text-gray-500', bg: 'bg-gray-100', emoji: '❓' };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">← กลับ</Link>
          <h1 className="text-lg font-bold text-gray-800 flex-1">👤 โปรไฟล์ของฉัน</h1>
          {profile?.is_verified && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">✓ ยืนยันแล้ว</span>
          )}
        </div>
        <div className="max-w-xl mx-auto px-4 flex border-b border-gray-100">
          {[
            { key: 'profile', label: '📝 โปรไฟล์', href: '/profile' },
            { key: 'kyc', label: '🪪 KYC', href: '/profile?tab=kyc' },
            { key: 'certificate', label: '📄 ใบรับรอง', href: '/profile/certificate' },
            { key: 'portfolio', label: '📋 Portfolio', href: '/profile/portfolio' },
          ].map(tab => (
            <Link key={tab.key} href={tab.href}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-5 space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">⚠️ {error}</div>}
        {successMsg && <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm font-medium">{successMsg}</div>}

        {activeTab === 'profile' && (
          <>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center text-white font-black text-2xl">
                  {profile?.full_name?.charAt(0) || '?'}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">{profile?.full_name}</h2>
                  <p className="text-sm text-gray-500">📍 {profile?.location || 'ปากน้ำประแส'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {profile?.is_verified && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">✓ Verified</span>}
                    <span className="text-xs text-gray-400">⭐ {(profile?.avg_rating || 0).toFixed(1)} · {profile?.total_jobs || 0} งาน</span>
                  </div>
                </div>
              </div>
              {(profile?.skills || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(profile?.skills || []).map((skill, i) => (
                    <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-100">{skill}</span>
                  ))}
                </div>
              )}
              {profile?.bio && <p className="text-sm text-gray-600 italic">"{profile.bio}"</p>}
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-3">✏️ แก้ไขโปรไฟล์</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">เบอร์โทรศัพท์</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="08X-XXX-XXXX"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">ที่อยู่</label>
                  <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="ที่อยู่ / หมู่บ้าน"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">แนะนำตัว (Bio)</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="แนะนำตัวเองสั้นๆ เช่น ช่างไฟประสบการณ์ 10 ปี..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-3">🏷️ ทักษะ / ความเชี่ยวชาญ</h3>
              <p className="text-xs text-gray-400 mb-3">เลือกทักษะที่คุณมี (แสดงบน Marketplace)</p>
              <div className="flex flex-wrap gap-2">
                {SKILL_OPTIONS.map(skill => (
                  <button key={skill} onClick={() => toggleSkill(skill)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      selectedSkills.includes(skill)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">เลือกแล้ว: {selectedSkills.length} ทักษะ</p>
            </div>

            <button onClick={saveProfile} disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl text-sm transition-colors">
              {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึกโปรไฟล์'}
            </button>
          </>
        )}

        {activeTab === 'kyc' && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <h3 className="text-sm font-bold text-blue-800 mb-1">🪪 ยืนยันตัวตน (KYC)</h3>
              <p className="text-xs text-blue-600">เพื่อรับงานและโอนเงินได้ กรุณายืนยันตัวตนก่อน</p>
              <div className={`mt-2 inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium ${kycStatusInfo.bg} ${kycStatusInfo.color}`}>
                {kycStatusInfo.emoji} {kycStatusInfo.label}
              </div>
            </div>

            {(profile?.kyc_status === 'none' || profile?.kyc_status === 'rejected' || !profile?.kyc_status) && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-800 mb-3">🏦 บัญชีธนาคาร</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">ชื่อธนาคาร</label>
                      <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="เช่น กสิกรไทย, SCB, กรุงไทย"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">เลขบัญชี *</label>
                      <input type="text" value={bankAccount} onChange={e => setBankAccount(e.target.value)} placeholder="XXX-X-XXXXX-X"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                  </div>
                  <p className="text-xs text-orange-600 mt-2">🔒 ข้อมูลนี้เห็นได้เฉพาะ Admin เท่านั้น</p>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-800 mb-3">🪪 รูปบัตรประชาชน *</h3>
                  <div onClick={() => idCardRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${idCardUrl ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-blue-300'}`}>
                    {uploading === 'id_card' ? (
                      <div className="py-3"><div className="text-2xl animate-spin inline-block">⏳</div><p className="text-xs text-gray-500 mt-1">กำลังอัปโหลด...</p></div>
                    ) : idCardUrl ? (
                      <div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={idCardUrl} alt="ID Card" className="max-h-32 mx-auto rounded-lg object-cover mb-1" />
                        <p className="text-xs text-green-600">✅ อัปโหลดแล้ว — คลิกเพื่อเปลี่ยน</p>
                      </div>
                    ) : (
                      <div className="py-3"><div className="text-3xl mb-1">🪪</div><p className="text-sm text-gray-500">แตะเพื่ออัปโหลดบัตรประชาชน</p></div>
                    )}
                  </div>
                  <input ref={idCardRef} type="file" accept="image/*" className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) { const url = await uploadFile(f, 'id_card'); if (url) setIdCardUrl(url); }
                    }} />
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-800 mb-1">🤳 รูปถ่ายคู่บัตร (Selfie with ID) *</h3>
                  <p className="text-xs text-gray-400 mb-3">ถ่ายรูปตัวเองพร้อมถือบัตรประชาชนให้เห็นชัด</p>
                  <div onClick={() => selfieRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${selfieUrl ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-blue-300'}`}>
                    {uploading === 'selfie' ? (
                      <div className="py-3"><div className="text-2xl animate-spin inline-block">⏳</div><p className="text-xs text-gray-500 mt-1">กำลังอัปโหลด...</p></div>
                    ) : selfieUrl ? (
                      <div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={selfieUrl} alt="Selfie" className="max-h-32 mx-auto rounded-lg object-cover mb-1" />
                        <p className="text-xs text-green-600">✅ อัปโหลดแล้ว — คลิกเพื่อเปลี่ยน</p>
                      </div>
                    ) : (
                      <div className="py-3"><div className="text-3xl mb-1">🤳</div><p className="text-sm text-gray-500">แตะเพื่ออัปโหลดรูปถ่ายคู่บัตร</p></div>
                    )}
                  </div>
                  <input ref={selfieRef} type="file" accept="image/*" className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) { const url = await uploadFile(f, 'selfie'); if (url) setSelfieUrl(url); }
                    }} />
                </div>

                <button onClick={saveKYC} disabled={saving || !!uploading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                  {saving ? '⏳ กำลังส่ง...' : '📤 ส่งข้อมูล KYC เพื่อตรวจสอบ'}
                </button>
              </div>
            )}

            {profile?.kyc_status === 'pending' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 text-center">
                <div className="text-4xl mb-2">⏳</div>
                <p className="text-yellow-800 font-bold">รอ Admin ตรวจสอบ</p>
                <p className="text-yellow-600 text-sm mt-1">ปกติใช้เวลา 1-24 ชั่วโมง</p>
              </div>
            )}

            {!profile?.kyc_status && (
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                <p className="text-sm text-orange-700 font-medium mb-2">🪪 ยังไม่ได้ยืนยันตัวตน</p>
                <a
                  href="/profile/kyc"
                  className="block w-full text-center bg-orange-500 text-white py-2 rounded-xl text-sm font-semibold hover:bg-orange-600 transition"
                >
                  เริ่มยืนยันตัวตน (KYC)
                </a>
              </div>
            )}
            {profile?.kyc_status === 'approved' && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-green-800 font-bold">ยืนยันตัวตนสำเร็จแล้ว!</p>
                <p className="text-green-600 text-sm mt-1">คุณสามารถรับงานและรับเงินได้แล้ว</p>
                <button onClick={() => router.push('/dashboard')}
                  className="mt-3 bg-green-600 text-white text-sm px-5 py-2 rounded-xl font-medium">
                  ไปรับงานเลย →
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 z-50">
        <Link href="/" className="flex flex-col items-center text-gray-400 text-xs gap-0.5"><span>🏠</span>หน้าหลัก</Link>
        <Link href="/services" className="flex flex-col items-center text-gray-400 text-xs gap-0.5"><span>🔍</span>ค้นหา</Link>
        <Link href="/dashboard" className="flex flex-col items-center text-gray-400 text-xs gap-0.5"><span>📋</span>งานของฉัน</Link>
        <Link href="/profile" className="flex flex-col items-center text-blue-600 text-xs gap-0.5"><span>👤</span>โปรไฟล์</Link>
      </nav>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center"><div className="text-4xl animate-bounce mb-2">👤</div><p className="text-gray-500 text-sm">กำลังโหลด...</p></div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}

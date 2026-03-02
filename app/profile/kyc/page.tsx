'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function KYCPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');

  // Preview URLs
  const [idCardPreview, setIdCardPreview] = useState('');
  const [selfiePreview, setSelfiePreview] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('kyc_status, bank_name, bank_account_number, bank_account_name')
        .eq('id', user.id)
        .single();

      if (profile) {
        setKycStatus(profile.kyc_status || null);
        if (profile.bank_name) setBankName(profile.bank_name);
        if (profile.bank_account_number) setBankAccount(profile.bank_account_number);
        if (profile.bank_account_name) setBankAccountName(profile.bank_account_name);
      }
    } catch (_e) {
      setError('เกิดข้อผิดพลาด');
    }
    setLoading(false);
  }

  function handleIdCardChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('รูปถ่ายบัตรประชาชนใหญ่เกินไป (5 MB) กรุณาถ่ายใหม่');
        e.target.value = '';
        return;
      }
      setError('');
      setIdCardFile(file);
      setIdCardPreview(URL.createObjectURL(file));
    }
  }

  function handleSelfieChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('รูปเซลฟี่ใหญ่เกินไป (5 MB) กรุณาถ่ายใหม่');
        e.target.value = '';
        return;
      }
      setError('');
      setSelfieFile(file);
      setSelfiePreview(URL.createObjectURL(file));
    }
  }

  async function uploadFile(file: File, folder: string): Promise<string | null> {
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${folder}/${currentUser.id}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('kyc-documents')
        .upload(filePath, file, { upsert: true });
      if (upErr) return null;
      const { data } = supabase.storage.from('kyc-documents').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (_e) {
      return null;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) return;

    if (!idCardFile && !selfieFile && !bankAccount) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const updates: Record<string, any> = {
        kyc_status: 'pending',
        bank_name: bankName,
        bank_account_number: bankAccount,
        bank_account_name: bankAccountName,
      };

      if (idCardFile) {
        const url = await uploadFile(idCardFile, 'id-cards');
        if (url) updates.id_card_url = url;
      }

      if (selfieFile) {
        const url = await uploadFile(selfieFile, 'selfies');
        if (url) updates.selfie_with_id_url = url;
      }

      const { error: updateErr } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', currentUser.id);

      if (updateErr) {
        setError(updateErr.message);
      } else {
        setSuccessMsg('ส่งข้อมูล KYC เรียบร้อยแล้ว รอการตรวจสอบจาก Admin');
        setKycStatus('pending');
      }
    } catch (_e) {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    }

    setSubmitting(false);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-500">กำลังโหลด...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-600">
          ← กลับ
        </button>
        <h1 className="font-bold text-lg text-gray-800">ยืนยันตัวตน (KYC)</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Status Badge */}
        {kycStatus && (
          <div className={`rounded-2xl p-4 text-center ${
            kycStatus === 'approved' 
              ? 'bg-green-50 border border-green-200' 
              : kycStatus === 'pending'
              ? 'bg-yellow-50 border border-yellow-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="text-2xl mb-1">
              {kycStatus === 'approved' ? '✅' : kycStatus === 'pending' ? '⏳' : '❌'}
            </div>
            <p className="font-semibold text-gray-700">
              {kycStatus === 'approved' 
                ? 'ยืนยันตัวตนสำเร็จ!' 
                : kycStatus === 'pending'
                ? 'รอการตรวจสอบจาก Admin'
                : 'ไม่ผ่านการตรวจสอบ กรุณาส่งใหม่'}
            </p>
          </div>
        )}

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

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <h3 className="font-semibold text-blue-800 mb-2">📋 ข้อมูลที่ต้องการ</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>🪪 รูปถ่ายบัตรประชาชน</li>
            <li>🤳 รูปถ่ายเซลฟี่พร้อมบัตรประชาชน</li>
            <li>🏦 ข้อมูลบัญชีธนาคาร</li>
          </ul>
          <p className="text-xs text-blue-600 mt-2">
            ⚠️ ข้อมูลทั้งหมดจะถูกเก็บเป็นความลับ และเห็นได้เฉพาะ Admin เท่านั้น
          </p>
        </div>

        {/* KYC Form */}
        {kycStatus !== 'approved' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ID Card Upload */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <label className="block font-semibold text-gray-700 mb-3">
                🪪 รูปถ่ายบัตรประชาชน
              </label>
              <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2 mb-2">📸 กรุณา<strong>ถ่ายรูปสด</strong>เท่านั้น — ระบบจะเปิดกล้องโดยอัตโนมัติ</p>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleIdCardChange}
                className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {idCardPreview && (
                <div className="mt-3">
                  <img src={idCardPreview} alt="ID Card Preview" className="w-full max-h-48 object-cover rounded-xl" />
                </div>
              )}
            </div>

            {/* Selfie Upload */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <label className="block font-semibold text-gray-700 mb-3">
                🤳 รูปเซลฟี่พร้อมบัตรประชาชน
              </label>
              <p className="text-xs text-gray-500 mb-1">ถ่ายรูปตัวเองพร้อมถือบัตรประชาชนให้เห็นชัดเจน</p>
              <p className="text-xs text-purple-600 bg-purple-50 rounded-lg px-3 py-2 mb-2">🤳 กรุณา<strong>ถ่ายเซลฟี่สด</strong>เท่านั้น — ใช้กล้องหน้าอัตโนมัติ</p>
              <input
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleSelfieChange}
                className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
              {selfiePreview && (
                <div className="mt-3">
                  <img src={selfiePreview} alt="Selfie Preview" className="w-full max-h-48 object-cover rounded-xl" />
                </div>
              )}
            </div>

            {/* Bank Details */}
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
              <h3 className="font-semibold text-gray-700">🏦 ข้อมูลบัญชีธนาคาร</h3>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">ธนาคาร</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  required
                >
                  <option value="">-- เลือกธนาคาร --</option>
                  <option value="กสิกรไทย">กสิกรไทย (KBANK)</option>
                  <option value="ไทยพาณิชย์">ไทยพาณิชย์ (SCB)</option>
                  <option value="กรุงไทย">กรุงไทย (KTB)</option>
                  <option value="กรุงเทพ">กรุงเทพ (BBL)</option>
                  <option value="ออมสิน">ออมสิน (GSB)</option>
                  <option value="ธ.ก.ส.">ธ.ก.ส. (BAAC)</option>
                  <option value="ทหารไทย">ทหารไทย (TTB)</option>
                  <option value="อาคารสงเคราะห์">อาคารสงเคราะห์ (GH Bank)</option>
                  <option value="ยูโอบี">ยูโอบี (UOB)</option>
                  <option value="อื่นๆ">อื่นๆ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">ชื่อบัญชี</label>
                <input
                  type="text"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  placeholder="ชื่อ-นามสกุล ตามบัญชีธนาคาร"
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">เลขบัญชี</label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value.replace(/D/g, '').slice(0, 15))}
                  placeholder="xxxxxxxxxx"
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {submitting ? '⏳ กำลังส่งข้อมูล...' : '📤 ส่งข้อมูลยืนยันตัวตน'}
            </button>

            <p className="text-xs text-center text-gray-400">
              ข้อมูลของคุณจะถูกเก็บเป็นความลับอย่างเคร่งครัด
            </p>
          </form>
        )}

        {kycStatus === 'approved' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <p className="font-bold text-gray-800 mb-2">ยืนยันตัวตนสำเร็จแล้ว!</p>
            <p className="text-sm text-gray-600 mb-4">บัญชีของคุณได้รับตราสัญลักษณ์ ✅ ยืนยันแล้ว</p>
            <Link
              href="/profile"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
            >
              ดูโปรไฟล์
            </Link>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 px-4 z-50">
        <Link href="/dashboard" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-blue-600 text-xs">
          <span className="text-lg">🏠</span>หน้าหลัก
        </Link>
        <Link href="/jobs/new" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-blue-600 text-xs">
          <span className="text-lg">💼</span>งาน
        </Link>
        <Link href="/services" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-blue-600 text-xs">
          <span className="text-lg">🔧</span>บริการ
        </Link>
        <Link href="/coupons" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-blue-600 text-xs">
          <span className="text-lg">🧧</span>คูปอง
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-0.5 text-blue-600 text-xs">
          <span className="text-lg">👤</span>โปรไฟล์
        </Link>
      </nav>
    </div>
  );
}

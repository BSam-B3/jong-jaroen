'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function KYCPhoneAndInfoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState<number>(1);

  // -- Step 1: OTP States --
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // -- Step 2: Personal Info & Images --
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [address, setAddress] = useState('');
  const [idImage, setIdImage] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => setCountdown(c => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  async function loadUserData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setCurrentUser(user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('kyc_status, phone_verified, full_name, national_id')
        .eq('id', user.id).single();

      if (profile) {
        setKycStatus(profile.kyc_status || 'none');
        if (profile.full_name) setFullName(profile.full_name);
        if (profile.national_id) setIdNumber(profile.national_id);
        
        if (profile.phone_verified && (profile.kyc_status === 'none' || profile.kyc_status === 'rejected')) {
          setStep(2);
        }
      }
    } catch (_e) {}
    setLoading(false);
  }

  // --- Image Handlers ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIdImage(file);
      setIdPreview(URL.createObjectURL(file));
    }
  };

  // --- OTP Handlers (Simulated) ---
  const handleSendOTP = async () => {
    if (phone.length < 9) { setError('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง'); return; }
    setError('');
    setIsSendingOtp(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setOtpSent(true);
    setCountdown(60);
    setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    setIsSendingOtp(false);
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString !== '000000') { setError('รหัส OTP ไม่ถูกต้อง (ใช้ 000000 เพื่อทดสอบ)'); return; }
    setIsVerifying(true);
    setStep(2);
    setIsVerifying(false);
  };

  // --- Submit Data & Upload to Storage ---
  const handleSubmitData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (idNumber.length !== 13) { setError('กรุณากรอกเลขประจำตัวประชาชนให้ครบ 13 หลัก'); return; }
    if (!idImage) { setError('กรุณาอัปโหลดรูปภาพบัตรประชาชน'); return; }
    if (!pdpaConsent) { setError('กรุณากดยอมรับเงื่อนไข'); return; }

    setIsSubmitting(true);
    setError('');

    try {
      // 1. Upload รูปไปที่ Storage (ถัง kyc_documents)
      const fileExt = idImage.name.split('.').pop();
      const fileName = `${currentUser.id}/id_card_${Date.now()}.${fileExt}`;
      const { error: uploadErr, data: uploadData } = await supabase.storage
        .from('kyc_documents')
        .upload(fileName, idImage);

      if (uploadErr) throw uploadErr;

      // 2. Update ตาราง Profiles (ใช้ชื่อคอลัมน์ที่ตรงกับ SQL)
      const updates = {
        kyc_status: 'pending',
        full_name: fullName,
        national_id: idNumber, // เปลี่ยนจาก id_card_number เป็น national_id
        id_card_url: uploadData.path, // เก็บ path ของรูป
        pdpa_consented_at: new Date().toISOString(),
        phone_verified: true,
      };

      const { error: updateErr } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', currentUser.id);

      if (updateErr) throw updateErr;
      setKycStatus('pending');
    } catch (err: any) {
      setError('เกิดข้อผิดพลาด: ' + (err.message || 'กรุณาลองอีกครั้ง'));
    }
    setIsSubmitting(false);
  };

  // -- Render Screens --
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">กำลังโหลด...</div>;

  if (kycStatus === 'approved' || kycStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
         <div className="text-6xl mb-4">{kycStatus === 'approved' ? '✅' : '⏳'}</div>
         <h1 className="text-2xl font-black mb-2">{kycStatus === 'approved' ? 'อนุมัติเรียบร้อย!' : 'รอการตรวจสอบ'}</h1>
         <button onClick={() => router.push('/profile')} className="mt-4 bg-[#EE4D2D] text-white px-8 py-3 rounded-full font-bold">กลับหน้าโปรไฟล์</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pb-24">
      <div className="w-full sm:max-w-2xl bg-white min-h-screen flex flex-col shadow-xl">
        <div className="p-5 border-b sticky top-0 bg-white z-50">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-xl">←</button>
            <h1 className="font-black text-xl">ยืนยันตัวตน (Step {step}/2)</h1>
          </div>
        </div>

        <div className="p-6">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm font-bold">{error}</div>}

          {step === 1 ? (
            <div className="space-y-6">
              <h2 className="text-center font-bold">ยืนยันเบอร์โทรศัพท์</h2>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="เบอร์โทรศัพท์" className="w-full p-4 border rounded-xl font-bold" />
              <button onClick={handleSendOTP} className="w-full bg-[#EE4D2D] text-white py-4 rounded-full font-black">รับรหัส OTP</button>
              {otpSent && (
                <div className="mt-4 space-y-4">
                   <div className="flex justify-center gap-2">
                     {otp.map((d, i) => (
                       <input key={i} ref={el => {otpInputRefs.current[i] = el}} type="tel" maxLength={1} value={d} onChange={e => {
                         const newOtp = [...otp]; newOtp[i] = e.target.value.slice(-1); setOtp(newOtp);
                         if (e.target.value && i < 5) otpInputRefs.current[i+1]?.focus();
                       }} className="w-10 h-12 border text-center text-xl font-bold rounded-lg" />
                     ))}
                   </div>
                   <button onClick={handleVerifyOTP} className="w-full bg-gray-800 text-white py-4 rounded-full font-black">ยืนยันรหัส</button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmitData} className="space-y-6">
              <div>
                <label className="block text-xs font-bold mb-1">ชื่อ-นามสกุลจริง</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full p-3 border rounded-xl" required />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">เลขบัตรประชาชน 13 หลัก</label>
                <input type="text" value={idNumber} onChange={e => setIdNumber(e.target.value.replace(/\D/g,'').slice(0,13))} className="w-full p-3 border rounded-xl font-mono tracking-widest" required />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">รูปถ่ายบัตรประชาชน</label>
                <div className="border-2 border-dashed rounded-xl p-4 text-center relative">
                   <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                   {idPreview ? <img src={idPreview} className="max-h-40 mx-auto" /> : <p className="text-gray-400">คลิกเพื่ออัปโหลดรูปบัตร</p>}
                </div>
              </div>
              <div className="flex items-start gap-2 bg-orange-50 p-3 rounded-xl">
                <input type="checkbox" checked={pdpaConsent} onChange={e => setPdpaConsent(e.target.checked)} className="mt-1" />
                <label className="text-[10px] text-gray-600">ยินยอมให้เก็บข้อมูลส่วนบุคคลเพื่อการยืนยันตัวตน</label>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-[#EE4D2D] text-white py-4 rounded-full font-black">
                {isSubmitting ? 'กำลังส่งข้อมูล...' : 'ส่งข้อมูลยืนยันตัวตน'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

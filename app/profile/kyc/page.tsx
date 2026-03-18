'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function KYCPhoneAndInfoPage() {
  const router = useRouter();
  
  // ── States พื้นฐาน ──
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState<number>(1); // 1: OTP, 2: Personal Info

  // ── Step 1: OTP States ──
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Step 2: Personal Info States ──
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [address, setAddress] = useState('');
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  // ระบบนับถอยหลังปุ่มส่ง OTP
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
        .select('kyc_status, phone_verified, full_name, id_card_number, address')
        .eq('id', user.id).single();
      
      if (profile) {
        setKycStatus(profile.kyc_status || 'none');
        if (profile.full_name) setFullName(profile.full_name);
        if (profile.id_card_number) setIdNumber(profile.id_card_number);
        if (profile.address) setAddress(profile.address);
        
        // ถ้าเคยยืนยันเบอร์แล้ว ให้ข้ามไป Step 2 (กรอกประวัติ) ได้เลย
        if (profile.phone_verified && profile.kyc_status === 'none') {
          setStep(2);
        }
      }
    } catch (_e) {}
    setLoading(false);
  }

  // ────────────────────────────────────────────────────────
  // ฟังก์ชัน Step 1: ยืนยันเบอร์โทรศัพท์ (OTP)
  // ────────────────────────────────────────────────────────

  const handleSendOTP = async () => {
    if (phone.length < 9) {
      setError('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง');
      return;
    }
    setError('');
    setIsSendingOtp(true);

    try {
      // 🚧 จำลองการส่ง OTP (รอเชื่อม Edge Function ของ C)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setOtpSent(true);
      setCountdown(60); 
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError('ไม่สามารถส่งรหัส OTP ได้ กรุณาลองใหม่');
    }
    setIsSendingOtp(false);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('กรุณากรอกรหัส OTP ให้ครบ 6 หลัก');
      return;
    }
    setError('');
    setIsVerifying(true);

    try {
      // 💡 Dev Mode: พิมพ์ 000000 เพื่อผ่านเข้าระบบ (สำหรับทดสอบ)
      if (otpString === '000000') {
        await new Promise(resolve => setTimeout(resolve, 800));
        setStep(2);
        setIsVerifying(false);
        return;
      }

      // 🚧 รอเชื่อมต่อ RPC verify_phone_otp ของ C
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'รหัส OTP ไม่ถูกต้อง หรือหมดอายุแล้ว');
      setOtp(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    }
    setIsVerifying(false);
  };

  // ────────────────────────────────────────────────────────
  // ฟังก์ชัน Step 2: ข้อมูลประจำตัว (Personal Info)
  // ────────────────────────────────────────────────────────

  const handleSubmitData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (idNumber.length !== 13) {
      setError('กรุณากรอกเลขประจำตัวประชาชนให้ครบ 13 หลัก');
      return;
    }
    if (!pdpaConsent) {
      setError('กรุณากดยอมรับเงื่อนไขเพื่อดำเนินการต่อ');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const updates = {
        kyc_status: 'pending', // ส่งให้ Admin ตรวจสอบ หรืออาจจะให้ approved เลยก็ได้ถ้าระบบ Auto
        full_name: fullName,
        id_card_number: idNumber,
        address: address,
        pdpa_consented_at: new Date().toISOString(),
        phone_verified: true, 
      };

      const { error: updateErr } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', currentUser.id);

      if (updateErr) throw updateErr;

      setKycStatus('pending');
    } catch (_err) {
      setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองอีกครั้ง');
    }
    setIsSubmitting(false);
  };

  // ── Render Loading & Status Screens ──
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-[#EE4D2D] text-center"><div className="text-4xl animate-bounce mb-2">🛡️</div><p className="font-bold">กำลังตรวจสอบสถานะ...</p></div>
    </div>
  );

  if (kycStatus === 'approved' || kycStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className={`w-full max-w-md rounded-[2rem] p-8 text-center shadow-xl border ${kycStatus === 'approved' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
          <div className="text-6xl mb-4">{kycStatus === 'approved' ? '✅' : '⏳'}</div>
          <h1 className="font-black text-2xl text-gray-800 mb-2">
            {kycStatus === 'approved' ? 'ยืนยันตัวตนสำเร็จ!' : 'โปรไฟล์อยู่ระหว่างการตรวจสอบ'}
          </h1>
          <p className="text-gray-600 mb-6 font-medium leading-relaxed">
            {kycStatus === 'approved' 
              ? 'ข้อมูลของคุณได้รับการยืนยันเรียบร้อยแล้วค่ะ' 
              : 'ข้อมูลของคุณกำลังรอการตรวจสอบจากส่วนกลาง (ใช้เวลาไม่เกิน 24 ชม.)'}
          </p>

          <button onClick={() => router.push('/profile')} className="w-full bg-[#EE4D2D] text-white py-4 rounded-full font-bold text-lg shadow-md hover:bg-[#D74022] active:scale-95 transition-all">
            กลับสู่หน้าโปรไฟล์
          </button>
        </div>
      </div>
    );
  }

  // ── Render Main Wizard ──
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pb-24">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-white min-h-screen relative flex flex-col shadow-xl overflow-hidden">
        
        {/* Header แบบ Wizard */}
        <div className="bg-white p-5 pt-10 sticky top-0 z-50 border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => { step > 1 ? setStep(step - 1) : router.back() }} className="text-gray-500 font-bold text-xl active:scale-90 transition-transform">←</button>
            <h1 className="font-black text-xl text-gray-800 tracking-tight">ยืนยันตัวตน</h1>
            <span className="ml-auto text-sm font-bold text-[#EE4D2D] bg-orange-50 px-3 py-1 rounded-full border border-orange-100">ขั้นตอน {step}/2</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden flex">
            <div className="bg-[#EE4D2D] h-full transition-all duration-500" style={{ width: `${(step / 2) * 100}%` }}></div>
          </div>
        </div>

        <div className="p-5 flex-1 relative flex flex-col">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs font-bold mb-4 flex items-start gap-2 shadow-sm animate-fade-in">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* ────────────────────────────────────────────────────────
              STEP 1: ยืนยันเบอร์โทรศัพท์ด้วย OTP
          ──────────────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="flex flex-col h-full animate-fade-in">
              <div className="mb-6 text-center">
                <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-3 border border-orange-100">📱</div>
                <h2 className="text-xl font-black text-[#EE4D2D] mb-1">1. ยืนยันเบอร์โทรศัพท์</h2>
                <p className="text-xs text-gray-500 font-medium leading-relaxed px-4">เพื่อความปลอดภัย เราจำเป็นต้องยืนยันตัวบุคคลผ่านหมายเลขโทรศัพท์ (OTP)</p>
              </div>

              {!otpSent ? (
                <div className="flex-1 flex flex-col mt-4">
                  <div className="bg-white border border-gray-200 rounded-[1.5rem] p-6 shadow-sm">
                    <label className="text-[11px] font-bold text-gray-500 mb-1.5 block ml-1">หมายเลขโทรศัพท์มือถือ</label>
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#EE4D2D] focus-within:ring-1 focus-within:ring-[#EE4D2D]/50 transition-all">
                      <div className="px-4 py-3.5 bg-gray-100 border-r border-gray-200 text-sm font-bold text-gray-600">+66</div>
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="08X XXX XXXX"
                        className="w-full bg-transparent px-4 py-3.5 text-base font-bold text-gray-800 outline-none tracking-wider"
                      />
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleSendOTP} 
                    disabled={isSendingOtp || phone.length < 9}
                    className="mt-6 w-full bg-[#EE4D2D] text-white py-4 rounded-full font-black text-base shadow-lg hover:bg-[#D74022] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSendingOtp ? '⏳ กำลังส่งรหัส...' : '✉️ รับรหัส OTP'}
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col mt-2">
                  <div className="bg-white border border-gray-200 rounded-[1.5rem] p-6 text-center shadow-sm">
                    <p className="text-xs font-bold text-gray-600 mb-2">รหัส 6 หลักถูกส่งไปยังหมายเลข</p>
                    <p className="text-lg font-black text-[#EE4D2D] mb-6 tracking-widest">+66 {phone.substring(0,2)}-XXX-{phone.substring(6)}</p>
                    
                    <div className="flex justify-center gap-2 sm:gap-3 mb-6">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => { otpInputRefs.current[idx] = el; }}
                          type="tel"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className="w-12 h-14 sm:w-14 sm:h-16 bg-gray-50 border border-gray-200 rounded-xl text-center text-2xl font-black text-gray-800 outline-none focus:border-[#EE4D2D] focus:bg-white focus:ring-2 focus:ring-[#EE4D2D]/20 transition-all shadow-inner"
                        />
                      ))}
                    </div>

                    <div className="text-[11px] font-bold text-gray-500">
                      {countdown > 0 ? (
                        <span>ส่งรหัสใหม่ได้ใน <strong className="text-[#EE4D2D]">{countdown}</strong> วินาที</span>
                      ) : (
                        <button onClick={handleSendOTP} className="text-[#EE4D2D] underline underline-offset-2 hover:text-[#D74022]">ส่งรหัส OTP อีกครั้ง</button>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={handleVerifyOTP} 
                    disabled={isVerifying || otp.join('').length !== 6}
                    className="mt-6 w-full bg-[#EE4D2D] text-white py-4 rounded-full font-black text-base shadow-lg hover:bg-[#D74022] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isVerifying ? '⏳ กำลังตรวจสอบ...' : 'ยืนยันรหัส OTP'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ────────────────────────────────────────────────────────
              STEP 2: ข้อมูลประจำตัว (Personal Info)
          ──────────────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="flex flex-col h-full animate-fade-in overflow-y-auto pb-6">
              <div className="mb-6 text-center">
                <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-3 border border-orange-100">👤</div>
                <h2 className="text-xl font-black text-[#EE4D2D] mb-1">2. ข้อมูลประจำตัว</h2>
                <p className="text-xs text-gray-500 font-medium px-4">สร้างโปรไฟล์อย่างเป็นทางการ เพื่อความน่าเชื่อถือในชุมชนจงเจริญ</p>
              </div>

              <form onSubmit={handleSubmitData} className="space-y-5">
                
                <div className="bg-white p-6 rounded-[1.5rem] border border-gray-200 shadow-sm space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1.5 ml-1">ชื่อ-นามสกุลจริง <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={fullName} 
                      onChange={e => setFullName(e.target.value)} 
                      placeholder="เช่น สมชาย รักประแส"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-sm font-bold text-gray-800 outline-none focus:border-[#EE4D2D] focus:bg-white focus:ring-1 focus:ring-[#EE4D2D]/50 transition-all" 
                      required 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1.5 ml-1">เลขประจำตัวประชาชน 13 หลัก <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={idNumber} 
                      onChange={e => setIdNumber(e.target.value.replace(/\D/g,'').slice(0, 13))} 
                      placeholder="ไม่ต้องเติมขีด (-) ปลอดภัย 100%"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-base font-bold text-gray-800 outline-none focus:border-[#EE4D2D] focus:bg-white focus:ring-1 focus:ring-[#EE4D2D]/50 transition-all tracking-widest font-mono" 
                      required 
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1.5 ml-1">ที่อยู่ปัจจุบัน <span className="text-red-500">*</span></label>
                    <textarea 
                      value={address} 
                      onChange={e => setAddress(e.target.value)} 
                      placeholder="บ้านเลขที่, หมู่, ตำบล, อำเภอ, จังหวัด..."
                      rows={3}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-sm font-medium text-gray-800 outline-none focus:border-[#EE4D2D] focus:bg-white focus:ring-1 focus:ring-[#EE4D2D]/50 transition-all" 
                      required 
                    />
                  </div>
                </div>

                {/* กล่องยินยอม PDPA ปรับข้อความใหม่ */}
                <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100 flex items-start gap-3 shadow-sm">
                  <input 
                    type="checkbox" 
                    id="pdpa" 
                    checked={pdpaConsent}
                    onChange={(e) => setPdpaConsent(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-orange-300 text-[#EE4D2D] focus:ring-[#EE4D2D]"
                  />
                  <label htmlFor="pdpa" className="text-[10px] text-gray-700 leading-relaxed cursor-pointer font-medium">
                    ข้าพเจ้ายินยอมให้แอปพลิเคชัน "จงเจริญ" เก็บรวบรวมข้อมูลส่วนบุคคลพื้นฐาน เพื่อวัตถุประสงค์ในการสร้างโปรไฟล์อ้างอิงความน่าเชื่อถือ <br/>
                    <span className="text-gray-500 block mt-1">ข้อมูลของคุณจะถูกเข้ารหัสความปลอดภัยและไม่เปิดเผยเลขบัตรประชาชนต่อสาธารณะ</span>
                  </label>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting || !pdpaConsent}
                  className="w-full bg-[#EE4D2D] text-white py-4 rounded-full font-black text-lg shadow-lg hover:bg-[#D74022] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  {isSubmitting ? '⏳ กำลังสร้างโปรไฟล์...' : '✅ ยืนยันข้อมูลและเริ่มใช้งาน'}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

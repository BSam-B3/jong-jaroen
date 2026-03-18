'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function KYCPhoneAndBankPage() {
  const router = useRouter();
  
  // ── States พื้นฐาน ──
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState<number>(1); // 1: OTP, 2: Bank & PDPA

  // ── Step 1: OTP States ──
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Step 2: Bank & PDPA States ──
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
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
        .select('kyc_status, phone_verified, bank_name, bank_account_number, bank_account_name')
        .eq('id', user.id).single();
      
      if (profile) {
        setKycStatus(profile.kyc_status || 'none');
        if (profile.bank_name) setBankName(profile.bank_name);
        if (profile.bank_account_number) setBankAccount(profile.bank_account_number);
        if (profile.bank_account_name) setBankAccountName(profile.bank_account_name);
        
        // ถ้าเคยยืนยันเบอร์แล้ว ให้ข้ามไป Step 2 ได้เลย (ถ้ายังไม่ approved)
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
      // 🚧 จุดเชื่อมต่อระบบของ C: เรียก Edge Function เพื่อสร้าง OTP
      // const { error } = await supabase.functions.invoke('create_phone_otp', { body: { phone } });
      // if (error) throw error;
      
      // จำลองการโหลด
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setOtpSent(true);
      setCountdown(60); // นับถอยหลัง 60 วินาที
      // Auto focus ช่องแรก
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError('ไม่สามารถส่งรหัส OTP ได้ กรุณาลองใหม่');
    }
    setIsSendingOtp(false);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1); // เอาแค่ตัวล่าสุด
    setOtp(newOtp);

    // พิมพ์เสร็จ เลื่อนไปช่องถัดไปอัตโนมัติ
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // กดลบแล้วช่องว่าง ให้ถอยไปช่องก่อนหน้า
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
      // 💡 Dev Mode Bypass: ใส่ 000000 เพื่อข้ามไปดู UI Step 2 (สำหรับตอนพัฒนา)
      if (otpString === '000000') {
        await new Promise(resolve => setTimeout(resolve, 800));
        setStep(2);
        setIsVerifying(false);
        return;
      }

      // 🚧 จุดเชื่อมต่อระบบของ C: เรียก RPC เพื่อตรวจสอบ OTP
      /*
      const { data, error } = await supabase.rpc('verify_phone_otp', {
        p_user_id: currentUser.id,
        p_phone: phone,
        p_otp_plain: otpString
      });
      if (error || !data) throw new Error('OTP ไม่ถูกต้อง');
      */
      
      // ถ้า API ตรวจสอบผ่าน
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'รหัส OTP ไม่ถูกต้อง หรือหมดอายุแล้ว');
      setOtp(['', '', '', '', '', '']); // เคลียร์ช่องให้กรอกใหม่
      otpInputRefs.current[0]?.focus();
    }
    setIsVerifying(false);
  };

  // ────────────────────────────────────────────────────────
  // ฟังก์ชัน Step 2: ผูกบัญชีและส่งยืนยัน
  // ────────────────────────────────────────────────────────

  const handleSubmitData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!pdpaConsent) {
      setError('กรุณากดยอมรับเงื่อนไขนโยบายความเป็นส่วนตัว (PDPA)');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const updates = {
        kyc_status: 'pending', // RLS ของ C จะล็อกข้อมูลทันทีที่ค่านี้ถูกเซ็ต
        bank_name: bankName,
        bank_account_number: bankAccount,
        bank_account_name: bankAccountName,
        pdpa_consented_at: new Date().toISOString(),
        phone_verified: true, // Mark ว่าเบอร์นี้ยืนยันแล้ว
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
      <div className="text-[#EE4D2D] text-center"><div className="text-4xl animate-bounce mb-2">🛡️</div><p className="font-bold">กำลังตรวจสอบความปลอดภัย...</p></div>
    </div>
  );

  // หน้าจอตอนรออนุมัติ หรือ อนุมัติแล้ว
  if (kycStatus === 'approved' || kycStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className={`w-full max-w-md rounded-[2rem] p-8 text-center shadow-xl border ${kycStatus === 'approved' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
          <div className="text-6xl mb-4">{kycStatus === 'approved' ? '✅' : '⏳'}</div>
          <h1 className="font-black text-2xl text-gray-800 mb-2">
            {kycStatus === 'approved' ? 'ยืนยันตัวตนสำเร็จ!' : 'บัญชีอยู่ระหว่างการตรวจสอบ'}
          </h1>
          <p className="text-gray-600 mb-6 font-medium leading-relaxed">
            {kycStatus === 'approved' 
              ? 'คุณสามารถใช้งานระบบรับเงินและเบิกจ่ายได้เต็มรูปแบบแล้วค่ะ' 
              : 'ข้อมูลของคุณถูกล็อกเพื่อความปลอดภัย และกำลังรอการอนุมัติจาก Admin (ไม่เกิน 24 ชม.)'}
          </p>
          
          <div className="bg-white p-4 rounded-xl border border-gray-100 mb-6 text-left shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-widest">ข้อมูลบัญชีรับเงินของคุณ (ถูกล็อก)</p>
            <p className="text-sm font-bold text-gray-800">{bankName}</p>
            <p className="text-sm font-medium text-gray-600 font-mono tracking-wider">{bankAccount}</p>
            <p className="text-xs text-gray-500 mt-1">ชื่อบัญชี: {bankAccountName}</p>
          </div>

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
            <h1 className="font-black text-xl text-gray-800 tracking-tight">ยืนยันตัวตน (KYC)</h1>
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
                <p className="text-xs text-gray-500 font-medium leading-relaxed px-4">เพื่อความปลอดภัยของบัญชี เราจำเป็นต้องยืนยันตัวตนของคุณผ่านรหัส OTP</p>
              </div>

              {!otpSent ? (
                // ฟอร์มกรอกเบอร์โทร
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
                // ฟอร์มกรอก OTP 6 หลัก
                <div className="flex-1 flex flex-col mt-2">
                  <div className="bg-white border border-gray-200 rounded-[1.5rem] p-6 text-center shadow-sm">
                    <p className="text-xs font-bold text-gray-600 mb-2">รหัส 6 หลักถูกส่งไปยังหมายเลข</p>
                    <p className="text-lg font-black text-[#EE4D2D] mb-6 tracking-widest">+66 {phone.substring(0,2)}-XXX-{phone.substring(6)}</p>
                    
                    {/* กล่องใส่รหัส 6 ช่อง */}
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
              STEP 2: ผูกบัญชีธนาคาร + ยอมรับเงื่อนไข (PDPA)
          ──────────────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="flex flex-col h-full animate-fade-in overflow-y-auto pb-6">
              <div className="mb-6 text-center">
                <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-3 border border-orange-100">🏦</div>
                <h2 className="text-xl font-black text-[#EE4D2D] mb-1">2. ผูกบัญชีรับเงิน</h2>
                <p className="text-xs text-gray-500 font-medium px-4">เพื่อป้องกันมิจฉาชีพ ชื่อบัญชีธนาคารจะต้องตรงกับชื่อโปรไฟล์ของคุณเท่านั้น</p>
              </div>

              <form onSubmit={handleSubmitData} className="space-y-5">
                
                {/* ฟอร์มบัญชีธนาคาร */}
                <div className="bg-white p-6 rounded-[1.5rem] border border-gray-200 shadow-sm space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1.5 ml-1">ธนาคาร <span className="text-red-500">*</span></label>
                    <select 
                      value={bankName} 
                      onChange={e => setBankName(e.target.value)} 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-sm font-medium text-gray-800 outline-none focus:border-[#EE4D2D] focus:bg-white focus:ring-1 focus:ring-[#EE4D2D]/50 transition-all appearance-none" 
                      required
                    >
                      <option value="">-- เลือกธนาคาร --</option>
                      <option value="กสิกรไทย (KBANK)">กสิกรไทย (KBANK)</option>
                      <option value="ไทยพาณิชย์ (SCB)">ไทยพาณิชย์ (SCB)</option>
                      <option value="กรุงเทพ (BBL)">กรุงเทพ (BBL)</option>
                      <option value="กรุงไทย (KTB)">กรุงไทย (KTB)</option>
                      <option value="กรุงศรีอยุธยา (BAY)">กรุงศรีอยุธยา (BAY)</option>
                      <option value="ออมสิน (GSB)">ออมสิน (GSB)</option>
                      <option value="พร้อมเพย์ (PromptPay)">พร้อมเพย์ (PromptPay)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1.5 ml-1 flex justify-between">
                      <span>ชื่อบัญชี (ภาษาไทย หรือ อังกฤษ) <span className="text-red-500">*</span></span>
                    </label>
                    <input 
                      type="text" 
                      value={bankAccountName} 
                      onChange={e => setBankAccountName(e.target.value)} 
                      placeholder="เช่น นาย สมชาย รักประแส"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-sm font-bold text-gray-800 outline-none focus:border-[#EE4D2D] focus:bg-white focus:ring-1 focus:ring-[#EE4D2D]/50 transition-all" 
                      required 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1.5 ml-1">เลขบัญชี / เบอร์พร้อมเพย์ <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={bankAccount} 
                      onChange={e => setBankAccount(e.target.value.replace(/\D/g,'').slice(0, 15))} 
                      placeholder="ตัวเลขเท่านั้น ไม่ต้องใส่ขีด (-)"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-base font-bold text-gray-800 outline-none focus:border-[#EE4D2D] focus:bg-white focus:ring-1 focus:ring-[#EE4D2D]/50 transition-all tracking-widest font-mono" 
                      required 
                    />
                  </div>
                </div>

                {/* กล่องยินยอม PDPA */}
                <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100 flex items-start gap-3 shadow-sm">
                  <input 
                    type="checkbox" 
                    id="pdpa" 
                    checked={pdpaConsent}
                    onChange={(e) => setPdpaConsent(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-orange-300 text-[#EE4D2D] focus:ring-[#EE4D2D]"
                  />
                  <label htmlFor="pdpa" className="text-[10px] text-gray-700 leading-relaxed cursor-pointer font-medium">
                    ข้าพเจ้ายินยอมให้แพลตฟอร์ม "จงเจริญ" เก็บรวบรวมและใช้ข้อมูลเบอร์โทรศัพท์และบัญชีธนาคาร เพื่อวัตถุประสงค์ในการยืนยันตัวตนและการเบิกจ่ายเงิน (PDPA) <br/>
                    <span className="text-red-500 font-bold block mt-1">⚠️ เมื่อส่งข้อมูลแล้ว ระบบจะทำการล็อก (Freeze) ข้อมูลบัญชีธนาคารเพื่อความปลอดภัย หากต้องการแก้ไขในภายหลังต้องติดต่อ Admin เท่านั้น</span>
                  </label>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting || !pdpaConsent}
                  className="w-full bg-[#EE4D2D] text-white py-4 rounded-full font-black text-lg shadow-lg hover:bg-[#D74022] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  {isSubmitting ? '⏳ กำลังบันทึกข้อมูล...' : '📤 ผูกบัญชีและส่งยืนยัน'}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

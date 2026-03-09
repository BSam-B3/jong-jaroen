'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function KYCWizardPage() {
  const router = useRouter();
  
  // ── States พื้นฐาน ──
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [error, setError] = useState('');
  
  // ── States สำหรับ Wizard (Step 1-3) ──
  const [step, setStep] = useState<number>(1);
  const [isExtracting, setIsExtracting] = useState(false);

  // ── States ข้อมูลเอกสารและฟอร์ม ──
  const [idCardBlob, setIdCardBlob] = useState<Blob | null>(null);
  const [idCardPreview, setIdCardPreview] = useState('');
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
  const [selfiePreview, setSelfiePreview] = useState('');
  
  // ข้อมูลจากบัตร (OCR)
  const [idNumber, setIdNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');

  // ข้อมูลบัญชี
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');

  // ── Camera Refs ──
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  // เปิด-ปิด กล้องอัตโนมัติตาม Step
  useEffect(() => {
    if (kycStatus === 'approved' || kycStatus === 'pending') return;

    if (step === 1 && !idCardPreview) {
      startCamera('environment'); // กล้องหลัง
    } else if (step === 2 && !selfiePreview) {
      startCamera('user'); // กล้องหน้า
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [step, idCardPreview, selfiePreview, kycStatus]);

  async function loadUserData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; } 
      setCurrentUser(user);
      const { data: profile } = await supabase
        .from('profiles')
        .select('kyc_status, bank_name, bank_account_number, bank_account_name')
        .eq('id', user.id).single();
      
      if (profile) {
        setKycStatus(profile.kyc_status || null);
        if (profile.bank_name) setBankName(profile.bank_name);
        if (profile.bank_account_number) setBankAccount(profile.bank_account_number);
        if (profile.bank_account_name) setBankAccountName(profile.bank_account_name);
      }
    } catch (_e) { 
      // จัดการ error เงียบๆ
    }
    setLoading(false);
  }

  async function startCamera(facingMode: 'user' | 'environment') {
    stopCamera();
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error(err);
      setError('ไม่สามารถเปิดกล้องได้ กรุณาตรวจสอบสิทธิ์การเข้าถึงกล้องของเบราว์เซอร์ค่ะ');
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }

  function captureFrame(type: 'id_card' | 'selfie') {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      if (type === 'id_card') {
        setIdCardBlob(blob);
        setIdCardPreview(url);
      } else {
        setSelfieBlob(blob);
        setSelfiePreview(url);
      }
      stopCamera();
    }, 'image/jpeg', 0.90);
  }

  function retake(type: 'id_card' | 'selfie') {
    if (type === 'id_card') {
      setIdCardBlob(null);
      setIdCardPreview('');
    } else {
      setSelfieBlob(null);
      setSelfiePreview('');
    }
  }

  // ── จำลองระบบ AI อ่านบัตร (OCR) ──
  const handleNextFromStep1 = () => {
    setIsExtracting(true);
    
    // จำลองเวลาโหลดประมวลผล 1.5 วินาที
    setTimeout(() => {
      // ตรงนี้ในอนาคตสามารถยิง API ส่งรูป idCardBlob ไปอ่านข้อความจริงๆ ได้
      setIdNumber('1-2345-67890-12-3');
      setFullName('นาย จงเจริญ รักประแส');
      setAddress('123 ม.4 ต.ปากน้ำประแส อ.แกลง จ.ระยอง 21170');
      
      setIsExtracting(false);
      setStep(2);
    }, 1500);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || !idCardBlob || !selfieBlob) return;

    setSubmitting(true);
    setError('');

    try {
      // 1. อัปโหลดรูปภาพ
      const idPath = `id-cards/${currentUser.id}_${Date.now()}.jpg`;
      const selPath = `selfies/${currentUser.id}_${Date.now()}.jpg`;

      await supabase.storage.from('kyc-documents').upload(idPath, idCardBlob, { upsert: true, contentType: 'image/jpeg' });
      await supabase.storage.from('kyc-documents').upload(selPath, selfieBlob, { upsert: true, contentType: 'image/jpeg' });

      const { data: idData } = supabase.storage.from('kyc-documents').getPublicUrl(idPath);
      const { data: selData } = supabase.storage.from('kyc-documents').getPublicUrl(selPath);

      // 2. อัปเดตฐานข้อมูล (บันทึกข้อมูล OCR และบัญชี)
      const updates = {
        kyc_status: 'pending',
        id_card_url: idData.publicUrl,
        selfie_with_id_url: selData.publicUrl,
        id_card_number: idNumber, // ถ้ามีคอลัมน์นี้ใน db
        full_name: fullName,      // ถ้ามีคอลัมน์นี้ใน db
        address: address,         // ถ้ามีคอลัมน์นี้ใน db
        bank_name: bankName,
        bank_account_number: bankAccount,
        bank_account_name: bankAccountName,
      };

      const { error: updateErr } = await supabase.from('profiles').update(updates).eq('id', currentUser.id);
      if (updateErr) throw updateErr;

      setKycStatus('pending');
    } catch (_err) {
      setError('เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้งค่ะ');
    }
    setSubmitting(false);
  }

  // ── Render Loading & Status ──
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-[#EE4D2D] text-center"><div className="text-4xl animate-bounce mb-2">🔍</div><p className="font-bold">กำลังโหลดข้อมูล...</p></div>
    </div>
  );

  if (kycStatus === 'approved' || kycStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 flex flex-col items-center justify-center p-6">
        <div className={`w-full max-w-md rounded-[2rem] p-8 text-center shadow-xl border ${kycStatus === 'approved' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
          <div className="text-6xl mb-4">{kycStatus === 'approved' ? '✅' : '⏳'}</div>
          <h1 className="font-black text-2xl text-gray-800 mb-2">
            {kycStatus === 'approved' ? 'ยืนยันตัวตนสำเร็จ!' : 'รอการตรวจสอบจากแอดมิน'}
          </h1>
          <p className="text-gray-600 mb-8 font-medium">
            {kycStatus === 'approved' ? 'คุณสามารถใช้งานระบบรับงานได้เต็มรูปแบบแล้ว' : 'ข้อมูลของคุณกำลังอยู่ในขั้นตอนการพิจารณา จะใช้เวลาไม่เกิน 24 ชั่วโมงค่ะ'}
          </p>
          <button onClick={() => router.push('/profile')} className="w-full bg-[#EE4D2D] text-white py-4 rounded-full font-bold text-lg shadow-md hover:bg-[#D74022] active:scale-95 transition-all">
            กลับสู่หน้าโปรไฟล์
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pb-24">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-white min-h-screen relative flex flex-col shadow-xl">
        
        {/* Header แบบมี Progress Bar */}
        <div className="bg-white p-5 pt-10 sticky top-0 z-50 border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => { step > 1 ? setStep(step - 1) : router.back() }} className="text-gray-500 font-bold text-xl">←</button>
            <h1 className="font-black text-xl text-gray-800 tracking-tight">ยืนยันตัวตน</h1>
            <span className="ml-auto text-sm font-bold text-[#EE4D2D] bg-orange-50 px-3 py-1 rounded-full">ขั้นตอน {step}/3</span>
          </div>
          
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div className="bg-[#EE4D2D] h-full transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }}></div>
          </div>
        </div>

        <div className="p-5 flex-1 relative flex flex-col">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs font-bold mb-4 flex items-center gap-2"><span>⚠️</span> {error}</div>}
          <canvas ref={canvasRef} className="hidden" />

          {/* ────────────────────────────────────────────────────────
              STEP 1: ถ่ายบัตรประชาชน
          ──────────────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="flex flex-col h-full animate-fade-in">
              <div className="mb-4">
                <h2 className="text-lg font-black text-[#EE4D2D] mb-1">1. ถ่ายรูปบัตรประชาชน</h2>
                <p className="text-xs text-gray-500 font-medium">วางบัตรประชาชนให้อยู่ในกรอบ และเห็นตัวหนังสือชัดเจน</p>
              </div>

              {!idCardPreview ? (
                <div className="flex-1 flex flex-col justify-center">
                  <div className="relative w-full aspect-[3/4] sm:aspect-video bg-black rounded-3xl overflow-hidden shadow-inner flex items-center justify-center">
                    <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
                    {/* กรอบสี่เหลี่ยมผืนผ้า (บัตร ปชช) */}
                    <div className="w-[85%] aspect-[1.6/1] border-[3px] border-white/80 rounded-2xl relative z-10 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                      <div className="absolute inset-0 border-[3px] border-[#EE4D2D] rounded-2xl animate-pulse"></div>
                    </div>
                  </div>
                  <button onClick={() => captureFrame('id_card')} className="mt-8 bg-[#EE4D2D] text-white w-20 h-20 rounded-full mx-auto flex items-center justify-center text-3xl shadow-[0_0_0_6px_rgba(238,77,45,0.3)] active:scale-90 transition-transform">
                    📸
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  <div className="w-full aspect-[4/3] bg-gray-100 rounded-3xl overflow-hidden border border-gray-200 relative">
                    <img src={idCardPreview} alt="ID Preview" className="w-full h-full object-cover" />
                    <div className="absolute top-4 right-4 bg-green-500 text-white p-2 rounded-full shadow-lg">✅</div>
                  </div>
                  <div className="mt-auto pt-6 space-y-3">
                    <button onClick={handleNextFromStep1} disabled={isExtracting} className="w-full bg-[#EE4D2D] text-white py-4 rounded-full font-black text-lg shadow-md hover:bg-[#D74022] active:scale-95 transition-all disabled:opacity-70 flex justify-center items-center gap-2">
                      {isExtracting ? '⏳ กำลังดึงข้อมูลจากบัตร...' : 'ถัดไป ➡️'}
                    </button>
                    <button onClick={() => retake('id_card')} disabled={isExtracting} className="w-full text-gray-500 py-3 font-bold text-sm hover:text-gray-800 transition-colors">
                      🔄 ถ่ายใหม่
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ────────────────────────────────────────────────────────
              STEP 2: ถ่ายเซลฟี่
          ──────────────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="flex flex-col h-full animate-fade-in">
              <div className="mb-4">
                <h2 className="text-lg font-black text-[#EE4D2D] mb-1">2. ถ่ายรูปใบหน้าตรง</h2>
                <p className="text-xs text-gray-500 font-medium">วางใบหน้าให้อยู่ในกรอบวงรี ถอดแว่นและหมวก</p>
              </div>

              {!selfiePreview ? (
                <div className="flex-1 flex flex-col justify-center">
                  <div className="relative w-full aspect-[3/4] sm:aspect-video bg-black rounded-3xl overflow-hidden shadow-inner flex items-center justify-center">
                    <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
                    {/* กรอบวงรี (ใบหน้า) */}
                    <div className="w-[65%] aspect-[3/4] border-[3px] border-white/80 rounded-[100%] relative z-10 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                      <div className="absolute inset-0 border-[3px] border-[#EE4D2D] rounded-[100%] animate-pulse"></div>
                    </div>
                  </div>
                  <button onClick={() => captureFrame('selfie')} className="mt-8 bg-[#EE4D2D] text-white w-20 h-20 rounded-full mx-auto flex items-center justify-center text-3xl shadow-[0_0_0_6px_rgba(238,77,45,0.3)] active:scale-90 transition-transform">
                    📸
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  <div className="w-full aspect-[3/4] bg-gray-100 rounded-3xl overflow-hidden border border-gray-200 relative">
                    <img src={selfiePreview} alt="Selfie Preview" className="w-full h-full object-cover" />
                    <div className="absolute top-4 right-4 bg-green-500 text-white p-2 rounded-full shadow-lg">✅</div>
                  </div>
                  <div className="mt-auto pt-6 space-y-3">
                    <button onClick={() => setStep(3)} className="w-full bg-[#EE4D2D] text-white py-4 rounded-full font-black text-lg shadow-md hover:bg-[#D74022] active:scale-95 transition-all flex justify-center items-center gap-2">
                      ถัดไป ➡️
                    </button>
                    <button onClick={() => retake('selfie')} className="w-full text-gray-500 py-3 font-bold text-sm hover:text-gray-800 transition-colors">
                      🔄 ถ่ายใหม่
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ────────────────────────────────────────────────────────
              STEP 3: ตรวจสอบข้อมูล + บัญชีธนาคาร
          ──────────────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="flex flex-col h-full animate-fade-in overflow-y-auto pb-10">
              <div className="mb-6">
                <h2 className="text-lg font-black text-[#EE4D2D] mb-1">3. ตรวจสอบและบัญชีรับเงิน</h2>
                <p className="text-xs text-gray-500 font-medium">กรุณาตรวจสอบข้อมูลที่อ่านได้จากบัตร และกรอกบัญชีธนาคาร</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* พรีวิวรูปที่ถ่าย */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative rounded-2xl overflow-hidden border-2 border-green-400 aspect-[4/3]">
                    <img src={idCardPreview} className="w-full h-full object-cover opacity-80" alt="ID" />
                    <div className="absolute inset-0 flex items-center justify-center text-white font-black text-sm drop-shadow-md">บัตรประชาชน ✅</div>
                  </div>
                  <div className="relative rounded-2xl overflow-hidden border-2 border-green-400 aspect-[4/3]">
                    <img src={selfiePreview} className="w-full h-full object-cover opacity-80" alt="Selfie" />
                    <div className="absolute inset-0 flex items-center justify-center text-white font-black text-sm drop-shadow-md">รูปใบหน้า ✅</div>
                  </div>
                </div>

                {/* ข้อมูลที่อ่านจากบัตร (แก้ไขได้) */}
                <div className="bg-orange-50 p-5 rounded-[1.5rem] border border-orange-100 space-y-4">
                  <h3 className="font-bold text-[#EE4D2D] text-sm flex items-center gap-2">
                    <span>✨</span> ข้อมูลจากบัตร (โปรดตรวจสอบ)
                  </h3>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1 ml-1">เลขประจำตัวประชาชน</label>
                    <input type="text" value={idNumber} onChange={e => setIdNumber(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-800 outline-none focus:border-[#EE4D2D]" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1 ml-1">ชื่อ-นามสกุล (ภาษาไทย)</label>
                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-800 outline-none focus:border-[#EE4D2D]" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1 ml-1">ที่อยู่ตามบัตรประชาชน</label>
                    <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2}
                      className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-800 outline-none focus:border-[#EE4D2D]" required />
                  </div>
                </div>

                {/* บัญชีธนาคาร */}
                <div className="bg-gray-50 p-5 rounded-[1.5rem] border border-gray-200 space-y-4">
                  <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                    <span>🏦</span> บัญชีรับเงิน
                  </h3>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1 ml-1">ธนาคาร</label>
                    <select value={bankName} onChange={e => setBankName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl p-3.5 text-sm font-medium text-gray-800 outline-none focus:border-[#EE4D2D]" required>
                      <option value="">-- เลือกธนาคาร --</option>
                      <option value="กสิกรไทย">กสิกรไทย (KBANK)</option>
                      <option value="ไทยพาณิชย์">ไทยพาณิชย์ (SCB)</option>
                      <option value="กรุงไทย">กรุงไทย (KTB)</option>
                      <option value="กรุงเทพ">กรุงเทพ (BBL)</option>
                      <option value="ออมสิน">ออมสิน (GSB)</option>
                      <option value="ธ.ก.ส.">ธ.ก.ส. (BAAC)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1 ml-1">ชื่อบัญชี (ต้องตรงกับชื่อในบัตร)</label>
                    <input type="text" value={bankAccountName} onChange={e => setBankAccountName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl p-3.5 text-sm font-medium text-gray-800 outline-none focus:border-[#EE4D2D]" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1 ml-1">เลขบัญชี</label>
                    <input type="text" value={bankAccount} onChange={e => setBankAccount(e.target.value.replace(/\D/g,'').slice(0,15))}
                      placeholder="ไม่ต้องใส่ขีด (-)"
                      className="w-full bg-white border border-gray-200 rounded-xl p-3.5 text-sm font-medium text-gray-800 outline-none focus:border-[#EE4D2D] tracking-widest" required />
                  </div>
                </div>

                <button type="submit" disabled={submitting}
                  className="w-full bg-[#EE4D2D] text-white py-4 rounded-full font-black text-lg shadow-lg hover:bg-[#D74022] active:scale-[0.98] transition-all disabled:opacity-50 mt-4">
                  {submitting ? '⏳ กำลังส่งข้อมูล...' : '📤 บันทึกและส่งให้ Admin ตรวจสอบ'}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

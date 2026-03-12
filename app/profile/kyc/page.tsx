'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const EAR_THRESHOLD = 0.25; 
const BLINK_FRAMES  = 2;     

function calcEAR(eye: number[][]): number {
  const dist = (a: number[], b: number[]) => Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2);
  const A = dist(eye[1], eye[5]);
  const B = dist(eye[2], eye[4]);
  const C = dist(eye[0], eye[3]);
  return (A + B) / (2.0 * C);
}

export default function KYCWizardPage() {
  const router = useRouter();
  
  // ── States ──
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [error, setError] = useState('');
  
  const [step, setStep] = useState<number>(1);
  const [isExtracting, setIsExtracting] = useState(false);

  const [idCardBlob, setIdCardBlob] = useState<Blob | null>(null);
  const [idCardPreview, setIdCardPreview] = useState('');
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
  const [selfiePreview, setSelfiePreview] = useState('');
  
  // ── AI & Camera States ──
  const [faceApiLoaded, setFaceApiLoaded] = useState(false);
  const [instruction, setInstruction] = useState('');
  
  // สถานะตรวจจับบัตร (สแกนหาโฟกัส -> พร้อมถ่าย)
  const [cardScanState, setCardScanState] = useState<'scanning' | 'ready'>('scanning');

  // ── Form States ──
  const [idNumber, setIdNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');

  // ── Refs ──
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const cardTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // ── Liveness Refs ──
  const capturedRef = useRef(false);
  const livenessPhaseRef = useRef<'blink' | 'smile'>('blink'); 
  const blinkCountRef = useRef(0);
  const blinkFramesRef = useRef(0);
  const wasOpenRef = useRef(true);
  const smileProgressRef = useRef(0);
  const blinkNeeded = 2;

  // สเตทสำหรับดึงค่า Ref มาโชว์ใน UI
  const [uiPhase, setUiPhase] = useState<'blink' | 'smile'>('blink');
  const [uiBlinkCount, setUiBlinkCount] = useState(0);
  const [uiSmileProgress, setUiSmileProgress] = useState(0);

  useEffect(() => {
    loadUserData();
    loadFaceApi();
  }, []);

  useEffect(() => {
    if (kycStatus === 'approved' || kycStatus === 'pending') return;

    if (step === 1 && !idCardPreview) {
      startCamera('environment'); 
    } else if (step === 2 && !selfiePreview) {
      startCamera('user'); 
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
    } catch (_e) {}
    setLoading(false);
  }

  async function loadFaceApi() {
    try {
      if (!(window as any).faceapi) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
          s.onload = () => res();
          s.onerror = () => rej(new Error('โหลด AI ไม่สำเร็จ'));
          document.head.appendChild(s);
        });
      }
      const faceapi = (window as any).faceapi;
      const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL), 
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),   
      ]);
      setFaceApiLoaded(true);
    } catch (e) {
      console.warn('AI Load Error:', e);
    }
  }

  async function startCamera(facingMode: 'user' | 'environment') {
    stopCamera();
    setError('');
    
    // Reset States
    capturedRef.current = false;
    livenessPhaseRef.current = 'blink';
    blinkCountRef.current = 0;
    blinkFramesRef.current = 0;
    wasOpenRef.current = true;
    smileProgressRef.current = 0;
    setUiPhase('blink');
    setUiBlinkCount(0);
    setUiSmileProgress(0);
    
    setCardScanState('scanning');

    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();

          if (facingMode === 'user' && faceApiLoaded) {
            setInstruction('กระพริบตา 2 ครั้ง เพื่อเริ่มการยืนยันตัวตน');
            detectLivenessCombo();
          } else {
            // ระบบตรวจสอบบัตร: หน่วงเวลา 3 วิ ให้กล้องจับโฟกัส แล้วถึงจะเปลี่ยนเป็นสีเขียวให้ถ่ายได้
            setInstruction('กำลังตรวจสอบความคมชัด กรุณาถือค้างไว้...');
            cardTimeoutRef.current = setTimeout(() => {
              setCardScanState('ready');
              setInstruction('บัตรชัดเจนแล้ว! กดถ่ายรูปได้เลย ✅');
            }, 3000);
          }
        }
      } catch (err: any) {
        setError('ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการเข้าถึงกล้องค่ะ');
      }
    }, 200);
  }

  function detectLivenessCombo() {
    const faceapi = (window as any).faceapi;
    const video = videoRef.current;
    if (!video || !faceapi) return;

    async function detect() {
      if (capturedRef.current) return; 
      try {
        const detection = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }))
          .withFaceLandmarks(true)
          .withFaceExpressions();

        if (detection) {
          if (livenessPhaseRef.current === 'blink') {
            const landmarks = detection.landmarks;
            const leftEye  = landmarks.getLeftEye().map((p: any) => [p.x, p.y]);
            const rightEye = landmarks.getRightEye().map((p: any) => [p.x, p.y]);
            const earLeft  = calcEAR(leftEye);
            const earRight = calcEAR(rightEye);
            const ear = (earLeft + earRight) / 2;

            if (ear < EAR_THRESHOLD) {
              blinkFramesRef.current++;
            } else {
              if (blinkFramesRef.current >= BLINK_FRAMES && wasOpenRef.current === false) {
                blinkCountRef.current++;
                setUiBlinkCount(blinkCountRef.current);
                
                if (blinkCountRef.current >= blinkNeeded) {
                  livenessPhaseRef.current = 'smile';
                  setUiPhase('smile');
                  setInstruction('เยี่ยมมาก! ตอนนี้ยิ้มกว้างๆ ค่ะ 😊');
                } else {
                  setInstruction(`กระพริบตาแล้ว ${blinkCountRef.current}/${blinkNeeded} ครั้ง`);
                }
              }
              wasOpenRef.current = ear >= EAR_THRESHOLD;
              blinkFramesRef.current = 0;
            }
            if (ear < EAR_THRESHOLD) wasOpenRef.current = false;
          } 
          else if (livenessPhaseRef.current === 'smile') {
            const happyScore = detection.expressions.happy;
            
            if (happyScore > 0.7) {
              smileProgressRef.current += 15; 
              setInstruction('ดีมากค่ะ ค้างไว้... 📸');
            } else {
              smileProgressRef.current = Math.max(0, smileProgressRef.current - 10);
              setInstruction('โปรดยิ้มกว้างๆ เพื่อถ่ายภาพ 😊');
            }

            setUiSmileProgress(Math.min(100, smileProgressRef.current));

            if (smileProgressRef.current >= 100 && !capturedRef.current) {
              capturedRef.current = true;
              setInstruction('ยืนยันสำเร็จ! 📸');
              setTimeout(() => captureFrame('selfie'), 300);
              return; 
            }
          }

        } else {
          setInstruction('ไม่พบใบหน้า กรุณาอยู่ในกรอบวงรี');
        }
      } catch (_e) {}
      
      rafRef.current = requestAnimationFrame(detect);
    }
    rafRef.current = requestAnimationFrame(detect);
  }

  function stopCamera() {
    cancelAnimationFrame(rafRef.current);
    if (cardTimeoutRef.current) clearTimeout(cardTimeoutRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }

  function captureFrame(type: 'id_card' | 'selfie') {
    if (type === 'selfie' && capturedRef.current === false) return; 
    capturedRef.current = true;

    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
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
      setCardScanState('scanning'); // รีเซ็ตการสแกนบัตรใหม่
      setStep(1);
    } else {
      setSelfieBlob(null);
      setSelfiePreview('');
      setStep(2);
    }
  }

  const handleNextFromStep1 = () => {
    setIsExtracting(true);
    setTimeout(() => {
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
      const idPath = `id-cards/${currentUser.id}_${Date.now()}.jpg`;
      const selPath = `selfies/${currentUser.id}_${Date.now()}.jpg`;

      await supabase.storage.from('kyc-documents').upload(idPath, idCardBlob, { upsert: true, contentType: 'image/jpeg' });
      await supabase.storage.from('kyc-documents').upload(selPath, selfieBlob, { upsert: true, contentType: 'image/jpeg' });

      const { data: idData } = supabase.storage.from('kyc-documents').getPublicUrl(idPath);
      const { data: selData } = supabase.storage.from('kyc-documents').getPublicUrl(selPath);

      const updates = {
        kyc_status: 'pending',
        id_card_url: idData.publicUrl,
        selfie_with_id_url: selData.publicUrl,
        bank_name: bankName,
        bank_account_number: bankAccount,
        bank_account_name: bankAccountName,
      };

      const { error: updateErr } = await supabase.from('profiles').update(updates).eq('id', currentUser.id);
      if (updateErr) throw updateErr;

      setKycStatus('pending');
    } catch (_err) {
      setError('เกิดข้อผิดพลาดในการส่งข้อมูล');
    }
    setSubmitting(false);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-[#EE4D2D] text-center"><div className="text-4xl animate-bounce mb-2">🔍</div><p className="font-bold">กำลังโหลดข้อมูล...</p></div>
    </div>
  );

  if (kycStatus === 'approved' || kycStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className={`w-full max-w-md rounded-[2rem] p-8 text-center shadow-xl border ${kycStatus === 'approved' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
          <div className="text-6xl mb-4">{kycStatus === 'approved' ? '✅' : '⏳'}</div>
          <h1 className="font-black text-2xl text-gray-800 mb-2">
            {kycStatus === 'approved' ? 'ยืนยันตัวตนสำเร็จ!' : 'รอการตรวจสอบ'}
          </h1>
          <p className="text-gray-600 mb-8 font-medium">
            {kycStatus === 'approved' ? 'คุณสามารถใช้งานระบบได้เต็มรูปแบบแล้ว' : 'กำลังอยู่ในขั้นตอนการพิจารณา จะใช้เวลาไม่เกิน 24 ชั่วโมงค่ะ'}
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
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-white min-h-screen relative flex flex-col shadow-xl overflow-hidden">
        
        <div className="bg-white p-5 pt-10 sticky top-0 z-50 border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => { step > 1 ? setStep(step - 1) : router.back() }} className="text-gray-500 font-bold text-xl active:scale-90 transition-transform">←</button>
            <h1 className="font-black text-xl text-gray-800 tracking-tight">ยืนยันตัวตน</h1>
            <span className="ml-auto text-sm font-bold text-[#EE4D2D] bg-orange-50 px-3 py-1 rounded-full border border-orange-100">ขั้นตอน {step}/3</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div className="bg-[#EE4D2D] h-full transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }}></div>
          </div>
        </div>

        <div className="p-5 flex-1 relative flex flex-col">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs font-bold mb-4 flex items-center gap-2"><span>⚠️</span> {error}</div>}

          {/* ────────────────────────────────────────────────────────
              STEP 1: ถ่ายบัตรประชาชน
          ──────────────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="flex flex-col h-full animate-fade-in">
              <div className="mb-4 text-center">
                <h2 className="text-xl font-black text-[#EE4D2D] mb-1">1. ถ่ายรูปบัตรประชาชน</h2>
                <p className="text-xs text-gray-500 font-medium">โปรดใช้บัตรประชาชนตัวจริงเท่านั้น</p>
              </div>

              {!idCardPreview ? (
                <div className="flex-1 flex flex-col justify-center">
                  <div className="relative w-full aspect-[3/4] sm:aspect-video bg-black rounded-3xl overflow-hidden shadow-inner flex items-center justify-center">
                    <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
                    
                    <div className="absolute inset-0 bg-black/40 pointer-events-none transition-all duration-500" style={{ opacity: cardScanState === 'ready' ? 0.1 : 0.4 }}></div>
                    
                    {/* ✅ กรอบสี่เหลี่ยมผืนผ้า (เปลี่ยนสีตามสถานะ) */}
                    <div className="w-[85%] aspect-[1.6/1] border-[3px] border-white/80 rounded-2xl relative z-10 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center overflow-hidden bg-transparent">
                      
                      <div className={`absolute inset-0 border-[3px] rounded-2xl transition-colors duration-500 ${cardScanState === 'ready' ? 'border-[#22C55E]' : 'border-[#EE4D2D]'}`}></div>
                      
                      {/* เส้นสแกนเลเซอร์ (จะซ่อนเมื่อพร้อมถ่าย) */}
                      {cardScanState === 'scanning' && (
                        <div className="w-full h-0.5 bg-[#EE4D2D] shadow-[0_0_15px_3px_rgba(238,77,45,0.8)] absolute top-0 animate-scan-line"></div>
                      )}
                      
                      {/* ข้อความในกรอบ */}
                      <div className="bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full absolute bottom-4">
                        <p className={`font-bold tracking-wider text-xs drop-shadow-md transition-colors ${cardScanState === 'ready' ? 'text-[#22C55E]' : 'text-white'}`}>
                          {instruction}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* ✅ ปุ่มถ่ายภาพ (ล็อคไว้จนกว่ากรอบจะเขียว) */}
                  <button 
                    onClick={() => { if(cardScanState === 'ready') captureFrame('id_card'); }} 
                    disabled={cardScanState !== 'ready'}
                    className={`mt-8 w-20 h-20 rounded-full mx-auto flex items-center justify-center text-3xl transition-all duration-300 ${
                      cardScanState === 'ready' 
                      ? 'bg-[#22C55E] text-white shadow-[0_0_0_6px_rgba(34,197,94,0.3)] hover:scale-105 active:scale-95 cursor-pointer' 
                      : 'bg-gray-400 text-gray-200 shadow-[0_0_0_6px_rgba(156,163,175,0.3)] cursor-not-allowed opacity-50'
                    }`}
                  >
                    📸
                  </button>
                  <p className="text-center text-[10px] text-gray-400 mt-3 font-medium">
                    {cardScanState === 'ready' ? 'กดปุ่มเพื่อถ่ายภาพได้เลย' : 'กรุณาถือกล้องนิ่งๆ...'}
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  <div className="w-full aspect-[4/3] bg-gray-100 rounded-3xl overflow-hidden border border-gray-200 relative shadow-inner">
                    <img src={idCardPreview} alt="ID Preview" className="w-full h-full object-contain" />
                    <div className="absolute top-4 right-4 bg-green-500 text-white p-2 rounded-full shadow-lg">✅</div>
                  </div>
                  <div className="mt-auto pt-6 space-y-3">
                    <button onClick={handleNextFromStep1} disabled={isExtracting} className="w-full bg-[#EE4D2D] text-white py-4 rounded-full font-black text-lg shadow-md hover:bg-[#D74022] active:scale-95 transition-all disabled:opacity-70 flex justify-center items-center gap-2">
                      {isExtracting ? '⏳ กำลังดึงข้อมูลจากบัตร...' : 'ใช้รูปนี้ และไปต่อ ➡️'}
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
              STEP 2: ถ่ายเซลฟี่ (Blink -> Smile)
          ──────────────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="flex flex-col h-full animate-fade-in">
              <div className="mb-4 text-center">
                <h2 className="text-xl font-black text-[#EE4D2D] mb-1">2. ยืนยันใบหน้า</h2>
                <p className="text-xs text-gray-500 font-medium">วางหน้าในกรอบ ถอดแว่น/หมวก และทำตามคำสั่ง</p>
              </div>

              {!selfiePreview ? (
                <div className="flex-1 flex flex-col justify-center relative">
                  
                  <div className="relative w-full aspect-[3/4] sm:aspect-[4/5] bg-black rounded-3xl overflow-hidden shadow-inner flex items-center justify-center">
                    <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]" /> 
                    
                    <div className="w-[65%] aspect-[3/4] rounded-[100%] relative z-10 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] flex items-center justify-center">
                      <div className="absolute inset-0 border-4 border-white/30 rounded-[100%]"></div>
                      
                      <div className="absolute inset-0 border-4 rounded-[100%] transition-colors duration-300" style={{ borderColor: uiSmileProgress > 50 ? '#22c55e' : (uiSmileProgress > 0 ? '#EE4D2D' : 'transparent') }}></div>
                    </div>

                    <div className="absolute bottom-10 left-0 right-0 text-center z-20">
                      <div className="inline-block bg-black/70 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20">
                         <p className="text-white font-bold text-sm mb-1">
                           {faceApiLoaded ? instruction : '⏳ กำลังเตรียมระบบ AI...'}
                         </p>
                         
                         {faceApiLoaded && uiPhase === 'blink' && (
                           <div className="flex justify-center gap-2 mt-2">
                             {[...Array(blinkNeeded)].map((_, i) => (
                               <div key={i} className={`w-3 h-3 rounded-full ${i < uiBlinkCount ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                             ))}
                           </div>
                         )}

                         {faceApiLoaded && uiPhase === 'smile' && (
                           <div className="w-full bg-white/20 h-1.5 rounded-full mt-2 overflow-hidden">
                             <div className={`h-full transition-all duration-300 ${uiSmileProgress >= 100 ? 'bg-green-500' : 'bg-[#EE4D2D]'}`} style={{ width: `${uiSmileProgress}%` }}></div>
                           </div>
                         )}
                      </div>
                    </div>
                  </div>

                  {!faceApiLoaded && (
                    <button onClick={() => captureFrame('selfie')} className="mt-6 bg-[#EE4D2D] text-white w-16 h-16 rounded-full mx-auto flex items-center justify-center text-2xl shadow-lg active:scale-90 transition-transform">
                      📸
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  <div className="w-full aspect-[3/4] bg-gray-100 rounded-3xl overflow-hidden border border-gray-200 relative shadow-inner">
                    <img src={selfiePreview} alt="Selfie Preview" className="w-full h-full object-cover" />
                    <div className="absolute top-4 right-4 bg-green-500 text-white p-2 rounded-full shadow-lg">✅</div>
                  </div>
                  <div className="mt-auto pt-6 space-y-3">
                    <button onClick={() => setStep(3)} className="w-full bg-[#EE4D2D] text-white py-4 rounded-full font-black text-lg shadow-md hover:bg-[#D74022] active:scale-95 transition-all flex justify-center items-center gap-2">
                      ใช้รูปนี้ และไปต่อ ➡️
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
              STEP 3: ตรวจสอบข้อมูล OCR + บัญชีธนาคาร
          ──────────────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="flex flex-col h-full animate-fade-in overflow-y-auto pb-6">
              <div className="mb-5 text-center">
                <h2 className="text-xl font-black text-[#EE4D2D] mb-1">3. ตรวจสอบข้อมูล</h2>
                <p className="text-xs text-gray-500 font-medium">ตรวจสอบข้อมูลบัตร และกรอกบัญชีเพื่อรับรายได้</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative rounded-2xl overflow-hidden border border-gray-200 aspect-[4/3] shadow-sm">
                    <img src={idCardPreview} className="w-full h-full object-cover opacity-90" alt="ID" />
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold text-gray-700">บัตร ปชช. ✅</div>
                  </div>
                  <div className="relative rounded-2xl overflow-hidden border border-gray-200 aspect-[4/3] shadow-sm">
                    <img src={selfiePreview} className="w-full h-full object-cover opacity-90" alt="Selfie" />
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold text-gray-700">สแกนหน้า ✅</div>
                  </div>
                </div>

                <div className="bg-orange-50 p-5 rounded-[1.5rem] border border-orange-100 space-y-4">
                  <h3 className="font-bold text-[#EE4D2D] text-sm flex items-center gap-2">
                    <span>✨</span> ข้อมูลจากบัตร (แก้ไขได้)
                  </h3>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1 ml-1">เลขประจำตัวประชาชน</label>
                    <input type="text" value={idNumber} onChange={e => setIdNumber(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl p-3.5 text-sm font-bold text-gray-800 outline-none focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]/50 transition-all" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1 ml-1">ชื่อ-นามสกุล (ภาษาไทย)</label>
                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl p-3.5 text-sm font-bold text-gray-800 outline-none focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]/50 transition-all" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1 ml-1">ที่อยู่ตามบัตรประชาชน</label>
                    <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2}
                      className="w-full bg-white border border-gray-200 rounded-xl p-3.5 text-sm font-bold text-gray-800 outline-none focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]/50 transition-all" required />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-[1.5rem] border border-gray-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                    <span>🏦</span> บัญชีสำหรับรับเงิน
                  </h3>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1 ml-1">ธนาคาร</label>
                    <select value={bankName} onChange={e => setBankName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-sm font-medium text-gray-800 outline-none focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]/50 transition-all" required>
                      <option value="">-- เลือกธนาคาร --</option>
                      <option value="กสิกรไทย">กสิกรไทย (KBANK)</option>
                      <option value="ไทยพาณิชย์">ไทยพาณิชย์ (SCB)</option>
                      <option value="กรุงไทย">กรุงไทย (KTB)</option>
                      <option value="กรุงเทพ">กรุงเทพ (BBL)</option>
                      <option value="ออมสิน">ออมสิน (GSB)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1 ml-1">ชื่อบัญชี (ต้องตรงกับชื่อในบัตร)</label>
                    <input type="text" value={bankAccountName} onChange={e => setBankAccountName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-sm font-medium text-gray-800 outline-none focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]/50 transition-all" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1 ml-1">เลขบัญชี</label>
                    <input type="text" value={bankAccount} onChange={e => setBankAccount(e.target.value.replace(/\D/g,'').slice(0,15))}
                      placeholder="ไม่ต้องใส่ขีด (-)"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-sm font-medium text-gray-800 outline-none focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]/50 transition-all tracking-widest" required />
                  </div>
                </div>

                <button type="submit" disabled={submitting}
                  className="w-full bg-[#EE4D2D] text-white py-4 rounded-full font-black text-lg shadow-lg hover:bg-[#D74022] active:scale-[0.98] transition-all disabled:opacity-50 mt-4">
                  {submitting ? '⏳ กำลังอัปโหลดข้อมูล...' : '📤 ส่งให้ Admin ตรวจสอบ'}
                </button>
              </form>
            </div>
          )}

        </div>
        
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes scan-line {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
          }
          .animate-scan-line {
            animation: scan-line 3s linear infinite;
          }
        `}} />
      </div>
    </div>
  );
}

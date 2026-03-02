'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// ── ค่า EAR threshold สำหรับตรวจกระพริบตา ────────────
const EAR_THRESHOLD = 0.25; // ต่ำกว่านี้ = ตาหลับ
const BLINK_FRAMES  = 2;     // ต้องหลับ >= 2 เฟรมติดกัน

type CameraStep = 'id_card' | 'selfie';
type StepStatus = 'waiting' | 'scanning' | 'blinking' | 'captured' | 'done';

// คำนวณ EAR (Eye Aspect Ratio) จาก 6 landmark points
function calcEAR(eye: number[][]): number {
  const dist = (a: number[], b: number[]) =>
    Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2);
  const A = dist(eye[1], eye[5]);
  const B = dist(eye[2], eye[4]);
  const C = dist(eye[0], eye[3]);
  return (A + B) / (2.0 * C);
}

export default function KYCPage() {
  const router = useRouter();
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [kycStatus, setKycStatus]     = useState<string | null>(null);
  const [error, setError]   = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Bank form
  const [bankName, setBankName]             = useState('');
  const [bankAccount, setBankAccount]       = useState('');
  const [bankAccountName, setBankAccountName] = useState('');

  // Camera state
  const [cameraStep, setCameraStep]   = useState<CameraStep>('id_card');
  const [stepStatus, setStepStatus]   = useState<StepStatus>('waiting');
  const [idCardBlob, setIdCardBlob]   = useState<Blob | null>(null);
  const [selfieBlob, setSelfieBlob]   = useState<Blob | null>(null);
  const [idCardPreview, setIdCardPreview] = useState('');
  const [selfiePreview, setSelfiePreview] = useState('');
  const [faceApiLoaded, setFaceApiLoaded] = useState(false);
  const [cameraActive, setCameraActive]   = useState(false);
  const [instruction, setInstruction] = useState('');
  const [blinkCount, setBlinkCount]   = useState(0);
  const [blinkNeeded] = useState(2); // ต้องกระพริบ 2 ครั้ง

  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const rafRef     = useRef<number>(0);
  const blinkFrames = useRef(0);
  const wasOpen     = useRef(true);
  const blinkCountRef = useRef(0);
  const capturedRef   = useRef(false);

  useEffect(() => {
    loadUserData();
    loadFaceApi();
    return () => stopCamera();
  }, []);

  async function loadUserData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }
      setCurrentUser(user);
      const { data: profile } = await supabase
        .from('profiles')
        .select('kyc_status,bank_name,bank_account_number,bank_account_name')
        .eq('id', user.id).single();
      if (profile) {
        setKycStatus(profile.kyc_status || null);
        if (profile.bank_name)           setBankName(profile.bank_name);
        if (profile.bank_account_number) setBankAccount(profile.bank_account_number);
        if (profile.bank_account_name)   setBankAccountName(profile.bank_account_name);
      }
    } catch (_e) { setError('โหลดข้อมูลไม่สำเร็จ'); }
    setLoading(false);
  }

  async function loadFaceApi() {
    try {
      // โหลด face-api.js จาก CDN
      if (!(window as any).faceapi) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
          s.onload = () => res();
          s.onerror = () => rej(new Error('โหลด face-api.js ไม่สำเร็จ'));
          document.head.appendChild(s);
        });
      }
      const faceapi = (window as any).faceapi;
      // โหลด models จาก CDN
      const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
      ]);
      setFaceApiLoaded(true);
    } catch (e) {
      console.warn('face-api load error:', e);
      setFaceApiLoaded(false); // fallback: ไม่มี blink detection แต่ยังใช้กล้องได้
    }
  }

  async function startCamera(step: CameraStep) {
    stopCamera();
    setCameraStep(step);
    setStepStatus('scanning');
    capturedRef.current = false;
    blinkCountRef.current = 0;
    setBlinkCount(0);
    blinkFrames.current = 0;
    wasOpen.current = true;

    const facingMode = step === 'selfie' ? 'user' : 'environment';
    setInstruction(step === 'id_card' ? 'วางบัตรประชาชนให้อยู่ในกรอบ' : 'วางหน้าและบัตรในกรอบ');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);

      if (step === 'selfie' && faceApiLoaded) {
        setInstruction('กระพริบตา 2 ครั้งเพื่อยืนยันตัวตน');
        setStepStatus('blinking');
        startBlinkDetection();
      } else {
        // ID card: ไม่ต้องกระพริบ ให้ถ่ายเองหลัง 2 วินาที
        setInstruction('วางบัตรให้ชัดเจน กำลังถ่ายใน 2 วินาที...');
        setTimeout(() => { if (!capturedRef.current) captureFrame(step); }, 2000);
      }
    } catch (err: any) {
      setError('ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการใช้งานกล้อง');
      setStepStatus('waiting');
    }
  }

  function startBlinkDetection() {
    const faceapi = (window as any).faceapi;
    const video = videoRef.current;
    if (!video || !faceapi) return;

    async function detect() {
      if (capturedRef.current) return;
      try {
        const detection = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.4 }))
          .withFaceLandmarks(true);

        if (detection) {
          const landmarks = detection.landmarks;
          // 68-point model: left eye = 36-41, right eye = 42-47
          const leftEye  = landmarks.getLeftEye().map((p: any) => [p.x, p.y]);
          const rightEye = landmarks.getRightEye().map((p: any) => [p.x, p.y]);
          const earLeft  = calcEAR(leftEye);
          const earRight = calcEAR(rightEye);
          const ear = (earLeft + earRight) / 2;

          if (ear < EAR_THRESHOLD) {
            blinkFrames.current++;
          } else {
            if (blinkFrames.current >= BLINK_FRAMES && wasOpen.current === false) {
              blinkCountRef.current++;
              setBlinkCount(blinkCountRef.current);
              if (blinkCountRef.current >= blinkNeeded) {
                setInstruction('ยืนยันสำเร็จ! กำลังถ่ายรูป...');
                setTimeout(() => captureFrame('selfie'), 300);
                return;
              }
              setInstruction(`กระพริบแล้ว ${blinkCountRef.current}/${blinkNeeded} ครั้ง`);
            }
            wasOpen.current = ear >= EAR_THRESHOLD;
            blinkFrames.current = 0;
          }
          if (ear < EAR_THRESHOLD) wasOpen.current = false;

          // วาด overlay
          drawOverlay(detection);
        } else {
          setInstruction('ไม่พบใบหน้า กรุณาวางหน้าในกรอบ');
          clearOverlay();
        }
      } catch (_e) {}
      rafRef.current = requestAnimationFrame(detect);
    }
    rafRef.current = requestAnimationFrame(detect);
  }

  function drawOverlay(detection: any) {
    const canvas = overlayRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // วาดกรอบใบหน้า
    const box = detection.detection.box;
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth   = 3;
    ctx.strokeRect(box.x, box.y, box.width, box.height);
  }

  function clearOverlay() {
    const canvas = overlayRef.current;
    if (!canvas) return;
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
  }

  function captureFrame(step: CameraStep) {
    if (capturedRef.current) return;
    capturedRef.current = true;
    cancelAnimationFrame(rafRef.current);

    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width  = video.videoWidth  || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      if (step === 'id_card') {
        setIdCardBlob(blob);
        setIdCardPreview(url);
      } else {
        setSelfieBlob(blob);
        setSelfiePreview(url);
      }
      setStepStatus('captured');
      setInstruction('');
      stopCamera();
    }, 'image/jpeg', 0.92);
  }

  function stopCamera() {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }

  function retake(step: CameraStep) {
    if (step === 'id_card') { setIdCardBlob(null); setIdCardPreview(''); }
    else                    { setSelfieBlob(null);  setSelfiePreview('');  }
    setStepStatus('waiting');
    setBlinkCount(0);
    capturedRef.current = false;
  }

  async function uploadBlob(blob: Blob, folder: string): Promise<string | null> {
    try {
      const filePath = `${folder}/${currentUser.id}_${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from('kyc-documents')
        .upload(filePath, blob, { upsert: true, contentType: 'image/jpeg' });
      if (upErr) return null;
      const { data } = supabase.storage.from('kyc-documents').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (_e) { return null; }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) return;
    if (!idCardBlob)  { setError('กรุณาถ่ายรูปบัตรประชาชน'); return; }
    if (!selfieBlob)  { setError('กรุณาถ่ายรูปเซลฟี่พร้อมบัตร'); return; }
    if (!bankAccount) { setError('กรุณากรอกเลขบัญชีธนาคาร'); return; }

    setSubmitting(true); setError('');
    try {
      const updates: Record<string, any> = {
        kyc_status: 'pending',
        bank_name: bankName,
        bank_account_number: bankAccount,
        bank_account_name: bankAccountName,
      };
      const idUrl  = await uploadBlob(idCardBlob, 'id-cards');
      const selUrl = await uploadBlob(selfieBlob, 'selfies');
      if (idUrl)  updates.id_card_url = idUrl;
      if (selUrl) updates.selfie_with_id_url = selUrl;

      const { error: updateErr } = await supabase.from('profiles').update(updates).eq('id', currentUser.id);
      if (updateErr) { setError(updateErr.message); }
      else { setSuccessMsg('ส่งข้อมูล KYC เรียบร้อยแล้ว! Admin จะตรวจสอบภายใน 24 ชั่วโมง'); setKycStatus('pending'); }
    } catch (_e) { setError('เกิดข้อผิดพลาด กรุณาลองใหม่'); }
    setSubmitting(false);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-gray-500 text-center"><div className="text-4xl animate-bounce mb-2">🔍</div><p>กำลังโหลด...</p></div>
    </div>
  );

  // ── Camera UI Component ───────────────────────────────
  function CameraCapture({ step }: { step: CameraStep }) {
    const isSelfie = step === 'selfie';
    const preview  = isSelfie ? selfiePreview : idCardPreview;
    const hasCapture = isSelfie ? !!selfieBlob : !!idCardBlob;

    if (hasCapture && preview) {
      return (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-green-500 text-lg">✅</span>
            <h3 className="font-semibold text-gray-800 text-sm">
              {isSelfie ? 'รูปเซลฟี่พร้อมบัตร' : 'รูปบัตรประชาชน'}
            </h3>
          </div>
          <img src={preview} alt="preview" className="w-full max-h-48 object-cover rounded-xl mb-3" />
          <button
            onClick={() => retake(step)}
            className="w-full text-sm text-blue-600 border border-blue-200 rounded-xl py-2 hover:bg-blue-50 transition"
          >
            🔄 ถ่ายใหม่
          </button>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="mb-3">
          <h3 className="font-semibold text-gray-800 text-sm mb-0.5">
            {isSelfie ? '🤳 ถ่ายเซลฟี่พร้อมบัตรประชาชน' : '🪪 ถ่ายบัตรประชาชน'}
          </h3>
          <p className="text-xs text-gray-500">
            {isSelfie
              ? 'ถือบัตรประชาชนให้เห็นชัด แล้วกระพริบตา 2 ครั้งเพื่อยืนยัน'
              : 'วางบัตรประชาชนให้ชัดเจน ระบบจะถ่ายให้อัตโนมัติ'}
          </p>
        </div>

        {/* Camera Preview */}
        {cameraActive && cameraStep === step ? (
          <div className="relative rounded-xl overflow-hidden bg-black aspect-video mb-3">
            <video
              ref={videoRef}
              autoPlay playsInline muted
              className="w-full h-full object-cover"
            />
            {/* Overlay canvas สำหรับ face detection */}
            <canvas
              ref={overlayRef}
              className="absolute inset-0 w-full h-full"
              style={{ pointerEvents: 'none' }}
            />
            {/* กรอบ guide */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {isSelfie ? (
                // กรอบวงรีสำหรับหน้า
                <div className="w-48 h-60 border-4 border-green-400 rounded-full opacity-70" />
              ) : (
                // กรอบสี่เหลี่ยมสำหรับบัตร
                <div className="w-72 h-44 border-4 border-blue-400 rounded-xl opacity-70" />
              )}
            </div>
            {/* Instruction overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-4 py-3">
              <p className="text-white text-sm text-center font-medium">{instruction}</p>
              {isSelfie && faceApiLoaded && (
                <p className="text-green-300 text-xs text-center mt-0.5">
                  กระพริบ {blinkCount}/{blinkNeeded} ครั้ง
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center mb-3">
            <div className="text-center">
              <div className="text-4xl mb-2">{isSelfie ? '🤳' : '🪪'}</div>
              <p className="text-gray-500 text-sm">กดปุ่มด้านล่างเพื่อเปิดกล้อง</p>
              {!faceApiLoaded && isSelfie && (
                <p className="text-xs text-orange-500 mt-1">⏳ กำลังโหลด AI...</p>
              )}
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />

        {cameraActive && cameraStep === step ? (
          <div className="space-y-2">
            {!isSelfie && (
              <button
                onClick={() => captureFrame(step)}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition"
              >
                📸 ถ่ายรูปเดี๋ยวนี้
              </button>
            )}
            <button
              onClick={stopCamera}
              className="w-full text-gray-500 border border-gray-200 py-2 rounded-xl text-sm hover:bg-gray-50 transition"
            >
              ยกเลิก
            </button>
          </div>
        ) : (
          <button
            onClick={() => startCamera(step)}
            className={`w-full py-3 rounded-xl font-bold text-sm transition ${
              isSelfie
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isSelfie ? '📷 เปิดกล้องหน้า + ตรวจกระพริบตา' : '📷 เปิดกล้องถ่ายบัตร'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-600">← กลับ</button>
        <h1 className="font-bold text-lg text-gray-800">ยืนยันตัวตน (KYC)</h1>
        {faceApiLoaded && <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">🧠 AI พร้อม</span>}
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Status Badge */}
        {kycStatus && (
          <div className={`rounded-2xl p-4 text-center ${
            kycStatus === 'approved' ? 'bg-green-50 border border-green-200'
            : kycStatus === 'pending' ? 'bg-yellow-50 border border-yellow-200'
            : 'bg-red-50 border border-red-200'
          }`}>
            <div className="text-2xl mb-1">
              {kycStatus === 'approved' ? '✅' : kycStatus === 'pending' ? '⏳' : '❌'}
            </div>
            <p className="font-semibold text-gray-700">
              {kycStatus === 'approved' ? 'ยืนยันตัวตนสำเร็จ!'
              : kycStatus === 'pending' ? 'รอการตรวจสอบจาก Admin'
              : 'ไม่ผ่านการตรวจสอบ กรุณาส่งใหม่'}
            </p>
          </div>
        )}

        {successMsg && <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm">{successMsg}</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{error}</div>}

        {/* Info */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <h3 className="font-semibold text-blue-800 mb-2 text-sm">📋 ขั้นตอน KYC</h3>
          <div className="space-y-1.5 text-xs text-blue-700">
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${idCardBlob ? 'bg-green-500' : 'bg-blue-400'}`}>
                {idCardBlob ? '✓' : '1'}
              </span>
              <span>ถ่ายรูปบัตรประชาชน (กล้องหลัง)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${selfieBlob ? 'bg-green-500' : 'bg-blue-400'}`}>
                {selfieBlob ? '✓' : '2'}
              </span>
              <span>เซลฟี่พร้อมบัตร + กระพริบตา 2 ครั้ง (ยืนยันตัวตนสด)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-400 flex items-center justify-center text-white text-xs font-bold">3</span>
              <span>กรอกข้อมูลบัญชีธนาคาร</span>
            </div>
          </div>
        </div>

        {kycStatus !== 'approved' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step 1: ID Card */}
            <CameraCapture step="id_card" />

            {/* Step 2: Selfie */}
            {idCardBlob && <CameraCapture step="selfie" />}

            {/* Step 3: Bank */}
            {idCardBlob && selfieBlob && (
              <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
                <h3 className="font-semibold text-gray-700">🏦 ข้อมูลบัญชีธนาคาร</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">ธนาคาร</label>
                  <select value={bankName} onChange={e => setBankName(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" required>
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
                  <input type="text" value={bankAccountName} onChange={e => setBankAccountName(e.target.value)}
                    placeholder="ชื่อ-นามสกุล ตามบัญชีธนาคาร"
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">เลขบัญชี</label>
                  <input type="text" value={bankAccount}
                    onChange={e => setBankAccount(e.target.value.replace(/\D/g,'').slice(0,15))}
                    placeholder="xxxxxxxxxx"
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" required />
                </div>
              </div>
            )}

            {idCardBlob && selfieBlob && (
              <button type="submit" disabled={submitting}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition disabled:opacity-50">
                {submitting ? '⏳ กำลังส่งข้อมูล...' : '📤 ส่งข้อมูลยืนยันตัวตน'}
              </button>
            )}
            <p className="text-xs text-center text-gray-400">ข้อมูลของคุณจะถูกเก็บเป็นความลับอย่างเคร่งครัด</p>
          </form>
        )}

        {kycStatus === 'approved' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <p className="font-bold text-gray-800 mb-2">ยืนยันตัวตนสำเร็จแล้ว!</p>
            <p className="text-sm text-gray-600 mb-4">บัญชีของคุณได้รับตราสัญลักษณ์ ✅ ยืนยันแล้ว</p>
            <Link href="/profile" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition">ดูโปรไฟล์</Link>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 px-4 z-50">
        <Link href="/dashboard" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-blue-600 text-xs"><span className="text-lg">🏠</span>หน้าหลัก</Link>
        <Link href="/jobs/new" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-blue-600 text-xs"><span className="text-lg">💼</span>งาน</Link>
        <Link href="/services" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-blue-600 text-xs"><span className="text-lg">🔧</span>บริการ</Link>
        <Link href="/coupons" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-blue-600 text-xs"><span className="text-lg">🧧</span>คูปอง</Link>
        <Link href="/profile" className="flex flex-col items-center gap-0.5 text-blue-600 text-xs"><span className="text-lg">👤</span>โปรไฟล์</Link>
      </nav>
    </div>
  );
}

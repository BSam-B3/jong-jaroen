'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { compressImage } from '../../lib/image-compress';

type Step = 'id_card' | 'selfie' | 'review' | 'uploading';

export default function KycUploadClient({ userId }: { userId: string }) {
  const router = useRouter();
  // ใช้ Browser Client เพื่อความชัวร์ 100%
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [step, setStep] = useState<Step>('id_card');
  const [idCardBlob, setIdCardBlob] = useState<Blob | null>(null);
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);

  // ฟังก์ชันเปิดกล้อง
  const startCamera = useCallback(async (facingMode: 'environment' | 'user') => {
    try {
      setPermissionRequested(true);
      setError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraReady(true);
    } catch (err) {
      console.error('Camera Error:', err);
      setError('ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตให้เว็บไซต์เข้าถึงกล้องของคุณ');
      setIsCameraReady(false);
    }
  }, []);

  // ปิดกล้องเมื่อเปลี่ยนสเต็ปหรือออกหน้า
  useEffect(() => {
    if (step === 'id_card') startCamera('environment');
    else if (step === 'selfie') startCamera('user');
    else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setIsCameraReady(false);
    }
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, [step, startCamera]);

  // ฟังก์ชันกดถ่ายรูป
  const handleCapture = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (step === 'selfie') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        const compressed = await compressImage(blob, 1, 1920);
        if (step === 'id_card') {
          setIdCardBlob(compressed);
          setPreviewUrl(URL.createObjectURL(compressed));
        } else if (step === 'selfie') {
          setSelfieBlob(compressed);
          setPreviewUrl(URL.createObjectURL(compressed));
        }
      } catch (e) {
        setError('เกิดข้อผิดพลาดในการประมวลผลรูปภาพ');
      }
    }, 'image/jpeg', 0.95);
  };

  // ถ่ายใหม่ / ไปต่อ
  const handleRetake = () => {
    setPreviewUrl(null);
    if (step === 'id_card') setIdCardBlob(null);
    if (step === 'selfie') setSelfieBlob(null);
  };
  const handleNext = () => {
    setPreviewUrl(null);
    if (step === 'id_card') setStep('selfie');
    else if (step === 'selfie') setStep('review');
  };

  // อัปโหลดเข้าฐานข้อมูล
  const handleSubmit = async () => {
    if (!idCardBlob || !selfieBlob) return;
    setStep('uploading');
    setError(null);

    try {
      const timestamp = Date.now();
      const idCardPath = `${userId}/id_card_${timestamp}.jpg`;
      const selfiePath = `${userId}/selfie_${timestamp}.jpg`;

      // 1. อัปโหลดรูปบัตร
      const { error: idErr } = await supabase.storage.from('kyc').upload(idCardPath, idCardBlob, { contentType: 'image/jpeg' });
      if (idErr) throw idErr;

      // 2. อัปโหลดรูปเซลฟี่
      const { error: sfErr } = await supabase.storage.from('kyc').upload(selfiePath, selfieBlob, { contentType: 'image/jpeg' });
      if (sfErr) throw sfErr;

      // 3. อัปเดต Profile
      const { error: dbErr } = await supabase.from('profiles').update({
        id_card_url: idCardPath,
        selfie_url: selfiePath,
        kyc_status: 'pending',
        kyc_submitted_at: new Date().toISOString(),
      }).eq('id', userId);
      if (dbErr) throw dbErr;

      alert('ส่งข้อมูลยืนยันตัวตนสำเร็จ! รอแอดมินตรวจสอบนะคะ');
      router.push('/'); 
      router.refresh();
    } catch (e: any) {
      console.error(e);
      setError(`เกิดข้อผิดพลาด: ${e.message}`);
      setStep('review');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 font-sans">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">ยืนยันตัวตน (KYC)</h1>
          <p className="text-gray-500 mt-2 font-medium">โปรดถ่ายรูปเพื่อยืนยันตัวตนให้ครบ 2 ขั้นตอน</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          {error && <div className="bg-red-50 p-4 text-red-600 text-sm font-bold border-b border-red-100 text-center">{error}</div>}

          {(step === 'id_card' || step === 'selfie') && (
            <div>
              <div className="p-6 border-b border-gray-50 text-center bg-gray-50/50">
                <h2 className="text-xl font-black text-gray-800">
                  {step === 'id_card' ? '📸 ขั้นตอนที่ 1: ถ่ายบัตรประชาชน' : '🤳 ขั้นตอนที่ 2: ถ่ายรูปเซลฟี่คู่บัตร'}
                </h2>
                <p className="text-sm text-gray-500 font-medium mt-1">
                  {step === 'id_card' ? 'วางบัตรให้อยู่ในกรอบสี่เหลี่ยม แสงสว่างเพียงพอ' : 'ขยับใบหน้าให้อยู่ในกรอบวงรี'}
                </p>
              </div>

              {/* Viewfinder */}
              <div className="relative bg-black aspect-[3/4] sm:aspect-video overflow-hidden">
                {!previewUrl ? (
                  <>
                    <video ref={videoRef} playsInline muted className={`w-full h-full object-cover ${step === 'selfie' ? 'scale-x-[-1]' : ''}`} />
                    
                    {/* Overlay Frame */}
                    {isCameraReady && (
                      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-black/40">
                        {step === 'id_card' ? (
                          <div className="w-[85%] aspect-[1.586/1] border-[3px] border-white/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] box-shadow-outset relative">
                             <div className="absolute inset-0 border-4 border-[#EE4D2D] rounded-2xl opacity-50 animate-pulse"></div>
                          </div>
                        ) : (
                          <div className="w-[65%] aspect-[3/4] border-[3px] border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] rounded-full relative">
                            <div className="absolute inset-0 border-4 border-[#EE4D2D] rounded-full opacity-50 animate-pulse"></div>
                          </div>
                        )}
                      </div>
                    )}

                    {!isCameraReady && permissionRequested && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent mb-4"></div>
                        <p className="font-bold">กำลังเปิดกล้อง...</p>
                      </div>
                    )}

                    {!permissionRequested && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button onClick={() => startCamera(step === 'id_card' ? 'environment' : 'user')} className="bg-[#EE4D2D] text-white px-6 py-3 rounded-xl font-black shadow-lg animate-bounce">
                          กดเพื่อเปิดกล้อง
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <img src={previewUrl} alt="preview" className="w-full h-full object-contain bg-gray-900" />
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-6">
                {!previewUrl ? (
                  <button onClick={handleCapture} disabled={!isCameraReady} className="w-full bg-gray-900 text-white font-black py-4 rounded-xl shadow-lg active:scale-95 disabled:opacity-50 transition-all">
                    📸 กดถ่ายรูป
                  </button>
                ) : (
                  <div className="flex gap-4">
                    <button onClick={handleRetake} className="flex-1 bg-gray-100 text-gray-600 hover:bg-gray-200 font-black py-4 rounded-xl transition-all">
                      🔄 ถ่ายใหม่
                    </button>
                    <button onClick={handleNext} className="flex-1 bg-green-500 text-white hover:bg-green-600 font-black py-4 rounded-xl shadow-lg transition-all">
                      ✓ ใช้รูปนี้
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="p-8">
              <h2 className="text-2xl font-black text-gray-800 mb-6 text-center">📋 ตรวจสอบความถูกต้อง</h2>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="text-center">
                  <div className="text-xs font-black text-gray-400 uppercase mb-2">บัตรประชาชน</div>
                  {idCardBlob && <img src={URL.createObjectURL(idCardBlob)} className="w-full aspect-[1.586/1] object-cover rounded-xl border-2 border-gray-100 shadow-sm" alt="id card" />}
                </div>
                <div className="text-center">
                  <div className="text-xs font-black text-gray-400 uppercase mb-2">เซลฟี่คู่บัตร</div>
                  {selfieBlob && <img src={URL.createObjectURL(selfieBlob)} className="w-full aspect-[3/4] object-cover rounded-xl border-2 border-gray-100 shadow-sm" alt="selfie" />}
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setStep('id_card')} className="w-1/3 bg-gray-100 text-gray-600 font-black py-4 rounded-xl">แก้ไข</button>
                <button onClick={handleSubmit} className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg">🚀 ส่งยืนยันตัวตน</button>
              </div>
            </div>
          )}

          {step === 'uploading' && (
            <div className="p-16 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
              <h3 className="text-xl font-black text-gray-800">กำลังอัปโหลด...</h3>
              <p className="text-gray-500 font-medium mt-2">โปรดอย่าปิดหน้าต่างนี้</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

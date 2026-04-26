'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
// เราจะเก็บ Tesseract ไว้เป็นตัวสำรอง (Fallback) จนกว่า Google จะพร้อมนะค๊ะ
import Tesseract from 'tesseract.js';

export default function KYCPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState<number>(1);

  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [idImageFile, setIdImageFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    loadUserData();
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (isCameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch(e => console.error("Video play failed:", e));
      };
    }
  }, [isCameraOpen]);

  async function loadUserData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setCurrentUser(user);
      const { data: profile } = await supabase.from('profiles')
        .select('kyc_status, phone_verified, full_name, national_id')
        .eq('id', user.id).single();
      if (profile) {
        setKycStatus(profile.kyc_status || 'none');
        if (profile.full_name) setFullName(profile.full_name);
        if (profile.national_id) setIdNumber(profile.national_id);
        if (profile.phone_verified) setStep(2);
      }
    } catch (_e) {}
    setLoading(false);
  }

  const startCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: { ideal: 'environment' } } 
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
    } catch (err) {
      setError('ไม่สามารถเข้าถึงกล้องได้ กรุณาตรวจสอบการตั้งค่าเบราว์เซอร์ค่ะ');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const captureAndProcess = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1200;
    const height = Math.round((video.videoHeight * width) / video.videoWidth);
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setIdPreview(dataUrl);
    stopCamera();

    setIsScanning(true);
    setError('');
    setStatusMessage('กำลังตรวจสอบความชัดเจนของเอกสาร...');
    
    try {
      const result = await Tesseract.recognize(dataUrl, 'tha+eng');
      const text = result.data.text;
      const isValid = text.includes('บัตรประจำตัวประชาชน') || text.includes('Identification') || text.includes('Thai National');
      
      if (!isValid) {
        setError('❌ ตรวจไม่พบข้อมูลบนหน้าบัตร กรุณาถ่ายใหม่ในที่สว่างและอยู่ในกรอบค่ะ');
        setIdPreview(null);
      } else {
        setStatusMessage('✅ ตรวจสอบเอกสารเบื้องต้นเรียบร้อย');
        const blob = await (await fetch(dataUrl)).blob();
        setIdImageFile(new File([blob], `verified_id_${Date.now()}.jpg`, { type: 'image/jpeg' }));
      }
    } catch (err) {
      setStatusMessage('ระบบขัดข้องชั่วคราว คุณสามารถส่งรูปเพื่อตรวจสอบภายหลังได้ค่ะ');
      const blob = await (await fetch(dataUrl)).blob();
      setIdImageFile(new File([blob], `id_card_${Date.now()}.jpg`, { type: 'image/jpeg' }));
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmitData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idImageFile || idNumber.length !== 13) return;
    setIsSubmitting(true);
    try {
      const fileName = `${currentUser.id}/${idImageFile.name}`;
      const { data: uploadData, error: uploadErr } = await supabase.storage.from('kyc_documents').upload(fileName, idImageFile);
      if (uploadErr) throw uploadErr;
      await supabase.from('profiles').update({
        kyc_status: 'pending', full_name: fullName, national_id: idNumber, id_card_url: uploadData.path, pdpa_consented_at: new Date().toISOString()
      }).eq('id', currentUser.id);
      setKycStatus('pending');
    } catch (err: any) { setError(err.message); }
    setIsSubmitting(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold">กำลังโหลด...</div>;
  
  if (kycStatus === 'approved' || kycStatus === 'pending') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10 text-center">
         <div className="text-8xl mb-6">{kycStatus === 'approved' ? '✅' : '⏳'}</div>
         <h1 className="text-3xl font-black mb-4">{kycStatus === 'approved' ? 'ยืนยันตัวตนสำเร็จ' : 'ได้รับเอกสารแล้ว'}</h1>
         <p className="text-gray-500 mb-8">ระบบกำลังตรวจสอบความถูกต้องของข้อมูล กรุณารอสักครู่ค่ะ</p>
         <button onClick={() => router.push('/profile')} className="bg-[#EE4D2D] text-white px-10 py-4 rounded-full font-black shadow-lg">กลับหน้าโปรไฟล์</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pb-24 relative overflow-hidden">
      <div className="w-full sm:max-w-2xl bg-white min-h-screen flex flex-col shadow-2xl relative">
        {isCameraOpen && (
          <div className="absolute inset-0 bg-black z-[100] flex flex-col">
            <div className="relative flex-1 overflow-hidden">
              <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                <div className="w-full max-w-sm aspect-[86/54] border-4 border-dashed border-orange-500 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]">
                  <div className="absolute -top-12 left-0 right-0 text-center text-white font-black text-sm uppercase tracking-widest">
                    วางบัตรประชาชนในกรอบ
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-black p-10 flex justify-between items-center pb-16">
              <button type="button" onClick={stopCamera} className="text-white font-bold px-4">ยกเลิก</button>
              <button type="button" onClick={captureAndProcess} className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center active:scale-90 transition-transform">
                 <div className="w-16 h-16 bg-white rounded-full border-2 border-black/10"></div>
              </button>
              <div className="w-16"></div>
            </div>
          </div>
        )}

        <div className="p-6 border-b sticky top-0 bg-white z-50 flex items-center gap-4">
          <button onClick={() => router.back()} className="text-2xl font-bold">←</button>
          <h1 className="font-black text-xl">ยืนยันตัวตน</h1>
        </div>

        <div className="p-8 space-y-8">
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-black border border-red-100">{error}</div>}
          <form onSubmit={handleSubmitData} className="space-y-6">
            <div>
              <label className="block text-[11px] font-black text-gray-400 mb-2 uppercase">ชื่อ-นามสกุลจริง</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold" placeholder="กรอกชื่อตามบัตร" required />
            </div>
            <div>
              <label className="block text-[11px] font-black text-gray-400 mb-2 uppercase">เลขบัตรประชาชน 13 หลัก</label>
              <input type="text" value={idNumber} onChange={e => setIdNumber(e.target.value.replace(/\D/g,'').slice(0,13))} className="w-full p-4 bg-gray-50 border-none rounded-2xl font-black tracking-widest text-lg" placeholder="0000000000000" required />
            </div>
            <div className="space-y-3">
              <label className="block text-[11px] font-black text-gray-400 uppercase">ถ่ายรูปบัตรประชาชน</label>
              <div onClick={() => !isScanning && startCamera()} className={`border-4 border-dashed rounded-[2rem] p-8 text-center cursor-pointer transition-all ${idPreview ? 'border-green-100 bg-green-50' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}>
                 {isScanning ? (
                   <div className="py-6 space-y-4">
                      <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="text-sm font-black text-orange-600 animate-pulse">{statusMessage}</p>
                   </div>
                 ) : idPreview ? (
                   <div className="space-y-4">
                     <img src={idPreview} className="max-h-48 mx-auto rounded-xl shadow-md border-2 border-white" alt="ID Preview" />
                     <p className="text-xs font-black text-green-600">✅ รูปพร้อมใช้งาน (แตะเพื่อถ่ายใหม่)</p>
                   </div>
                 ) : (
                   <div className="py-10 space-y-3">
                      <div className="text-5xl">🪪</div>
                      <p className="text-sm font-black text-gray-700">แตะเพื่อถ่ายรูปบัตร</p>
                   </div>
                 )}
              </div>
            </div>
            <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-2xl">
              <input type="checkbox" checked={pdpaConsent} onChange={e => setPdpaConsent(e.target.checked)} className="mt-1 h-5 w-5 rounded" required />
              <p className="text-[10px] text-blue-800 leading-relaxed font-medium">ข้าพเจ้ายินยอมให้ประมวลผลข้อมูลเพื่อใช้ในการยืนยันตัวตนตามนโยบายของระบบ</p>
            </div>
            <button type="submit" disabled={isSubmitting || !idImageFile || isScanning} className="w-full bg-[#EE4D2D] text-white py-5 rounded-full font-black text-sm shadow-xl active:scale-95 disabled:opacity-50 transition-all">
              {isSubmitting ? 'กำลังส่งข้อมูล...' : 'ส่งข้อมูลเพื่อรับการตรวจสอบ'}
            </button>
          </form>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Tesseract from 'tesseract.js'; // ต้องเพิ่มบรรทัดนี้หลังจากแก้ package.json นะค๊ะ

export default function KYCWithAI() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState<number>(1);

  // -- Personal Info & Camera States --
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // -- AI OCR & Image Processing --
  const [idImageFile, setIdImageFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false); // สถานะ AI กำลังอ่านบัตร
  const [ocrStatus, setOcrStatus] = useState(''); // ข้อความบอกความคืบหน้าของ AI

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    loadUserData();
    return () => stopCamera();
  }, []);

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
        if (profile.phone_verified) setStep(2);
      }
    } catch (_e) {}
    setLoading(false);
  }

  // --- Camera & AI Processing ---
  const startCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsCameraOpen(true);
    } catch (err) {
      setError('ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการเข้าถึงกล้องค่ะ');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    setIsCameraOpen(false);
  };

  const captureAndProcess = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Capture & Resize (ความกว้าง 1200px เหมาะกับ OCR)
    const width = 1200;
    const height = Math.round((video.videoHeight * width) / video.videoWidth);
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(video, 0, 0, width, height);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setIdPreview(dataUrl);
    stopCamera();

    // 2. AI OCR Verification (สแกนหาคำในบัตร)
    setIsScanning(true);
    setError('');
    setOcrStatus('AI กำลังสแกนบัตร...');

    try {
      const result = await Tesseract.recognize(dataUrl, 'tha+eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            setOcrStatus(`กำลังอ่านตัวอักษร... ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      const detectedText = result.data.text;
      // เช็ค Keyword สำคัญบนบัตรประชาชนไทย
      const isValidCard = detectedText.includes('บัตรประจำตัวประชาชน') || 
                          detectedText.includes('Identification Card') ||
                          detectedText.includes('Thai National');

      if (!isValidCard) {
        setError('❌ AI ตรวจไม่พบข้อความบนบัตรประชาชน กรุณาถ่ายใหม่ให้ชัดเจนและอยู่ในกรอบค่ะ');
        setIdPreview(null);
      } else {
        setOcrStatus('✅ ตรวจสอบบัตรเบื้องต้นสำเร็จ!');
        // แปลงเป็นไฟล์เพื่อเตรียมอัปโหลด
        const blob = await (await fetch(dataUrl)).blob();
        setIdImageFile(new File([blob], `verified_id_${Date.now()}.jpg`, { type: 'image/jpeg' }));
      }
    } catch (err) {
      console.error(err);
      setError('AI ไม่สามารถประมวลผลได้ชั่วคราว แต่คุณยังสามารถส่งรูปเพื่อรอแอดมินตรวจด้วยมือได้ค่ะ');
      // ยอมให้ไปต่อได้เผื่อระบบ OCR ติดขัด
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
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('kyc_documents').upload(fileName, idImageFile);
      if (uploadErr) throw uploadErr;

      await supabase.from('profiles').update({
        kyc_status: 'pending',
        full_name: fullName,
        national_id: idNumber,
        id_card_url: uploadData.path,
        pdpa_consented_at: new Date().toISOString()
      }).eq('id', currentUser.id);

      setKycStatus('pending');
    } catch (err: any) { setError(err.message); }
    setIsSubmitting(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 font-bold">กำลังโหลด...</div>;

  if (kycStatus === 'approved' || kycStatus === 'pending') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10 text-center">
         <div className="text-8xl mb-6">{kycStatus === 'approved' ? '✅' : '⏳'}</div>
         <h1 className="text-3xl font-black mb-4">{kycStatus === 'approved' ? 'อนุมัติเรียบร้อย!' : 'AI รับเอกสารแล้ว'}</h1>
         <p className="text-gray-500 mb-8">ขณะนี้ข้อมูลของคุณบีสามกำลังรอแอดมินยืนยันความถูกต้องในขั้นตอนสุดท้ายค่ะ</p>
         <button onClick={() => router.push('/profile')} className="bg-[#EE4D2D] text-white px-10 py-4 rounded-full font-black shadow-lg">กลับหน้าโปรไฟล์</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pb-24 relative overflow-hidden">
      <div className="w-full sm:max-w-2xl bg-white min-h-screen flex flex-col shadow-2xl relative">
        
        {/* --- ส่วนกล้อง Overlay --- */}
        {isCameraOpen && (
          <div className="absolute inset-0 bg-black z-[100] flex flex-col">
            <div className="relative flex-1 overflow-hidden">
              <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                <div className="w-full max-w-sm aspect-[86/54] border-4 border-dashed border-orange-500 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]">
                  <div className="absolute -top-12 left-0 right-0 text-center text-white font-black text-sm uppercase tracking-widest">
                    วางบัตรประชาชนในกรอบ
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-black p-10 flex justify-between items-center pb-16">
              <button onClick={stopCamera} className="text-white font-bold px-4">ยกเลิก</button>
              <button onClick={captureAndProcess} className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center active:scale-90 transition-transform">
                 <div className="w-16 h-16 bg-white rounded-full border-2 border-black/10"></div>
              </button>
              <div className="w-16"></div>
            </div>
          </div>
        )}

        <div className="p-6 border-b sticky top-0 bg-white z-50 flex items-center gap-4">
          <button onClick={() => router.back()} className="text-2xl font-bold">←</button>
          <h1 className="font-black text-xl">ยืนยันตัวตน AI</h1>
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
              <div 
                onClick={() => !isScanning && startCamera()}
                className={`border-4 border-dashed rounded-[2rem] p-8 text-center cursor-pointer transition-all ${idPreview ? 'border-green-100 bg-green-50' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}
              >
                 {isScanning ? (
                   <div className="py-6 space-y-4">
                      <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="text-sm font-black text-orange-600 animate-pulse">{ocrStatus}</p>
                   </div>
                 ) : idPreview ? (
                   <div className="space-y-4">
                     <img src={idPreview} className="max-h-48 mx-auto rounded-xl shadow-md border-2 border-white" />
                     <p className="text-xs font-black text-green-600">✅ รูปภาพพร้อมใช้งาน (แตะเพื่อถ่ายใหม่)</p>
                   </div>
                 ) : (
                   <div className="py-10 space-y-3">
                      <div className="text-5xl">🪪</div>
                      <p className="text-sm font-black text-gray-700">แตะเพื่อเปิดกล้อง AI</p>
                      <p className="text-[10px] text-gray-400">ระบบจะสแกนหาข้อความบนบัตรเพื่อความถูกต้อง</p>
                   </div>
                 )}
              </div>
            </div>

            <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-2xl">
              <input type="checkbox" checked={pdpaConsent} onChange={e => setPdpaConsent(e.target.checked)} className="mt-1 h-5 w-5 rounded" required />
              <p className="text-[10px] text-blue-800 leading-relaxed font-medium">ข้าพเจ้ายินยอมให้ระบบ AI ประมวลผลข้อมูลในบัตรประชาชนเพื่อยืนยันตัวตนในชุมชนจงเจริญ</p>
            </div>
            
            <button type="submit" disabled={isSubmitting || !idImageFile || isScanning} className="w-full bg-gradient-to-r from-[#EE4D2D] to-[#FF7337] text-white py-5 rounded-full font-black text-sm shadow-xl active:scale-95 disabled:grayscale disabled:opacity-50 transition-all">
              {isSubmitting ? 'กำลังส่งข้อมูล...' : 'ส่งข้อมูลให้แอดมินอนุมัติ'}
            </button>
          </form>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}

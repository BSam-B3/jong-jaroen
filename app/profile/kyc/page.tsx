'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/app/components/BottomNav';

export default function KYCPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [error, setError] = useState('');

  // -- Form States --
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // -- Camera & AI States --
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

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setCurrentUser(user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setKycStatus(profile.kyc_status);
        setFullName(profile.full_name || '');
        setIdNumber(profile.national_id || '');
        setDateOfBirth(profile.date_of_birth || '');
        setAddress(profile.address || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // ใช้กล้องหลังเป็นหลัก
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setIsCameraOpen(true);
      setIdPreview(null);
      setIdImageFile(null);
      setError('');
      setStatusMessage('');
    } catch (err) {
      setError('ไม่สามารถเปิดกล้องได้ กรุณาตรวจสอบสิทธิ์การเข้าถึงกล้องค่ะ');
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

    const width = 1280;
    const height = Math.round((video.videoHeight * width) / video.videoWidth);
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(video, 0, 0, width, height);

    const blob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('canvas empty'))), 'image/jpeg', 0.9)
    );

    setIdPreview(URL.createObjectURL(blob));
    stopCamera();
    setIsScanning(true);
    setError('');
    setStatusMessage('ระบบกำลังวิเคราะห์ข้อมูลจากภาพถ่าย...');

    const file = new File([blob], `id_card_${Date.now()}.jpg`, { type: 'image/jpeg' });
    setIdImageFile(file);

    try {
      const fd = new FormData();
      fd.append('file', file);
      
      // ส่งรูปไปให้ API หลังบ้านประมวลผล (ปลอดภัย ไม่หลุด API Key)
      const res = await fetch('/api/kyc/ocr', { method: 'POST', body: fd });
      if (!res.ok) throw new Error(`OCR HTTP ${res.status}`);
      
      const { text: rawText } = await res.json();
      const cleanText = String(rawText).replace(/\n/g, ' ');

      if (!cleanText.includes('บัตรประจำตัวประชาชน') && !cleanText.includes('Thai National')) {
        setError('❌ ตรวจไม่พบข้อมูลหน้าบัตร กรุณาถ่ายใหม่ค่ะ');
        setIdPreview(null);
        setIdImageFile(null);
        return;
      }

      setStatusMessage('✅ วิเคราะห์สำเร็จ กรุณาตรวจสอบข้อมูลอีกครั้ง');
      
      const idMatch = cleanText.match(/\b\d{1}\s\d{4}\s\d{5}\s\d{2}\s\d{1}\b/);
      if (idMatch) setIdNumber(idMatch[0].replace(/\s/g, ''));

      const nameMatch = cleanText.match(/(?:ชื่อ - นามสกุล|Name|Thai National)\s+([ก-๙]+\s+[ก-๙]+)/);
      if (nameMatch) setFullName(nameMatch[1].trim());

      const dobMatch = cleanText.match(/(?:เกิดวันที่|Date of Birth)\s+([0-9]+\s+[ก-๙]+\s+[0-9]+)/);
      if (dobMatch) setDateOfBirth(dobMatch[1].trim());

      const houseMatch = cleanText.match(/(?:ที่อยู่|Address)\s*([0-9/]+\s*หมู่ที่\s*[0-9]+.*?(?=เขต|อำเภอ|จังหวัด|$))/);
      if (houseMatch) setAddress(houseMatch[1].trim());

    } catch (err) {
      console.error(err);
      setStatusMessage('⚠️ ระบบดึงข้อมูลอัตโนมัติขัดข้อง กรุณากรอกด้วยตนเอง');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmitData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idImageFile) return setError('กรุณาถ่ายรูปบัตรก่อนค่ะ');
    if (!pdpaConsent) return setError('กรุณายอมรับ PDPA ก่อนค่ะ');
    setIsSubmitting(true);
    setError('');

    try {
      const fd = new FormData();
      fd.append('file', idImageFile);
      fd.append('full_name', fullName);
      fd.append('national_id', idNumber);
      fd.append('date_of_birth', dateOfBirth);
      fd.append('address', address);
      fd.append('pdpa_consent', String(pdpaConsent));

      // อัปโหลดไฟล์และอัปเดตข้อมูลผ่านช่องทางลับหลังบ้าน
      const res = await fetch('/api/kyc/submit', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        const map: Record<string, string> = {
          BAD_NATIONAL_ID: 'เลขบัตรประชาชนไม่ถูกต้อง (ตรวจสอบความถูกต้องของเลข 13 หลัก)',
          TOO_LARGE: 'ไฟล์ใหญ่เกิน 5MB',
          BAD_MIME: 'ไฟล์ต้องเป็น JPG/PNG/WEBP เท่านั้น',
          MIME_SPOOF: 'ไฟล์ภาพไม่ถูกต้อง',
          PDPA_REQUIRED: 'กรุณายอมรับข้อตกลง PDPA',
        };
        throw new Error(map[data?.error] ?? 'เกิดข้อผิดพลาดในการส่งข้อมูล');
      }
      setKycStatus('pending');
      alert('ส่งข้อมูลยืนยันตัวตนเรียบร้อยแล้วค่ะ แอดมินจะทำการตรวจสอบโดยเร็วที่สุด');
      router.push('/profile');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">กำลังโหลดข้อมูล...</div>;

  if (kycStatus === 'pending') {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
          <div className="text-4xl mb-4">⏳</div>
          <h1 className="text-2xl font-black text-gray-800 mb-2">รอการตรวจสอบ</h1>
          <p className="text-gray-500 font-bold mb-6">ระบบได้รับเอกสารของคุณแล้ว<br/>แอดมินกำลังดำเนินการตรวจสอบค่ะ</p>
          <button onClick={() => router.push('/profile')} className="w-full bg-blue-500 text-white font-bold py-3 rounded-xl">กลับหน้าโปรไฟล์</button>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (kycStatus === 'approved') {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-2xl font-black text-green-600 mb-2">ยืนยันตัวตนสำเร็จ</h1>
          <p className="text-gray-500 font-bold mb-6">บัญชีของคุณได้รับการอนุมัติแล้วค่ะ</p>
          <button onClick={() => router.push('/profile')} className="w-full bg-blue-500 text-white font-bold py-3 rounded-xl">กลับหน้าโปรไฟล์</button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-24 text-left">
      <div className="max-w-2xl mx-auto bg-white min-h-screen shadow-xl p-6 md:p-8">
        <button onClick={() => router.back()} className="text-sm font-bold text-blue-500 mb-6 hover:underline">← กลับ</button>
        <h1 className="text-2xl font-black text-gray-800 mb-2">ยืนยันตัวตน (KYC)</h1>
        <p className="text-gray-500 text-sm font-bold mb-8">เพื่อความปลอดภัย กรุณาถ่ายรูปหน้าบัตรประชาชนและตรวจสอบข้อมูลให้ถูกต้องค่ะ</p>

        {error && <div className="bg-red-100 border border-red-300 text-red-600 p-3 rounded-xl mb-6 text-sm font-bold">{error}</div>}
        {statusMessage && <div className="bg-blue-100 border border-blue-300 text-blue-600 p-3 rounded-xl mb-6 text-sm font-bold">{statusMessage}</div>}

        <div className="mb-8 bg-gray-50 p-4 rounded-2xl border border-gray-200">
          <h2 className="font-bold text-gray-700 mb-4 text-sm uppercase">1. ถ่ายรูปบัตรประชาชน</h2>
          
          {!isCameraOpen && !idPreview && (
            <button onClick={startCamera} className="w-full bg-gray-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-md">
              <span>📸</span> เปิดกล้องเพื่อถ่ายรูป
            </button>
          )}

          {isCameraOpen && (
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video mb-4 shadow-inner">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 border-2 border-dashed border-white/50 m-4 rounded-xl pointer-events-none"></div>
            </div>
          )}

          {isCameraOpen && (
            <div className="flex gap-2">
              <button onClick={captureAndProcess} disabled={isScanning} className="flex-1 bg-green-500 text-white font-black py-3 rounded-xl shadow-md disabled:opacity-50">
                {isScanning ? 'กำลังวิเคราะห์...' : 'ถ่ายรูป 📸'}
              </button>
              <button onClick={stopCamera} className="bg-red-500 text-white font-bold px-4 rounded-xl shadow-md">ปิดกล้อง</button>
            </div>
          )}

          {idPreview && (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden border-2 border-green-400">
                <img src={idPreview} alt="ID Preview" className="w-full object-cover aspect-video" />
              </div>
              <button onClick={startCamera} className="w-full bg-gray-200 text-gray-700 font-bold py-3 rounded-xl border border-gray-300 hover:bg-gray-300">
                ถ่ายใหม่ 🔄
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmitData} className="space-y-5">
          <h2 className="font-bold text-gray-700 mb-2 text-sm uppercase border-b pb-2">2. ตรวจสอบข้อมูล</h2>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">เลขบัตรประชาชน (13 หลัก)</label>
            <input type="text" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} maxLength={13} className="w-full border-gray-300 rounded-xl p-3 bg-gray-50 font-bold font-mono text-lg focus:ring-blue-500 focus:border-blue-500" required placeholder="0000000000000" />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">ชื่อ - นามสกุล</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border-gray-300 rounded-xl p-3 bg-gray-50 font-bold focus:ring-blue-500 focus:border-blue-500" required placeholder="นาย จงเจริญ ดีงาม" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">วัน/เดือน/ปีเกิด</label>
              <input type="text" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="w-full border-gray-300 rounded-xl p-3 bg-gray-50 font-bold focus:ring-blue-500 focus:border-blue-500" required placeholder="1 มกราคม 2500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">ที่อยู่ตามบัตร</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className="w-full border-gray-300 rounded-xl p-3 bg-gray-50 font-bold focus:ring-blue-500 focus:border-blue-500" required placeholder="123 หมู่ 1..."></textarea>
          </div>

          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 items-start mt-6">
            <input type="checkbox" id="pdpa" checked={pdpaConsent} onChange={(e) => setPdpaConsent(e.target.checked)} className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" required />
            <label htmlFor="pdpa" className="text-xs font-bold text-gray-600 leading-relaxed">
              ข้าพเจ้ายินยอมให้แพลตฟอร์มเก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคล (รวมถึงรูปภาพบัตรประชาชน) เพื่อวัตถุประสงค์ในการยืนยันตัวตนตามกฎหมาย PDPA
            </label>
          </div>

          <button type="submit" disabled={isSubmitting || !idImageFile} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl text-lg shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mt-4">
            {isSubmitting ? 'กำลังส่งข้อมูล...' : 'ส่งข้อมูลยืนยันตัวตน 🚀'}
          </button>
        </form>
      </div>
      <BottomNav />
    </div>
  );
}

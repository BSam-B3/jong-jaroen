'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { addKycWatermark } from '@/app/utils/watermark';

export default function KYCPage() {
  const router = useRouter();
  // ✅ เรียกใช้ Supabase แบบ Client อย่างถูกต้อง แก้ Error Vercel ทันที
  const supabase = useMemo(() => createClient(), []); 
  
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [error, setError] = useState('');

  // -- 📝 Form States --
  const [firstNameTh, setFirstNameTh] = useState('');
  const [lastNameTh, setLastNameTh] = useState('');
  const [firstNameEn, setFirstNameEn] = useState('');
  const [lastNameEn, setLastNameEn] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  
  // ที่อยู่แยกช่อง
  const [addressNo, setAddressNo] = useState('');
  const [subDistrict, setSubDistrict] = useState('');
  const [district, setDistrict] = useState('');
  const [province, setProvince] = useState('');
  
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // -- 📸 Camera & Image States --
  const [idImageFile, setIdImageFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [selfieImageFile, setSelfieImageFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [captureMode, setCaptureMode] = useState<'id' | 'selfie'>('id');
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
      
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profile) {
        setKycStatus(profile.kyc_status || 'none');
        if (profile.first_name_th) setFirstNameTh(profile.first_name_th);
        if (profile.last_name_th) setLastNameTh(profile.last_name_th);
        if (profile.first_name_en) setFirstNameEn(profile.first_name_en);
        if (profile.last_name_en) setLastNameEn(profile.last_name_en);
        if (profile.id_card_number) setIdNumber(profile.id_card_number); // ✅ ใช้ id_card_number ตามฐานข้อมูลใหม่
        if (profile.date_of_birth) setDateOfBirth(profile.date_of_birth);
        if (profile.address_no) setAddressNo(profile.address_no);
        if (profile.sub_district) setSubDistrict(profile.sub_district);
        if (profile.district) setDistrict(profile.district);
        if (profile.province) setProvince(profile.province);
      }
    } catch (_e) {}
    setLoading(false);
  }

  const startCamera = async (mode: 'id' | 'selfie') => {
    setError('');
    setCaptureMode(mode);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: { ideal: mode === 'id' ? 'environment' : 'user' } } 
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

    const width = 1280;
    const height = Math.round((video.videoHeight * width) / video.videoWidth);
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    stopCamera();

    if (captureMode === 'selfie') {
        setSelfiePreview(dataUrl);
        const blob = await (await fetch(dataUrl)).blob();
        setSelfieImageFile(new File([blob], `selfie_${Date.now()}.jpg`, { type: 'image/jpeg' }));
        return;
    }

    setIdPreview(dataUrl);
    setIsScanning(true);
    setError('');
    setStatusMessage('ระบบกำลังวิเคราะห์ข้อมูลจากภาพถ่าย...');

    try {
      const base64Image = dataUrl.split(',')[1];
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_VISION_API_KEY;

      if (!apiKey) throw new Error("API Key ไม่พร้อมใช้งาน");

      const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: base64Image },
            features: [{ type: 'TEXT_DETECTION' }]
          }]
        })
      });

      const result = await response.json();
      const rawText = result.responses?.[0]?.fullTextAnnotation?.text || '';
      const cleanText = rawText.replace(/\n/g, ' ');
      const isValid = rawText.includes('บัตรประจำตัวประชาชน') || rawText.includes('Identification') || rawText.includes('Thai National');

      if (!isValid) {
        setError('❌ ตรวจไม่พบข้อมูลหน้าบัตร กรุณาถ่ายรูปให้ชัดเจนและเห็นเต็มใบค่ะ');
        setIdPreview(null);
      } else {
        setStatusMessage('✅ วิเคราะห์สำเร็จ กรุณาตรวจสอบข้อมูลอีกครั้ง');

        // --- 🤖 ขุมพลัง AI OCR (อัปเกรด: แยกข้อมูลเป็นชิ้นๆ) ---
        const idMatch = rawText.replace(/\D/g, '').match(/(\d{13})/);
        if (idMatch) setIdNumber(idMatch[1]);

        const thNameMatch = cleanText.match(/(นาย|นาง|นางสาว)\s*([ก-๙]+)\s+([ก-๙]+)/);
        if (thNameMatch) {
            setFirstNameTh(thNameMatch[2]);
            setLastNameTh(thNameMatch[3]);
        }

        const enNameMatch = cleanText.match(/Name\s+([A-Za-z]+)\s+([A-Za-z]+)/i);
        if (enNameMatch) {
            setFirstNameEn(enNameMatch[1]);
            setLastNameEn(enNameMatch[2]);
        }

        const dobMatch = cleanText.match(/(\d{1,2}\s*[ก-๙\.]+\s*\d{4})/);
        if (dobMatch) setDateOfBirth(dobMatch[1]);

        const houseMatch = cleanText.match(/(?:ที่อยู่|Address)\s*([0-9/]+(?:\s*(?:หมู่ที่|หมู่|ม\.)\s*\d+)?)/);
        if (houseMatch) setAddressNo(houseMatch[1].trim());

        const subDistrictMatch = cleanText.match(/(?:ตำบล|ต\.|แขวง)\s*([ก-๙]+)/);
        if (subDistrictMatch) setSubDistrict(subDistrictMatch[1].trim());

        const districtMatch = cleanText.match(/(?:อำเภอ|อ\.|เขต)\s*([ก-๙]+)/);
        if (districtMatch) setDistrict(districtMatch[1].trim());

        const provinceMatch = cleanText.match(/(?:จังหวัด|จ\.)\s*([ก-๙]+)/);
        if (provinceMatch) setProvince(provinceMatch[1].trim());

        const blob = await (await fetch(dataUrl)).blob();
        setIdImageFile(new File([blob], `id_card_${Date.now()}.jpg`, { type: 'image/jpeg' }));
      }
    } catch (err) {
      console.error(err);
      setStatusMessage('⚠️ ระบบดึงข้อมูลอัตโนมัติขัดข้อง กรุณากรอกด้วยตนเองค่ะ');
      const blob = await (await fetch(dataUrl)).blob();
      setIdImageFile(new File([blob], `id_card_${Date.now()}.jpg`, { type: 'image/jpeg' }));
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmitData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idImageFile || !selfieImageFile || idNumber.length !== 13) {
        setError('กรุณาถ่ายรูปให้ครบทั้ง 2 ขั้นตอน (หน้าบัตรและรูปคู่บัตร) ค่ะ');
        return;
    }
    
    setIsSubmitting(true);
    try {
      // ✨ ประทับลายน้ำเพื่อความปลอดภัย
      const watermarkedId = await addKycWatermark(idImageFile, currentUser.id);
      const watermarkedSelfie = await addKycWatermark(selfieImageFile, currentUser.id);

      const idFileName = `kyc/${currentUser.id}/id_${Date.now()}.jpg`;
      const selfieFileName = `kyc/${currentUser.id}/selfie_${Date.now()}.jpg`;

      const { data: idUploadData, error: idUploadErr } = await supabase.storage.from('kyc-documents').upload(idFileName, watermarkedId);
      if (idUploadErr) throw idUploadErr;

      const { data: selfieUploadData, error: selfieUploadErr } = await supabase.storage.from('kyc-documents').upload(selfieFileName, watermarkedSelfie);
      if (selfieUploadErr) throw selfieUploadErr;

      const full_name = `${firstNameTh} ${lastNameTh}`.trim();
      const full_name_en = `${firstNameEn} ${lastNameEn}`.trim();

      // ✅ อัปเดตข้อมูลด้วยชื่อคอลัมน์ที่คลีนแล้ว
      await supabase.from('profiles').update({
        kyc_status: 'pending',
        kyc_rejected_reason: null, 
        full_name: full_name,
        full_name_en: full_name_en,
        first_name_th: firstNameTh,
        last_name_th: lastNameTh,
        first_name_en: firstNameEn,
        last_name_en: lastNameEn,
        id_card_number: idNumber, // ใช้ id_card_number
        date_of_birth: dateOfBirth, // ใช้ date_of_birth
        address_no: addressNo,
        sub_district: subDistrict,
        district: district,
        province: province,
        id_card_url: idUploadData.path, 
        selfie_url: selfieUploadData.path, // ใช้ selfie_url
        pdpa_consented_at: new Date().toISOString()
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
         <p className="text-gray-500 mb-8">เรากำลังตรวจสอบข้อมูลของคุณบีสาม กรุณารอสักครู่นะคะ</p>
         <button onClick={() => router.push('/profile')} className="bg-[#EE4D2D] text-white px-10 py-4 rounded-full font-black shadow-lg">กลับหน้าโปรไฟล์</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pb-24 relative overflow-hidden">
      <div className="w-full sm:max-w-2xl bg-white min-h-screen flex flex-col shadow-2xl relative">

        {/* --- 📸 UI กล้องถ่ายรูป --- */}
        {isCameraOpen && (
          <div className="fixed inset-0 z-[999] bg-black flex flex-col overflow-hidden">
            <div className="p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
               <button type="button" onClick={stopCamera} className="text-white text-sm font-bold bg-white/20 px-4 py-2 rounded-full backdrop-blur-md">ยกเลิก</button>
               <span className="text-white font-black text-sm tracking-widest uppercase">
                  {captureMode === 'id' ? 'Scan ID Card' : 'Selfie with ID'}
               </span>
               <div className="w-12"></div>
            </div>

            <div className="relative flex-1 flex items-center justify-center px-6">
              <video ref={videoRef} autoPlay playsInline muted className={`absolute inset-0 w-full h-full object-cover opacity-80 ${captureMode === 'selfie' ? 'scale-x-[-1]' : ''}`} />

              {captureMode === 'id' ? (
                <div className="relative z-10 w-full aspect-[86/54] border-2 border-dashed border-orange-500 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] flex items-center justify-center">
                   <div className="absolute inset-0 border-2 border-white/20 rounded-2xl"></div>
                   <p className="text-white/40 font-black text-xs tracking-tighter uppercase">วางหน้าบัตรให้พอดีกรอบ</p>
                </div>
              ) : (
                <div className="relative z-10 w-[80%] aspect-[3/4] border-2 border-dashed border-orange-500 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] flex flex-col items-center justify-end pb-10">
                   <p className="text-white font-black text-sm text-center px-4 leading-relaxed bg-black/50 py-2 rounded-xl">ขยับใบหน้าและบัตร<br/>ให้อยู่ในกรอบแนวตั้ง</p>
                </div>
              )}
            </div>

            <div className="bg-black p-10 pb-16 flex flex-col items-center gap-4">
              <button type="button" onClick={captureAndProcess} className="w-20 h-20 bg-white rounded-full border-[6px] border-gray-700 flex items-center justify-center active:scale-90 transition-transform shadow-2xl">
                 <div className="w-14 h-14 bg-white rounded-full border-2 border-black/5"></div>
              </button>
            </div>
          </div>
        )}

        <div className="p-6 border-b sticky top-0 bg-white z-50 flex items-center gap-4">
          <button type="button" onClick={() => router.back()} className="text-2xl font-bold">←</button>
          <h1 className="font-black text-xl">ยืนยันตัวตน</h1>
        </div>

        <div className="p-8 space-y-8">
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-black border border-red-100">{error}</div>}

          {/* 🌟 Step 1: รูปหน้าบัตร */}
          <div className="space-y-3">
            <label className="block text-[11px] font-black text-gray-400 uppercase">1. ถ่ายรูปหน้าบัตรประชาชน</label>
            <div onClick={() => !isScanning && startCamera('id')} className={`border-4 border-dashed rounded-[2rem] p-8 text-center cursor-pointer transition-all ${idPreview ? 'border-green-100 bg-green-50' : 'border-gray-100 bg-gray-50'}`}>
               {isScanning ? (
                 <div className="py-6 space-y-4">
                    <div className="w-10 h-10 border-4 border-[#EE4D2D] border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-sm font-black text-[#EE4D2D] animate-pulse">{statusMessage}</p>
                 </div>
               ) : idPreview ? (
                 <div className="space-y-4">
                   <img src={idPreview} className="max-h-48 mx-auto rounded-xl shadow-md border-2 border-white" alt="ID Preview" />
                   <p className="text-xs font-black text-green-600 uppercase tracking-widest">✅ ดึงข้อมูลสำเร็จ (แตะถ่ายใหม่ได้)</p>
                 </div>
               ) : (
                 <div className="py-10 space-y-3">
                    <div className="text-5xl">📸</div>
                    <p className="text-sm font-black text-[#EE4D2D]">แตะเพื่อเปิดกล้องหลัง</p>
                 </div>
               )}
            </div>
          </div>

          {/* 🌟 Step 2: รูปเซลฟี่คู่บัตร */}
          <div className="space-y-3">
            <label className="block text-[11px] font-black text-gray-400 uppercase">2. ถ่ายเซลฟี่คู่กับบัตร</label>
            <div onClick={() => startCamera('selfie')} className={`border-4 border-dashed rounded-[2rem] p-8 text-center cursor-pointer transition-all ${selfiePreview ? 'border-green-100 bg-green-50' : 'border-gray-100 bg-gray-50'}`}>
               {selfiePreview ? (
                 <div className="space-y-4">
                   <img src={selfiePreview} className="max-h-48 mx-auto rounded-xl shadow-md border-2 border-white" alt="Selfie Preview" />
                   <p className="text-xs font-black text-green-600 uppercase tracking-widest">✅ รูปเซลฟี่พร้อมส่ง (แตะถ่ายใหม่ได้)</p>
                 </div>
               ) : (
                 <div className="py-10 space-y-3">
                    <div className="text-5xl">🤳</div>
                    <p className="text-sm font-black text-[#EE4D2D]">แตะเพื่อเปิดกล้องหน้า</p>
                 </div>
               )}
            </div>
          </div>

          {/* 🌟 Step 3: ฟอร์มตรวจสอบ (หั่นเป็นช่องๆ) */}
          <form onSubmit={handleSubmitData} className="space-y-6">
            <label className="block text-[11px] font-black text-gray-400 uppercase pt-4 border-t">3. ตรวจสอบและแก้ไขข้อมูล</label>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black text-gray-400 mb-2 uppercase">ชื่อ (ไทย)</label>
                <input type="text" value={firstNameTh} onChange={e => setFirstNameTh(e.target.value)} className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-orange-500" required />
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-400 mb-2 uppercase">นามสกุล (ไทย)</label>
                <input type="text" value={lastNameTh} onChange={e => setLastNameTh(e.target.value)} className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-orange-500" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black text-gray-400 mb-2 uppercase">First Name (EN)</label>
                <input type="text" value={firstNameEn} onChange={e => setFirstNameEn(e.target.value)} className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-400 mb-2 uppercase">Last Name (EN)</label>
                <input type="text" value={lastNameEn} onChange={e => setLastNameEn(e.target.value)} className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-orange-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[11px] font-black text-gray-400 mb-2 uppercase">เลขบัตรประชาชน</label>
                <input type="text" value={idNumber} onChange={e => setIdNumber(e.target.value.replace(/\D/g,'').slice(0,13))} className="w-full p-4 bg-gray-50 border-none rounded-2xl font-black tracking-widest text-lg focus:ring-2 focus:ring-orange-500" required />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-black text-gray-400 mb-2 uppercase">วัน/เดือน/ปีเกิด</label>
                <input type="text" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-orange-500" />
              </div>
            </div>

            {/* ส่วนที่อยู่ */}
            <div className="bg-orange-50/50 p-4 rounded-3xl space-y-4 border border-orange-100">
              <label className="block text-[11px] font-black text-[#EE4D2D] uppercase border-b border-orange-200 pb-2">📍 ที่อยู่ตามบัตรประชาชน</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">บ้านเลขที่ / หมู่</label>
                  <input type="text" value={addressNo} onChange={e => setAddressNo(e.target.value)} className="w-full p-3 bg-white border border-orange-100 rounded-xl font-medium focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">ตำบล / แขวง</label>
                  <input type="text" value={subDistrict} onChange={e => setSubDistrict(e.target.value)} className="w-full p-3 bg-white border border-orange-100 rounded-xl font-medium focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">อำเภอ / เขต</label>
                  <input type="text" value={district} onChange={e => setDistrict(e.target.value)} className="w-full p-3 bg-white border border-orange-100 rounded-xl font-medium focus:ring-2 focus:ring-orange-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">จังหวัด</label>
                  <input type="text" value={province} onChange={e => setProvince(e.target.value)} className="w-full p-3 bg-white border border-orange-100 rounded-xl font-medium focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-2xl">
              <input type="checkbox" checked={pdpaConsent} onChange={e => setPdpaConsent(e.target.checked)} className="mt-1 h-5 w-5 rounded" required />
              <p className="text-[10px] text-blue-800 leading-relaxed font-medium">ข้าพเจ้ายินยอมให้ประมวลผลข้อมูลและรูปถ่ายเพื่อยืนยันตัวตน (KYC) ตามนโยบาย PDPA</p>
            </div>

            <button type="submit" disabled={isSubmitting || !idImageFile || !selfieImageFile || isScanning} className="w-full bg-[#EE4D2D] text-white py-5 rounded-full font-black text-sm shadow-xl active:scale-95 disabled:opacity-50 transition-all">
              {isSubmitting ? 'กำลังส่งข้อมูล...' : 'ส่งข้อมูลเพื่อรับการตรวจสอบ'}
            </button>
          </form>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}

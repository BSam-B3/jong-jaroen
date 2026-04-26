'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

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
        .select('kyc_status, full_name, national_id, date_of_birth, address')
        .eq('id', user.id).single();
        
      if (profile) {
        setKycStatus(profile.kyc_status || 'none');
        if (profile.full_name) setFullName(profile.full_name);
        if (profile.national_id) setIdNumber(profile.national_id);
        if (profile.date_of_birth) setDateOfBirth(profile.date_of_birth);
        if (profile.address) setAddress(profile.address);
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
    setStatusMessage('กำลังวิเคราะห์ข้อมูลด้วย AI...');
    
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
      
      // ลบเว้นวรรคและการขึ้นบรรทัดใหม่บางส่วนเพื่อให้อ่านง่ายขึ้น
      const cleanText = rawText.replace(/\n/g, ' ');

      const isValid = rawText.includes('บัตรประจำตัวประชาชน') || rawText.includes('Identification') || rawText.includes('Thai National') || rawText.includes('ประเทศไทย');
      
      if (!isValid) {
        setError('❌ ตรวจไม่พบข้อมูลหน้าบัตร กรุณาถ่ายใหม่ให้ชัดเจนและเห็นเต็มใบค่ะ');
        setIdPreview(null);
      } else {
        setStatusMessage('✅ ดึงข้อมูลสำเร็จ กรุณาตรวจสอบความถูกต้องด้านล่าง');
        
        // --- 🤖 อัปเกรด AI Data Parsing (หาข้อมูลเก่งขึ้น) ---
        
        // 1. หาเลข 13 หลัก (จับเฉพาะตัวเลข เอาให้ชัวร์ว่าครบ 13 ตัว)
        const idMatch = rawText.replace(/\D/g, '').match(/(\d{13})/);
        if (idMatch) setIdNumber(idMatch[1]);

        // 2. หาชื่อ (ดักจับคำนำหน้า แล้วตามด้วยอักษรไทย 2 ก้อน)
        const nameMatch = cleanText.match(/(นาย|นาง|นางสาว)\s*([ก-๙]+)\s+([ก-๙]+)/);
        if (nameMatch) setFullName(`${nameMatch[1]}${nameMatch[2]} ${nameMatch[3]}`);

        // 3. หาวันเกิด (ดักจับรูปแบบ [ตัวเลข] [ชื่อเดือนไทย] [พ.ศ.])
        const dobMatch = cleanText.match(/(\d{1,2}\s*[ก-๙\.]+\s*\d{4})/);
        if (dobMatch) setDateOfBirth(dobMatch[1]);

        // 4. หาที่อยู่ (ดักคำว่าที่อยู่ แล้วกวาดไปจนถึงรหัสไปรษณีย์ หรือคำว่า จังหวัด)
        const addressMatch = cleanText.match(/(?:ที่อยู่|Address)\s*([0-9/]+\s*(?:หมู่|ม\.)?.*?(?:ตำบล|ต\.|อำเภอ|อ\.|จังหวัด|จ\.).*?(?=\s\d{5}|\n|$))/i);
        if (addressMatch) setAddress(addressMatch[1].trim());

        // เตรียมไฟล์อัปโหลด
        const blob = await (await fetch(dataUrl)).blob();
        setIdImageFile(new File([blob], `verified_id_${Date.now()}.jpg`, { type: 'image/jpeg' }));
      }
    } catch (err) {
      console.error(err);
      setStatusMessage('⚠️ ระบบดึงข้อมูลขัดข้อง กรุณากรอกด้วยตนเองค่ะ');
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
        kyc_status: 'pending', 
        full_name: fullName, 
        national_id: idNumber, 
        date_of_birth: dateOfBirth,
        address: address,
        id_card_url: uploadData.path, 
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
         <p className="text-gray-500 mb-8">ระบบกำลังตรวจสอบความถูกต้องของข้อมูล กรุณารอสักครู่ค่ะ</p>
         <button onClick={() => router.push('/profile')} className="bg-[#EE4D2D] text-white px-10 py-4 rounded-full font-black shadow-lg">กลับหน้าโปรไฟล์</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pb-24 relative overflow-hidden">
      <div className="w-full sm:max-w-2xl bg-white min-h-screen flex flex-col shadow-2xl relative">
        
        {/* --- 📸 Dedicated Camera Overlay (จอถ่ายรูปเต็มจอ) --- */}
        {isCameraOpen && (
          <div className="fixed inset-0 z-[999] bg-black flex flex-col">
            {/* Header / ปิดกล้อง */}
            <div className="absolute top-0 left-0 right-0 p-6 z-50 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
               <button type="button" onClick={stopCamera} className="text-white bg-black/40 px-4 py-2 rounded-full font-bold text-sm backdrop-blur-md">ยกเลิก</button>
               <span className="text-white font-black text-sm tracking-wider">ถ่ายรูปหน้าบัตร</span>
               <div className="w-16"></div>
            </div>

            {/* Viewport กล้อง & กรอบบัตร */}
            <div className="relative flex-1 overflow-hidden flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
              
              {/* กรอบสี่เหลี่ยมสัดส่วนบัตรประชาชน */}
              <div className="relative z-10 w-[90%] max-w-sm aspect-[86/54] border-[3px] border-orange-500 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] flex items-center justify-center">
                 {/* เส้นนำสายตา */}
                 <div className="absolute w-8 h-8 border-t-2 border-l-2 border-white top-2 left-2"></div>
                 <div className="absolute w-8 h-8 border-t-2 border-r-2 border-white top-2 right-2"></div>
                 <div className="absolute w-8 h-8 border-b-2 border-l-2 border-white bottom-2 left-2"></div>
                 <div className="absolute w-8 h-8 border-b-2 border-r-2 border-white bottom-2 right-2"></div>
                 <p className="text-white/70 font-black text-xl uppercase tracking-widest opacity-50">วางบัตรในกรอบ</p>
              </div>
            </div>

            {/* พื้นที่ปุ่มกดถ่ายรูป (ย้ายมาล่างสุด กดง่าย) */}
            <div className="bg-black pb-12 pt-6 flex justify-center items-center">
              <button 
                type="button" 
                onClick={captureAndProcess} 
                className="w-20 h-20 bg-white rounded-full border-4 border-gray-400 flex items-center justify-center active:scale-90 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              >
                 <div className="w-16 h-16 bg-white rounded-full border-2 border-black/10"></div>
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
          
          <div className="space-y-3">
            <label className="block text-[11px] font-black text-gray-400 uppercase">1. ถ่ายรูปหน้าบัตรประชาชน</label>
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
                    <div className="text-5xl">📸</div>
                    <p className="text-sm font-black text-[#EE4D2D]">แตะเพื่อเปิดกล้อง</p>
                    <p className="text-[10px] text-gray-400">ระบบ AI จะช่วยดึงข้อมูลจากรูปภาพ</p>
                 </div>
               )}
            </div>
          </div>

          <form onSubmit={handleSubmitData} className="space-y-6">
            <label className="block text-[11px] font-black text-gray-400 uppercase pt-4 border-t">2. ตรวจสอบความถูกต้อง</label>
            
            <div>
              <label className="block text-[11px] font-black text-gray-400 mb-2 uppercase">ชื่อ-นามสกุลจริง</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-orange-500" placeholder="กรอกชื่อตามบัตร" required />
            </div>
            <div>
              <label className="block text-[11px] font-black text-gray-400 mb-2 uppercase">เลขบัตรประชาชน 13 หลัก</label>
              <input type="text" value={idNumber} onChange={e => setIdNumber(e.target.value.replace(/\D/g,'').slice(0,13))} className="w-full p-4 bg-gray-50 border-none rounded-2xl font-black tracking-widest text-lg focus:ring-2 focus:ring-orange-500" placeholder="0000000000000" required />
            </div>
            <div>
              <label className="block text-[11px] font-black text-gray-400 mb-2 uppercase">วัน/เดือน/ปีเกิด (ตามบัตร)</label>
              <input type="text" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-orange-500" placeholder="เช่น 1 ม.ค. 2540" />
            </div>
            <div>
              <label className="block text-[11px] font-black text-gray-400 mb-2 uppercase">ที่อยู่ตามหน้าบัตร</label>
              <textarea value={address} onChange={e => setAddress(e.target.value)} rows={3} className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-orange-500 resize-none" placeholder="บ้านเลขที่, หมู่, ตำบล, อำเภอ, จังหวัด" />
            </div>

            <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-2xl">
              <input type="checkbox" checked={pdpaConsent} onChange={e => setPdpaConsent(e.target.checked)} className="mt-1 h-5 w-5 rounded" required />
              <p className="text-[10px] text-blue-800 leading-relaxed font-medium">ข้าพเจ้ายินยอมให้ประมวลผลข้อมูลส่วนบุคคลและรูปถ่ายตามนโยบายรักษาความปลอดภัย</p>
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

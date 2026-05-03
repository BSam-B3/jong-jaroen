'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function PayJobPage() {
  const { id: jobId } = useParams();
  const router = useRouter();
  const supabase = createClient();
  
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJob = async () => {
      const { data } = await supabase.from('jobs').select('*').eq('id', jobId).single();
      setJob(data);
      setLoading(false);
    };
    fetchJob();
  }, [jobId, supabase]);

  // 🌟 ฟังก์ชันแปลงไฟล์รูปเป็น Base64 เพื่อส่งเข้า API
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsVerifying(true);
    setError('');

    try {
      const base64 = await convertToBase64(file);

      // ส่งรูปไปให้ API ตรวจสอบสลิปที่บีสามทำไว้
      const res = await fetch('/api/verify-slip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          jobId: jobId
        })
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'ตรวจสอบสลิปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      }

      alert('โอนเงินและตรวจสอบสลิปสำเร็จ! ✨ ช่างพร้อมเริ่มงานแล้วค่ะ');
      router.push(`/jobs/${jobId}`);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold bg-[#F4F6F8]">⏳ กำลังดึงข้อมูลงาน...</div>;

  return (
    <div className="min-h-screen bg-[#F4F6F8] p-6 font-sans flex flex-col items-center justify-center pb-20">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-xl">
        
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="text-2xl font-black text-gray-400 active:scale-95 transition-transform">←</button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">ชำระเงินค่าจ้าง 💸</h1>
            <p className="text-gray-500 text-[11px] font-bold mt-1">อัปโหลดสลิปเพื่อเริ่มต้นงาน</p>
          </div>
        </div>

        {/* ยอดเงิน */}
        <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6 text-center mb-8 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-6xl opacity-10">💰</div>
          <p className="text-[11px] font-black text-orange-600 uppercase tracking-widest relative z-10">ยอดเงินที่ต้องโอนเข้าแอป</p>
          <p className="text-5xl font-black text-[#EE4D2D] mt-2 relative z-10">
            ฿{job?.budget?.toLocaleString('th-TH')}
          </p>
        </div>

        {/* ส่วนอัปโหลดสลิป */}
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-black border border-red-100 text-center leading-relaxed">
              ❌ {error}
            </div>
          )}

          <label className={`flex flex-col items-center justify-center w-full h-56 border-4 border-dashed rounded-[2rem] transition-all cursor-pointer ${isVerifying ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200' : 'hover:bg-orange-50 border-orange-200 bg-white'}`}>
            {isVerifying ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#EE4D2D] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-black text-gray-700 animate-pulse">กำลังให้ AI ตรวจสลิป...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center px-4">
                <span className="text-6xl mb-2 drop-shadow-md">📄</span>
                <p className="text-sm font-black text-[#EE4D2D]">กดตรงนี้เพื่อแนบสลิปโอนเงิน</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-relaxed">
                  ระบบจะตรวจสอบยอดเงิน<br/>และวันที่โอนอัตโนมัติ
                </p>
              </div>
            )}
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={isVerifying} />
          </label>
        </div>

        <button onClick={() => router.back()} className="w-full mt-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs hover:bg-gray-200 transition-colors active:scale-95">
          ไว้จ่ายทีหลัง
        </button>
      </div>
    </div>
  );
}

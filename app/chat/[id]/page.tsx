'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ChatPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const jobId = params.id;

  const [job, setJob] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // State สำหรับระบบรีวิว
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function initChat() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/auth/login');
      setCurrentUser(session.user);

      // ดึงข้อมูลงานและคู่สัญญา
      const { data } = await supabase
        .from('jobs')
        .select('*, employer:profiles!employer_id(full_name), worker:profiles!worker_id(full_name)')
        .eq('id', jobId)
        .single();

      setJob(data);
      setLoading(false);
    }
    initChat();
  }, [jobId, router, supabase]);

  // 📸 1. ช่างกดส่งงานแนบรูป
  const handleUploadAndSubmit = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!confirm('ยืนยันการแนบรูปนี้เพื่อส่งมอบงานใช่ไหมคะ?')) return;
    setIsActionLoading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${jobId}-proof-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('job-proofs').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('job-proofs').getPublicUrl(fileName);

      const { error } = await supabase
        .from('jobs')
        .update({ status: 'delivered', delivery_image_url: publicUrlData.publicUrl, updated_at: new Date().toISOString() })
        .eq('id', jobId);
        
      if (error) throw error;

      alert('ส่งงานและแนบรูปเรียบร้อย! ✨');
      window.location.reload();
    } catch (err: any) { 
      alert('เกิดข้อผิดพลาด: ' + err.message); 
    } finally { 
      setIsActionLoading(false); 
    }
  };

  // 💸 2. ลูกค้ากดรับงานและปล่อยเงิน
  const handleReleaseFunds = async () => {
    if (!confirm('ตรวจรูปงานเรียบร้อยแล้ว ยืนยันการปล่อยเงินให้ช่างใช่ไหมคะ?')) return;
    setIsActionLoading(true);
    try {
      const { error } = await supabase.rpc('release_escrow', { p_job_id: jobId });
      if (error) throw error;
      
      alert('ปล่อยเงินสำเร็จ! 🎉\nอย่าลืมให้คะแนนช่างด้านล่างด้วยนะคะ!');
      window.location.reload(); 
    } catch (err: any) { 
      alert(err.message); 
    } finally { 
      setIsActionLoading(false); 
    }
  };

  // ⭐ 3. ลูกค้ากดส่งรีวิว
  const handleSubmitReview = async () => {
    if (!confirm('ยืนยันการให้คะแนนช่างใช่ไหมคะ?')) return;
    setIsActionLoading(true);
    try {
      const { error } = await supabase.rpc('submit_review', {
        p_job_id: jobId,
        p_rating: rating,
        p_review_text: reviewText
      });
      if (error) throw error;
      alert('ขอบคุณสำหรับรีวิวค่ะ! 🌟 ช่างได้คะแนนเรียบร้อยแล้ว');
      window.location.reload();
    } catch (err: any) { 
      alert(err.message); 
    } finally { 
      setIsActionLoading(false); 
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">⏳ กำลังเปิดห้องคุย...</div>;

  const isWorker = currentUser?.id === job?.worker_id;
  const isEmployer = currentUser?.id === job?.employer_id;

  // สร้างรหัสอ้างอิงสั้นๆ จาก UUID 6 ตัวแรก
  const shortRefId = job?.id ? job.id.substring(0, 6).toUpperCase() : 'UNKNOWN';

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col font-sans">

      {/* 🟢 Action Header */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button onClick={() => router.back()} className="text-gray-400 text-2xl active:scale-95 transition-transform shrink-0">←</button>
          
          <div className="text-center flex-1 mx-2">
            <h1 className="font-black text-gray-800 text-sm md:text-base line-clamp-1" title={job?.title}>{job?.title || 'ห้องแชทงาน'}</h1>
            
            {/* 🌟 เพิ่มส่วนแสดง Ref ID และงบประมาณ ให้ User แยกแยะงานได้ชัดเจน */}
            <div className="flex items-center justify-center gap-2 mt-1.5 flex-wrap">
               <span className="text-[9px] font-black text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                 Ref: #{shortRefId}
               </span>
               <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                 ฿{job?.budget?.toLocaleString() || '0'}
               </span>
               <span className="text-[9px] font-bold text-[#EE4D2D] uppercase tracking-widest flex items-center gap-1">
                 <span className={`w-1.5 h-1.5 rounded-full ${job?.status === 'completed' ? 'bg-emerald-500' : 'bg-[#EE4D2D] animate-pulse'}`}></span>
                 สถานะ: {job?.status === 'in_progress' ? 'กำลังดำเนินการ' : job?.status === 'delivered' ? 'ส่งมอบแล้ว' : job?.status}
               </span>
            </div>
          </div>

          <div className="w-8 shrink-0"></div>
        </div>

        {/* ปุ่มตามหน้าที่ (Role-based Actions) */}
        <div className="max-w-2xl mx-auto mt-4">
          
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleUploadAndSubmit} className="hidden" />

          {isWorker && job?.status === 'in_progress' && (
            <button onClick={() => fileInputRef.current?.click()} disabled={isActionLoading} className="w-full bg-[#EE4D2D] text-white py-3 rounded-2xl font-black text-sm shadow-md active:scale-95 transition-transform disabled:opacity-50">
              {isActionLoading ? 'กำลังอัปโหลดรูป...' : '📸 ถ่ายรูปผลงาน & ส่งมอบ (เก็บตังค์!)'}
            </button>
          )}

          {isEmployer && job?.status === 'delivered' && (
            <button onClick={handleReleaseFunds} disabled={isActionLoading} className="w-full bg-emerald-500 text-white py-3 rounded-2xl font-black text-sm shadow-md active:scale-95 transition-transform disabled:opacity-50">
              {isActionLoading ? 'กำลังประมวลผล...' : '✅ ตรวจรูปผลงาน & ปล่อยเงิน 💸'}
            </button>
          )}

          {/* กล่องรีวิว (แสดงเฉพาะฝั่งผู้ว่าจ้างที่จ่ายเงินแล้วแต่ยังไม่ได้รีวิว) */}
          {job?.status === 'completed' && isEmployer && !job?.rating && (
            <div className="w-full bg-white p-4 rounded-2xl border border-orange-200 shadow-sm animate-in fade-in slide-in-from-top-2">
              <p className="text-sm font-black text-gray-800 text-center mb-2">ให้คะแนนช่างหน่อยค่ะ 🌟</p>
              <div className="flex justify-center gap-2 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setRating(star)} className={`text-3xl transition-transform active:scale-75 ${rating >= star ? 'text-orange-400' : 'text-gray-200'}`}>
                    ★
                  </button>
                ))}
              </div>
              <textarea 
                value={reviewText} onChange={(e) => setReviewText(e.target.value)}
                placeholder="ประทับใจตรงไหน พิมพ์ชมช่างได้เลย..." 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs mb-3 focus:ring-2 focus:ring-orange-400 outline-none"
                rows={2}
              />
              <button onClick={handleSubmitReview} disabled={isActionLoading} className="w-full bg-gray-900 text-white py-2.5 rounded-xl font-black text-xs shadow-md">
                {isActionLoading ? 'กำลังบันทึก...' : 'ส่งรีวิว'}
              </button>
            </div>
          )}

          {/* ป้ายแสดงเมื่อจบงานและรีวิวแล้ว */}
          {job?.status === 'completed' && (job?.rating || isWorker) && (
            <div className="w-full bg-emerald-50 text-emerald-600 py-3 rounded-2xl font-black text-xs text-center border border-emerald-100 flex flex-col gap-1">
              <span>🎉 งานนี้สำเร็จเรียบร้อยแล้ว</span>
              {job?.rating && <span className="text-orange-500 text-lg">{'★'.repeat(job.rating)}</span>}
            </div>
          )}
        </div>
      </div>

      {/* 💬 Chat Area */}
      <main className="flex-1 p-6 space-y-4 max-w-2xl mx-auto w-full">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 self-start max-w-[80%]">
          <p className="text-xs font-bold text-[#EE4D2D] mb-1">จงเจริญ AI 🤖</p>
          <p className="text-sm text-gray-700 leading-relaxed">
            ยินดีด้วยค่ะ! ห้องแชทเปิดแล้ว คุยรายละเอียดงานกันที่นี่ได้เลยนะ<br/>
            <span className="font-bold">ช่าง:</span> เมื่อทำงานเสร็จ ให้กดปุ่มถ่ายรูปด้านบนเพื่อส่งงานนะคะ
          </p>
        </div>

        {/* 📸 แสดงรูปผลงานที่ช่างอัปโหลด (ถ้ามี) */}
        {job?.delivery_image_url && (
          <div className="flex flex-col items-center mt-2 p-4 bg-white rounded-[2rem] border border-emerald-100 shadow-sm animate-in zoom-in duration-300">
            <p className="text-xs font-black text-emerald-600 mb-3 uppercase tracking-widest">📦 รูปหลักฐานการส่งมอบงาน</p>
            <img 
              src={job.delivery_image_url} 
              alt="Proof of work" 
              className="rounded-2xl w-full max-w-sm object-cover border border-gray-100 shadow-sm" 
            />
            {isEmployer && job.status === 'delivered' && (
              <p className="text-[10px] text-gray-400 mt-3 font-bold text-center">
                กรุณาตรวจสอบผลงานก่อนกดปล่อยเงินด้านบนนะคะ
              </p>
            )}
          </div>
        )}

        {/* ตัวอย่างแชทจำลอง (เตรียมต่อ Realtime ในอนาคต) */}
        <div className="flex flex-col gap-2">
           <div className={`p-4 rounded-2xl shadow-sm max-w-[80%] ${isWorker ? 'bg-[#EE4D2D] text-white self-end' : 'bg-white text-gray-800 self-start border border-gray-100'}`}>
              <p className="text-sm font-medium">สวัสดีครับ พร้อมลุยงานแล้วครับ!</p>
           </div>
        </div>
      </main>

      {/* ⌨️ Input Area */}
      <div className="p-4 bg-white border-t border-gray-100 sticky bottom-0">
        <div className="max-w-2xl mx-auto flex gap-2">
          <input 
            type="text" 
            placeholder="พิมพ์ข้อความที่นี่..." 
            className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#EE4D2D] focus:border-transparent outline-none transition-all"
          />
          <button className="bg-[#EE4D2D] text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-md active:scale-95 transition-transform">
            🚀
          </button>
        </div>
      </div>

    </div>
  );
}

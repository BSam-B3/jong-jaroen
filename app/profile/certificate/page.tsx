'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface UserCertificate {
  id: string;
  title: string;
  image_url: string;
  created_at: string;
}

export default function CertificateGalleryPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [certificates, setCertificates] = useState<UserCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States สำหรับฟอร์มอัปโหลด
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCertificates();
  }, []);

  async function loadCertificates() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);

      // ดึงข้อมูลจากตาราง user_certificates (เดี๋ยวเราไปสร้างตารางนี้ทีหลังได้ค่ะ)
      const { data } = await supabase
        .from('user_certificates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      setCertificates(data || []);
    } catch (_e) {
      // ซ่อน Error ไว้ก่อนเพื่อให้ UI โชว์ตอนเทสต์
    }
    setLoading(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('ขนาดไฟล์ต้องไม่เกิน 10MB');
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setError('');
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('กรุณาระบุชื่อใบประกาศ'); return; }
    if (!file) { setError('กรุณาอัปโหลดรูปภาพใบประกาศ'); return; }

    setSaving(true);
    setError('');

    try {
      // 1. อัปโหลดรูปขึ้น Storage
      const ext = file.name.split('.').pop();
      const path = `certs/${userId}_${Date.now()}.${ext}`;
      
      const { error: upErr } = await supabase.storage
        .from('certificates-gallery')
        .upload(path, file, { upsert: true });
        
      if (upErr) throw upErr;

      // 2. ขอลิงก์รูปภาพ
      const { data: urlData } = supabase.storage
        .from('certificates-gallery')
        .getPublicUrl(path);

      // 3. บันทึกข้อมูลลง Database
      const { error: dbErr } = await supabase.from('user_certificates').insert({
        user_id: userId,
        title: title.trim(),
        image_url: urlData.publicUrl,
      });

      if (dbErr) throw dbErr;

      // สำเร็จ
      setShowForm(false);
      setTitle('');
      setFile(null);
      setPreviewUrl('');
      loadCertificates();

    } catch (err) {
      setError('เกิดข้อผิดพลาดในการอัปโหลด กรุณาลองใหม่');
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('ต้องการลบใบประกาศนี้ใช่หรือไม่?')) return;
    try {
      await supabase.from('user_certificates').delete().eq('id', id);
      setCertificates(prev => prev.filter(c => c.id !== id));
    } catch (_e) {
      alert('ลบไม่สำเร็จ');
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center"><div className="text-4xl animate-bounce mb-2 text-[#EE4D2D]">🖼️</div><p className="text-gray-500 font-bold text-sm">กำลังโหลดคลังภาพ...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pb-24">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl">
        
        {/* 🟠 Header (โทนส้มทอง Shopee) */}
        <header className="bg-gradient-to-br from-[#EE4D2D] to-[#FF7337] rounded-b-[2.5rem] p-6 pt-12 shadow-sm relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <button onClick={() => router.back()} className="text-white font-bold text-lg active:scale-90 transition-transform">←</button>
              <div className="leading-tight">
                <h1 className="text-xl font-black text-white tracking-tight">ใบรับรองฝีมือ</h1>
                <p className="text-[10px] text-white/90 font-medium mt-0.5">คลังภาพประกาศนียบัตร / ใบผ่านงาน</p>
              </div>
            </div>
            {!showForm && (
              <button 
                onClick={() => setShowForm(true)} 
                className="bg-white text-[#EE4D2D] text-xs px-4 py-2 rounded-full font-bold shadow-md hover:bg-gray-50 active:scale-95 transition-all flex items-center gap-1"
              >
                + อัปโหลด
              </button>
            )}
          </div>
        </header>

        <main className="p-5 flex-1 relative z-20 -mt-2 space-y-4">
          
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs font-bold shadow-sm flex items-start gap-2"><span>⚠️</span> {error}</div>}

          {/* 📤 ฟอร์มอัปโหลดรูป */}
          {showForm && (
            <div className="bg-white rounded-[1.5rem] shadow-sm p-6 border border-gray-100 animate-fade-in relative">
              <button onClick={() => {setShowForm(false); setError('');}} className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 font-bold">✕</button>
              
              <h3 className="font-black text-[#EE4D2D] text-base border-b border-gray-100 pb-3 flex items-center gap-2 mb-4">
                <span>🖼️</span> อัปโหลดใบประกาศใหม่
              </h3>

              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 mb-1 block ml-1">ชื่อใบประกาศ / คอร์สที่อบรม <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="เช่น ใบผ่านการอบรมล้างแอร์..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium text-gray-800 outline-none focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]/50 transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 mb-1 block ml-1">รูปภาพใบประกาศ <span className="text-red-500">*</span></label>
                  <div 
                    onClick={() => fileRef.current?.click()}
                    className={`w-full aspect-[4/3] border-2 border-dashed rounded-[1.5rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden relative transition-colors ${previewUrl ? 'border-green-400 bg-black' : 'border-gray-300 hover:border-[#EE4D2D] bg-gray-50'}`}
                  >
                    {previewUrl ? (
                      <>
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <span className="text-white font-bold bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">เปลี่ยนรูปภาพ</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <div className="text-4xl mb-2 opacity-40 text-[#EE4D2D]">📸</div>
                        <p className="text-sm font-bold text-gray-600">แตะเพื่ออัปโหลดรูปภาพ</p>
                        <p className="text-[10px] text-gray-400 mt-1">รองรับ JPG, PNG แนวนอนจะสวยที่สุด</p>
                      </div>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-[#EE4D2D] hover:bg-[#D74022] active:scale-[0.98] disabled:bg-gray-300 disabled:scale-100 text-white font-black py-4 rounded-full text-base shadow-lg transition-all mt-2"
                >
                  {saving ? '⏳ กำลังอัปโหลด...' : '📤 บันทึกเข้าคลังภาพ'}
                </button>
              </form>
            </div>
          )}

          {/* 🖼️ แกลลอรี่รูปภาพ */}
          {!showForm && certificates.length === 0 ? (
            <div className="bg-white rounded-[1.5rem] p-10 text-center shadow-sm border border-gray-100 mt-4">
              <div className="text-6xl mb-4 opacity-50">🖼️</div>
              <p className="text-gray-800 font-black text-lg">ยังไม่มีใบประกาศ</p>
              <p className="text-gray-500 text-xs mt-2 leading-relaxed">
                อัปโหลดรูปถ่ายใบรับรอง หรือใบผ่านการอบรม<br/>ของคุณ เพื่อโชว์ให้ลูกค้าเห็นถึงความเชี่ยวชาญสิคะ
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-6 bg-orange-50 text-[#EE4D2D] border border-orange-100 text-sm px-6 py-3 rounded-full font-bold hover:bg-orange-100 active:scale-95 transition-all shadow-sm"
              >
                + อัปโหลดใบแรก
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              {certificates.map((cert) => (
                <div key={cert.id} className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden group">
                  {/* รูปใบประกาศ */}
                  <div className="w-full aspect-[4/3] bg-gray-100 relative">
                    <img src={cert.image_url} alt={cert.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    
                    {/* ปุ่มลบมุมขวาบน (จะโชว์ตลอดเพื่อให้กดง่ายในมือถือ) */}
                    <button 
                      onClick={() => handleDelete(cert.id)}
                      className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm text-red-500 rounded-full flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                    >
                      🗑️
                    </button>
                  </div>
                  
                  {/* ชื่อใบประกาศ */}
                  <div className="p-4 bg-white relative z-10 border-t border-gray-50">
                    <h3 className="font-bold text-gray-800 text-sm leading-tight line-clamp-2">{cert.title}</h3>
                    <p className="text-[10px] text-gray-400 mt-1 font-medium">อัปโหลดเมื่อ: {new Date(cert.created_at).toLocaleDateString('th-TH')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

        </main>

        {/* 🧭 Bottom Nav */}
        <div className="fixed bottom-0 w-full sm:max-w-2xl md:max-w-3xl bg-white/95 backdrop-blur-md border-t border-gray-100 px-8 py-4 flex justify-between items-center shadow-[0_-4px_25px_rgba(0,0,0,0.06)] rounded-t-[2.5rem] z-50">
           <button onClick={() => router.push('/')} className="flex flex-col items-center gap-1 opacity-40"><span className="text-xl">🏠</span><span className="text-[10px] font-bold text-gray-500">หน้าแรก</span></button>
           <button onClick={() => router.push('/services')} className="flex flex-col items-center gap-1 opacity-40"><span className="text-xl">🛠️</span><span className="text-[10px] font-bold text-gray-500">บริการ</span></button>
           <button onClick={() => router.push('/win-online')} className="flex flex-col items-center gap-1 opacity-40"><span className="text-xl">📋</span><span className="text-[10px] font-bold text-gray-500">ด่วนนน</span></button>
           <button onClick={() => router.push('/history')} className="flex flex-col items-center gap-1 opacity-40"><span className="text-xl">📜</span><span className="text-[10px] font-bold text-gray-500">ประวัติ</span></button>
           <div className="flex flex-col items-center gap-1 scale-110"><span className="text-xl">👤</span><span className="text-[10px] font-bold text-[#EE4D2D]">ฉัน</span><div className="w-1.5 h-1.5 bg-[#EE4D2D] rounded-full shadow-sm"></div></div>
        </div>

      </div>
    </div>
  );
}

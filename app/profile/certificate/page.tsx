'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Certificate {
  id: string;
  user_id: string;
  full_name: string;
  total_jobs: number;
  skills: string[];
  issued_at: string;
  cert_number: string;
}

interface Profile {
  id: string;
  full_name: string;
  total_jobs: number;
  skills: string[];
  kyc_status: string;
  avg_rating: number;
  is_verified: boolean;
}

export default function CertificatePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const CERT_MIN_JOBS = 5;

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, total_jobs, skills, kyc_status, avg_rating, is_verified')
        .eq('id', user.id)
        .single();

      if (profileData) setProfile(profileData as Profile);

      const { data: certData } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', user.id)
        .order('issued_at', { ascending: false })
        .limit(1)
        .single();

      if (certData) setCert(certData as Certificate);
      setLoading(false);
    };
    load();
  }, [router]);

  const generateQR = (certId: string) => {
    const verifyUrl = window.location.origin + '/verify/' + certId;
    const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(verifyUrl);
    setQrDataUrl(qrUrl);
  };

  const issueCertificate = async () => {
    if (!profile) return;
    if (profile.total_jobs < CERT_MIN_JOBS) {
      alert('ต้องทำงานครบ ' + CERT_MIN_JOBS + ' งานก่อน (ปัจจุบัน: ' + profile.total_jobs + ' งาน)');
      return;
    }
    if (profile.kyc_status !== 'approved') {
      alert('ต้องผ่านการยืนยัน KYC ก่อนจึงจะออกใบรับรองได้');
      return;
    }
    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const now = new Date();
      const certNum = 'JJ-' + now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
      const { data, error } = await supabase
        .from('certificates')
        .upsert({
          user_id: user.id,
          full_name: profile.full_name,
          total_jobs: profile.total_jobs,
          skills: profile.skills,
          cert_number: certNum,
          issued_at: now.toISOString(),
        }, { onConflict: 'user_id' })
        .select()
        .single();
      if (error) throw error;
      if (data) {
        setCert(data as Certificate);
        generateQR(data.id);
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (cert?.id) generateQR(cert.id);
  }, [cert?.id]);

  const handlePrint = () => { window.print(); };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-2 text-[#EE4D2D]">📄</div>
          <p className="text-gray-500 text-sm font-bold">กำลังโหลดใบรับรอง...</p>
        </div>
      </div>
    );
  }

  const canIssueCert = profile && profile.total_jobs >= CERT_MIN_JOBS && profile.kyc_status === 'approved';
  const progressPct = Math.min(100, ((profile?.total_jobs || 0) / CERT_MIN_JOBS) * 100);

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #cert-printable, #cert-printable * { visibility: visible; }
          #cert-printable { position: fixed; left: 0; top: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: white;}
          .no-print { display: none !important; }
        }
      `}</style>
      <div className="min-h-screen bg-gray-100 flex justify-center pb-24">
        <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl">
          
          {/* 🟠 Header */}
          <header className="bg-gradient-to-br from-[#EE4D2D] to-[#FF7337] rounded-b-[2.5rem] p-6 pt-12 shadow-sm relative z-10 no-print">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <button onClick={() => router.back()} className="text-white font-bold text-lg active:scale-90 transition-transform">←</button>
                <h1 className="text-xl font-black text-white tracking-tight">ใบรับรองฝีมือ</h1>
              </div>
              {cert && (
                <button onClick={handlePrint} className="bg-white text-[#EE4D2D] text-xs px-4 py-2 rounded-full font-bold shadow-md hover:bg-gray-50 active:scale-95 transition-all flex items-center gap-1">
                  🖨️ พิมพ์ PDF
                </button>
              )}
            </div>
            <p className="text-[10px] text-white/90 font-medium mt-0.5 ml-8">เครื่องหมายการันตีคุณภาพจากจงเจริญ</p>
          </header>

          <main className="p-4 flex-1 relative z-20 -mt-2 space-y-4">
            
            {/* การ์ดบอกสถานะความคืบหน้า (ถ้ายังไม่มีใบรับรอง) */}
            {!cert && (
              <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 no-print animate-fade-in">
                <div className="flex items-center gap-3 mb-4 border-b border-gray-50 pb-3">
                  <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-2xl shadow-inner">🎯</div>
                  <div>
                    <h3 className="font-black text-gray-800 text-base">ความคืบหน้าสู่ใบรับรอง</h3>
                    <p className="text-xs text-gray-500">สะสมผลงานให้ครบเพื่อปลดล็อก</p>
                  </div>
                </div>
                
                <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                  <span>งานที่เสร็จ: <strong className="text-[#EE4D2D] text-sm">{profile?.total_jobs || 0}</strong> งาน</span>
                  <span>เป้าหมาย: <strong>{CERT_MIN_JOBS}</strong> งาน</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 mb-3 shadow-inner overflow-hidden">
                  <div className="bg-gradient-to-r from-[#FF7337] to-[#EE4D2D] h-full rounded-full transition-all duration-1000" style={{ width: progressPct + '%' }} />
                </div>
                
                <p className="text-[11px] text-gray-500 text-center mb-4">
                  {canIssueCert ? '🎉 คุณผ่านเกณฑ์แล้ว! กดออกใบรับรองด้านล่างได้เลย' : `พยายามเข้านะ! ขาดอีก ${CERT_MIN_JOBS - (profile?.total_jobs || 0)} งาน`}
                </p>
                
                {profile?.kyc_status !== 'approved' && (
                  <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl text-center mb-4 border border-red-100">
                    ⚠️ คุณต้องผ่านการยืนยันตัวตน (KYC) ก่อน
                  </div>
                )}
                
                <button
                  onClick={issueCertificate}
                  disabled={!canIssueCert || generating}
                  className="w-full bg-[#EE4D2D] hover:bg-[#D74022] disabled:bg-gray-300 disabled:scale-100 text-white font-black py-4 rounded-full text-sm shadow-md active:scale-[0.98] transition-all"
                >
                  {generating ? '⏳ กำลังออกใบรับรอง...' : '📜 ขอรับใบรับรองฝีมือ'}
                </button>
              </div>
            )}

            {/* หน้าตาใบรับรอง (แสดงเมื่อออกแล้ว) */}
            {cert && (
              <div id="cert-printable" ref={printRef} className="animate-fade-in">
                {/* กรอบทอง/ส้ม */}
                <div className="bg-gradient-to-br from-[#EE4D2D] via-[#FF7337] to-[#EE4D2D] p-2 rounded-[2rem] shadow-2xl">
                  {/* พื้นหลังกระดาษ */}
                  <div className="bg-[#FFFDF9] rounded-[1.5rem] overflow-hidden border-4 border-white relative">
                    
                    {/* ลายน้ำพื้นหลัง (ตกแต่ง) */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                      <span className="text-9xl font-black transform -rotate-45">JONG JAROEN</span>
                    </div>

                    {/* หัวใบรับรอง */}
                    <div className="bg-gradient-to-r from-orange-50 via-white to-orange-50 py-5 px-6 border-b border-orange-100 flex items-center justify-between">
                      <div>
                        <div className="text-[#EE4D2D] font-black text-2xl tracking-widest drop-shadow-sm">จงเจริญ</div>
                        <div className="text-gray-500 text-[9px] font-bold uppercase tracking-[0.2em] mt-0.5">JONG JAROEN PLATFORM</div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Certificate of Excellence</p>
                        <p className="text-xs text-gray-600 font-bold">Prasae Community</p>
                      </div>
                    </div>
                    
                    {/* เนื้อหาใบรับรอง */}
                    <div className="p-8 text-center relative z-10">
                      <h2 className="text-2xl sm:text-3xl font-black text-gray-800 mb-1">ใบรับรองเกียรติคุณ</h2>
                      <p className="text-sm text-gray-500 font-medium mb-6">มอบเพื่อแสดงว่า</p>
                      
                      <p className="text-3xl sm:text-4xl font-black text-[#EE4D2D] mb-4 drop-shadow-sm">{cert.full_name}</p>
                      
                      <p className="text-sm text-gray-600 font-medium leading-relaxed max-w-sm mx-auto mb-6">
                        ได้ผ่านการตรวจสอบประวัติและส่งมอบผลงานคุณภาพครบ <br/>
                        <strong className="text-lg text-[#EE4D2D] bg-orange-50 px-3 py-1 rounded-lg mx-1">{cert.total_jobs} งาน</strong> <br/>
                        บนแพลตฟอร์มจงเจริญ เป็นที่ประจักษ์ถึงความซื่อสัตย์และฝีมือ
                      </p>

                      {cert.skills && cert.skills.length > 0 && (
                        <div className="mb-8">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">ความเชี่ยวชาญที่ได้รับการรับรอง</p>
                          <div className="flex flex-wrap gap-2 justify-center">
                            {cert.skills.map((skill, i) => (
                              <span key={i} className="text-xs bg-white text-[#EE4D2D] border border-orange-200 px-3 py-1.5 rounded-full font-bold shadow-sm">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-end justify-between gap-4 text-left border-t-2 border-dashed border-gray-200 pt-6 mt-4">
                        <div className="flex-1">
                          <p className="text-[10px] text-gray-400 font-bold mb-0.5">เลขที่ใบรับรอง (Ref No.)</p>
                          <p className="text-sm font-black text-gray-800 font-mono tracking-wider mb-3">{cert.cert_number}</p>
                          
                          <p className="text-[10px] text-gray-400 font-bold mb-0.5">วันที่ออกใบรับรอง (Issued Date)</p>
                          <p className="text-sm font-bold text-gray-700">
                            {new Date(cert.issued_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                        
                        {/* โซน QR Code */}
                        <div className="text-center flex flex-col items-center">
                          {qrDataUrl ? (
                            <img src={qrDataUrl} alt="QR Code" className="w-24 h-24 rounded-xl p-1 border border-gray-200 bg-white shadow-sm mb-1.5" />
                          ) : (
                            <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center mb-1.5"><span className="text-xs text-gray-400">QR</span></div>
                          )}
                          <p className="text-[9px] text-gray-500 font-bold tracking-widest uppercase">Scan to Verify</p>
                        </div>
                      </div>
                      
                      <div className="mt-8 text-center">
                         <div className="inline-flex items-center gap-1.5 bg-[#EE4D2D] text-white px-4 py-1.5 rounded-full shadow-md">
                           <span className="text-sm">🎖️</span>
                           <span className="text-[10px] font-black tracking-wider uppercase">Jong Jaroen Verified</span>
                         </div>
                      </div>

                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3 no-print">
                  <button onClick={handlePrint} className="w-full bg-[#EE4D2D] text-white py-4 rounded-full font-black text-sm shadow-md hover:bg-[#D74022] active:scale-95 transition-all flex justify-center items-center gap-2">
                    🖨️ ดาวน์โหลด / พิมพ์ PDF
                  </button>
                  <button onClick={issueCertificate} disabled={generating} className="w-full bg-white text-gray-600 border border-gray-200 py-3.5 rounded-full font-bold text-sm hover:bg-gray-50 active:scale-95 transition-all">
                    {generating ? '⏳ กำลังออกใหม่...' : '🔄 ขออัปเดตใบรับรองใหม่'}
                  </button>
                </div>
              </div>
            )}

            <div className="bg-orange-50 border border-orange-100 rounded-[1.5rem] p-5 shadow-sm mt-4 no-print">
              <p className="text-xs text-gray-700 leading-relaxed font-medium">
                <strong className="text-[#EE4D2D]">🔒 การตรวจสอบความถูกต้อง:</strong> นายจ้างหรือบุคคลทั่วไป สามารถสแกน QR Code บนใบรับรองนี้ เพื่อตรวจสอบประวัติและผลงานของคุณผ่านระบบของจงเจริญได้ทันที
              </p>
            </div>
          </main>

          {/* 🧭 Bottom Nav */}
          <div className="fixed bottom-0 w-full sm:max-w-2xl md:max-w-3xl bg-white/95 backdrop-blur-md border-t border-gray-100 px-8 py-4 flex justify-between items-center shadow-[0_-4px_25px_rgba(0,0,0,0.06)] rounded-t-[2.5rem] z-50 no-print">
             <button onClick={() => router.push('/')} className="flex flex-col items-center gap-1 opacity-40"><span className="text-xl">🏠</span><span className="text-[10px] font-bold text-gray-500">หน้าแรก</span></button>
             <button onClick={() => router.push('/services')} className="flex flex-col items-center gap-1 opacity-40"><span className="text-xl">🛠️</span><span className="text-[10px] font-bold text-gray-500">บริการ</span></button>
             <button onClick={() => router.push('/win-online')} className="flex flex-col items-center gap-1 opacity-40"><span className="text-xl">📋</span><span className="text-[10px] font-bold text-gray-500">ด่วนนน</span></button>
             <button onClick={() => router.push('/history')} className="flex flex-col items-center gap-1 opacity-40"><span className="text-xl">📜</span><span className="text-[10px] font-bold text-gray-500">ประวัติ</span></button>
             <div className="flex flex-col items-center gap-1 scale-110"><span className="text-xl">👤</span><span className="text-[10px] font-bold text-[#EE4D2D]">ฉัน</span><div className="w-1.5 h-1.5 bg-[#EE4D2D] rounded-full shadow-sm"></div></div>
          </div>

        </div>
      </div>
    </>
  );
}

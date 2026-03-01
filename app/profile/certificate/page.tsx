'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
      if (!user) { router.push('/auth/login'); return; }

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
      alert('ต้องผ่านการยืนยัน KYC ก่อน');
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cert?.id]);

  const handlePrint = () => { window.print(); };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-2">📄</div>
          <p className="text-gray-500 text-sm">กำลังโหลด...</p>
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
          #cert-printable { position: fixed; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white shadow-sm sticky top-0 z-10 no-print">
          <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link href="/profile" className="text-gray-400 hover:text-gray-600">← กลับ</Link>
            <h1 className="text-lg font-bold text-gray-800 flex-1">📄 ใบรับรองฝีมือ</h1>
            {cert && (
              <button onClick={handlePrint} className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium">
                🖨️ พิมพ์ PDF
              </button>
            )}
          </div>
        </header>

        <main className="max-w-xl mx-auto px-4 py-5 space-y-4">
          {!cert && (
            <div className="bg-white rounded-2xl p-5 shadow-sm no-print">
              <h3 className="text-sm font-bold text-gray-800 mb-3">🎯 ความคืบหน้าสู่ใบรับรอง</h3>
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>งานที่เสร็จ: <strong className="text-gray-800">{profile?.total_jobs || 0}</strong> งาน</span>
                <span>เป้าหมาย: <strong className="text-blue-600">{CERT_MIN_JOBS} งาน</strong></span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className="bg-gradient-to-r from-blue-500 to-blue-700 h-3 rounded-full transition-all" style={{ width: progressPct + '%' }} />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {canIssueCert ? '🎉 คุณผ่านเกณฑ์แล้ว! กดออกใบรับรองได้เลย' : 'ขาดอีก ' + (CERT_MIN_JOBS - (profile?.total_jobs || 0)) + ' งาน'}
              </p>
              {profile?.kyc_status !== 'approved' && (
                <p className="text-xs text-orange-600 mt-1">⚠️ ต้องผ่านการยืนยัน KYC ก่อน</p>
              )}
              <button
                onClick={issueCertificate}
                disabled={!canIssueCert || generating}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl text-sm transition-colors"
              >
                {generating ? '⏳ กำลังออกใบรับรอง...' : '📜 ออกใบรับรองฝีมือ'}
              </button>
            </div>
          )}

          {cert && (
            <div id="cert-printable" ref={printRef}>
              <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 rounded-3xl p-1 shadow-2xl">
                <div className="bg-white rounded-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 py-3 px-5 flex items-center justify-between">
                    <div className="text-blue-900 font-black text-lg tracking-wide">จงเจริญ</div>
                    <div className="text-blue-900 text-xs font-bold opacity-75">JONG JAROEN</div>
                  </div>
                  <div className="p-6">
                    <div className="text-center mb-5">
                      <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Certificate of Skill</p>
                      <h2 className="text-xl font-black text-gray-800">ใบรับรองฝีมือแรงงาน</h2>
                      <p className="text-xs text-gray-400 mt-1">Prasae Community · Local Freelance Marketplace</p>
                    </div>
                    <div className="flex items-center gap-2 mb-5">
                      <div className="flex-1 h-px bg-yellow-300" /><span className="text-yellow-500 text-lg">✦</span><div className="flex-1 h-px bg-yellow-300" />
                    </div>
                    <div className="text-center mb-5">
                      <p className="text-xs text-gray-400 mb-1">ขอมอบให้แก่</p>
                      <p className="text-2xl font-black text-blue-900 mb-1">{cert.full_name}</p>
                      <p className="text-xs text-gray-500">ผ่านงาน <strong className="text-blue-700">{cert.total_jobs} งาน</strong> บนแพลตฟอร์มจงเจริญ</p>
                    </div>
                    {cert.skills && cert.skills.length > 0 && (
                      <div className="mb-5">
                        <p className="text-xs text-gray-400 text-center mb-2">ความเชี่ยวชาญ</p>
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          {cert.skills.map((skill, i) => (
                            <span key={i} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-medium">{skill}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-5">
                      <div className="flex-1 h-px bg-gray-100" /><span className="text-gray-200 text-sm">✦</span><div className="flex-1 h-px bg-gray-100" />
                    </div>
                    <div className="flex items-end justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-xs text-gray-400 mb-0.5">เลขที่ใบรับรอง</p>
                        <p className="text-sm font-bold text-gray-700 font-mono">{cert.cert_number}</p>
                        <p className="text-xs text-gray-400 mt-1.5 mb-0.5">วันที่ออก</p>
                        <p className="text-sm font-medium text-gray-600">
                          {new Date(cert.issued_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        <p className="text-xs text-gray-400 mt-3">🔍 สแกน QR เพื่อยืนยันความถูกต้อง</p>
                      </div>
                      <div className="text-center">
                        {qrDataUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={qrDataUrl} alt="QR Code" className="w-24 h-24 rounded-lg" />
                        ) : (
                          <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center"><span className="text-xs text-gray-400">QR</span></div>
                        )}
                        <p className="text-xs text-gray-400 mt-1">Verify</p>
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5">
                        <span className="text-green-600 text-sm">✅</span>
                        <span className="text-xs text-green-700 font-medium">ออกโดย จงเจริญ Platform</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 no-print">
                <button onClick={issueCertificate} disabled={generating} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm transition-colors">
                  {generating ? '⏳ กำลังออกใหม่...' : '🔄 ออกใบรับรองใหม่'}
                </button>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 no-print">
            <p className="text-xs text-blue-700">
              <strong>🔒 การยืนยัน:</strong> บุคคลทั่วไปสามารถสแกน QR Code หรือไปที่{' '}
              <code className="bg-blue-100 px-1 rounded">/verify/[id]</code>{' '}
              เพื่อยืนยันความถูกต้องของใบรับรองได้
            </p>
          </div>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 z-50 no-print">
          <Link href="/" className="flex flex-col items-center text-gray-400 text-xs gap-0.5"><span>🏠</span>หน้าหลัก</Link>
          <Link href="/services" className="flex flex-col items-center text-gray-400 text-xs gap-0.5"><span>🔍</span>ค้นหา</Link>
          <Link href="/dashboard" className="flex flex-col items-center text-gray-400 text-xs gap-0.5"><span>📋</span>งานของฉัน</Link>
          <Link href="/profile" className="flex flex-col items-center text-blue-600 text-xs gap-0.5"><span>👤</span>โปรไฟล์</Link>
        </nav>
      </div>
    </>
  );
        }

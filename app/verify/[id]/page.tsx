import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

interface Certificate {
  id: string;
  user_id: string;
  full_name: string;
  total_jobs: number;
  skills: string[];
  issued_at: string;
  cert_number: string;
}

async function getCertificate(id: string): Promise<Certificate | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await supabase
    .from('certificates')
    .select('*')
    .eq('id', id)
    .single();
  return data as Certificate | null;
}

export default async function VerifyCertPage({ params }: { params: { id: string } }) {
  const cert = await getCertificate(params.id);

  if (!cert) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-xl font-black text-red-600 mb-2">ไม่พบใบรับรองนี้</h1>
          <p className="text-sm text-gray-500 mb-6">
            ใบรับรองอาจถูกยกเลิก หรือรหัสไม่ถูกต้อง
          </p>
          <p className="text-xs text-gray-400 font-mono mb-6 break-all">ID: {params.id}</p>
          <Link href="/" className="bg-gray-100 text-gray-600 px-5 py-2 rounded-xl text-sm font-medium">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  const issueDate = new Date(cert.issued_at).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        {/* Verified badge */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-green-500 text-white px-5 py-2 rounded-full shadow-lg">
            <span className="text-xl">✅</span>
            <span className="font-bold text-sm">ใบรับรองถูกต้อง</span>
          </div>
        </div>

        {/* Certificate card */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
          {/* Gold header */}
          <div className="bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 py-4 px-6 flex items-center justify-between">
            <div className="text-blue-900 font-black text-xl tracking-wide">จงเจริญ</div>
            <div className="text-blue-900 text-xs font-bold opacity-75">JONG JAROEN</div>
          </div>

          <div className="p-6">
            <div className="text-center mb-6">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Certificate of Skill</p>
              <h2 className="text-lg font-black text-gray-800">ใบรับรองฝีมือแรงงาน</h2>
              <p className="text-xs text-gray-400">Prasae Community</p>
            </div>

            <div className="flex items-center gap-2 mb-5">
              <div className="flex-1 h-px bg-yellow-300" />
              <span className="text-yellow-500">✦</span>
              <div className="flex-1 h-px bg-yellow-300" />
            </div>

            <div className="text-center mb-5">
              <p className="text-xs text-gray-400 mb-1">ออกให้แก่</p>
              <p className="text-2xl font-black text-blue-900">{cert.full_name}</p>
              <p className="text-sm text-gray-500 mt-1">
                ผ่านงาน <strong className="text-blue-700">{cert.total_jobs} งาน</strong>
              </p>
            </div>

            {cert.skills && cert.skills.length > 0 && (
              <div className="mb-5">
                <p className="text-xs text-gray-400 text-center mb-2">ความเชี่ยวชาญ</p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {cert.skills.map((skill: string, i: number) => (
                    <span key={i} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400 text-xs">เลขที่ใบรับรอง</span>
                <span className="font-mono font-bold text-xs text-gray-700">{cert.cert_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-xs">วันที่ออก</span>
                <span className="text-xs text-gray-600">{issueDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-xs">สถานะ</span>
                <span className="text-xs text-green-600 font-bold">✅ ถูกต้อง</span>
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

        {/* Footer */}
        <div className="text-center mt-4">
          <p className="text-blue-200 text-xs mb-2">
            ยืนยันโดยอัตโนมัติ · Verified by Jong Jaroen
          </p>
          <Link href="/" className="text-white text-xs opacity-75 hover:opacity-100 underline">
            จงเจริญ · Local Freelance Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}

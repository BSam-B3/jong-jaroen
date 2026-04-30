import { sbServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CertificatePage() {
  const supabase = sbServer();
  
  // 1. ตรวจสอบผู้ใช้งาน
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login');
  }

  // 2. ดึงข้อมูลใบรับรองของผู้ใช้คนนี้
  const { data: certificates, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-24">
      <div className="max-w-md mx-auto space-y-6">
        <Link href="/profile" className="text-gray-500 font-bold text-sm flex items-center gap-2">
          <span>←</span> กลับหน้าโปรไฟล์
        </Link>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">ใบรับรองของคุณ</h1>
          <p className="text-xs text-gray-500 font-medium">รวมประกาศนียบัตรการันตีฝีมือจากจงเจริญ</p>
        </div>

        {(!certificates || certificates.length === 0) ? (
          <div className="bg-white rounded-[2rem] p-10 text-center border-2 border-dashed border-gray-200">
            <span className="text-5xl block mb-4">📜</span>
            <p className="text-sm font-bold text-gray-400">ยังไม่มีใบรับรองในขณะนี้</p>
            <p className="text-[10px] text-gray-400 mt-1">รับงานและสะสมคะแนนเพื่อรับใบรับรองฝีมือนะคะ</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {certificates.map((cert) => (
              <Link 
                key={cert.id}
                href={`/verify/${cert.id}`}
                className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between group active:scale-95 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl">
                    🏆
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-800">{cert.cert_number}</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">ใบรับรองฝีมือแรงงาน</p>
                  </div>
                </div>
                <div className="text-blue-500 font-bold text-lg group-hover:translate-x-1 transition-transform">
                  ›
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

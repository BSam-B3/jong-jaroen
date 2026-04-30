import { redirect } from 'next/navigation';
import Link from 'next/link';
import { sbServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 🟢 คอมโพเนนต์สำหรับแสดงป้ายสถานะ (Status Badge)
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'approved':
      return <span className="px-2 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded-lg flex items-center gap-1 border border-green-200">✅ ผ่านแล้ว</span>;
    case 'pending':
      return <span className="px-2 py-1 bg-orange-50 text-orange-600 text-[10px] font-bold rounded-lg flex items-center gap-1 border border-orange-200">⏳ รอตรวจสอบ</span>;
    case 'rejected':
      return <span className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg flex items-center gap-1 border border-red-200">❌ ต้องแก้ไข</span>;
    default:
      return <span className="px-2 py-1 bg-gray-50 text-gray-400 text-[10px] font-bold rounded-lg flex items-center gap-1 border border-gray-200">⚪ ยังไม่ระบุ</span>;
  }
}

export default async function ProfileEditPage() {
  const supabase = sbServer();
  
  // ตรวจสอบ Session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?next=/profile/edit');

  // ดึงข้อมูล Profile เพื่อเช็คสถานะต่างๆ
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // ดึงค่าสถานะ (ถ้าใน Database ยังไม่มีคอลัมน์นี้ ให้มองเป็น 'none' ไปก่อน)
  const kycStatus = profile?.kyc_status || 'none';
  const bankStatus = profile?.bank_status || 'none'; 
  const docStatus = profile?.doc_status || 'none';
  const certStatus = profile?.cert_status || 'none';

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans">
      {/* Header */}
      <div className="bg-white px-6 pt-16 pb-8 rounded-b-[3rem] shadow-sm border-b border-gray-100">
        <Link href="/profile" className="text-gray-500 font-bold text-sm mb-6 inline-block">← ย้อนกลับ</Link>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center text-2xl shadow-inner">
            ✏️
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">{profile?.full_name || 'ตั้งค่าข้อมูลส่วนตัว'}</h1>
            <p className="text-sm text-gray-500 font-medium">{profile?.phone || 'ยังไม่ได้เพิ่มเบอร์โทรศัพท์'}</p>
          </div>
        </div>
      </div>

      <main className="px-6 mt-6 space-y-6">
        
        {/* Banner แจ้งเตือน */}
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex gap-3">
          <span className="text-xl">💡</span>
          <p className="text-xs font-medium text-orange-800 leading-relaxed">
            หน้าต่างนี้สำหรับจัดการข้อมูลส่วนตัว ตั้งค่าช่องทางรับเงิน และเรียกดูประวัติผลงานของคุณค่ะ หากมีการแก้ไขข้อมูลสำคัญ จะต้องเข้าสู่กระบวนการรอตรวจสอบใหม่อีกครั้ง
          </p>
        </div>

        {/* Section 1: ข้อมูลพื้นฐาน */}
        <section className="space-y-3">
          <h2 className="text-sm font-black text-gray-800 flex items-center gap-2">
            <span>👤</span> แก้ไขข้อมูลส่วนตัว
          </h2>
          <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100">
            {/* อันนี้กดได้ตลอด ไม่ต้องมีสถานะ */}
            <Link href="/profile/edit/basic" className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors">
              <div>
                <h3 className="font-bold text-gray-800 text-sm">แก้ไข ชื่อ-นามสกุล / เบอร์โทร</h3>
              </div>
              <span className="text-gray-300">→</span>
            </Link>
          </div>
        </section>

        {/* Section 2: ยืนยันตัวตน (KYC) */}
        <section className="space-y-3">
          <h2 className="text-sm font-black text-gray-800 flex items-center gap-2">
            <span>🛡️</span> ยืนยันตัวตนและบัญชีรับเงิน
          </h2>
          <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100">
            
            <Link href="/profile/kyc" className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors">
              <div className="flex gap-4 items-center">
                <span className="text-2xl">🔍</span>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">ยืนยันตัวตน (KYC)</h3>
                  <p className="text-[10px] text-gray-500">ถ่ายรูปคู่บัตรประชาชน</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={kycStatus} />
                <span className="text-gray-300">→</span>
              </div>
            </Link>

            <div className="h-[1px] bg-gray-50 mx-4" />

            <Link href="/profile/bank" className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors">
              <div className="flex gap-4 items-center">
                <span className="text-2xl">🏦</span>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">บัญชีรับเงิน (Bank Account)</h3>
                  <p className="text-[10px] text-gray-500">ตั้งค่าพร้อมเพย์ / บัญชีธนาคาร</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={bankStatus} />
                <span className="text-gray-300">→</span>
              </div>
            </Link>

            <div className="h-[1px] bg-gray-50 mx-4" />

            <Link href="/profile/documents" className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors">
              <div className="flex gap-4 items-center">
                <span className="text-2xl">🪪</span>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">แฟ้มเอกสารส่วนตัว</h3>
                  <p className="text-[10px] text-gray-500">ใบขับขี่ / ใบอนุญาตวิชาชีพ</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={docStatus} />
                <span className="text-gray-300">→</span>
              </div>
            </Link>

          </div>
        </section>

        {/* Section 3: Portfolio */}
        <section className="space-y-3">
          <h2 className="text-sm font-black text-gray-800 flex items-center gap-2">
            <span>🏆</span> ผลงานและใบรับรอง
          </h2>
          <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100">
            
            <Link href="/profile/certificates" className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors">
              <div className="flex gap-4 items-center">
                <span className="text-2xl">🖼️</span>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">คลังใบประกาศ (Certificates)</h3>
                  <p className="text-[10px] text-gray-500">อัปโหลดใบผ่านงาน / อบรม</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={certStatus} />
                <span className="text-gray-300">→</span>
              </div>
            </Link>

            <div className="h-[1px] bg-gray-50 mx-4" />

            {/* Resume มักจะเป็นแค่การดาวน์โหลด ไม่ต้องมีสถานะ */}
            <Link href="/profile/resume" className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors">
              <div className="flex gap-4 items-center">
                <span className="text-2xl">📋</span>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">เรซูเม่และประวัติงาน</h3>
                  <p className="text-[10px] text-gray-500">ดาวน์โหลดประวัติการทำงาน (PDF)</p>
                </div>
              </div>
              <span className="text-gray-300">→</span>
            </Link>

          </div>
        </section>

      </main>
    </div>
  );
}

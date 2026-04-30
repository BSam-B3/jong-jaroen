import { redirect } from 'next/navigation';
import Link from 'next/link';
import { sbServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 🟢 คอมโพเนนต์สำหรับแสดงป้ายสถานะ (ปรับเป็นแคปซูลแบบคลีนๆ)
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'approved':
      return <span className="px-2.5 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded-full border border-green-100 shadow-sm">✅ ผ่านแล้ว</span>;
    case 'pending':
      return <span className="px-2.5 py-1 bg-orange-50 text-orange-600 text-[10px] font-black rounded-full border border-orange-100 shadow-sm">⏳ รอตรวจ</span>;
    case 'rejected':
      return <span className="px-2.5 py-1 bg-red-50 text-red-600 text-[10px] font-black rounded-full border border-red-100 shadow-sm">❌ แก้ไข</span>;
    default:
      return <span className="px-2.5 py-1 bg-gray-50 text-gray-400 text-[10px] font-black rounded-full border border-gray-100">⚪ ยังไม่เริ่ม</span>;
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
    /* ✅ ครอบด้วย Wrapper แบบเดียวกับหน้า Profile/Home เป๊ะๆ */
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-10">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-x-hidden">
        
        {/* 🟠 Header ส้มจงเจริญ (มีปุ่มย้อนกลับ) */}
        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] p-6 pt-12 pb-8 shadow-sm relative z-20 flex items-center gap-4">
          <Link href="/profile" className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm shadow-inner border border-white/30 text-white text-xl active:scale-95 transition-transform shrink-0">
            ←
          </Link>
          <div className="flex flex-col text-white">
            <h1 className="text-xl font-black tracking-tight line-clamp-1">จัดการข้อมูลส่วนตัว</h1>
            <p className="text-[11px] font-bold text-white/80 mt-0.5 tracking-wide">
              {profile?.phone || 'ยังไม่ได้เพิ่มเบอร์โทรศัพท์'}
            </p>
          </div>
        </div>

        <main className="flex-1 relative z-10 space-y-5 mt-4 px-4 pb-8">
          
          {/* Banner แจ้งเตือน */}
          <div className="bg-orange-50/80 border border-orange-100 rounded-[1.2rem] p-4 flex gap-3 shadow-sm">
            <span className="text-xl">💡</span>
            <p className="text-[11px] font-bold text-orange-800/80 leading-relaxed">
              หากมีการแก้ไขข้อมูลสำคัญในหมวด <span className="text-[#EE4D2D]">"ยืนยันตัวตน"</span> ระบบจะต้องเข้าสู่กระบวนการรอตรวจสอบใหม่อีกครั้งค่ะ
            </p>
          </div>

          {/* Section 1: ข้อมูลพื้นฐาน */}
          <section>
            <h2 className="text-[11px] font-black text-gray-400 px-2 mb-2 uppercase tracking-wide">จัดการข้อมูล (Profile)</h2>
            <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden">
              <Link href="/profile/edit/basic" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors active:bg-gray-100">
                <div className="flex items-center gap-3">
                  <span className="text-[22px]">👤</span>
                  <span className="font-medium text-gray-800 text-sm">แก้ไข ชื่อ-นามสกุล / เบอร์โทร</span>
                </div>
                <span className="text-gray-300 text-xl font-bold">›</span>
              </Link>
            </div>
          </section>

          {/* Section 2: ยืนยันตัวตน (KYC) */}
          <section>
            <h2 className="text-[11px] font-black text-gray-400 px-2 mb-2 uppercase tracking-wide">ความปลอดภัย (Trust & Safety)</h2>
            <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden">
              
              <Link href="/profile/kyc" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors active:bg-gray-100 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <span className="text-[22px]">🔍</span>
                  <div>
                    <h3 className="font-medium text-gray-800 text-sm">ยืนยันตัวตน (KYC)</h3>
                    <p className="text-[10px] text-gray-400">ถ่ายรูปคู่บัตรประชาชน</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={kycStatus} />
                  <span className="text-gray-300 text-xl font-bold">›</span>
                </div>
              </Link>

              <Link href="/profile/bank" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors active:bg-gray-100 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <span className="text-[22px]">🏦</span>
                  <div>
                    <h3 className="font-medium text-gray-800 text-sm">บัญชีรับเงิน (Bank)</h3>
                    <p className="text-[10px] text-gray-400">ตั้งค่าพร้อมเพย์ / ธนาคาร</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={bankStatus} />
                  <span className="text-gray-300 text-xl font-bold">›</span>
                </div>
              </Link>

              <Link href="/profile/documents" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors active:bg-gray-100">
                <div className="flex items-center gap-3">
                  <span className="text-[22px]">🪪</span>
                  <div>
                    <h3 className="font-medium text-gray-800 text-sm">แฟ้มเอกสารส่วนตัว</h3>
                    <p className="text-[10px] text-gray-400">ใบขับขี่ / ใบอนุญาต</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={docStatus} />
                  <span className="text-gray-300 text-xl font-bold">›</span>
                </div>
              </Link>

            </div>
          </section>

          {/* Section 3: Portfolio */}
          <section>
            <h2 className="text-[11px] font-black text-gray-400 px-2 mb-2 uppercase tracking-wide">ผลงาน (Portfolio)</h2>
            <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden">
              
              <Link href="/profile/certificates" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors active:bg-gray-100 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <span className="text-[22px]">🖼️</span>
                  <div>
                    <h3 className="font-medium text-gray-800 text-sm">คลังใบประกาศ</h3>
                    <p className="text-[10px] text-gray-400">อัปโหลดใบผ่านงาน</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={certStatus} />
                  <span className="text-gray-300 text-xl font-bold">›</span>
                </div>
              </Link>

              <Link href="/profile/resume" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors active:bg-gray-100">
                <div className="flex items-center gap-3">
                  <span className="text-[22px]">📋</span>
                  <div>
                    <h3 className="font-medium text-gray-800 text-sm">เรซูเม่และประวัติงาน</h3>
                    <p className="text-[10px] text-gray-400">ดาวน์โหลด (PDF)</p>
                  </div>
                </div>
                <span className="text-gray-300 text-xl font-bold">›</span>
              </Link>

            </div>
          </section>

        </main>
      </div>
    </div>
  );
}

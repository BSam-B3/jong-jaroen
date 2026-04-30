import { sbServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function KycStatusPage() {
  const supabase = sbServer();
  
  // 1. ตรวจสอบผู้ใช้งาน
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login');
  }

  // 2. ดึงสถานะ KYC ล่าสุด
  const { data: profile } = await supabase
    .from('profiles')
    .select('kyc_status, full_name, reviewer_note')
    .eq('id', user.id)
    .single();

  const status = profile?.kyc_status || 'none';

  const statusConfigs: Record<string, any> = {
    none: {
      icon: '🆔',
      title: 'ยังไม่ได้ยืนยันตัวตน',
      desc: 'กรุณาอัปโหลดรูปถ่ายพร้อมบัตรประชาชนเพื่อเริ่มรับงานค่ะ',
      color: 'text-gray-900',
      bgColor: 'bg-gray-100'
    },
    pending: {
      icon: '⏳',
      title: 'อยู่ระหว่างตรวจสอบ',
      desc: 'แอดมินกำลังตรวจสอบข้อมูลของคุณ ปกติจะใช้เวลาไม่เกิน 24 ชม. ค่ะ',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    approved: {
      icon: '✅',
      title: 'ยืนยันตัวตนสำเร็จ',
      desc: 'คุณสามารถเริ่มรับงานและสร้างรายได้บนแพลตฟอร์มได้แล้วค่ะ',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    rejected: {
      icon: '❌',
      title: 'การยืนยันถูกปฏิเสธ',
      desc: profile?.reviewer_note || 'ข้อมูลไม่ชัดเจน กรุณาลองใหม่อีกครั้งค่ะ',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  };

  const config = statusConfigs[status] || statusConfigs.none;

  return (
    <div className="min-h-screen bg-white p-6 flex flex-col">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        <Link href="/profile" className="text-gray-500 font-bold text-sm mb-8">← กลับ</Link>
        
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
          <div className={`w-24 h-24 ${config.bgColor} rounded-[2.5rem] flex items-center justify-center text-5xl shadow-inner`}>
            {config.icon}
          </div>
          
          <div className="space-y-2">
            <h1 className={`text-2xl font-black ${config.color}`}>{config.title}</h1>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">
              {config.desc}
            </p>
          </div>

         {(status === 'none' || status === 'rejected') && (
            {/* 👇 แก้ไขตรง href ตรงนี้จุดเดียวเลยค่ะ 👇 */}
            <Link 
              href="/profile/kyc/upload" 
              className="w-full bg-[#EE4D2D] text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-orange-200 active:scale-95 transition-all"
            >
              {status === 'rejected' ? 'ส่งเอกสารใหม่อีกครั้ง' : 'เริ่มยืนยันตัวตน'}
            </Link>
          )}
        </div>
        
        <div className="py-10 text-center">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
            Jong Jaroen Trust & Safety
          </p>
        </div>
      </div>
    </div>
  );
}

import { redirect } from 'next/navigation';
// ✅ ใช้ sbServer สำหรับฝั่ง Server Component
import { sbServer } from '@/lib/supabase/server'; 
import KycUploadClient from './KycUploadClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function KycUploadPage() {
  const supabase = sbServer();
  
  // 1. เช็ค Login
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/auth/login?next=/profile/kyc/upload');
  }

  // 2. เช็คสถานะ KYC ปัจจุบัน
  const { data: profile } = await supabase
    .from('profiles')
    .select('kyc_status')
    .eq('id', user.id)
    .single();

  /**
   * 💡 ปรับปรุง UX: 
   * ถ้าส่งเอกสารแล้ว (pending) หรือผ่านแล้ว (approved) 
   * ให้เด้งกลับไปหน้า "เช็คสถานะ" (/profile/kyc) แทนหน้าแรก
   * เพื่อให้ผู้ใช้เห็นการ์ดสถานะที่ชัดเจนค่ะ
   */
  if (profile?.kyc_status === 'pending' || profile?.kyc_status === 'approved') {
    redirect('/profile/kyc');
  }

  // ถ้ายังไม่เคยส่ง หรือโดนปฏิเสธ (rejected) ให้แสดงหน้าอัปโหลด
  return <KycUploadClient userId={user.id} />;
}

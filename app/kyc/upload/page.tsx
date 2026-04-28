import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server'; // หรือ path ที่บีสามใช้เก็บ supabase server
import KycUploadClient from './KycUploadClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function KycUploadPage() {
  const supabase = await createClient();
  
  // เช็ค Login
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/auth/login?next=/kyc/upload');
  }

  // เช็คสถานะ KYC ปัจจุบัน
  const { data: profile } = await supabase
    .from('profiles')
    .select('kyc_status')
    .eq('id', user.id)
    .single();

  // ถ้าส่งเอกสารไปแล้ว ให้เด้งกลับไปหน้าแรก
  if (profile?.kyc_status === 'pending') redirect('/?msg=kyc_pending');
  if (profile?.kyc_status === 'approved') redirect('/?msg=kyc_approved');

  return <KycUploadClient userId={user.id} />;
}

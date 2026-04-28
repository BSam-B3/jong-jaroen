import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import KycReviewClient from './KycReviewClient';

export default async function KycReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (!profile) notFound();

  // ลิงก์รูปจะเรียกผ่าน API Proxy ที่เราสร้างไว้ในข้อ 2
  const imageProxyUrl = `/api/admin/kyc/${id}/image`;

  return <KycReviewClient profile={profile} imageProxyUrl={imageProxyUrl} userId={id} />;
}

import { notFound } from 'next/navigation';
import { requireAdmin } from '../../_lib/requireAdmin';
import KycReviewClient from './KycReviewClient';

export default async function AdminKycReviewPage({ params }: any) {
  const { id } = await params;
  const { sb } = await requireAdmin(`/admin/kyc/${id}`);

  const { data: profile } = await sb
    .from('profiles')
    .select('id, full_name, national_id, date_of_birth, address, kyc_status, id_card_url, kyc_reviewed_at')
    .eq('id', id)
    .single();

  if (!profile) notFound();

  return (
    <KycReviewClient 
      profile={profile} 
      imageProxyUrl={profile.id_card_url ? `/api/admin/kyc/${profile.id}/image` : null} 
    />
  );
}

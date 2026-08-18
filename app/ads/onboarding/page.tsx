import { redirect } from 'next/navigation';
import { AdAccountOnboardingForm } from '@/components/ads/AdAccountOnboardingForm';
import { getAdAccountMembership } from '@/lib/ads/account';
import { getServerAuthSession } from '@/lib/auth';

export default async function AdsOnboardingPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) redirect('/ads/login');
  if (await getAdAccountMembership(session.user.id)) redirect('/ads/overview');
  return <AdAccountOnboardingForm />;
}

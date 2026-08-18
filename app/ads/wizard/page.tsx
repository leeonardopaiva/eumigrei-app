import AdWizard from '@/components/ads/AdWizard';
import { requireAdAccountPage } from '@/lib/ads/account';

export default async function AdsWizardPage() {
  await requireAdAccountPage();
  return <AdWizard />;
}

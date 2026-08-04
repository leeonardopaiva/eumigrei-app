import { AdsHelpCenter } from '@/components/ads/AdsHelpCenter';
import { requireAdAccountPage } from '@/lib/ads/account';

export default async function AdsHelpPage() {
  await requireAdAccountPage();
  return <AdsHelpCenter />;
}

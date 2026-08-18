import { OverviewDashboard } from '@/components/ads/OverviewDashboard';
import { requireAdAccountPage } from '@/lib/ads/account';
import { buildAdsOverviewData, resolveAdsDateRange } from '@/lib/ads/dashboard';

type PageProps = { searchParams?: Promise<{ range?: string }> };

export default async function AdsOverviewPage({ searchParams }: PageProps) {
  const { session, membership } = await requireAdAccountPage();
  const params = await searchParams;
  const data = await buildAdsOverviewData(session.user.id, resolveAdsDateRange(params?.range), membership.adAccountId);
  return <OverviewDashboard data={data} />;
}

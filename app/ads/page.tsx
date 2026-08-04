import { redirect } from 'next/navigation';
import { getServerAuthSession } from '@/lib/auth';
import { buildAdsOverviewData, resolveAdsDateRange } from '@/lib/ads/dashboard';
import { OverviewDashboard } from '@/components/ads/OverviewDashboard';

type PageProps = {
  searchParams?: Promise<{
    range?: string;
  }>;
};

export default async function AdsDashboardPage({ searchParams }: PageProps) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const params = await searchParams;
  const range = resolveAdsDateRange(params?.range);
  const data = await buildAdsOverviewData(session.user.id, range);

  return <OverviewDashboard data={data} />;
}

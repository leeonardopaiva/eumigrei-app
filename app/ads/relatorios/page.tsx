import { redirect } from 'next/navigation';
import { getServerAuthSession } from '@/lib/auth';
import { buildAdsOverviewData, buildAdsReportData, resolveAdsDateRange } from '@/lib/ads/dashboard';
import { ReportBuilder } from '@/components/ads/ReportBuilder';

type PageProps = {
  searchParams?: Promise<{
    range?: string;
  }>;
};

export default async function AdsReportsPage({ searchParams }: PageProps) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const params = await searchParams;
  const range = resolveAdsDateRange(params?.range);
  const [overviewData, reportData] = await Promise.all([
    buildAdsOverviewData(session.user.id, range),
    buildAdsReportData(session.user.id),
  ]);

  return <ReportBuilder data={reportData} rows={overviewData.rows} />;
}


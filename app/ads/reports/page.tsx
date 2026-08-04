import { ReportBuilder } from '@/components/ads/ReportBuilder';
import { requireAdAccountPage } from '@/lib/ads/account';
import { buildAdsOverviewData, buildAdsReportData, resolveAdsDateRange } from '@/lib/ads/dashboard';

type PageProps = { searchParams?: Promise<{ range?: string }> };

export default async function AdsReportsPage({ searchParams }: PageProps) {
  const { session, membership } = await requireAdAccountPage();
  const params = await searchParams;
  const range = resolveAdsDateRange(params?.range);
  const [overviewData, reportData] = await Promise.all([
    buildAdsOverviewData(session.user.id, range, membership.adAccountId),
    buildAdsReportData(session.user.id, membership.adAccountId),
  ]);
  return <ReportBuilder data={reportData} rows={overviewData.rows} />;
}

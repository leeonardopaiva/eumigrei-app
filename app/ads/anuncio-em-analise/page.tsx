import { AdReviewConfirmation } from '@/components/ads/AdReviewConfirmation';
import { requireAdAccountPage } from '@/lib/ads/account';
import { prisma } from '@/lib/prisma';

type PageProps = {
  searchParams?: Promise<{
    campaign?: string;
  }>;
};

export default async function AdReviewPage({ searchParams }: PageProps) {
  const { membership } = await requireAdAccountPage();

  const params = await searchParams;
  const campaign = params?.campaign
    ? await prisma.banner.findFirst({
        where: { id: params.campaign, adAccountId: membership.adAccountId },
        select: { headline: true, name: true, paymentStatus: true },
      })
    : null;

  return (
    <AdReviewConfirmation
      headline={campaign?.headline || campaign?.name || null}
      paymentConfirmed={campaign?.paymentStatus === 'PAID'}
    />
  );
}

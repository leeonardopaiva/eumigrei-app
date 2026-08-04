import { redirect } from 'next/navigation';
import { AdReviewConfirmation } from '@/components/ads/AdReviewConfirmation';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type PageProps = {
  searchParams?: Promise<{
    campaign?: string;
  }>;
};

export default async function AdReviewPage({ searchParams }: PageProps) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) redirect('/login');

  const params = await searchParams;
  const campaign = params?.campaign
    ? await prisma.banner.findFirst({
        where: { id: params.campaign, createdById: session.user.id },
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

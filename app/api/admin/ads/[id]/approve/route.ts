import { AdCampaignStatus, AdModerationStatus, AdPaymentStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminSession } from '@/lib/require-admin';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { session, response } = await requireAdminSession();
  if (response || !session) return response;

  const { id } = await context.params;
  const campaign = await prisma.banner.findFirst({
    where: {
      id,
      paymentStatus: AdPaymentStatus.PAID,
      moderationStatus: AdModerationStatus.PENDING_REVIEW,
    },
    select: { id: true, durationMonths: true },
  });
  if (!campaign) {
    return NextResponse.json({ error: 'Campanha paga e pendente de revisao nao encontrada.' }, { status: 409 });
  }

  const startsAt = new Date();
  const endsAt = new Date(startsAt);
  endsAt.setMonth(endsAt.getMonth() + (campaign.durationMonths ?? 1));

  const banner = await prisma.banner.update({
    where: { id: campaign.id },
    data: {
      moderationStatus: AdModerationStatus.APPROVED,
      campaignStatus: AdCampaignStatus.ACTIVE,
      approvedById: session.user.id,
      approvedAt: startsAt,
      startsAt,
      endsAt,
      rejectionReason: null,
      isActive: true,
    },
    select: { id: true, moderationStatus: true, startsAt: true, endsAt: true },
  });

  return NextResponse.json({ banner });
}


import { AdModerationStatus, AdPlan, Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminSession } from '@/lib/require-admin';

const PAGE_SIZE = 12;
const moderationStatuses = new Set(Object.values(AdModerationStatus));
const plans = new Set(Object.values(AdPlan));

export async function GET(request: Request) {
  const { response } = await requireAdminSession();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const requestedStatus = searchParams.get('status');
  const requestedPlan = searchParams.get('plan');
  const search = searchParams.get('search')?.trim().slice(0, 100) || '';
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);
  const status = requestedStatus && moderationStatuses.has(requestedStatus as AdModerationStatus)
    ? requestedStatus as AdModerationStatus
    : AdModerationStatus.PENDING_REVIEW;
  const plan = requestedPlan && plans.has(requestedPlan as AdPlan) ? requestedPlan as AdPlan : undefined;

  const where: Prisma.BannerWhereInput = {
    adAccountId: { not: null },
    moderationStatus: status,
    ...(plan ? { plan } : {}),
    ...(search
      ? {
          OR: [
            { headline: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
            { adAccount: { name: { contains: search, mode: 'insensitive' } } },
            { createdBy: { email: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [campaigns, total, pendingCount, approvedCount, rejectedCount] = await Promise.all([
    prisma.banner.findMany({
      where,
      orderBy: [{ submittedAt: 'asc' }, { updatedAt: 'asc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        headline: true,
        name: true,
        description: true,
        imageUrl: true,
        goal: true,
        plan: true,
        durationMonths: true,
        contractAmountCents: true,
        moderationStatus: true,
        paymentStatus: true,
        submittedAt: true,
        updatedAt: true,
        rejectionReason: true,
        region: { select: { label: true } },
        adAccount: { select: { name: true, logoUrl: true } },
        createdBy: { select: { name: true, email: true } },
      },
    }),
    prisma.banner.count({ where }),
    prisma.banner.count({ where: { adAccountId: { not: null }, moderationStatus: AdModerationStatus.PENDING_REVIEW } }),
    prisma.banner.count({ where: { adAccountId: { not: null }, moderationStatus: AdModerationStatus.APPROVED } }),
    prisma.banner.count({ where: { adAccountId: { not: null }, moderationStatus: AdModerationStatus.REJECTED } }),
  ]);

  return NextResponse.json({
    campaigns: campaigns.map((campaign) => ({
      ...campaign,
      submittedAt: campaign.submittedAt?.toISOString() ?? campaign.updatedAt.toISOString(),
      updatedAt: campaign.updatedAt.toISOString(),
    })),
    pagination: { page, pageSize: PAGE_SIZE, total, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) },
    stats: { pending: pendingCount, approved: approvedCount, rejected: rejectedCount },
  });
}

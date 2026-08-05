import { AdGoal, AdModerationStatus, AdPlan, Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminSession } from '@/lib/require-admin';

const PAGE_SIZE = 12;
const moderationStatuses = new Set(Object.values(AdModerationStatus));
const plans = new Set(Object.values(AdPlan));
const goals = new Set(Object.values(AdGoal));

export async function GET(request: Request) {
  const { response } = await requireAdminSession();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const requestedStatus = searchParams.get('status');
  const requestedPlan = searchParams.get('plan');
  const search = searchParams.get('search')?.trim().slice(0, 100) || '';
  const regionKey = searchParams.get('region')?.trim().slice(0, 100) || '';
  const requestedGoal = searchParams.get('goal');
  const goal = requestedGoal && goals.has(requestedGoal as AdGoal) ? requestedGoal as AdGoal : undefined;
  const sort = searchParams.get('sort') === 'newest' ? 'newest' : searchParams.get('sort') === 'sla' ? 'sla' : 'oldest';
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);
  const status = requestedStatus && moderationStatuses.has(requestedStatus as AdModerationStatus)
    ? requestedStatus as AdModerationStatus
    : AdModerationStatus.PENDING_REVIEW;
  const plan = requestedPlan && plans.has(requestedPlan as AdPlan) ? requestedPlan as AdPlan : undefined;

  const where: Prisma.BannerWhereInput = {
    adAccountId: { not: null },
    moderationStatus: status,
    ...(plan ? { plan } : {}),
    ...(goal ? { goal } : {}),
    ...(regionKey ? { regionKey } : {}),
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
      orderBy: sort === 'newest' ? [{ submittedAt: 'desc' }, { updatedAt: 'desc' }] : [{ submittedAt: 'asc' }, { updatedAt: 'asc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        headline: true,
        name: true,
        description: true,
        imageUrl: true,
        ctaLabel: true,
        targetUrl: true,
        whatsappNumber: true,
        marketplaceItemId: true,
        placement: true,
        goal: true,
        plan: true,
        durationMonths: true,
        contractAmountCents: true,
        moderationStatus: true,
        paymentStatus: true,
        submittedAt: true,
        updatedAt: true,
        rejectionReason: true,
        region: { select: { key: true, label: true } },
        adAccount: { select: { id: true, name: true, logoUrl: true, country: true, currency: true, businessCategory: true } },
        createdBy: { select: { name: true, email: true } },
        payments: { orderBy: { createdAt: 'desc' }, take: 1, select: { provider: true, providerPaymentId: true, amountCents: true, currency: true, status: true, paidAt: true, createdAt: true } },
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
      payments: campaign.payments.map((payment) => ({ ...payment, paidAt: payment.paidAt?.toISOString() ?? null, createdAt: payment.createdAt.toISOString() })),
    })),
    pagination: { page, pageSize: PAGE_SIZE, total, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) },
    stats: { pending: pendingCount, approved: approvedCount, rejected: rejectedCount },
  });
}

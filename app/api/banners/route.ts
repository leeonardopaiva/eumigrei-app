import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const MAX_BANNERS_BY_PLACEMENT = 4;
const FREQUENCY_CAP_PER_DAY = 3;

const getPlacementFilter = (placement: string | null) => {
  if (placement === 'feed') {
    return [{ placement: 'FEED' as const }, { placement: 'BOTH' as const }];
  }

  return [{ placement: 'HOME' as const }, { placement: 'BOTH' as const }];
};

const getPlacementValue = (placement: string | null) => (placement === 'feed' ? 'FEED' : 'HOME');

const normalizeTarget = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();

const hasIntersection = (left: string[], right: string[]) => {
  const rightSet = new Set(right.map(normalizeTarget));
  return left.some((value) => rightSet.has(normalizeTarget(value)));
};

export async function GET(request: Request) {
  const session = await getServerAuthSession();
  const { searchParams } = new URL(request.url);
  const regionKey = session?.user?.regionKey ?? searchParams.get('region');
  const placementParam = searchParams.get('placement');
  const placementFilter = getPlacementFilter(placementParam);
  const placement = getPlacementValue(placementParam);
  const now = new Date();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const [viewer, recentSearches] = await Promise.all([
    session?.user?.id
      ? prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            interests: true,
          },
        })
      : Promise.resolve(null),
    session?.user?.id
      ? prisma.analyticsEvent.findMany({
          where: {
            userId: session.user.id,
            type: 'search_query',
            createdAt: {
              gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            },
          },
          orderBy: [{ createdAt: 'desc' }],
          take: 20,
          select: {
            targetKey: true,
            label: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const viewerInterests = (viewer?.interests ?? []).map(normalizeTarget);
  const viewerSearchTerms = recentSearches.flatMap((event) => [
    normalizeTarget(event.targetKey),
    normalizeTarget(event.label),
  ]);

  const banners = await prisma.banner.findMany({
    where: regionKey
      ? {
          isActive: true,
          campaignStatus: 'ACTIVE',
          OR: placementFilter,
          AND: [
            { OR: [{ regionKey }, { regionKey: null }] },
            { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
            { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
            { OR: [{ paymentStatus: 'NOT_REQUIRED' }, { paymentStatus: 'PAID' }] },
          ],
        }
      : {
          isActive: true,
          campaignStatus: 'ACTIVE',
          regionKey: null,
          OR: placementFilter,
          AND: [
            { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
            { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
            { OR: [{ paymentStatus: 'NOT_REQUIRED' }, { paymentStatus: 'PAID' }] },
          ],
        },
    orderBy: [{ updatedAt: 'desc' }],
    select: {
      id: true,
      name: true,
      imageUrl: true,
      type: true,
      placement: true,
      targetUrl: true,
      regionKey: true,
      targetInterests: true,
      targetKeywords: true,
      targetCategories: true,
      objective: true,
      billingMode: true,
      bidCents: true,
      dailyBudgetCents: true,
      totalBudgetCents: true,
      spentCents: true,
      updatedAt: true,
      region: {
        select: {
          key: true,
          label: true,
        },
      },
      impressions: {
        where: {
          userId: session?.user?.id ?? '__anonymous__',
          placement,
          createdAt: {
            gte: oneDayAgo,
          },
        },
        select: {
          id: true,
        },
      },
      charges: {
        where: {
          createdAt: {
            gte: startOfToday,
          },
        },
        select: {
          amountCents: true,
        },
      },
    },
  });

  const scoredBanners = banners
    .map((banner) => {
      const hasTargeting =
        banner.targetInterests.length > 0 ||
        banner.targetKeywords.length > 0 ||
        banner.targetCategories.length > 0;
      const interestMatch = hasIntersection(banner.targetInterests, viewerInterests);
      const keywordMatch = hasIntersection(banner.targetKeywords, viewerSearchTerms);
      const categoryMatch =
        hasIntersection(banner.targetCategories, viewerSearchTerms) ||
        hasIntersection(banner.targetCategories, viewerInterests);
      const regionMatch = Boolean(regionKey && banner.regionKey === regionKey);
      const matchedBy = [
        regionMatch ? 'region' : null,
        interestMatch ? 'interest' : null,
        keywordMatch ? 'search' : null,
        categoryMatch ? 'category' : null,
      ].filter((value): value is string => Boolean(value));
      const score =
        (regionMatch ? 30 : 0) +
        (interestMatch ? 25 : 0) +
        (keywordMatch ? 35 : 0) +
        (categoryMatch ? 20 : 0) +
        Math.min(banner.bidCents, 500) / 100;

      return {
        banner,
        matchedBy,
        score,
        canShow: !hasTargeting || matchedBy.length > 0,
      };
    })
    .filter(({ banner, canShow }) => {
      if (!canShow) {
        return false;
      }

      if (banner.totalBudgetCents !== null && banner.spentCents >= banner.totalBudgetCents) {
        return false;
      }

      if (
        banner.dailyBudgetCents !== null &&
        banner.charges.reduce((total, charge) => total + charge.amountCents, 0) >= banner.dailyBudgetCents
      ) {
        return false;
      }

      return banner.impressions.length < FREQUENCY_CAP_PER_DAY;
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return right.banner.updatedAt.getTime() - left.banner.updatedAt.getTime();
    })
    .slice(0, MAX_BANNERS_BY_PLACEMENT);

  if (scoredBanners.length > 0) {
    await prisma.adImpression
      .createMany({
        data: scoredBanners.map(({ banner, matchedBy }) => ({
          bannerId: banner.id,
          userId: session?.user?.id ?? null,
          placement,
          sourcePath: placement === 'FEED' ? '/community' : '/',
          sourceSection: placement === 'FEED' ? 'community_feed_banner' : 'home_banner',
          regionKey: regionKey || null,
          matchedBy,
        })),
      })
      .catch((error) => {
        console.error('Failed to track ad impressions:', error);
      });

    await Promise.all(
      scoredBanners
        .filter(({ banner }) => banner.billingMode === 'CPM' && banner.bidCents > 0)
        .map(({ banner }) => {
          const amountCents = Math.max(1, Math.ceil(banner.bidCents / 1000));

          return prisma.$transaction([
            prisma.banner.update({
              where: { id: banner.id },
              data: {
                spentCents: {
                  increment: amountCents,
                },
              },
              select: { id: true },
            }),
            prisma.adCharge.create({
              data: {
                bannerId: banner.id,
                userId: session?.user?.id ?? null,
                amountCents,
                billingMode: 'CPM',
                sourceType: 'impression',
              },
              select: { id: true },
            }),
          ]);
        }),
    ).catch((error) => {
      console.error('Failed to update CPM ad spend:', error);
    });
  }

  return NextResponse.json({
    banners: scoredBanners.map(({ banner, matchedBy }) => ({
      id: banner.id,
      name: banner.name,
      imageUrl: banner.imageUrl,
      type: banner.type,
      placement: banner.placement,
      targetUrl: banner.targetUrl,
      regionKey: banner.regionKey,
      regionLabel: banner.region?.label ?? null,
      scope: banner.regionKey ? 'regional' : 'global',
      objective: banner.objective,
      matchedBy,
      sponsored: true,
    })),
  });
}

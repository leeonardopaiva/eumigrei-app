import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin';
import { prisma } from '@/lib/prisma';

const ANALYTICS_WINDOW_DAYS = 30;
const RECENT_EVENTS_LIMIT = 40;

type MinimalAnalyticsEvent = {
  type: string;
  targetType: string;
  targetKey: string;
  label: string;
  sourceSection: string | null;
  userId: string | null;
};

const aggregateItems = <TKey extends string>(
  events: MinimalAnalyticsEvent[],
  matcher: (event: MinimalAnalyticsEvent) => boolean,
  buildKey: (event: MinimalAnalyticsEvent) => TKey,
  mapItem: (event: MinimalAnalyticsEvent, count: number) => Record<string, unknown>,
) => {
  const counts = new Map<TKey, { event: MinimalAnalyticsEvent; count: number }>();

  for (const event of events) {
    if (!matcher(event)) {
      continue;
    }

    const key = buildKey(event);
    const existing = counts.get(key);

    if (existing) {
      existing.count += 1;
      continue;
    }

    counts.set(key, { event, count: 1 });
  }

  return Array.from(counts.values())
    .sort((left, right) => right.count - left.count)
    .map(({ event, count }) => mapItem(event, count));
};

export async function GET(request: Request) {
  const { response } = await requireAdminSession();

  if (response) {
    return response;
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId')?.trim() || undefined;
  const since = new Date(Date.now() - ANALYTICS_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const where = {
    createdAt: {
      gte: since,
    },
    ...(userId ? { userId } : {}),
  };

  const [events, recentEvents, selectedUser] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where,
      select: {
        type: true,
        targetType: true,
        targetKey: true,
        label: true,
        sourceSection: true,
        userId: true,
      },
    }),
    prisma.analyticsEvent.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      take: RECENT_EVENTS_LIMIT,
      select: {
        id: true,
        type: true,
        targetType: true,
        targetKey: true,
        label: true,
        sourcePath: true,
        sourceSection: true,
        regionKey: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            image: true,
          },
        },
      },
    }),
    userId
      ? prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            image: true,
            locationLabel: true,
            regionKey: true,
          },
        })
      : Promise.resolve(null),
  ]);

  const disabledFeatureClicks = events.filter((event) => event.type === 'disabled_feature_click');
  const bannerClicks = events.filter((event) => event.type === 'banner_click');

  const topDisabledFeatures = aggregateItems(
    events,
    (event) => event.type === 'disabled_feature_click',
    (event) => `${event.targetKey}::${event.sourceSection || 'unknown'}`,
    (event, count) => ({
      targetKey: event.targetKey,
      label: event.label,
      sourceSection: event.sourceSection,
      count,
    }),
  ).slice(0, 8);

  const topBanners = aggregateItems(
    events,
    (event) => event.type === 'banner_click',
    (event) => event.targetKey,
    (event, count) => ({
      targetKey: event.targetKey,
      label: event.label,
      count,
    }),
  ).slice(0, 8);

  const topSources = aggregateItems(
    events,
    () => true,
    (event) => (event.sourceSection || 'Desconhecido') as string,
    (event, count) => ({
      sourceSection: event.sourceSection || 'Desconhecido',
      count,
    }),
  ).slice(0, 8);

  const trackedUsers = new Set(events.map((event) => event.userId).filter(Boolean)).size;

  return NextResponse.json({
    windowDays: ANALYTICS_WINDOW_DAYS,
    selectedUser,
    summary: {
      totalEvents: events.length,
      disabledFeatureClicks: disabledFeatureClicks.length,
      bannerClicks: bannerClicks.length,
      trackedUsers,
    },
    topDisabledFeatures,
    topBanners,
    topSources,
    recentEvents,
  });
}

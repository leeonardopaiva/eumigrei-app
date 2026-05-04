import { BusinessStatus, CommunityPostStatus, EventStatus, Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getVisibilityFilter } from '@/lib/visibility';

const SEARCH_RESULTS_LIMIT = 6;

export async function GET(request: Request) {
  const session = await getServerAuthSession();
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() ?? '';
  const viewerRegionKey = session?.user?.regionKey ?? searchParams.get('region');

  if (!query) {
    return NextResponse.json({
      query: '',
      businesses: [],
      events: [],
      posts: [],
      counts: {
        businesses: 0,
        events: 0,
        posts: 0,
        total: 0,
      },
    });
  }

  const normalizedQuery = query.slice(0, 80);
  const now = new Date();

  await prisma.analyticsEvent.create({
    data: {
      type: 'search_query',
      targetType: 'search',
      targetKey: normalizedQuery.toLowerCase(),
      label: normalizedQuery,
      sourcePath: '/buscar',
      sourceSection: 'search',
      regionKey: viewerRegionKey || null,
      userId: session?.user?.id || null,
    },
  }).catch((error) => {
    console.error('Failed to track search query:', error);
  });

  const businessWhere: Prisma.BusinessWhereInput = {
    status: BusinessStatus.PUBLISHED,
    OR: [
      { name: { contains: normalizedQuery, mode: Prisma.QueryMode.insensitive } },
      { category: { contains: normalizedQuery, mode: Prisma.QueryMode.insensitive } },
      { address: { contains: normalizedQuery, mode: Prisma.QueryMode.insensitive } },
      { description: { contains: normalizedQuery, mode: Prisma.QueryMode.insensitive } },
    ],
    ...getVisibilityFilter(viewerRegionKey),
  };

  const eventWhere: Prisma.EventWhereInput = {
    status: EventStatus.PUBLISHED,
    startsAt: {
      gte: now,
    },
    OR: [
      { title: { contains: normalizedQuery, mode: Prisma.QueryMode.insensitive } },
      { description: { contains: normalizedQuery, mode: Prisma.QueryMode.insensitive } },
      { venueName: { contains: normalizedQuery, mode: Prisma.QueryMode.insensitive } },
      { locationLabel: { contains: normalizedQuery, mode: Prisma.QueryMode.insensitive } },
    ],
    ...getVisibilityFilter(viewerRegionKey),
  };

  const postWhere: Prisma.CommunityPostWhereInput = {
    status: CommunityPostStatus.PUBLISHED,
    ...(viewerRegionKey ? { regionKey: viewerRegionKey } : {}),
    OR: [
      { content: { contains: normalizedQuery, mode: Prisma.QueryMode.insensitive } },
      { locationLabel: { contains: normalizedQuery, mode: Prisma.QueryMode.insensitive } },
      {
        author: {
          OR: [
            { name: { contains: normalizedQuery, mode: Prisma.QueryMode.insensitive } },
            { username: { contains: normalizedQuery, mode: Prisma.QueryMode.insensitive } },
          ],
        },
      },
    ],
  };

  const [businesses, businessCount, events, eventCount, posts, postCount] = await Promise.all([
    prisma.business.findMany({
      where: businessWhere,
      orderBy: [{ ratingCount: 'desc' }, { createdAt: 'desc' }],
      take: SEARCH_RESULTS_LIMIT,
      select: {
        id: true,
        slug: true,
        name: true,
        category: true,
        address: true,
        description: true,
        imageUrl: true,
        locationLabel: true,
        ratingAverage: true,
        ratingCount: true,
      },
    }),
    prisma.business.count({ where: businessWhere }),
    prisma.event.findMany({
      where: eventWhere,
      orderBy: [{ startsAt: 'asc' }],
      take: SEARCH_RESULTS_LIMIT,
      select: {
        id: true,
        slug: true,
        title: true,
        venueName: true,
        startsAt: true,
        locationLabel: true,
        description: true,
        imageUrl: true,
        ratingAverage: true,
        ratingCount: true,
      },
    }),
    prisma.event.count({ where: eventWhere }),
    prisma.communityPost.findMany({
      where: postWhere,
      orderBy: [{ createdAt: 'desc' }],
      take: SEARCH_RESULTS_LIMIT,
      select: {
        id: true,
        content: true,
        imageUrl: true,
        createdAt: true,
        locationLabel: true,
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
    }),
    prisma.communityPost.count({ where: postWhere }),
  ]);

  return NextResponse.json({
    query: normalizedQuery,
    businesses,
    events,
    posts,
    counts: {
      businesses: businessCount,
      events: eventCount,
      posts: postCount,
      total: businessCount + eventCount + postCount,
    },
  });
}

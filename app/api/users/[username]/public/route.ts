import { BusinessStatus, CommunityPostStatus, EventStatus, FriendRequestStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getVisibilityFilter } from '@/lib/visibility';

type RouteContext = {
  params: Promise<{
    username: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await getServerAuthSession();
  const { username } = await context.params;
  const normalizedUsername = username.trim().toLowerCase();

  const user = await prisma.user.findFirst({
    where: {
      username: normalizedUsername,
    },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      locationLabel: true,
      regionKey: true,
      createdAt: true,
    },
  });

  if (!user?.username) {
    return NextResponse.json({ error: 'Perfil publico nao encontrado.' }, { status: 404 });
  }

  const businessVisibilityWhere = {
    createdById: user.id,
    status: BusinessStatus.PUBLISHED,
    ...getVisibilityFilter(session?.user?.regionKey),
  };

  const eventVisibilityWhere = {
    createdById: user.id,
    status: EventStatus.PUBLISHED,
    ...getVisibilityFilter(session?.user?.regionKey),
  };

  const postVisibilityWhere = session?.user?.regionKey
    ? {
        authorId: user.id,
        status: CommunityPostStatus.PUBLISHED,
        regionKey: session.user.regionKey,
      }
    : null;

  const [
    businesses,
    events,
    posts,
    friendCount,
    businessCount,
    eventCount,
    postCount,
  ] = await Promise.all([
    prisma.business.findMany({
      where: businessVisibilityWhere,
      orderBy: [{ createdAt: 'desc' }],
      take: 6,
      select: {
        id: true,
        slug: true,
        name: true,
        category: true,
        imageUrl: true,
        locationLabel: true,
        ratingAverage: true,
        ratingCount: true,
      },
    }),
    prisma.event.findMany({
      where: eventVisibilityWhere,
      orderBy: [{ startsAt: 'asc' }],
      take: 6,
      select: {
        id: true,
        slug: true,
        title: true,
        venueName: true,
        startsAt: true,
        imageUrl: true,
        locationLabel: true,
        ratingAverage: true,
        ratingCount: true,
      },
    }),
    postVisibilityWhere
      ? prisma.communityPost.findMany({
          where: postVisibilityWhere,
          orderBy: [{ createdAt: 'desc' }],
          take: 4,
          select: {
            id: true,
            content: true,
            imageUrl: true,
            createdAt: true,
            locationLabel: true,
            _count: {
              select: {
                reactions: true,
                comments: true,
              },
            },
          },
        })
      : Promise.resolve([]),
    prisma.friendRequest.count({
      where: {
        status: FriendRequestStatus.ACCEPTED,
        OR: [{ requesterId: user.id }, { recipientId: user.id }],
      },
    }),
    prisma.business.count({
      where: businessVisibilityWhere,
    }),
    prisma.event.count({
      where: eventVisibilityWhere,
    }),
    postVisibilityWhere
      ? prisma.communityPost.count({
          where: postVisibilityWhere,
        })
      : Promise.resolve(0),
  ]);

  return NextResponse.json({
    profile: {
      id: user.id,
      name: user.name || 'Usuario da comunidade',
      username: user.username,
      image: user.image,
      locationLabel: user.locationLabel,
      joinedAt: user.createdAt,
      publicPath: `/${user.username}`,
      friendFeature: {
        available: false,
        canRequest: Boolean(session?.user?.id && session.user.id !== user.id),
      },
      stats: {
        friendCount,
        businessCount,
        eventCount,
        postCount,
      },
      businesses,
      events,
      posts,
    },
  });
}

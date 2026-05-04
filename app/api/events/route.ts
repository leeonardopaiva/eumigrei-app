import { EventStatus, Prisma, UserRole, VisibilityScope } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildRateLimitHeaders, consumeRateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { findRegionByKey } from '@/lib/region-store';
import { slugify, uniqueSlug } from '@/lib/slug';
import { eventSchema } from '@/lib/validators';
import { getVisibilityFilter } from '@/lib/visibility';

export async function GET(request: Request) {
  const session = await getServerAuthSession();
  const { searchParams } = new URL(request.url);
  const viewerRegionKey = searchParams.get('region') ?? session?.user?.regionKey;
  const viewerId = session?.user?.id;
  const isAdmin = session?.user?.role === UserRole.ADMIN;
  const recentCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const baseWhere: Prisma.EventWhereInput = {
    startsAt: {
      gte: recentCutoff,
    },
    OR: [
      {
        status: EventStatus.PUBLISHED,
        ...getVisibilityFilter(viewerRegionKey),
      },
      ...(viewerId
        ? [
            {
              status: EventStatus.PENDING_REVIEW,
              createdById: viewerId,
            },
          ]
        : []),
      ...(isAdmin
        ? [
            {
              status: EventStatus.PENDING_REVIEW,
            },
          ]
        : []),
    ],
  };

  const events = await prisma.event.findMany({
    where: baseWhere,
    orderBy: [{ startsAt: 'asc' }],
    take: 24,
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      venueName: true,
      startsAt: true,
      endsAt: true,
      locationLabel: true,
      regionKey: true,
      externalUrl: true,
      imageUrl: true,
      galleryUrls: true,
      ratingAverage: true,
      ratingCount: true,
      visibilityScope: true,
      status: true,
      createdById: true,
      favorites: {
        where: { userId: viewerId || '__no-user__' },
        select: { id: true },
        take: 1,
      },
    },
  });

  const scope: 'local' | 'global' =
    viewerRegionKey &&
    events.some((event) => event.visibilityScope !== VisibilityScope.GLOBAL)
      ? 'local'
      : 'global';

  return NextResponse.json({
    events: events.map(({ createdById, favorites, visibilityScope, ...event }) => ({
      ...event,
      isFavorite: favorites.length > 0,
      canEdit: isAdmin || createdById === viewerId,
      isPendingReview: event.status === EventStatus.PENDING_REVIEW,
    })),
    scope,
  });
}

export async function POST(request: Request) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimit = await consumeRateLimit({
    scope: 'event:create',
    key: getRateLimitKey(request, session.user.id),
    max: 4,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Cadastros demais em pouco tempo. Aguarde antes de enviar outro evento.' },
      { status: 429, headers: buildRateLimitHeaders(rateLimit) },
    );
  }

  if (!session.user.onboardingCompleted) {
    return NextResponse.json(
      { error: 'Complete your profile before creating an event' },
      { status: 400 },
    );
  }

  const body = await request.json();
  const parsed = eventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid event data' },
      { status: 400 },
    );
  }

  const region = await findRegionByKey(parsed.data.regionKey, { activeOnly: true });

  if (!region) {
    return NextResponse.json({ error: 'Selecione uma regiao valida.' }, { status: 400 });
  }

  const baseSlug = slugify(parsed.data.title);
  const slug =
    baseSlug &&
    !(await prisma.event.findUnique({
      where: { slug: baseSlug },
      select: { id: true },
    }))
      ? baseSlug
      : uniqueSlug(parsed.data.title);

  const event = await prisma.event.create({
    data: {
      title: parsed.data.title,
      slug,
      description: parsed.data.description,
      venueName: parsed.data.venueName,
      startsAt: new Date(parsed.data.startsAt),
      endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
      locationLabel: region.label,
      regionKey: region.key,
      externalUrl: parsed.data.externalUrl,
      imageUrl: parsed.data.imageUrl,
      galleryUrls: parsed.data.galleryUrls,
      visibilityScope: VisibilityScope.USER_REGION,
      status: EventStatus.PENDING_REVIEW,
      createdById: session.user.id,
    },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
    },
  });

  return NextResponse.json({
    event,
    message: 'Event submitted for review',
  });
}


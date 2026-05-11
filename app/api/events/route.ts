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
      businessId: true,
      favorites: {
        select: {
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      },
      _count: {
        select: {
          favorites: true,
        },
      },
    },
  });

  const scope: 'local' | 'global' =
    viewerRegionKey &&
    events.some((event) => event.visibilityScope !== VisibilityScope.GLOBAL)
      ? 'local'
      : 'global';
  const businessEditableEventIds =
    viewerId && events.length > 0
      ? new Set(
          (
            await prisma.$queryRaw<Array<{ eventId: string }>>(
              Prisma.sql`
                SELECT e."id" AS "eventId"
                FROM "public"."Event" e
                INNER JOIN "public"."BusinessMember" bm ON bm."businessId" = e."businessId"
                WHERE e."id" IN (${Prisma.join(events.map((event) => event.id))})
                  AND bm."userId" = ${viewerId}
              `,
            )
          ).map((row) => row.eventId),
        )
      : new Set<string>();

  return NextResponse.json({
    events: events.map(({ createdById, businessId, favorites, visibilityScope, _count, ...event }) => {
      const canEdit = isAdmin || createdById === viewerId || businessEditableEventIds.has(event.id);
      const canViewInterestedUsers = isAdmin;
      const canUnlockInterestedUsers = !isAdmin && canEdit && Boolean(businessId);

      return {
        ...event,
        isFavorite: Boolean(viewerId && favorites.some((favorite) => favorite.userId === viewerId)),
        interestCount: _count.favorites,
        interestPreview: canViewInterestedUsers
          ? favorites
              .map((favorite) => favorite.user)
              .filter((user): user is { id: string; name: string | null; image: string | null } => Boolean(user))
          : favorites.map((favorite) => ({ id: favorite.userId, name: null, image: null })),
        canViewInterestedUsers,
        canUnlockInterestedUsers,
        canEdit,
        isPendingReview: event.status === EventStatus.PENDING_REVIEW,
      };
    }),
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

  const professionalBusiness = parsed.data.businessId
    ? await prisma.business.findFirst({
        where: {
          id: parsed.data.businessId,
          OR: [
            { createdById: session.user.id },
            { members: { some: { userId: session.user.id } } },
          ],
        },
        select: {
          id: true,
          regionKey: true,
          locationLabel: true,
        },
      })
    : null;

  if (parsed.data.businessId && !professionalBusiness) {
    return NextResponse.json(
      { error: 'Selecione um perfil profissional valido para cadastrar o evento.' },
      { status: 403 },
    );
  }

  const effectiveRegionKey = professionalBusiness?.regionKey ?? parsed.data.regionKey;
  const region = professionalBusiness
    ? null
    : await findRegionByKey(effectiveRegionKey, { activeOnly: true });

  if (!professionalBusiness && !region) {
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

  const event = await prisma.$transaction(async (tx) => {
    const created = await tx.event.create({
      data: {
        title: parsed.data.title,
        slug,
        description: parsed.data.description,
        venueName: parsed.data.venueName,
        startsAt: new Date(parsed.data.startsAt),
        endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
        locationLabel: professionalBusiness?.locationLabel ?? region!.label,
        regionKey: professionalBusiness?.regionKey ?? region!.key,
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

    if (professionalBusiness) {
      await tx.$executeRaw`
        UPDATE "public"."Event"
        SET "businessId" = ${professionalBusiness.id}
        WHERE "id" = ${created.id}
      `;
    }

    return created;
  });

  return NextResponse.json({
    event,
    message: 'Event submitted for review',
  });
}


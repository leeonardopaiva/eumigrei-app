import { BusinessStatus, BusinessMemberRole, Prisma, UserRole, VisibilityScope } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildRateLimitHeaders, consumeRateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { findRegionByKey } from '@/lib/region-store';
import { slugify, uniqueSlug } from '@/lib/slug';
import { businessSchema } from '@/lib/validators';
import { getVisibilityFilter } from '@/lib/visibility';

export async function GET(request: Request) {
  const session = await getServerAuthSession();
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const viewerRegionKey = searchParams.get('region') ?? session?.user?.regionKey;
  const viewerId = session?.user?.id;
  const isAdmin = session?.user?.role === UserRole.ADMIN;

  const baseWhere: Prisma.BusinessWhereInput = {
    AND: [
      category ? { category } : {},
      search
        ? {
            OR: [
              { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
              { category: { contains: search, mode: Prisma.QueryMode.insensitive } },
              { address: { contains: search, mode: Prisma.QueryMode.insensitive } },
            ],
          }
        : {},
      {
        OR: [
          {
            status: BusinessStatus.PUBLISHED,
            ...getVisibilityFilter(viewerRegionKey),
          },
          ...(viewerId
            ? [
                {
                  status: BusinessStatus.PENDING_REVIEW,
                  createdById: viewerId,
                },
              ]
            : []),
          ...(isAdmin
            ? [
                {
                  status: BusinessStatus.PENDING_REVIEW,
                },
              ]
            : []),
        ],
      },
    ],
  };

  const businesses = await prisma.business.findMany({
    where: baseWhere,
    orderBy: [{ createdAt: 'desc' }],
    take: 24,
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
      address: true,
      imageUrl: true,
      locationLabel: true,
      ratingAverage: true,
      ratingCount: true,
      visibilityScope: true,
      status: true,
      createdById: true,
      members: {
        where: { userId: viewerId || '__no-user__' },
        select: { id: true },
        take: 1,
      },
      favorites: {
        where: { userId: viewerId || '__no-user__' },
        select: { id: true },
        take: 1,
      },
    },
  });

  const scope: 'local' | 'global' =
    viewerRegionKey &&
    businesses.some((business) => business.visibilityScope !== VisibilityScope.GLOBAL)
      ? 'local'
      : 'global';

  return NextResponse.json({
    businesses: businesses.map(({ createdById, favorites, members, visibilityScope, ...business }) => ({
      ...business,
      isFavorite: favorites.length > 0,
      canEdit: isAdmin || createdById === viewerId || members.length > 0,
      isPendingReview: business.status === BusinessStatus.PENDING_REVIEW,
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
    scope: 'business:create',
    key: getRateLimitKey(request, session.user.id),
    max: 4,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Cadastros demais em pouco tempo. Aguarde antes de enviar outro negocio.' },
      { status: 429, headers: buildRateLimitHeaders(rateLimit) },
    );
  }

  if (!session.user.onboardingCompleted) {
    return NextResponse.json(
      { error: 'Complete your profile before creating a business' },
      { status: 400 },
    );
  }

  const body = await request.json();
  const parsed = businessSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid business data' },
      { status: 400 },
    );
  }

  const region = await findRegionByKey(parsed.data.regionKey, { activeOnly: true });

  if (!region) {
    return NextResponse.json({ error: 'Selecione uma regiao valida.' }, { status: 400 });
  }

  const baseSlug = slugify(parsed.data.name);
  const slug =
    baseSlug &&
    !(await prisma.business.findUnique({
      where: { slug: baseSlug },
      select: { id: true },
    }))
      ? baseSlug
      : uniqueSlug(parsed.data.name);

  const business = await prisma.$transaction(async (tx) => {
    const created = await tx.business.create({
      data: {
        name: parsed.data.name,
        slug,
        category: parsed.data.category,
        description: parsed.data.description,
        address: parsed.data.address,
        phone: parsed.data.phone,
        whatsapp: parsed.data.whatsapp,
        website: parsed.data.website,
        instagram: parsed.data.instagram,
        imageUrl: parsed.data.imageUrl,
        galleryUrls: parsed.data.galleryUrls,
        locationLabel: region.label,
        regionKey: region.key,
        visibilityScope: VisibilityScope.USER_REGION,
        status: BusinessStatus.PENDING_REVIEW,
        createdById: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: BusinessMemberRole.OWNER,
          },
        },
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    await tx.user.update({
      where: { id: session.user.id },
      data: {
        role: session.user.role === UserRole.ADMIN ? UserRole.ADMIN : UserRole.BUSINESS_OWNER,
      },
    });

    return created;
  });

  return NextResponse.json({
    business,
    message: 'Business submitted for review',
  });
}

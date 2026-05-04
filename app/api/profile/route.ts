import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildRateLimitHeaders, consumeRateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { validateUsernameValue } from '@/lib/username';
import { updateProfileSchema } from '@/lib/validators';

export async function GET() {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      phone: true,
      image: true,
      coverImageUrl: true,
      bio: true,
      interests: true,
      galleryUrls: true,
      locationLabel: true,
      regionKey: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'Usuario nao encontrado.' }, { status: 404 });
  }

  const [businesses, events] = await Promise.all([
    prisma.business.findMany({
      where: {
        OR: [
          { createdById: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
      orderBy: [{ updatedAt: 'desc' }],
      take: 12,
      select: {
        id: true,
        slug: true,
        name: true,
        category: true,
        status: true,
        imageUrl: true,
        locationLabel: true,
        regionKey: true,
        updatedAt: true,
      },
    }),
    prisma.event.findMany({
      where: {
        createdById: session.user.id,
      },
      orderBy: [{ updatedAt: 'desc' }],
      take: 12,
      select: {
        id: true,
        slug: true,
        title: true,
        startsAt: true,
        status: true,
        imageUrl: true,
        locationLabel: true,
        updatedAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    user,
    professionalProfile: {
      businessCount: businesses.length,
      eventCount: events.length,
      identity: businesses[0]
        ? {
            id: businesses[0].id,
            name: businesses[0].name,
            slug: businesses[0].slug || businesses[0].id,
            imageUrl: businesses[0].imageUrl,
            locationLabel: businesses[0].locationLabel,
            regionKey: businesses[0].regionKey,
            publicPath: `/negocios/${businesses[0].slug || businesses[0].id}`,
          }
        : null,
      businesses: businesses.map((business) => ({
        ...business,
        publicPath: `/negocios/${business.slug || business.id}`,
      })),
      events: events.map((event) => ({
        ...event,
        publicPath: `/eventos/${event.slug || event.id}`,
      })),
    },
  });
}

export async function PUT(request: Request) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimit = await consumeRateLimit({
    scope: 'profile:update',
    key: getRateLimitKey(request, session.user.id),
    max: 8,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Muitas atualizacoes em pouco tempo. Tente novamente em alguns minutos.' },
      { status: 429, headers: buildRateLimitHeaders(rateLimit) },
    );
  }

  const body = await request.json();
  const parsed = updateProfileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Dados invalidos do perfil.' },
      { status: 400 },
    );
  }

  const usernameValidation = validateUsernameValue(parsed.data.username);

  if (usernameValidation.error) {
    return NextResponse.json({ error: usernameValidation.error }, { status: 400 });
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      username: usernameValidation.normalized,
      NOT: {
        id: session.user.id,
      },
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    return NextResponse.json({ error: 'Esse nome publico ja esta em uso.' }, { status: 409 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
    },
  });

  const currentEmail = currentUser?.email?.trim().toLowerCase() || '';
  const requestedEmail = parsed.data.email?.trim().toLowerCase() || '';

  if (requestedEmail !== currentEmail) {
    return NextResponse.json(
      { error: 'A troca de email exige verificacao e ficou bloqueada nesta versao.' },
      { status: 400 },
    );
  }

  try {
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: parsed.data.name,
        username: usernameValidation.normalized,
        phone: parsed.data.phone,
        bio: parsed.data.bio ?? null,
        coverImageUrl: parsed.data.coverImageUrl ?? null,
        interests: parsed.data.interests,
        galleryUrls: parsed.data.galleryUrls,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        bio: true,
        coverImageUrl: true,
        interests: true,
        galleryUrls: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Email ou nome publico ja esta em uso.' },
        { status: 409 },
      );
    }

    throw error;
  }
}


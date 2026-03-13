import { EventStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { slugify, uniqueSlug } from '@/lib/slug';
import { eventSchema } from '@/lib/validators';

export async function GET(request: Request) {
  const session = await getServerAuthSession();
  const { searchParams } = new URL(request.url);
  const regionKey = session?.user?.regionKey ?? searchParams.get('region');
  const now = new Date();

  const events = await prisma.event.findMany({
    where: {
      status: EventStatus.PUBLISHED,
      ...(regionKey ? { regionKey } : {}),
      startsAt: {
        gte: now,
      },
    },
    orderBy: [{ startsAt: 'asc' }],
    take: 24,
    select: {
      id: true,
      slug: true,
      title: true,
      venueName: true,
      startsAt: true,
      locationLabel: true,
      imageUrl: true,
      status: true,
    },
  });

  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      locationLabel: parsed.data.locationLabel,
      regionKey: slugify(parsed.data.locationLabel),
      externalUrl: parsed.data.externalUrl,
      imageUrl: parsed.data.imageUrl,
      status: EventStatus.PENDING_REVIEW,
      createdById: session.user.id,
    },
    select: {
      id: true,
      title: true,
      status: true,
    },
  });

  return NextResponse.json({
    event,
    message: 'Event submitted for review',
  });
}

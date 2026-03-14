import { EventStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { findRegionByKey } from '@/lib/region-store';
import { updateEventMediaSchema } from '@/lib/validators';

type RouteContext = {
  params: Promise<{
    eventId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await getServerAuthSession();
  const { eventId } = await context.params;

  const event = await prisma.event.findFirst({
    where: {
      OR: [{ id: eventId }, { slug: eventId }],
    },
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
      status: true,
      createdById: true,
      createdBy: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: 'Evento nao encontrado.' }, { status: 404 });
  }

  const canView =
    event.status === EventStatus.PUBLISHED ||
    session?.user?.role === 'ADMIN' ||
    session?.user?.id === event.createdById;

  if (!canView) {
    return NextResponse.json({ error: 'Evento nao disponivel.' }, { status: 404 });
  }

  const region = await findRegionByKey(event.regionKey);
  const canEdit = session?.user?.role === 'ADMIN' || session?.user?.id === event.createdById;

  return NextResponse.json({
    event: {
      ...event,
      city: region?.city ?? null,
      state: region?.state ?? null,
      canEdit,
      publicPath: `/eventos/${event.slug}`,
    },
  });
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateEventMediaSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Dados invalidos do evento.' },
      { status: 400 },
    );
  }

  const { eventId } = await context.params;
  const existingEvent = await prisma.event.findFirst({
    where: {
      OR: [{ id: eventId }, { slug: eventId }],
    },
    select: {
      id: true,
      slug: true,
      createdById: true,
    },
  });

  if (!existingEvent) {
    return NextResponse.json({ error: 'Evento nao encontrado.' }, { status: 404 });
  }

  const canEdit = session.user.role === 'ADMIN' || session.user.id === existingEvent.createdById;

  if (!canEdit) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const event = await prisma.event.update({
    where: { id: existingEvent.id },
    data: {
      imageUrl: parsed.data.imageUrl ?? null,
      galleryUrls: parsed.data.galleryUrls,
    },
    select: {
      id: true,
      slug: true,
      imageUrl: true,
      galleryUrls: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ event });
}

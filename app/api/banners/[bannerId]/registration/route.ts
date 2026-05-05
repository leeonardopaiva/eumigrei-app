import { BannerType } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{
    bannerId: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { bannerId } = await context.params;

  const banner = await prisma.banner.findFirst({
    where: {
      id: bannerId,
      type: BannerType.REGISTRATION,
      isActive: true,
    },
    select: { id: true, name: true, billingMode: true, bidCents: true },
  });

  if (!banner) {
    return NextResponse.json({ error: 'Banner de cadastro nao encontrado.' }, { status: 404 });
  }

  const existingRegistration = await prisma.bannerRegistration.findUnique({
    where: {
      bannerId_userId: {
        bannerId,
        userId: session.user.id,
      },
    },
    select: { id: true },
  });

  const registration = await prisma.bannerRegistration.upsert({
    where: {
      bannerId_userId: {
        bannerId,
        userId: session.user.id,
      },
    },
    update: {
      name: session.user.name ?? null,
      email: session.user.email ?? null,
      phone: session.user.phone ?? null,
      regionKey: session.user.regionKey ?? null,
      locationLabel: session.user.locationLabel ?? null,
    },
    create: {
      bannerId,
      userId: session.user.id,
      name: session.user.name ?? null,
      email: session.user.email ?? null,
      phone: session.user.phone ?? null,
      regionKey: session.user.regionKey ?? null,
      locationLabel: session.user.locationLabel ?? null,
    },
    select: { id: true, createdAt: true },
  });

  await prisma.analyticsEvent.create({
    data: {
      type: 'banner_registration',
      targetType: 'banner',
      targetKey: banner.id,
      label: banner.name,
      sourcePath: '/',
      sourceSection: 'home_banner',
      regionKey: session.user.regionKey ?? null,
      userId: session.user.id,
    },
  });

  if (!existingRegistration && banner.billingMode === 'CPL' && banner.bidCents > 0) {
    await prisma.$transaction([
      prisma.banner.update({
        where: { id: banner.id },
        data: {
          spentCents: {
            increment: banner.bidCents,
          },
        },
        select: { id: true },
      }),
      prisma.adCharge.create({
        data: {
          bannerId: banner.id,
          userId: session.user.id,
          amountCents: banner.bidCents,
          billingMode: 'CPL',
          sourceType: 'lead',
        },
        select: { id: true },
      }),
    ]);
  }

  return NextResponse.json({
    registration,
    message: 'Cadastro registrado. Entraremos em contato com seus dados de perfil.',
  });
}

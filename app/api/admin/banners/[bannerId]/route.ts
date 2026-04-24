import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findRegionByKey } from '@/lib/region-store';
import { requireAdminSession } from '@/lib/require-admin';
import { adminBannerSchema } from '@/lib/validators';

type RouteContext = {
  params: Promise<{
    bannerId: string;
  }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const { response } = await requireAdminSession();

  if (response) {
    return response;
  }

  const body = await request.json();
  const parsed = adminBannerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Dados invalidos do banner.' },
      { status: 400 },
    );
  }

  if (parsed.data.regionKey) {
    const region = await findRegionByKey(parsed.data.regionKey);

    if (!region) {
      return NextResponse.json({ error: 'Regiao invalida.' }, { status: 400 });
    }
  }

  const { bannerId } = await context.params;

  try {
    const banner = await prisma.banner.update({
      where: { id: bannerId },
      data: {
        name: parsed.data.name,
        imageUrl: parsed.data.imageUrl,
        type: parsed.data.type,
        placement: parsed.data.placement,
        targetUrl: parsed.data.type === 'LINK' ? parsed.data.targetUrl : null,
        regionKey: parsed.data.regionKey ?? null,
        isActive: parsed.data.isActive,
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        type: true,
        placement: true,
        targetUrl: true,
        regionKey: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        region: {
          select: {
            key: true,
            label: true,
          },
        },
      },
    });

    return NextResponse.json({ banner });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return NextResponse.json({ error: 'Banner nao encontrado.' }, { status: 404 });
    }

    throw error;
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findRegionByKey } from '@/lib/region-store';
import { requireAdminSession } from '@/lib/require-admin';
import { adminBannerSchema } from '@/lib/validators';

export async function POST(request: Request) {
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

  const banner = await prisma.banner.create({
    data: {
      name: parsed.data.name,
      imageUrl: parsed.data.imageUrl,
      targetUrl: parsed.data.targetUrl,
      regionKey: parsed.data.regionKey ?? null,
      isActive: parsed.data.isActive,
    },
    select: {
      id: true,
      name: true,
      imageUrl: true,
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
}

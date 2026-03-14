import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerAuthSession();
  const { searchParams } = new URL(request.url);
  const regionKey = session?.user?.regionKey ?? searchParams.get('region');

  const banners = await prisma.banner.findMany({
    where: regionKey
      ? {
          isActive: true,
          OR: [{ regionKey }, { regionKey: null }],
        }
      : {
          isActive: true,
          regionKey: null,
        },
    orderBy: [{ updatedAt: 'desc' }],
    select: {
      id: true,
      name: true,
      imageUrl: true,
      targetUrl: true,
      regionKey: true,
      updatedAt: true,
      region: {
        select: {
          key: true,
          label: true,
        },
      },
    },
  });

  const sortedBanners = regionKey
    ? [...banners].sort((left, right) => {
        const leftScore = left.regionKey === regionKey ? 0 : 1;
        const rightScore = right.regionKey === regionKey ? 0 : 1;
        return leftScore - rightScore;
      })
    : banners;

  return NextResponse.json({
    banners: sortedBanners.map((banner) => ({
      id: banner.id,
      name: banner.name,
      imageUrl: banner.imageUrl,
      targetUrl: banner.targetUrl,
      regionKey: banner.regionKey,
      regionLabel: banner.region?.label ?? null,
      scope: banner.regionKey ? 'regional' : 'global',
    })),
  });
}

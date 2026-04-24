import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const getPlacementFilter = (placement: string | null) => {
  if (placement === 'feed') {
    return [{ placement: 'FEED' as const }, { placement: 'BOTH' as const }];
  }

  return [{ placement: 'HOME' as const }, { placement: 'BOTH' as const }];
};

export async function GET(request: Request) {
  const session = await getServerAuthSession();
  const { searchParams } = new URL(request.url);
  const regionKey = session?.user?.regionKey ?? searchParams.get('region');
  const placementFilter = getPlacementFilter(searchParams.get('placement'));

  const banners = await prisma.banner.findMany({
    where: regionKey
      ? {
          isActive: true,
          AND: [{ OR: [{ regionKey }, { regionKey: null }] }, { OR: placementFilter }],
        }
      : {
          isActive: true,
          regionKey: null,
          OR: placementFilter,
        },
    orderBy: [{ updatedAt: 'desc' }],
    select: {
      id: true,
      name: true,
      imageUrl: true,
      type: true,
      placement: true,
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
      type: banner.type,
      placement: banner.placement,
      targetUrl: banner.targetUrl,
      regionKey: banner.regionKey,
      regionLabel: banner.region?.label ?? null,
      scope: banner.regionKey ? 'regional' : 'global',
    })),
  });
}

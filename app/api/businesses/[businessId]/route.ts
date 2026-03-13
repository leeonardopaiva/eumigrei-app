import { BusinessStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{
    businessId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await getServerAuthSession();
  const { businessId } = await context.params;

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
      description: true,
      address: true,
      imageUrl: true,
      locationLabel: true,
      phone: true,
      whatsapp: true,
      website: true,
      instagram: true,
      status: true,
      createdById: true,
      createdAt: true,
    },
  });

  if (!business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  }

  const canView =
    business.status === BusinessStatus.PUBLISHED ||
    session?.user?.role === 'ADMIN' ||
    session?.user?.id === business.createdById;

  if (!canView) {
    return NextResponse.json({ error: 'Business not available' }, { status: 404 });
  }

  return NextResponse.json({ business });
}

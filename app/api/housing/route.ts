import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { housingSchema } from '@/lib/validators';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();
  const housing = await prisma.housing.findMany({
    where: {
      isActive: true,
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: 'insensitive' as const } },
              { propertyType: { contains: query, mode: 'insensitive' as const } },
              { locationLabel: { contains: query, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: { createdBy: { select: { id: true, name: true, username: true } } },
  });
  return NextResponse.json({ housing });
}

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = housingSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados invalidos.' }, { status: 400 });
  const housing = await prisma.housing.create({ data: { ...parsed.data, createdById: session.user.id } });
  return NextResponse.json({ housing }, { status: 201 });
}

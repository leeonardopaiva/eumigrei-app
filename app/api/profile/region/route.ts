import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { findRegionByKey } from '@/lib/region-store';
import { prisma } from '@/lib/prisma';
import { updateRegionSchema } from '@/lib/validators';

export async function PUT(request: Request) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateRegionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid region data' },
      { status: 400 },
    );
  }

  const region = await findRegionByKey(parsed.data.regionKey, { activeOnly: true });

  if (!region) {
    return NextResponse.json({ error: 'Invalid region' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      locationLabel: region.label,
      regionKey: region.key,
    },
    select: {
      id: true,
      locationLabel: true,
      regionKey: true,
    },
  });

  return NextResponse.json({ user });
}

import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/slug';
import { onboardingSchema } from '@/lib/validators';

export async function POST(request: Request) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = onboardingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid profile data' },
      { status: 400 },
    );
  }

  const regionKey = slugify(parsed.data.locationLabel);

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      locationLabel: parsed.data.locationLabel,
      regionKey,
      onboardingCompleted: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      locationLabel: true,
      regionKey: true,
      onboardingCompleted: true,
    },
  });

  return NextResponse.json({ user });
}

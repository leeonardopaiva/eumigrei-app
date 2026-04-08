import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { analyticsEventSchema } from '@/lib/validators';

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  const body = await request.json().catch(() => null);
  const parsed = analyticsEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Evento invalido.' },
      { status: 400 },
    );
  }

  await prisma.analyticsEvent.create({
    data: {
      ...parsed.data,
      regionKey: parsed.data.regionKey || session?.user?.regionKey || null,
      userId: session?.user?.id || null,
    },
  });

  return NextResponse.json({ ok: true });
}

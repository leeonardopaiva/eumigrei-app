import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateUsernameValue } from '@/lib/username';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUsername = searchParams.get('username') || '';
  const session = await getServerAuthSession();
  const validation = validateUsernameValue(rawUsername);

  if (validation.error) {
    return NextResponse.json({
      available: false,
      username: validation.normalized,
      reason: validation.error,
    });
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      username: validation.normalized,
      ...(session?.user?.id ? { NOT: { id: session.user.id } } : {}),
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    return NextResponse.json({
      available: false,
      username: validation.normalized,
      reason: 'Esse nome ja esta em uso.',
    });
  }

  return NextResponse.json({
    available: true,
    username: validation.normalized,
  });
}

import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findRegionByKey } from '@/lib/region-store';
import { requireAdminSession } from '@/lib/require-admin';
import { validateUsernameValue } from '@/lib/username';
import { adminUserSchema } from '@/lib/validators';

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const { response } = await requireAdminSession();

  if (response) {
    return response;
  }

  const body = await request.json();
  const parsed = adminUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Dados invalidos do usuario.' },
      { status: 400 },
    );
  }

  const { userId } = await context.params;
  const region = await findRegionByKey(parsed.data.regionKey);

  if (!region) {
    return NextResponse.json({ error: 'Regiao invalida.' }, { status: 400 });
  }

  const usernameValidation = validateUsernameValue(parsed.data.username);

  if (usernameValidation.error) {
    return NextResponse.json({ error: usernameValidation.error }, { status: 400 });
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      username: usernameValidation.normalized,
      NOT: {
        id: userId,
      },
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    return NextResponse.json({ error: 'Esse nome publico ja esta em uso.' }, { status: 409 });
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: parsed.data.name,
        username: usernameValidation.normalized,
        email: parsed.data.email,
        phone: parsed.data.phone,
        image: parsed.data.image ?? null,
        role: parsed.data.role,
        locationLabel: region.label,
        regionKey: region.key,
        onboardingCompleted: parsed.data.onboardingCompleted,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        locationLabel: true,
        regionKey: true,
        onboardingCompleted: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return NextResponse.json({ error: 'Usuario nao encontrado.' }, { status: 404 });
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Email ou nome publico ja esta em uso.' },
        { status: 409 },
      );
    }

    throw error;
  }
}

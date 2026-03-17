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
  const { session, response } = await requireAdminSession();

  if (response) {
    return response;
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
    },
  });

  if (!targetUser) {
    return NextResponse.json({ error: 'Usuario nao encontrado.' }, { status: 404 });
  }

  if (userId === session.user.id && parsed.data.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Voce nao pode remover sua propria permissao de administrador.' },
      { status: 400 },
    );
  }

  if (targetUser.role === 'ADMIN' && parsed.data.role !== 'ADMIN') {
    const adminCount = await prisma.user.count({
      where: {
        role: 'ADMIN',
      },
    });

    if (adminCount <= 1) {
      return NextResponse.json(
        { error: 'Nao e permitido rebaixar o ultimo administrador da plataforma.' },
        { status: 400 },
      );
    }
  }

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

export async function DELETE(_request: Request, context: RouteContext) {
  const { session, response } = await requireAdminSession();

  if (response) {
    return response;
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId } = await context.params;

  if (userId === session.user.id) {
    return NextResponse.json(
      { error: 'Voce nao pode excluir a propria conta de administrador.' },
      { status: 400 },
    );
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
    },
  });

  if (!targetUser) {
    return NextResponse.json({ error: 'Usuario nao encontrado.' }, { status: 404 });
  }

  if (targetUser.role === 'ADMIN') {
    const adminCount = await prisma.user.count({
      where: {
        role: 'ADMIN',
      },
    });

    if (adminCount <= 1) {
      return NextResponse.json(
        { error: 'Nao e permitido excluir o ultimo administrador da plataforma.' },
        { status: 400 },
      );
    }
  }

  try {
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return NextResponse.json({ error: 'Usuario nao encontrado.' }, { status: 404 });
    }

    throw error;
  }
}

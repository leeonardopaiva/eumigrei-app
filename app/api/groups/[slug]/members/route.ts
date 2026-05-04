import { CommunityGroupMemberRole } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await context.params;
  const group = await prisma.communityGroup.findFirst({
    where: {
      slug,
      isPublic: true,
    },
    select: {
      id: true,
      slug: true,
    },
  });

  if (!group) {
    return NextResponse.json({ error: 'Grupo nao encontrado.' }, { status: 404 });
  }

  const membership = await prisma.communityGroupMember.upsert({
    where: {
      groupId_userId: {
        groupId: group.id,
        userId: session.user.id,
      },
    },
    update: {},
    create: {
      groupId: group.id,
      userId: session.user.id,
      role: CommunityGroupMemberRole.MEMBER,
    },
    select: {
      id: true,
      role: true,
    },
  });

  return NextResponse.json({
    membership,
    message: 'Voce entrou no grupo.',
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await context.params;
  const group = await prisma.communityGroup.findFirst({
    where: {
      slug,
      isPublic: true,
    },
    select: {
      id: true,
      createdById: true,
    },
  });

  if (!group) {
    return NextResponse.json({ error: 'Grupo nao encontrado.' }, { status: 404 });
  }

  if (group.createdById === session.user.id) {
    return NextResponse.json({ error: 'O dono do grupo nao pode sair.' }, { status: 400 });
  }

  await prisma.communityGroupMember.deleteMany({
    where: {
      groupId: group.id,
      userId: session.user.id,
    },
  });

  return NextResponse.json({
    message: 'Voce saiu do grupo.',
  });
}

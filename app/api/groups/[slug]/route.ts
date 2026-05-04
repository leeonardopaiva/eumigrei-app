import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await getServerAuthSession();
  const { slug } = await context.params;

  const group = await prisma.communityGroup.findFirst({
    where: {
      slug,
      isPublic: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      category: true,
      regionKey: true,
      createdAt: true,
      createdById: true,
      region: {
        select: {
          label: true,
        },
      },
      members: {
        orderBy: [{ createdAt: 'asc' }],
        take: 60,
        select: {
          id: true,
          role: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              locationLabel: true,
            },
          },
        },
      },
      _count: {
        select: {
          members: true,
        },
      },
    },
  });

  if (!group) {
    return NextResponse.json({ error: 'Grupo nao encontrado.' }, { status: 404 });
  }

  const viewerMembership = session?.user?.id
    ? group.members.find((member) => member.user.id === session.user.id)
    : null;

  return NextResponse.json({
    group: {
      id: group.id,
      name: group.name,
      slug: group.slug,
      description: group.description,
      imageUrl: group.imageUrl,
      category: group.category,
      regionKey: group.regionKey,
      regionLabel: group.region?.label ?? null,
      createdAt: group.createdAt,
      memberCount: group._count.members,
      publicPath: `/grupos/${group.slug}`,
      viewerMembership: viewerMembership
        ? {
            id: viewerMembership.id,
            role: viewerMembership.role,
          }
        : null,
      members: group.members.map((member) => ({
        id: member.id,
        role: member.role,
        joinedAt: member.createdAt,
        user: member.user,
      })),
    },
  });
}

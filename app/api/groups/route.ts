import { CommunityGroupMemberRole } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { findRegionByKey } from '@/lib/region-store';
import { slugify, uniqueSlug } from '@/lib/slug';
import { communityGroupSchema } from '@/lib/validators';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.trim();

  const groups = await prisma.communityGroup.findMany({
    where: {
      isPublic: true,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { category: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: [{ createdAt: 'desc' }],
    take: 24,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      category: true,
      regionKey: true,
      region: {
        select: {
          label: true,
        },
      },
      _count: {
        select: {
          members: true,
        },
      },
    },
  });

  return NextResponse.json({
    groups: groups.map((group) => ({
      id: group.id,
      name: group.name,
      slug: group.slug,
      description: group.description,
      imageUrl: group.imageUrl,
      category: group.category,
      regionKey: group.regionKey,
      regionLabel: group.region?.label ?? null,
      memberCount: group._count.members,
      publicPath: `/grupos/${group.slug}`,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!session.user.onboardingCompleted) {
    return NextResponse.json({ error: 'Complete seu perfil antes de criar um grupo.' }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = communityGroupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Dados invalidos do grupo.' },
      { status: 400 },
    );
  }

  const region = parsed.data.regionKey
    ? await findRegionByKey(parsed.data.regionKey, { activeOnly: true })
    : null;

  if (parsed.data.regionKey && !region) {
    return NextResponse.json({ error: 'Selecione uma regiao valida.' }, { status: 400 });
  }

  const baseSlug = slugify(parsed.data.name);
  const slug =
    baseSlug &&
    !(await prisma.communityGroup.findUnique({
      where: { slug: baseSlug },
      select: { id: true },
    }))
      ? baseSlug
      : uniqueSlug(parsed.data.name);

  const group = await prisma.communityGroup.create({
    data: {
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
      imageUrl: parsed.data.imageUrl,
      category: parsed.data.category,
      regionKey: region?.key,
      createdById: session.user.id,
      members: {
        create: {
          userId: session.user.id,
          role: CommunityGroupMemberRole.OWNER,
        },
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  return NextResponse.json({
    group: {
      ...group,
      publicPath: `/grupos/${group.slug}`,
    },
    message: 'Grupo criado.',
  });
}

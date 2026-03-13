import { BusinessStatus, BusinessMemberRole, UserRole } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { slugify, uniqueSlug } from '@/lib/slug';
import { businessSchema } from '@/lib/validators';

export async function GET(request: Request) {
  const session = await getServerAuthSession();
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const regionKey = session?.user?.regionKey ?? searchParams.get('region');

  const businesses = await prisma.business.findMany({
    where: {
      status: BusinessStatus.PUBLISHED,
      ...(regionKey ? { regionKey } : {}),
      ...(category ? { category } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { category: { contains: search, mode: 'insensitive' } },
              { address: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: [{ createdAt: 'desc' }],
    take: 24,
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
      address: true,
      imageUrl: true,
      locationLabel: true,
      status: true,
    },
  });

  return NextResponse.json({ businesses });
}

export async function POST(request: Request) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!session.user.onboardingCompleted || !session.user.regionKey || !session.user.locationLabel) {
    return NextResponse.json(
      { error: 'Complete your profile before creating a business' },
      { status: 400 },
    );
  }

  const body = await request.json();
  const parsed = businessSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid business data' },
      { status: 400 },
    );
  }

  const baseSlug = slugify(parsed.data.name);
  const slug =
    baseSlug &&
    !(await prisma.business.findUnique({
      where: { slug: baseSlug },
      select: { id: true },
    }))
      ? baseSlug
      : uniqueSlug(parsed.data.name);

  const business = await prisma.$transaction(async (tx) => {
    const created = await tx.business.create({
      data: {
        name: parsed.data.name,
        slug,
        category: parsed.data.category,
        description: parsed.data.description,
        address: parsed.data.address,
        phone: parsed.data.phone,
        whatsapp: parsed.data.whatsapp,
        website: parsed.data.website,
        instagram: parsed.data.instagram,
        imageUrl: parsed.data.imageUrl,
        locationLabel: session.user.locationLabel!,
        regionKey: session.user.regionKey!,
        status: BusinessStatus.PENDING_REVIEW,
        createdById: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: BusinessMemberRole.OWNER,
          },
        },
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    await tx.user.update({
      where: { id: session.user.id },
      data: {
        role: session.user.role === UserRole.ADMIN ? UserRole.ADMIN : UserRole.BUSINESS_OWNER,
      },
    });

    return created;
  });

  return NextResponse.json({
    business,
    message: 'Business submitted for review',
  });
}

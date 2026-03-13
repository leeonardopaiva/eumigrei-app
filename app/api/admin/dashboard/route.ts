import { BusinessStatus, CommunityPostStatus, EventStatus, UserRole } from '@prisma/client';
import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const { response } = await requireAdminSession();

  if (response) {
    return response;
  }

  const [
    pendingBusinesses,
    pendingEvents,
    pendingPosts,
    totalUsers,
    publishedBusinesses,
    publishedEvents,
    publishedPosts,
    businessOwners,
  ] = await Promise.all([
    prisma.business.findMany({
      where: { status: BusinessStatus.PENDING_REVIEW },
      orderBy: [{ createdAt: 'asc' }],
      take: 12,
      select: {
        id: true,
        name: true,
        category: true,
        address: true,
        locationLabel: true,
        createdAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.event.findMany({
      where: { status: EventStatus.PENDING_REVIEW },
      orderBy: [{ createdAt: 'asc' }],
      take: 12,
      select: {
        id: true,
        title: true,
        venueName: true,
        locationLabel: true,
        startsAt: true,
        createdAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.communityPost.findMany({
      where: { status: CommunityPostStatus.PENDING_REVIEW },
      orderBy: [{ createdAt: 'asc' }],
      take: 12,
      select: {
        id: true,
        content: true,
        locationLabel: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    }),
    prisma.user.count(),
    prisma.business.count({ where: { status: BusinessStatus.PUBLISHED } }),
    prisma.event.count({ where: { status: EventStatus.PUBLISHED } }),
    prisma.communityPost.count({ where: { status: CommunityPostStatus.PUBLISHED } }),
    prisma.user.count({ where: { role: UserRole.BUSINESS_OWNER } }),
  ]);

  return NextResponse.json({
    stats: {
      totalUsers,
      businessOwners,
      publishedBusinesses,
      publishedEvents,
      publishedPosts,
      pendingBusinesses: pendingBusinesses.length,
      pendingEvents: pendingEvents.length,
      pendingPosts: pendingPosts.length,
    },
    pendingBusinesses,
    pendingEvents,
    pendingPosts,
  });
}

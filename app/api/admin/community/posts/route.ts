import { CommunityPostStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const { response } = await requireAdminSession();

  if (response) {
    return response;
  }

  const posts = await prisma.communityPost.findMany({
    where: {
      status: CommunityPostStatus.PENDING_REVIEW,
    },
    orderBy: [{ createdAt: 'desc' }],
    take: 20,
    select: {
      id: true,
      content: true,
      createdAt: true,
      locationLabel: true,
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
      businessAuthor: {
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
        },
      },
    },
  });

  return NextResponse.json({
    posts: posts.map((post) => ({
      ...post,
      author: post.businessAuthor
        ? {
            id: post.businessAuthor.id,
            name: post.businessAuthor.name,
            username: null,
            image: post.businessAuthor.imageUrl,
          }
        : post.author,
      businessAuthor: undefined,
    })),
  });
}

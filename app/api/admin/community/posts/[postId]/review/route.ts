import { CommunityPostStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin';
import { prisma } from '@/lib/prisma';
import { postReviewSchema } from '@/lib/validators';

type RouteContext = {
  params: Promise<{
    postId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { response } = await requireAdminSession();

  if (response) {
    return response;
  }

  const body = await request.json();
  const parsed = postReviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid review action' },
      { status: 400 },
    );
  }

  const { postId } = await context.params;
  const nextStatus =
    parsed.data.action === 'approve'
      ? CommunityPostStatus.PUBLISHED
      : CommunityPostStatus.REMOVED;

  const post = await prisma.communityPost.update({
    where: { id: postId },
    data: { status: nextStatus },
    select: {
      id: true,
      status: true,
    },
  });

  return NextResponse.json({ post });
}

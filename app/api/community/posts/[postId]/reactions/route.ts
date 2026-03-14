import { ReactionType } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildRateLimitHeaders, consumeRateLimit, getRateLimitKey } from '@/lib/rate-limit';

type RouteContext = {
  params: Promise<{
    postId: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimit = await consumeRateLimit({
    scope: 'community:reaction',
    key: getRateLimitKey(_request, session.user.id),
    max: 60,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Muitas interacoes em pouco tempo. Aguarde um minuto.' },
      { status: 429, headers: buildRateLimitHeaders(rateLimit) },
    );
  }

  const { postId } = await context.params;

  const existingReaction = await prisma.postReaction.findUnique({
    where: {
      postId_authorId_type: {
        postId,
        authorId: session.user.id,
        type: ReactionType.LIKE,
      },
    },
    select: { id: true },
  });

  if (existingReaction) {
    await prisma.postReaction.delete({
      where: {
        postId_authorId_type: {
          postId,
          authorId: session.user.id,
          type: ReactionType.LIKE,
        },
      },
    });

    return NextResponse.json({ liked: false });
  }

  await prisma.postReaction.create({
    data: {
      postId,
      authorId: session.user.id,
      type: ReactionType.LIKE,
    },
  });

  return NextResponse.json({ liked: true });
}

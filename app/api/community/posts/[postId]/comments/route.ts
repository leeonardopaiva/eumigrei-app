import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildRateLimitHeaders, consumeRateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { commentSchema } from '@/lib/validators';

type RouteContext = {
  params: Promise<{
    postId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await getServerAuthSession();

  if (!session?.user?.id || !session.user.onboardingCompleted) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimit = await consumeRateLimit({
    scope: 'community:comment',
    key: getRateLimitKey(request, session.user.id),
    max: 20,
    windowMs: 5 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Comentarios demais em pouco tempo. Aguarde alguns minutos.' },
      { status: 429, headers: buildRateLimitHeaders(rateLimit) },
    );
  }

  const { postId } = await context.params;
  const body = await request.json();
  const parsed = commentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid comment' },
      { status: 400 },
    );
  }

  const comment = await prisma.postComment.create({
    data: {
      postId,
      authorId: session.user.id,
      content: parsed.data.content,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  return NextResponse.json({ comment });
}

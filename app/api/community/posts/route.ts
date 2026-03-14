import { CommunityPostStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildRateLimitHeaders, consumeRateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { communityPostSchema } from '@/lib/validators';

const DAILY_POST_LIMIT = 3;

export async function GET(request: Request) {
  const session = await getServerAuthSession();
  const { searchParams } = new URL(request.url);
  const regionKey = session?.user?.regionKey ?? searchParams.get('region');

  const posts = await prisma.communityPost.findMany({
    where: {
      status: CommunityPostStatus.PUBLISHED,
      ...(regionKey ? { regionKey } : {}),
    },
    orderBy: [{ createdAt: 'desc' }],
    take: 20,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
          locationLabel: true,
        },
      },
      comments: {
        orderBy: [{ createdAt: 'asc' }],
        take: 3,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
      reactions: {
        select: {
          authorId: true,
        },
      },
      _count: {
        select: {
          comments: true,
          reactions: true,
        },
      },
    },
  });

  return NextResponse.json({
    posts: posts.map((post) => ({
      id: post.id,
      content: post.content,
      imageUrl: post.imageUrl,
      status: post.status,
      createdAt: post.createdAt,
      locationLabel: post.locationLabel,
      author: post.author,
      comments: post.comments,
      likeCount: post._count.reactions,
      commentCount: post._count.comments,
      viewerHasLiked: session?.user?.id
        ? post.reactions.some((reaction) => reaction.authorId === session.user.id)
        : false,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimit = await consumeRateLimit({
    scope: 'community:post',
    key: getRateLimitKey(request, session.user.id),
    max: 6,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Publicacoes demais em pouco tempo. Tente novamente mais tarde.' },
      { status: 429, headers: buildRateLimitHeaders(rateLimit) },
    );
  }

  if (!session.user.onboardingCompleted || !session.user.regionKey || !session.user.locationLabel) {
    return NextResponse.json(
      { error: 'Complete your profile before posting' },
      { status: 400 },
    );
  }

  const body = await request.json();
  const parsed = communityPostSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid post data' },
      { status: 400 },
    );
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const postsToday = await prisma.communityPost.count({
    where: {
      authorId: session.user.id,
      createdAt: {
        gte: startOfDay,
      },
    },
  });

  if (postsToday >= DAILY_POST_LIMIT) {
    return NextResponse.json(
      { error: `Daily limit reached (${DAILY_POST_LIMIT} posts)` },
      { status: 429 },
    );
  }

  const hasExternalLink = /(https?:\/\/|www\.)/i.test(parsed.data.content);

  const post = await prisma.communityPost.create({
    data: {
      content: parsed.data.content,
      imageUrl: parsed.data.imageUrl,
      externalUrl: hasExternalLink ? parsed.data.content.match(/https?:\/\/\S+|www\.\S+/i)?.[0] : null,
      status: hasExternalLink ? CommunityPostStatus.PENDING_REVIEW : CommunityPostStatus.PUBLISHED,
      authorId: session.user.id,
      regionKey: session.user.regionKey,
      locationLabel: session.user.locationLabel,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
          locationLabel: true,
        },
      },
    },
  });

  return NextResponse.json({
    post: {
      id: post.id,
      content: post.content,
      imageUrl: post.imageUrl,
      status: post.status,
      createdAt: post.createdAt,
      locationLabel: post.locationLabel,
      author: post.author,
      comments: [],
      likeCount: 0,
      commentCount: 0,
      viewerHasLiked: false,
    },
    message:
      post.status === CommunityPostStatus.PUBLISHED
        ? 'Post published'
        : 'Post sent for moderation',
  });
}

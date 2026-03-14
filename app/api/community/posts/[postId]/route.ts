import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { communityPostSchema } from '@/lib/validators';

type RouteContext = {
  params: Promise<{
    postId: string;
  }>;
};

const canManagePost = (session: Awaited<ReturnType<typeof getServerAuthSession>>, authorId: string) =>
  Boolean(session?.user?.id) &&
  (session?.user?.role === 'ADMIN' || session?.user?.id === authorId);

export async function PUT(request: Request, context: RouteContext) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { postId } = await context.params;
  const existingPost = await prisma.communityPost.findUnique({
    where: { id: postId },
    select: {
      id: true,
      authorId: true,
    },
  });

  if (!existingPost) {
    return NextResponse.json({ error: 'Publicacao nao encontrada.' }, { status: 404 });
  }

  if (!canManagePost(session, existingPost.authorId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = communityPostSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Dados invalidos da publicacao.' },
      { status: 400 },
    );
  }

  const updatedPost = await prisma.communityPost.update({
    where: { id: existingPost.id },
    data: {
      content: parsed.data.content,
      imageUrl: parsed.data.imageUrl ?? null,
      externalUrl: parsed.data.externalUrl ?? null,
    },
    select: {
      id: true,
      content: true,
      imageUrl: true,
      externalUrl: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ post: updatedPost, message: 'Publicacao atualizada.' });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { postId } = await context.params;
  const existingPost = await prisma.communityPost.findUnique({
    where: { id: postId },
    select: {
      id: true,
      authorId: true,
    },
  });

  if (!existingPost) {
    return NextResponse.json({ error: 'Publicacao nao encontrada.' }, { status: 404 });
  }

  if (!canManagePost(session, existingPost.authorId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.communityPost.delete({
    where: { id: existingPost.id },
  });

  return NextResponse.json({ message: 'Publicacao removida.' });
}

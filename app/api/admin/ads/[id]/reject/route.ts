import { AdCampaignStatus, AdModerationStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminSession } from '@/lib/require-admin';

type RouteContext = { params: Promise<{ id: string }> };
const rejectionSchema = z.object({ reason: z.string().trim().min(5).max(1000) });

export async function POST(request: Request, context: RouteContext) {
  const { session, response } = await requireAdminSession();
  if (response || !session) return response;

  const parsed = rejectionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Informe o motivo da recusa.' }, { status: 400 });
  }

  const { id } = await context.params;
  const result = await prisma.banner.updateMany({
    where: { id, moderationStatus: AdModerationStatus.PENDING_REVIEW },
    data: {
      moderationStatus: AdModerationStatus.REJECTED,
      campaignStatus: AdCampaignStatus.PAUSED,
      rejectionReason: parsed.data.reason,
      approvedById: session.user.id,
      approvedAt: null,
      isActive: false,
    },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: 'Campanha pendente de revisao nao encontrada.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}


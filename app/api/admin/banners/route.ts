import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findRegionByKey } from '@/lib/region-store';
import { requireAdminSession } from '@/lib/require-admin';
import { adminBannerSchema } from '@/lib/validators';

export async function POST(request: Request) {
  const { response } = await requireAdminSession();

  if (response) {
    return response;
  }

  const body = await request.json();
  const parsed = adminBannerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Dados invalidos do banner.' },
      { status: 400 },
    );
  }

  if (parsed.data.regionKey) {
    const region = await findRegionByKey(parsed.data.regionKey);

    if (!region) {
      return NextResponse.json({ error: 'Regiao invalida.' }, { status: 400 });
    }
  }

  const banner = await prisma.banner.create({
    data: {
      name: parsed.data.name,
      imageUrl: parsed.data.imageUrl,
      type: parsed.data.type,
      placement: parsed.data.placement,
      targetUrl: parsed.data.type === 'LINK' ? parsed.data.targetUrl : null,
      regionKey: parsed.data.regionKey ?? null,
      isActive: parsed.data.isActive,
      campaignStatus: parsed.data.campaignStatus,
      objective: parsed.data.objective,
      billingMode: parsed.data.billingMode,
      paymentStatus: parsed.data.paymentStatus,
      targetInterests: parsed.data.targetInterests,
      targetKeywords: parsed.data.targetKeywords,
      targetCategories: parsed.data.targetCategories,
      startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : null,
      endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
      dailyBudgetCents: parsed.data.dailyBudgetCents ?? null,
      totalBudgetCents: parsed.data.totalBudgetCents ?? null,
      bidCents: parsed.data.bidCents,
      checkoutUrl: parsed.data.checkoutUrl ?? null,
      paymentProvider: parsed.data.paymentProvider ?? null,
    },
    select: {
      id: true,
      name: true,
      imageUrl: true,
      type: true,
      placement: true,
      targetUrl: true,
      regionKey: true,
      isActive: true,
      campaignStatus: true,
      objective: true,
      billingMode: true,
      paymentStatus: true,
      targetInterests: true,
      targetKeywords: true,
      targetCategories: true,
      startsAt: true,
      endsAt: true,
      dailyBudgetCents: true,
      totalBudgetCents: true,
      bidCents: true,
      spentCents: true,
      checkoutUrl: true,
      paymentProvider: true,
      createdAt: true,
      updatedAt: true,
      region: {
        select: {
          key: true,
          label: true,
        },
      },
    },
  });

  return NextResponse.json({ banner });
}

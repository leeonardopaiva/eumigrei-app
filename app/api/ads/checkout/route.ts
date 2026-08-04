import { AdCampaignStatus, AdModerationStatus, AdPaymentStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { calculateAdContractAmount, AD_PLAN_CATALOG } from '@/lib/ads/contracts';
import { getAdDestinationFields, getStripe } from '@/lib/ads/server';
import { adCheckoutSchema } from '@/lib/ads/validation';
import { getAppBaseUrl } from '@/lib/app-url';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = adCheckoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados invalidos.' }, { status: 400 });
  }

  const banner = await prisma.banner.findFirst({
    where: {
      id: parsed.data.bannerId,
      createdById: session.user.id,
      moderationStatus: { in: [AdModerationStatus.DRAFT, AdModerationStatus.REJECTED] },
    },
    select: {
      id: true,
      payments: {
        where: { status: AdPaymentStatus.PENDING, provider: 'STRIPE' },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { providerSessionId: true },
      },
    },
  });
  if (!banner) return NextResponse.json({ error: 'Rascunho nao encontrado ou indisponivel.' }, { status: 404 });

  const pendingSessionId = banner.payments[0]?.providerSessionId;
  if (pendingSessionId) {
    try {
      const existingCheckout = await getStripe().checkout.sessions.retrieve(pendingSessionId);
      if (existingCheckout.status === 'open' && existingCheckout.url) {
        return NextResponse.json({ checkoutUrl: existingCheckout.url, clientSecret: existingCheckout.client_secret });
      }
      if (existingCheckout.status === 'complete') {
        return NextResponse.json({ error: 'Pagamento em processamento. Aguarde a confirmacao do Stripe.' }, { status: 409 });
      }
    } catch (error) {
      console.error('Failed to recover pending Stripe checkout:', error);
    }

    await prisma.adPayment.updateMany({
      where: { providerSessionId: pendingSessionId, status: AdPaymentStatus.PENDING },
      data: { status: AdPaymentStatus.FAILED },
    });
  }

  const region = await prisma.region.findFirst({ where: { key: parsed.data.regionKey, isActive: true }, select: { key: true } });
  if (!region) return NextResponse.json({ error: 'Regiao invalida.' }, { status: 400 });

  const amountCents = calculateAdContractAmount(parsed.data.plan, parsed.data.durationMonths);
  const destinationFields = getAdDestinationFields(parsed.data.goal, parsed.data.destination);

  await prisma.banner.update({
    where: { id: banner.id },
    data: {
      name: parsed.data.headline,
      headline: parsed.data.headline,
      description: parsed.data.description,
      imageUrl: parsed.data.imageUrl,
      ctaLabel: parsed.data.ctaLabel,
      goal: parsed.data.goal,
      ...destinationFields,
      regionKey: parsed.data.regionKey,
      plan: parsed.data.plan,
      durationMonths: parsed.data.durationMonths,
      contractAmountCents: amountCents,
      campaignStatus: AdCampaignStatus.DRAFT,
      moderationStatus: AdModerationStatus.DRAFT,
      paymentStatus: AdPaymentStatus.PENDING,
      isActive: false,
    },
  });

  try {
    const stripe = getStripe();
    const baseUrl = getAppBaseUrl(request);
    const checkout = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        customer_email: session.user.email ?? undefined,
        success_url: `${baseUrl}/anuncios?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/anuncios?checkout=canceled`,
        line_items: [{
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: amountCents,
            product_data: {
              name: `Campanha ${AD_PLAN_CATALOG[parsed.data.plan].name} - ${parsed.data.durationMonths} mes(es)`,
              description: parsed.data.headline,
            },
          },
        }],
        metadata: { bannerId: banner.id, userId: session.user.id },
        payment_intent_data: { metadata: { bannerId: banner.id, userId: session.user.id } },
      },
      { idempotencyKey: parsed.data.idempotencyKey },
    );

    await prisma.adPayment.upsert({
      where: { providerSessionId: checkout.id },
      update: { amountCents, currency: 'USD', status: AdPaymentStatus.PENDING },
      create: {
        bannerId: banner.id,
        provider: 'STRIPE',
        providerSessionId: checkout.id,
        amountCents,
        currency: 'USD',
        status: AdPaymentStatus.PENDING,
      },
    });

    return NextResponse.json({ checkoutUrl: checkout.url, clientSecret: checkout.client_secret });
  } catch (error) {
    console.error('Failed to create Stripe checkout:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Nao foi possivel iniciar o pagamento.' },
      { status: 503 },
    );
  }
}

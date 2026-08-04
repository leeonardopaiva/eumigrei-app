import { AdModerationStatus, AdPaymentStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/ads/server';
import { prisma } from '@/lib/prisma';

const paymentIntentId = (session: Stripe.Checkout.Session) =>
  typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null;

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const signature = request.headers.get('stripe-signature');
  if (!webhookSecret || !signature) {
    return NextResponse.json({ error: 'Webhook Stripe nao configurado.' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Assinatura Stripe invalida.' },
      { status: 400 },
    );
  }

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const checkout = event.data.object;
    const bannerId = checkout.metadata?.bannerId;
    if (bannerId && checkout.payment_status === 'paid') {
      const amountCents = checkout.amount_total ?? 0;
      if (checkout.currency?.toLowerCase() !== 'usd') {
        return NextResponse.json({ error: 'Moeda de pagamento invalida.' }, { status: 409 });
      }
      const campaign = await prisma.banner.findUnique({
        where: { id: bannerId },
        select: { contractAmountCents: true },
      });
      if (!campaign || campaign.contractAmountCents !== amountCents) {
        console.error('Stripe amount does not match ad contract snapshot.', { bannerId, amountCents });
        return NextResponse.json({ error: 'Valor do pagamento divergente.' }, { status: 409 });
      }

      await prisma.$transaction([
        prisma.adPayment.upsert({
          where: { providerSessionId: checkout.id },
          update: {
            providerPaymentId: paymentIntentId(checkout),
            amountCents,
            currency: 'USD',
            status: AdPaymentStatus.PAID,
            paidAt: new Date(),
          },
          create: {
            bannerId,
            provider: 'STRIPE',
            providerSessionId: checkout.id,
            providerPaymentId: paymentIntentId(checkout),
            amountCents,
            currency: 'USD',
            status: AdPaymentStatus.PAID,
            paidAt: new Date(),
          },
        }),
        prisma.banner.update({
          where: { id: bannerId },
          data: {
            paymentStatus: AdPaymentStatus.PAID,
            moderationStatus: AdModerationStatus.PENDING_REVIEW,
            submittedAt: new Date(),
            isActive: false,
          },
        }),
      ]);
    }
  }

  if (event.type === 'checkout.session.async_payment_failed' || event.type === 'checkout.session.expired') {
    const checkout = event.data.object;
    await prisma.adPayment.updateMany({
      where: { providerSessionId: checkout.id },
      data: { status: AdPaymentStatus.FAILED },
    });
  }

  return NextResponse.json({ received: true });
}

'use client';

import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Alert, Card } from '@/components/ui';
import { AD_PLAN_CATALOG, calculateAdContractAmount, formatAdCurrency } from '@/lib/ads/contracts';
import type { AdWizardData } from '@/lib/ads/validation';

export const AD_PAYMENT_FORM_ID = 'ad-payment-form';
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? '';
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

function PaymentForm({ campaignId, onProcessing, onSuccess, onError }: { campaignId?: string; onProcessing: (value: boolean) => void; onSuccess: () => void; onError: (message: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();

  return (
    <form
      id={AD_PAYMENT_FORM_ID}
      onSubmit={async (event) => {
        event.preventDefault();
        if (!stripe || !elements) return;
        onProcessing(true);
        onError('');
        const result = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/ads/anuncio-em-analise${campaignId ? `?campaign=${encodeURIComponent(campaignId)}` : ''}`,
          },
          redirect: 'if_required',
        });
        onProcessing(false);
        if (result.error) return onError(result.error.message ?? 'Nao foi possivel confirmar o pagamento.');
        if (result.paymentIntent?.status === 'succeeded' || result.paymentIntent?.status === 'processing') onSuccess();
      }}
    >
      <PaymentElement options={{ layout: 'tabs' }} />
    </form>
  );
}

export function CheckoutStep({ state, clientSecret, error, onProcessing, onSuccess, onError }: { state: AdWizardData; clientSecret: string | null; error: string | null; onProcessing: (value: boolean) => void; onSuccess: () => void; onError: (message: string) => void }) {
  if (!state.plan || !state.durationMonths) return null;
  const amount = calculateAdContractAmount(state.plan, state.durationMonths);

  return (
    <Card className="border border-slate-200 p-6 shadow-xs">
      <div className="mb-6 flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#078cf5] text-xs font-bold text-white">4</span><Card.Title className="text-[17px]">Checkout</Card.Title></div>
      <div className="grid gap-5 lg:grid-cols-2">
      <Card className="border border-slate-200 bg-[#fbfcfd] shadow-none">
        <Card.Title>Resumo do contrato</Card.Title>
        <div className="mt-6 divide-y divide-border rounded-2xl border border-border px-5">
          {[['Campanha', state.headline], ['Objetivo', state.goal], ['Plano', AD_PLAN_CATALOG[state.plan].name], ['Vigencia', `${state.durationMonths} ${state.durationMonths === 1 ? 'mes' : 'meses'}`], ['Regiao', state.regionKey], ['Valor total', formatAdCurrency(amount)]].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 py-4 text-body-sm"><span className="text-muted-foreground">{label}</span><strong className="text-right text-text">{value}</strong></div>)}
        </div>
        <Alert className="mt-5" tone="info" title="Contrato em USD" description="O valor e calculado no servidor. A campanha entra em moderacao somente depois da confirmacao do Stripe." />
      </Card>
      <Card className="self-start border border-slate-200 bg-[#fbfcfd] shadow-none">
        <Card.Title>Pagamento seguro</Card.Title>
        <Card.Description className="mb-5 mt-1">Seus dados de cartao sao processados diretamente pelo Stripe.</Card.Description>
        {!publishableKey ? <Alert tone="erro" title="Stripe nao configurado" description="Configure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY." /> : null}
        {error ? <Alert className="mb-4" tone="erro" title="Falha no pagamento" description={error} /> : null}
        {stripePromise && clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#6d28d9', borderRadius: '16px' } } }}>
            <PaymentForm
              campaignId={state.draftId}
              onProcessing={onProcessing}
              onSuccess={onSuccess}
              onError={onError}
            />
          </Elements>
        ) : publishableKey ? <p className="text-body-sm text-muted-foreground">Preparando formulario de pagamento...</p> : null}
      </Card>
      </div>
    </Card>
  );
}

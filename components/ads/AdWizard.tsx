'use client';

import React, { useEffect, useReducer, useRef, useState } from 'react';
import { Check, ExternalLink, MessageCircle, ShoppingBag } from 'lucide-react';
import CloudinaryImageField from '@/components/forms/CloudinaryImageField';
import RegionSelector from '@/components/RegionSelector';
import { Alert, Badge, Button, Card, Input, Modal, Select, Textarea } from '@/components/ui';
import {
  AD_DURATIONS,
  AD_GOALS,
  AD_PLAN_CATALOG,
  AD_PLANS,
  calculateAdContractAmount,
  formatAdCurrency,
} from '@/lib/ads/contracts';
import {
  adCreativeStepSchema,
  adGoalStepSchema,
  adReachStepSchema,
  type AdWizardData,
} from '@/lib/ads/validation';
import { cn } from '@/lib/cn';
import { WizardStepper } from './WizardStepper';

const STORAGE_KEY = 'gringoou:ad-wizard-draft';
const STEPS = ['Objetivo', 'Criativo', 'Alcance', 'Checkout'];
const CTA_OPTIONS = ['Saiba mais', 'Fale conosco', 'Comprar agora', 'Ver oferta', 'Participar'];

const initialState: AdWizardData = {
  step: 1,
  headline: '',
  description: '',
  imageUrl: '',
  ctaLabel: 'Saiba mais',
  destination: '',
  regionKey: '',
};

type Action =
  | { type: 'PATCH'; payload: Partial<AdWizardData> }
  | { type: 'STEP'; payload: AdWizardData['step'] }
  | { type: 'HYDRATE'; payload: AdWizardData }
  | { type: 'RESET' };

const reducer = (state: AdWizardData, action: Action): AdWizardData => {
  if (action.type === 'PATCH') return { ...state, ...action.payload };
  if (action.type === 'STEP') return { ...state, step: action.payload };
  if (action.type === 'HYDRATE') return { ...initialState, ...action.payload };
  return initialState;
};

type FieldErrors = Partial<Record<keyof AdWizardData, string>>;

const goalOptions = [
  { value: AD_GOALS[0], title: 'WhatsApp', description: 'Leve clientes diretamente para uma conversa.', icon: MessageCircle },
  { value: AD_GOALS[1], title: 'URL externa', description: 'Direcione o publico para seu site ou landing page.', icon: ExternalLink },
  { value: AD_GOALS[2], title: 'Marketplace', description: 'Promova um item publicado no marketplace.', icon: ShoppingBag },
] as const;

const getErrors = (issues: Array<{ path: PropertyKey[]; message: string }>) =>
  issues.reduce<FieldErrors>((errors, issue) => {
    const field = issue.path[0] as keyof AdWizardData;
    if (field && !errors[field]) errors[field] = issue.message;
    return errors;
  }, {});

export const AdWizard: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hydrated, setHydrated] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const checkoutKeyRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) dispatch({ type: 'HYDRATE', payload: JSON.parse(stored) as AdWizardData });
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  const patch = (payload: Partial<AdWizardData>) => {
    dispatch({ type: 'PATCH', payload });
    setErrors((current) => {
      const next = { ...current };
      Object.keys(payload).forEach((key) => delete next[key as keyof AdWizardData]);
      return next;
    });
    setRequestError(null);
  };

  const saveDraft = async () => {
    setSaving(true);
    setRequestError(null);
    try {
      const response = await fetch('/api/ads/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? 'Nao foi possivel salvar o rascunho.');
      patch({ bannerId: payload.banner.id });
      return payload.banner.id as string;
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Nao foi possivel salvar o rascunho.');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const nextStep = async () => {
    if (state.step === 1) {
      const parsed = adGoalStepSchema.safeParse(state);
      if (!parsed.success) return setErrors(getErrors(parsed.error.issues));
      dispatch({ type: 'STEP', payload: 2 });
      return;
    }

    if (state.step === 2) {
      const parsed = adCreativeStepSchema.safeParse(state);
      if (!parsed.success) return setErrors(getErrors(parsed.error.issues));
      if (await saveDraft()) dispatch({ type: 'STEP', payload: 3 });
      return;
    }

    if (state.step === 3) {
      const parsed = adReachStepSchema.safeParse(state);
      if (!parsed.success) return setErrors(getErrors(parsed.error.issues));
      if (await saveDraft()) dispatch({ type: 'STEP', payload: 4 });
    }
  };

  const startCheckout = async () => {
    if (!state.bannerId || !state.plan || !state.durationMonths) return;
    setSaving(true);
    setRequestError(null);
    checkoutKeyRef.current ??= `ad-checkout-${state.bannerId}-${crypto.randomUUID()}`;
    try {
      const response = await fetch('/api/ads/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...state, idempotencyKey: checkoutKeyRef.current }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? 'Nao foi possivel iniciar o pagamento.');
      if (!payload?.checkoutUrl) throw new Error('O Stripe nao retornou uma URL de checkout.');
      window.location.assign(payload.checkoutUrl);
    } catch (error) {
      setCheckoutOpen(false);
      setRequestError(error instanceof Error ? error.message : 'Nao foi possivel iniciar o pagamento.');
      setSaving(false);
    }
  };

  const destinationLabel = state.goal === 'WHATSAPP' ? 'WhatsApp com DDI' : state.goal === 'MARKETPLACE' ? 'ID do item' : 'URL de destino';
  const amountCents = state.plan && state.durationMonths ? calculateAdContractAmount(state.plan, state.durationMonths) : 0;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <Card>
        <Card.Header>
          <div>
            <Badge tone="primary">Ads Manager</Badge>
            <Card.Title className="mt-3">Crie sua campanha</Card.Title>
            <Card.Description>Configure objetivo, criativo, alcance e pagamento em quatro etapas.</Card.Description>
          </div>
        </Card.Header>
        <WizardStepper currentStep={state.step} steps={STEPS} className="mt-6" />
      </Card>

      {requestError ? <Alert tone="erro" title="Nao foi possivel continuar" description={requestError} onClose={() => setRequestError(null)} /> : null}

      {state.step === 1 ? (
        <Card>
          <Card.Title>Qual e o objetivo do anuncio?</Card.Title>
          <Card.Description className="mt-1">Escolha a acao principal esperada do seu publico.</Card.Description>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {goalOptions.map((option) => {
              const Icon = option.icon;
              const selected = state.goal === option.value;
              return (
                <button key={option.value} type="button" onClick={() => patch({ goal: option.value, destination: '' })} className={cn('relative rounded-card border-2 p-5 text-left transition hover:border-brand-300 hover:bg-brand-100/40', selected ? 'border-brand-500 bg-brand-100/60' : 'border-border bg-white')}>
                  <Icon size={24} className="text-brand-500" />
                  <p className="mt-4 font-bold text-text">{option.title}</p>
                  <p className="mt-1 text-body-sm text-muted-foreground">{option.description}</p>
                  {selected ? <Check size={18} className="absolute right-4 top-4 text-brand-500" /> : null}
                </button>
              );
            })}
          </div>
          {errors.goal ? <p className="mt-3 text-caption font-medium text-red-600">{errors.goal}</p> : null}
        </Card>
      ) : null}

      {state.step === 2 ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <Card className="space-y-5">
            <div><Card.Title>Crie o anuncio</Card.Title><Card.Description>O preview acompanha suas alteracoes.</Card.Description></div>
            <label className="block space-y-2"><span className="text-body-sm font-bold">Titulo</span><Input value={state.headline} maxLength={70} onChange={(event) => patch({ headline: event.target.value })} state={errors.headline ? 'error' : 'default'} helperText={errors.headline ?? `${state.headline.length}/70 caracteres`} /></label>
            <label className="block space-y-2"><span className="text-body-sm font-bold">Descricao</span><Textarea value={state.description} maxLength={1700} onChange={(event) => patch({ description: event.target.value })} state={errors.description ? 'error' : 'default'} helperText={errors.description ?? `${state.description.length}/1700 caracteres`} /></label>
            <div><span className="mb-2 block text-body-sm font-bold">Imagem</span><CloudinaryImageField value={state.imageUrl} onChange={(imageUrl) => patch({ imageUrl })} folder="banners" height={220} error={errors.imageUrl} /></div>
            <label className="block space-y-2"><span className="text-body-sm font-bold">Chamada para acao</span><Select value={state.ctaLabel} onChange={(event) => patch({ ctaLabel: event.target.value })}>{CTA_OPTIONS.map((cta) => <option key={cta}>{cta}</option>)}</Select></label>
            <label className="block space-y-2"><span className="text-body-sm font-bold">{destinationLabel}</span><Input value={state.destination} placeholder={state.goal === 'WHATSAPP' ? '5511999999999' : state.goal === 'EXTERNAL_URL' ? 'https://seusite.com' : 'ID do item no marketplace'} onChange={(event) => patch({ destination: event.target.value })} state={errors.destination ? 'error' : 'default'} helperText={errors.destination} /></label>
          </Card>
          <Card className="self-start" aria-label="Preview do anuncio">
            <Badge tone="neutro">Patrocinado</Badge>
            <div className="mt-4 aspect-[4/3] overflow-hidden rounded-2xl bg-brand-100">{state.imageUrl ? <img src={state.imageUrl} alt="Preview do anuncio" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-body-sm text-muted-foreground">Sua imagem aparecera aqui</div>}</div>
            <Card.Title className="mt-4">{state.headline || 'Titulo do seu anuncio'}</Card.Title>
            <Card.Description className="mt-2 whitespace-pre-wrap">{state.description || 'A descricao do anuncio aparecera neste espaco.'}</Card.Description>
            <Button className="mt-5" fullWidth>{state.ctaLabel}</Button>
          </Card>
        </div>
      ) : null}

      {state.step === 3 ? (
        <Card className="space-y-6">
          <div><Card.Title>Alcance e pacote</Card.Title><Card.Description>Defina onde e por quanto tempo sua campanha sera exibida.</Card.Description></div>
          <RegionSelector value={state.regionKey} onChange={(region) => patch({ regionKey: region.key })} label="Regiao da campanha" hint={errors.regionKey} />
          <div className="grid gap-4 md:grid-cols-3">
            {AD_PLANS.map((plan) => {
              const item = AD_PLAN_CATALOG[plan];
              const selected = state.plan === plan;
              return <button key={plan} type="button" onClick={() => patch({ plan })} className={cn('rounded-card border-2 p-5 text-left transition hover:border-brand-300', selected ? 'border-brand-500 bg-brand-100/60' : 'border-border bg-white')}><div className="flex items-center justify-between"><p className="text-h3 font-bold">{item.name}</p>{selected ? <Check size={18} className="text-brand-500" /> : null}</div><p className="mt-2 text-h2 font-extrabold">{formatAdCurrency(item.monthlyPriceCents)}<span className="text-caption font-medium text-muted-foreground">/mes</span></p><p className="mt-2 text-body-sm text-muted-foreground">{item.description}</p><ul className="mt-4 space-y-2">{item.highlights.map((highlight) => <li key={highlight} className="flex gap-2 text-caption"><Check size={14} className="text-emerald-600" />{highlight}</li>)}</ul></button>;
            })}
          </div>
          {errors.plan ? <p className="text-caption font-medium text-red-600">{errors.plan}</p> : null}
          <label className="block max-w-sm space-y-2"><span className="text-body-sm font-bold">Vigencia</span><Select value={state.durationMonths ?? ''} onChange={(event) => patch({ durationMonths: Number(event.target.value) as 1 | 3 | 6 })} state={errors.durationMonths ? 'error' : 'default'} helperText={errors.durationMonths}><option value="">Selecione</option>{AD_DURATIONS.map((duration) => <option key={duration} value={duration}>{duration} {duration === 1 ? 'mes' : 'meses'}</option>)}</Select></label>
        </Card>
      ) : null}

      {state.step === 4 && state.plan && state.durationMonths ? (
        <Card>
          <Card.Title>Resumo do contrato</Card.Title>
          <div className="mt-6 divide-y divide-border rounded-2xl border border-border px-5">
            {[['Campanha', state.headline], ['Objetivo', state.goal], ['Plano', AD_PLAN_CATALOG[state.plan].name], ['Vigencia', `${state.durationMonths} ${state.durationMonths === 1 ? 'mes' : 'meses'}`], ['Regiao', state.regionKey], ['Valor total', formatAdCurrency(amountCents)]].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 py-4 text-body-sm"><span className="text-muted-foreground">{label}</span><strong className="text-right text-text">{value}</strong></div>)}
          </div>
          <Alert className="mt-5" tone="info" title="Pagamento seguro" description="O valor e recalculado no servidor. A campanha sera enviada para moderacao somente apos a confirmacao do Stripe." />
          <Button className="mt-6" size="lg" fullWidth onClick={() => setCheckoutOpen(true)}>Ir para pagamento</Button>
        </Card>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <Button variant="secondary" disabled={state.step === 1 || saving} onClick={() => dispatch({ type: 'STEP', payload: Math.max(1, state.step - 1) as AdWizardData['step'] })}>Voltar</Button>
        {state.step < 4 ? <Button loading={saving} onClick={() => void nextStep()}>Continuar</Button> : null}
      </div>

      <Modal open={checkoutOpen} onClose={() => !saving && setCheckoutOpen(false)} title="Confirmar checkout" description={`Voce sera direcionado ao Stripe para pagar ${formatAdCurrency(amountCents)}.`} footer={<><Button variant="secondary" disabled={saving} onClick={() => setCheckoutOpen(false)}>Cancelar</Button><Button loading={saving} onClick={() => void startCheckout()}>Continuar para o Stripe</Button></>}>
        <p className="text-body-sm text-muted-foreground">Depois do pagamento, a campanha seguira para aprovacao da equipe Gringoou.</p>
      </Modal>
    </div>
  );
};

export default AdWizard;


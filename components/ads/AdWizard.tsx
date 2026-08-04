'use client';

import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Badge, Button, Card } from '@/components/ui';
import { useToast } from '@/components/feedback/ToastProvider';
import { adCreativeStepSchema, adGoalStepSchema, adReachStepSchema, type AdWizardData } from '@/lib/ads/validation';
import { CheckoutStep, AD_PAYMENT_FORM_ID } from './steps/CheckoutStep';
import { CreativeStep } from './steps/CreativeStep';
import { GoalStep } from './steps/GoalStep';
import { ReachAndPlanStep } from './steps/ReachAndPlanStep';
import type { AdFieldErrors } from './types';
import { WizardStepper } from './WizardStepper';

const STORAGE_KEY = 'gringoou:ad-wizard-draft';
const STEPS = ['Objetivo', 'Criativo', 'Alcance', 'Checkout'];

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
  | { type: 'HYDRATE'; payload: AdWizardData };

const reducer = (state: AdWizardData, action: Action): AdWizardData => {
  if (action.type === 'PATCH') return { ...state, ...action.payload };
  if (action.type === 'STEP') return { ...state, step: action.payload };
  return { ...initialState, ...action.payload };
};

const getErrors = (issues: Array<{ path: PropertyKey[]; message: string }>) =>
  issues.reduce<AdFieldErrors>((errors, issue) => {
    const field = issue.path[0] as keyof AdWizardData;
    if (field && !errors[field]) errors[field] = issue.message;
    return errors;
  }, {});

export const AdWizard: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hydrated, setHydrated] = useState(false);
  const [errors, setErrors] = useState<AdFieldErrors>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const checkoutKeyRef = useRef<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AdWizardData & { bannerId?: string };
        dispatch({ type: 'HYDRATE', payload: { ...parsed, draftId: parsed.draftId ?? parsed.bannerId } });
      }
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

  const saveDraft = useCallback(async (showSuccess = false) => {
    const creative = adCreativeStepSchema.safeParse(state);
    if (!creative.success) {
      setErrors(getErrors(creative.error.issues));
      return null;
    }

    setSaving(true);
    setRequestError(null);
    try {
      const response = await fetch('/api/banners/draft', {
        method: state.draftId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...state, bannerId: state.draftId }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? 'Nao foi possivel salvar o rascunho.');
      const draftId = payload.banner.id as string;
      dispatch({ type: 'PATCH', payload: { draftId } });
      if (showSuccess) showToast('Rascunho salvo.', 'success');
      return draftId;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel salvar o rascunho.';
      setRequestError(message);
      if (showSuccess) showToast(message, 'error');
      return null;
    } finally {
      setSaving(false);
    }
  }, [showToast, state]);

  const preparePayment = useCallback(async (draftId: string) => {
    if (!state.plan || !state.durationMonths) return false;
    setSaving(true);
    setRequestError(null);
    checkoutKeyRef.current ??= `ad-payment-${draftId}-${crypto.randomUUID()}`;
    try {
      const response = await fetch('/api/ads/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...state, bannerId: draftId, idempotencyKey: checkoutKeyRef.current }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? 'Nao foi possivel preparar o pagamento.');
      if (!payload?.clientSecret) throw new Error('O Stripe nao retornou o client secret.');
      setClientSecret(payload.clientSecret);
      return true;
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Nao foi possivel preparar o pagamento.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [state]);

  useEffect(() => {
    if (hydrated && state.step === 4 && state.draftId && !clientSecret && !paymentSubmitted) {
      void preparePayment(state.draftId);
    }
  }, [clientSecret, hydrated, paymentSubmitted, preparePayment, state.draftId, state.step]);

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
      const draftId = await saveDraft();
      if (!draftId) return;
      dispatch({ type: 'STEP', payload: 4 });
      await preparePayment(draftId);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl pb-28">
      <Card className="sticky top-0 z-30 mb-6 rounded-t-none border-t-0 shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div><Badge tone="primary">Ads Manager</Badge><Card.Title className="mt-3">Crie sua campanha</Card.Title></div>
          {state.draftId ? <Badge tone="neutro">Rascunho salvo</Badge> : null}
        </div>
        <WizardStepper currentStep={state.step} steps={STEPS} className="mt-5" />
      </Card>

      {requestError ? <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-body-sm text-red-700">{requestError}</div> : null}
      {paymentSubmitted ? <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-body-sm text-emerald-700">Pagamento recebido ou em processamento. A campanha sera enviada para moderacao pelo webhook do Stripe.</div> : null}

      {state.step === 1 ? <GoalStep state={state} errors={errors} patch={patch} /> : null}
      {state.step === 2 ? <CreativeStep state={state} errors={errors} patch={patch} /> : null}
      {state.step === 3 ? <ReachAndPlanStep state={state} errors={errors} patch={patch} /> : null}
      {state.step === 4 ? <CheckoutStep state={state} clientSecret={clientSecret} error={requestError} onProcessing={setPaymentProcessing} onError={setRequestError} onSuccess={() => { setPaymentSubmitted(true); sessionStorage.removeItem(STORAGE_KEY); showToast('Pagamento enviado. Campanha aguardando moderacao.', 'success'); }} /> : null}

      <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white/95 px-4 py-4 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:left-64">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <Button variant="secondary" disabled={state.step === 1 || saving || paymentProcessing} onClick={() => dispatch({ type: 'STEP', payload: Math.max(1, state.step - 1) as AdWizardData['step'] })}>Voltar</Button>
          <div className="flex items-center gap-2">
            {state.step >= 2 && state.step < 4 ? <Button variant="ghost" loading={saving} onClick={() => void saveDraft(true)}>Salvar rascunho</Button> : null}
            {state.step < 4 ? <Button loading={saving} disabled={state.step === 1 && !state.goal} onClick={() => void nextStep()}>Continuar</Button> : <Button type="submit" form={AD_PAYMENT_FORM_ID} loading={paymentProcessing || saving} disabled={!clientSecret || paymentSubmitted}>⚡ Finalizar e enviar</Button>}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdWizard;

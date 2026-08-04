'use client';

import { Check } from 'lucide-react';
import RegionSelector from '@/components/RegionSelector';
import { Card, Select } from '@/components/ui';
import { AD_DURATIONS, AD_PLAN_CATALOG, AD_PLANS, formatAdCurrency } from '@/lib/ads/contracts';
import type { AdWizardData } from '@/lib/ads/validation';
import { cn } from '@/lib/cn';
import type { AdFieldErrors, PatchAdWizard } from '../types';

export function ReachAndPlanStep({ state, errors, patch }: { state: AdWizardData; errors: AdFieldErrors; patch: PatchAdWizard }) {
  return (
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
  );
}


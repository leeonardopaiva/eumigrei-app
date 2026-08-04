'use client';

import { Check, ExternalLink, MessageCircle, ShoppingBag } from 'lucide-react';
import { Card } from '@/components/ui';
import { AD_GOALS } from '@/lib/ads/contracts';
import { cn } from '@/lib/cn';
import type { AdFieldErrors, PatchAdWizard } from '../types';
import type { AdWizardData } from '@/lib/ads/validation';

const goals = [
  { value: AD_GOALS[0], title: 'WhatsApp', description: 'Leve clientes diretamente para uma conversa.', icon: MessageCircle },
  { value: AD_GOALS[1], title: 'URL externa', description: 'Direcione o publico para seu site ou landing page.', icon: ExternalLink },
  { value: AD_GOALS[2], title: 'Marketplace', description: 'Promova um item publicado no marketplace.', icon: ShoppingBag },
] as const;

export function GoalStep({ state, errors, patch }: { state: AdWizardData; errors: AdFieldErrors; patch: PatchAdWizard }) {
  return (
    <Card>
      <Card.Title>Qual e o objetivo do anuncio?</Card.Title>
      <Card.Description className="mt-1">Escolha a acao principal esperada do seu publico.</Card.Description>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {goals.map((option) => {
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
  );
}


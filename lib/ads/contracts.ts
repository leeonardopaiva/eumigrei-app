export const AD_GOALS = ['WHATSAPP', 'EXTERNAL_URL', 'MARKETPLACE'] as const;
export const AD_PLANS = ['BRONZE', 'SILVER', 'GOLD'] as const;
export const AD_DURATIONS = [1, 3, 6] as const;

export type AdGoalValue = (typeof AD_GOALS)[number];
export type AdPlanValue = (typeof AD_PLANS)[number];
export type AdDuration = (typeof AD_DURATIONS)[number];

export const AD_PLAN_CATALOG: Record<
  AdPlanValue,
  { name: string; monthlyPriceCents: number; description: string; highlights: string[] }
> = {
  BRONZE: {
    name: 'Bronze',
    monthlyPriceCents: 9900,
    description: 'Presenca essencial para alcancar sua regiao.',
    highlights: ['Segmentacao regional', 'Relatorio de impressoes'],
  },
  SILVER: {
    name: 'Prata',
    monthlyPriceCents: 17900,
    description: 'Mais alcance para campanhas em crescimento.',
    highlights: ['Maior prioridade de entrega', 'Relatorio de cliques e impressoes'],
  },
  GOLD: {
    name: 'Ouro',
    monthlyPriceCents: 29900,
    description: 'Maxima prioridade para campanhas estrategicas.',
    highlights: ['Prioridade maxima', 'Relatorio completo de resultados'],
  },
};

export const calculateAdContractAmount = (plan: AdPlanValue, durationMonths: AdDuration) =>
  AD_PLAN_CATALOG[plan].monthlyPriceCents * durationMonths;

export const formatAdCurrency = (amountCents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' }).format(amountCents / 100);

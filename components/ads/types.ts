import type { AdWizardData } from '@/lib/ads/validation';

export type AdFieldErrors = Partial<Record<keyof AdWizardData, string>>;
export type PatchAdWizard = (payload: Partial<AdWizardData>) => void;


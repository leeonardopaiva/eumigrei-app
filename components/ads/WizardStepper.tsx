'use client';

import React from 'react';
import { Badge, ProgressBar } from '@/components/ui';
import { cn } from '@/lib/cn';

type WizardStepperProps = {
  currentStep: number;
  steps: string[];
  className?: string;
};

export const WizardStepper: React.FC<WizardStepperProps> = ({ currentStep, steps, className }) => (
  <div className={cn('space-y-4', className)}>
    <ProgressBar value={(currentStep / steps.length) * 100} label={`Etapa ${currentStep} de ${steps.length}`} />
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Etapas da campanha">
      {steps.map((label, index) => {
        const step = index + 1;
        const active = step === currentStep;
        const complete = step < currentStep;
        return (
          <li key={label} className={cn('flex items-center gap-2 text-caption font-semibold', active ? 'text-brand-600' : 'text-muted-foreground')}>
            <Badge tone={complete ? 'success' : active ? 'primary' : 'neutro'} count={step} />
            <span className="truncate">{label}</span>
          </li>
        );
      })}
    </ol>
  </div>
);


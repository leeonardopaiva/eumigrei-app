import React from 'react';
import { cn } from '@/lib/cn';

export interface CharacterCounterProps extends React.HTMLAttributes<HTMLSpanElement> {
  current: number;
  max: number;
}

export const CharacterCounter: React.FC<CharacterCounterProps> = ({ current, max, className, ...props }) => {
  const remaining = max - current;
  const tone = remaining < 0 ? 'text-red-600' : remaining <= 60 ? 'text-amber-600' : 'text-slate-400';

  return (
    <span className={cn('text-[11px] font-semibold tabular-nums', tone, className)} {...props}>
      {current}/{max}
    </span>
  );
};

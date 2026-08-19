'use client';

import type { ReactNode } from 'react';
import type { BannerAd } from '@/types';
import { useViewableAdImpression } from '@/hooks/useViewableAdImpression';

export function ViewableAdSlot({ banner, placement, className, children }: {
  banner: BannerAd;
  placement: 'HOME' | 'FEED';
  className?: string;
  children: ReactNode;
}) {
  const ref = useViewableAdImpression(banner.id, placement, banner.matchedBy ?? []);
  return <div ref={ref} className={className}>{children}</div>;
}

import type React from 'react';
import { AdAccountProvider } from '@/components/ads/AdAccountProvider';
import { AdsShell } from '@/components/ads/AdsShell';

export default function AdsLayout({ children }: { children: React.ReactNode }) {
  return <AdAccountProvider><AdsShell>{children}</AdsShell></AdAccountProvider>;
}

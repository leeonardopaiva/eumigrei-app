'use client';

import type React from 'react';
import { AdsSidebar } from '@/components/ads/AdsSidebar';
import { AdsTopbar } from '@/components/ads/AdsTopbar';

type AdsShellProps = {
  children: React.ReactNode;
};

export function AdsShell({ children }: AdsShellProps) {
  return (
    <div className="min-h-screen bg-[#f5f7f9]">
      <AdsTopbar />
      <AdsSidebar />
      <main className="min-h-screen px-4 pb-8 pt-[96px] md:ml-[272px] md:px-8 lg:px-10">{children}</main>
    </div>
  );
}

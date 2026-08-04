import type React from 'react';
import { AdsSidebar } from '@/components/ads/AdsSidebar';

export default function AdsLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-bg"><AdsSidebar /><main className="px-4 py-6 sm:px-6 md:ml-64 md:px-8 md:py-8">{children}</main></div>;
}


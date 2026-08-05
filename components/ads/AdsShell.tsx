'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AdsSidebar } from '@/components/ads/AdsSidebar';
import { AdsTopbar } from '@/components/ads/AdsTopbar';

type AdsShellProps = {
  children: React.ReactNode;
};

export function AdsShell({ children }: AdsShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isPortalEntry = pathname === '/ads/login' || pathname === '/ads/register' || pathname === '/ads/onboarding';

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (isPortalEntry) {
    return <main className="min-h-screen bg-[#f5f7f9] px-4 py-10">{children}</main>;
  }

  return (
    <div className="min-h-screen bg-[#f5f7f9]">
      <AdsTopbar onMenuToggle={() => setMobileMenuOpen((current) => !current)} />
      <AdsSidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
      <main className="min-h-screen px-4 pb-8 pt-[96px] md:ml-[272px] md:px-8 lg:px-10">{children}</main>
    </div>
  );
}

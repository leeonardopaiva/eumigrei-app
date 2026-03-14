'use client';

import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from '@/components/feedback/ToastProvider';

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ToastProvider>{children}</ToastProvider>
    </SessionProvider>
  );
}

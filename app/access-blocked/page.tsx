import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@/components/Layout';

export const metadata: Metadata = {
  title: 'Gringoou - acesso bloqueado',
  description: 'Seu acesso esta bloqueado no momento.',
};

export default function AccessBlockedPage() {
  return (
    <main className="min-h-screen bg-[#f9f9f9] px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-2xl items-center justify-center">
        <div className="w-full max-w-lg rounded-[32px] bg-white px-8 py-10 text-center shadow-sm sm:px-10 sm:py-12">
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>

          <p className="mt-8 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Acesso bloqueado
          </p>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-500 sm:text-base">
            Sua conta nao esta liberada para acessar o aplicativo neste momento.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              href="/login"
              className="inline-flex h-12 w-full max-w-[280px] items-center justify-center rounded-full bg-[#00509D] px-6 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(0,80,157,0.16)]"
            >
              Voltar ao login
            </Link>
            <Link
              href="/login?switchAccount=1"
              className="inline-flex h-12 w-full max-w-[280px] items-center justify-center rounded-full border border-[#00509D]/15 bg-white px-6 text-sm font-semibold text-[#00509D] shadow-none hover:bg-[#F2F7FF]"
            >
              Trocar conta Google
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

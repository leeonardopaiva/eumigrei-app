import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldAlert, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Gringoou em manutencao',
  description: 'A plataforma esta temporariamente em manutencao.',
};

export default function MaintenancePage() {
  return (
    <main className="min-h-screen bg-[#f9f9f9] px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-2xl items-center justify-center">
        <div className="w-full rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF4FF] text-[#00509D]">
            <ShieldAlert size={30} />
          </div>

          <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#F4F8FF] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#00509D]">
            <Sparkles size={12} />
            Acesso temporariamente restrito
          </p>

          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900">
            Gringoou em manutenção
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-600">
            Estamos ajustando a plataforma para uma nova etapa. Enquanto isso, o acesso permanece
            bloqueado para a maior parte dos usuários.
          </p>

          <div className="mt-8 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
            Se você estiver na allowlist configurada no ambiente e autenticado com a conta autorizada,
            basta atualizar a página para entrar.
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/api/auth/signout?callbackUrl=/maintenance"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Encerrar sessao
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl bg-[#00509D] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#00427f]"
            >
              Tentar acessar
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

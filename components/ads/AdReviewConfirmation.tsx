'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Clock3, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';

const STORAGE_KEY = 'gringoou:ad-wizard-draft';

type AdReviewConfirmationProps = {
  headline: string | null;
  paymentConfirmed: boolean;
};

export function AdReviewConfirmation({ headline, paymentConfirmed }: AdReviewConfirmationProps) {
  const router = useRouter();

  useEffect(() => {
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-150px)] w-full max-w-[820px] items-center justify-center py-10">
      <Card className="w-full rounded-[28px] border border-slate-200 px-6 py-10 text-center shadow-sm sm:px-12 sm:py-14">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <Check size={38} strokeWidth={2.5} />
        </div>

        <Badge tone={paymentConfirmed ? 'success' : 'destaque'} className="mt-6">
          {paymentConfirmed ? 'Pagamento confirmado' : 'Pagamento em processamento'}
        </Badge>

        <h1 className="mt-5 text-[30px] font-extrabold leading-tight text-[#132f40] sm:text-[38px]">
          Seu anúncio será analisado
        </h1>
        <p className="mx-auto mt-4 max-w-[590px] text-[15px] leading-7 text-slate-500">
          {headline ? <strong className="text-[#243b53]">{headline}. </strong> : null}
          {paymentConfirmed
            ? 'Recebemos seu pagamento e enviamos a campanha para moderação.'
            : 'Recebemos sua solicitação e estamos confirmando o pagamento com o Stripe.'}{' '}
          Após a aprovação da equipe, o anúncio ficará ativo em breve.
        </p>

        <div className="mx-auto mt-10 grid max-w-[650px] gap-3 text-left sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
            <Check size={20} className="text-emerald-600" />
            <p className="mt-3 text-sm font-bold text-[#243b53]">Pagamento enviado</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Confirmação segura pelo Stripe.</p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
            <ShieldCheck size={20} className="text-amber-600" />
            <p className="mt-3 text-sm font-bold text-[#243b53]">Análise da equipe</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Verificaremos o conteúdo da campanha.</p>
          </div>
          <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
            <Clock3 size={20} className="text-brand-500" />
            <p className="mt-3 text-sm font-bold text-[#243b53]">Ativação</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">O anúncio aprovado entrará no ar.</p>
          </div>
        </div>

        <p className="mt-8 text-xs text-slate-400">
          Você poderá acompanhar o status da campanha no painel de anúncios.
        </p>
        <Button className="mt-6" iconLeft={<LayoutDashboard size={17} />} onClick={() => router.push('/ads')}>
          Voltar ao dashboard
        </Button>
      </Card>
    </div>
  );
}

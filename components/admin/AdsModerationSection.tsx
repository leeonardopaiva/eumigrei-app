'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, Search, ShieldCheck, XCircle } from 'lucide-react';
import { Badge, Button, Card, Input, Modal, Select, Textarea } from '@/components/ui';
import { useToast } from '@/components/feedback/ToastProvider';

type Campaign = {
  id: string;
  headline: string | null;
  name: string;
  description: string | null;
  imageUrl: string;
  goal: string | null;
  plan: 'BRONZE' | 'SILVER' | 'GOLD' | null;
  durationMonths: number | null;
  contractAmountCents: number | null;
  moderationStatus: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  paymentStatus: string;
  submittedAt: string;
  rejectionReason: string | null;
  region: { label: string } | null;
  adAccount: { name: string; logoUrl: string | null } | null;
  createdBy: { name: string; email: string | null } | null;
};

type Payload = {
  campaigns: Campaign[];
  pagination: { page: number; pages: number; total: number };
  stats: { pending: number; approved: number; rejected: number };
};

const statusLabels = {
  PENDING_REVIEW: 'Pendentes',
  APPROVED: 'Aprovados',
  REJECTED: 'Rejeitados',
} as const;

const usd = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' });

function slaStatus(submittedAt: string) {
  const deadline = new Date(submittedAt).getTime() + 24 * 60 * 60 * 1000;
  const remaining = deadline - Date.now();
  if (remaining <= 0) return { label: 'SLA vencido', tone: 'erro' as const };
  const hours = Math.max(1, Math.ceil(remaining / (60 * 60 * 1000)));
  return { label: `${hours}h restantes`, tone: hours <= 4 ? 'destaque' as const : 'neutro' as const };
}

export default function AdsModerationSection() {
  const { showToast } = useToast();
  const [payload, setPayload] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [status, setStatus] = useState<keyof typeof statusLabels>('PENDING_REVIEW');
  const [plan, setPlan] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rejecting, setRejecting] = useState<Campaign | null>(null);
  const [reason, setReason] = useState('');

  const query = useMemo(() => {
    const params = new URLSearchParams({ status, page: String(page) });
    if (plan) params.set('plan', plan);
    if (search.trim()) params.set('search', search.trim());
    return params.toString();
  }, [page, plan, search, status]);

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/ads?${query}`, { cache: 'no-store' });
      const nextPayload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(nextPayload?.error ?? 'Nao foi possivel carregar a fila de anuncios.');
      setPayload(nextPayload);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Falha ao carregar a fila.', 'error');
    } finally {
      setLoading(false);
    }
  }, [query, showToast]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadCampaigns(), search ? 250 : 0);
    return () => window.clearTimeout(timeout);
  }, [loadCampaigns, search]);

  const approve = async (campaign: Campaign) => {
    setProcessingId(campaign.id);
    try {
      const response = await fetch(`/api/admin/ads/${campaign.id}/approve`, { method: 'POST' });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? 'Nao foi possivel aprovar a campanha.');
      showToast('Campanha aprovada e anunciante notificado.', 'success');
      await loadCampaigns();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Falha ao aprovar.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const reject = async () => {
    if (!rejecting || reason.trim().length < 5) return;
    setProcessingId(rejecting.id);
    try {
      const response = await fetch(`/api/admin/ads/${rejecting.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? 'Nao foi possivel rejeitar a campanha.');
      setRejecting(null);
      setReason('');
      showToast('Campanha rejeitada e anunciante notificado.', 'success');
      await loadCampaigns();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Falha ao rejeitar.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const statCards = [
    { label: 'Aguardando revisao', value: payload?.stats.pending ?? 0, icon: <Clock3 size={20} />, tone: 'text-amber-600 bg-amber-50' },
    { label: 'Aprovados', value: payload?.stats.approved ?? 0, icon: <CheckCircle2 size={20} />, tone: 'text-emerald-600 bg-emerald-50' },
    { label: 'Rejeitados', value: payload?.stats.rejected ?? 0, icon: <XCircle size={20} />, tone: 'text-red-600 bg-red-50' },
  ];

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {statCards.map((item) => (
          <Card key={item.label} className="rounded-3xl border border-slate-100 p-4">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${item.tone}`}>{item.icon}</div>
            <p className="mt-3 text-2xl font-extrabold text-slate-900">{item.value}</p>
            <p className="text-xs font-semibold text-slate-500">{item.label}</p>
          </Card>
        ))}
      </div>

      <Card className="rounded-3xl border border-slate-100 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(statusLabels) as Array<keyof typeof statusLabels>).map((item) => (
              <Button key={item} size="sm" variant={status === item ? 'primary' : 'ghost'} onClick={() => { setStatus(item); setPage(1); }}>
                {statusLabels[item]}
              </Button>
            ))}
          </div>
          <div className="flex flex-1 flex-col gap-3 sm:flex-row lg:justify-end">
            <div className="min-w-44"><Select value={plan} onChange={(event) => { setPlan(event.target.value); setPage(1); }}><option value="">Todos os planos</option><option value="BRONZE">Bronze</option><option value="SILVER">Prata</option><option value="GOLD">Ouro</option></Select></div>
            <div className="min-w-56"><Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Anuncio, empresa ou e-mail" prefixIcon={<Search size={16} />} /></div>
          </div>
        </div>
      </Card>

      {loading && !payload ? <Card className="h-44 animate-pulse rounded-3xl bg-slate-100" /> : null}
      {!loading && payload?.campaigns.length === 0 ? (
        <Card className="rounded-3xl border border-slate-100 py-12 text-center">
          <ShieldCheck size={32} className="mx-auto text-emerald-500" />
          <h3 className="mt-3 font-bold text-slate-900">Fila em dia</h3>
          <p className="mt-1 text-sm text-slate-500">Nenhuma campanha encontrada com estes filtros.</p>
        </Card>
      ) : null}

      <div className="space-y-3">
        {payload?.campaigns.map((campaign) => {
          const sla = slaStatus(campaign.submittedAt);
          return (
            <Card key={campaign.id} className="rounded-3xl border border-slate-100 p-4">
              <div className="flex flex-col gap-4 md:flex-row">
                <img src={campaign.imageUrl} alt="" className="h-36 w-full rounded-2xl bg-slate-100 object-cover md:w-48" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={campaign.moderationStatus === 'APPROVED' ? 'success' : campaign.moderationStatus === 'REJECTED' ? 'erro' : 'destaque'}>{statusLabels[campaign.moderationStatus as keyof typeof statusLabels] ?? campaign.moderationStatus}</Badge>
                    {campaign.moderationStatus === 'PENDING_REVIEW' ? <Badge tone={sla.tone} variant="outline">{sla.label}</Badge> : null}
                    <Badge tone="neutro" variant="outline">{campaign.plan ?? 'Sem plano'}</Badge>
                  </div>
                  <h3 className="mt-3 text-lg font-extrabold text-slate-900">{campaign.headline || campaign.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{campaign.description}</p>
                  <div className="mt-3 grid gap-1 text-xs text-slate-500 sm:grid-cols-2">
                    <p><strong>Conta:</strong> {campaign.adAccount?.name ?? '-'}</p>
                    <p><strong>Anunciante:</strong> {campaign.createdBy?.name ?? campaign.createdBy?.email ?? '-'}</p>
                    <p><strong>Regiao:</strong> {campaign.region?.label ?? '-'}</p>
                    <p><strong>Contrato:</strong> {campaign.contractAmountCents == null ? '-' : usd.format(campaign.contractAmountCents / 100)} / {campaign.durationMonths ?? '-'} mes(es)</p>
                  </div>
                  {campaign.rejectionReason ? <p className="mt-3 rounded-2xl bg-red-50 p-3 text-xs text-red-700"><strong>Motivo:</strong> {campaign.rejectionReason}</p> : null}
                </div>
                {campaign.moderationStatus === 'PENDING_REVIEW' ? (
                  <div className="flex shrink-0 gap-2 md:flex-col">
                    <Button size="sm" variant="success" loading={processingId === campaign.id} onClick={() => void approve(campaign)}>Aprovar</Button>
                    <Button size="sm" variant="destructive" disabled={processingId !== null} onClick={() => { setRejecting(campaign); setReason(''); }}>Rejeitar</Button>
                  </div>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>

      {payload && payload.pagination.pages > 1 ? (
        <div className="flex items-center justify-between">
          <Button variant="secondary" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Anterior</Button>
          <span className="text-xs font-semibold text-slate-500">Pagina {page} de {payload.pagination.pages}</span>
          <Button variant="secondary" size="sm" disabled={page >= payload.pagination.pages || loading} onClick={() => setPage((value) => value + 1)}>Proxima</Button>
        </div>
      ) : null}

      <Modal
        open={Boolean(rejecting)}
        onClose={() => { if (!processingId) setRejecting(null); }}
        title="Rejeitar campanha"
        description="Informe um motivo objetivo. Ele sera enviado ao anunciante com as orientacoes para correcao."
        footer={<><Button variant="secondary" disabled={Boolean(processingId)} onClick={() => setRejecting(null)}>Cancelar</Button><Button variant="destructive" loading={processingId === rejecting?.id} disabled={reason.trim().length < 5} onClick={() => void reject()}>Confirmar rejeicao</Button></>}
      >
        <Textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} placeholder="Ex.: A imagem contem texto ilegivel e a URL de destino nao corresponde a oferta." helperText={`${reason.length}/1000 caracteres`} />
      </Modal>
    </section>
  );
}

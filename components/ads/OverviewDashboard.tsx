'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, Copy, Download, Edit3, Filter, Plus, Search, SlidersHorizontal, Trash2 } from 'lucide-react';
import { Alert, Badge, Button, Card, Input, Select } from '@/components/ui';
import {
  formatNumber,
  formatPercent,
  formatUsd,
  formatUsdWithCents,
  type AdsOverviewData,
  type AdsOverviewRow,
} from '@/lib/ads/dashboard';

type OverviewDashboardProps = { data: AdsOverviewData };
type StatusView = { label: string; tone: 'success' | 'destaque' | 'erro' | 'neutro' };

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(value));
}

function getStatus(row: AdsOverviewRow, enabled: boolean): StatusView {
  if (!enabled) return { label: 'Pausado', tone: 'erro' };
  if (row.moderationStatus === 'REJECTED') return { label: 'Rejeitado', tone: 'erro' };
  if (row.moderationStatus === 'PENDING_REVIEW' || row.moderationStatus === 'DRAFT') return { label: 'Em analise', tone: 'destaque' };
  if (row.endsAt && new Date(row.endsAt).getTime() < Date.now()) return { label: 'Concluido', tone: 'neutro' };
  if (row.moderationStatus === 'APPROVED' && row.paymentStatus === 'PAID') return { label: 'Ativo', tone: 'success' };
  return { label: 'Inativo', tone: 'neutro' };
}

export function OverviewDashboard({ data }: OverviewDashboardProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [enabledRows, setEnabledRows] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(data.rows.map((row) => [row.id, row.isActive])),
  );
  const visibleRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return data.rows;
    return data.rows.filter((row) =>
      [row.label, row.goal, row.plan, row.regionLabel].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalized)),
    );
  }, [data.rows, query]);
  const rangeCaption = data.range.from && data.range.key !== 'all'
    ? `${formatDate(data.range.from.toISOString())} - ${formatDate(data.range.to.toISOString())}`
    : 'Todo o periodo';
  const stats = [
    { label: 'Gasto faturavel', value: formatUsd(data.stats.spendCents), caption: rangeCaption },
    { label: 'Impressoes', value: formatNumber(data.stats.impressions), caption: rangeCaption },
    { label: 'Campanhas ativas', value: String(data.stats.activeCampaigns), caption: `de ${data.rows.length} campanhas totais`, accent: true },
    { label: 'Criativos rejeitados', value: String(data.stats.rejectedCreatives), caption: data.stats.rejectedCreatives ? 'requer sua atencao' : 'nenhuma pendencia' },
  ];

  return (
    <div className="mx-auto w-full max-w-[1380px] space-y-7">
      <Alert tone="atencao" title="Seus anuncios nao serao entregues ate que seu e-mail seja verificado." className="items-center rounded-full border-amber-300 bg-amber-50 px-6 py-4 shadow-none">
        <button type="button" className="text-sm font-bold text-brand-500 underline underline-offset-2">Reenviar verificacao</button>
      </Alert>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[34px] font-extrabold leading-none text-[#132f40]">Overview</h1>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={data.range.key} prefixIcon={<CalendarDays size={17} />} onChange={(event) => router.push(`/ads?range=${event.target.value}`)} className="min-w-[150px]">
            <option value="7d">Ultimos 7 dias</option><option value="month">Este mes</option><option value="all">Total</option>
          </Select>
          <Button iconLeft={<Plus size={19} />} onClick={() => router.push('/ads/criar')}>Criar Campanha</Button>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="min-h-[150px] rounded-[22px] border border-slate-200 px-7 py-6 shadow-sm">
            <p className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-slate-400">{stat.label}</p>
            <p className={`mt-6 text-[34px] font-extrabold leading-none ${stat.accent ? 'text-brand-500' : 'text-[#132f40]'}`}>{stat.value}</p>
            <p className="mt-3 text-[13px] text-slate-400">{stat.caption}</p>
          </Card>
        ))}
      </div>

      <Card padded={false} className="rounded-[22px] border border-slate-200 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 pt-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex gap-8 overflow-x-auto">
            {['Campanhas', 'Grupos de Anuncios', 'Anuncios'].map((tab, index) => (
              <button key={tab} type="button" className={`whitespace-nowrap border-b-2 px-1 pb-4 text-sm font-bold ${index === 0 ? 'border-brand-500 text-brand-500' : 'border-transparent text-slate-400'}`}>{tab}</button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 pb-3">
            <Button size="sm" iconOnly aria-label="Nova campanha" iconLeft={<Plus size={17} />} onClick={() => router.push('/ads/criar')} />
            {[Edit3, Copy, Trash2, Download, SlidersHorizontal].map((Icon, index) => (
              <Button key={index} size="sm" iconOnly variant="ghost" aria-label="Acao da campanha" iconLeft={<Icon size={16} />} className="bg-slate-50 text-slate-400" />
            ))}
            <div className="w-full sm:w-[190px]"><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar..." prefixIcon={<Search size={16} />} /></div>
            <Button size="sm" iconOnly variant="ghost" aria-label="Filtros" iconLeft={<Filter size={16} />} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left">
            <thead><tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-[0.06em] text-slate-400">
              {['Nome', 'On/Off', 'Status', 'Inicio', 'Fim', 'Impressoes', 'Cliques', 'Conv.', 'Gasto', 'CTR', 'CPC'].map((label) => <th key={label} className="px-5 py-4">{label}</th>)}
            </tr></thead>
            <tbody>
              {visibleRows.map((row) => {
                const enabled = enabledRows[row.id] ?? false;
                const status = getStatus(row, enabled);
                return (
                  <tr key={row.id} className="border-b border-slate-100 text-[13px] text-[#243b53] hover:bg-slate-50/70">
                    <td className="max-w-[260px] px-5 py-4 font-bold">{row.label}</td>
                    <td className="px-5 py-4"><button type="button" role="switch" aria-checked={enabled} onClick={() => setEnabledRows((current) => ({ ...current, [row.id]: !enabled }))} className={`relative h-6 w-11 rounded-full transition ${enabled ? 'bg-brand-500' : 'bg-slate-200'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${enabled ? 'left-6' : 'left-1'}`} /></button></td>
                    <td className="px-5 py-4"><Badge tone={status.tone} className="normal-case tracking-normal">{status.label}</Badge></td>
                    <td className="px-5 py-4 text-slate-400">{formatDate(row.startsAt)}</td><td className="px-5 py-4 text-slate-400">{formatDate(row.endsAt)}</td>
                    <td className="px-5 py-4 font-semibold">{formatNumber(row.impressions)}</td><td className="px-5 py-4 font-semibold">{formatNumber(row.clicks)}</td><td className="px-5 py-4 text-slate-400">{formatNumber(row.conversions)}</td>
                    <td className="px-5 py-4 font-semibold">{formatUsd(row.spendCents)}</td><td className="px-5 py-4 font-semibold text-brand-500">{formatPercent(row.ctr)}</td><td className="px-5 py-4 text-slate-400">{row.cpcCents == null ? '-' : formatUsdWithCents(row.cpcCents)}</td>
                  </tr>
                );
              })}
              {visibleRows.length === 0 ? <tr><td colSpan={11} className="px-5 py-12 text-center text-sm text-slate-400">Nenhuma campanha encontrada.</td></tr> : null}
            </tbody>
            <tfoot><tr className="bg-slate-50/70 text-[13px] font-extrabold text-[#132f40]">
              <td className="px-5 py-4" colSpan={5}>Total</td><td className="px-5 py-4">{formatNumber(data.total.impressions)}</td><td className="px-5 py-4">{formatNumber(data.total.clicks)}</td><td className="px-5 py-4">{formatNumber(data.total.conversions)}</td><td className="px-5 py-4">{formatUsd(data.total.spendCents)}</td><td className="px-5 py-4 text-brand-500">{formatPercent(data.total.impressions ? data.total.clicks / data.total.impressions : 0)}</td><td className="px-5 py-4">{data.total.clicks ? formatUsdWithCents(Math.round(data.total.spendCents / data.total.clicks)) : '-'}</td>
            </tr></tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}

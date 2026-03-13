'use client';

import React, { startTransition, useEffect, useState } from 'react';
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  CircleAlert,
  Globe2,
  MapPinned,
  MessageSquareText,
  PencilLine,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Store,
  Users,
} from 'lucide-react';
import type { User } from '../types';

type BusinessAction = 'approve' | 'reject' | 'suspend';
type EventAction = 'approve' | 'reject' | 'cancel';
type PostAction = 'approve' | 'remove';

type AdminActor = { id: string; name: string | null; email: string | null; image?: string | null };
type PendingBusiness = { id: string; name: string; category: string; address: string; locationLabel: string; createdAt: string; createdBy: AdminActor };
type PendingEvent = { id: string; title: string; venueName: string; locationLabel: string; startsAt: string; createdAt: string; createdBy: AdminActor };
type PendingPost = { id: string; content: string; locationLabel: string; createdAt: string; author: AdminActor };
type ManagedRegion = {
  key: string;
  label: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  aliases: string[];
  isActive: boolean;
  updatedAt: string;
};
type AdminDashboardData = {
  stats: {
    totalUsers: number;
    businessOwners: number;
    publishedBusinesses: number;
    publishedEvents: number;
    publishedPosts: number;
    pendingBusinesses: number;
    pendingEvents: number;
    pendingPosts: number;
    totalRegions: number;
    activeRegions: number;
  };
  pendingBusinesses: PendingBusiness[];
  pendingEvents: PendingEvent[];
  pendingPosts: PendingPost[];
  regions: ManagedRegion[];
};
type RegionFormState = {
  key: string;
  label: string;
  city: string;
  state: string;
  lat: string;
  lng: string;
  aliases: string;
  isActive: boolean;
};

const emptyRegionForm: RegionFormState = {
  key: '',
  label: '',
  city: '',
  state: '',
  lat: '',
  lng: '',
  aliases: '',
  isActive: true,
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));

const summarize = (value: string, limit = 150) => (value.length > limit ? `${value.slice(0, limit).trimEnd()}...` : value);
const sortRegions = (regions: ManagedRegion[]) => [...regions].sort((a, b) => a.label.localeCompare(b.label, 'en-US'));

const AdminPanel: React.FC<{ user: User }> = ({ user }) => {
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingKey, setProcessingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editingRegionKey, setEditingRegionKey] = useState<string | null>(null);
  const [regionForm, setRegionForm] = useState<RegionFormState>(emptyRegionForm);

  const loadDashboard = async (showRefreshing = false) => {
    showRefreshing ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/dashboard', { cache: 'no-store' });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? 'Nao foi possivel carregar o painel admin.');
      startTransition(() => setDashboard(payload));
    } catch (loadError) {
      console.error('Failed to load admin dashboard:', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar o painel admin.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const totalPending = dashboard
    ? dashboard.stats.pendingBusinesses + dashboard.stats.pendingEvents + dashboard.stats.pendingPosts
    : 0;

  const updateDashboardRegion = (region: ManagedRegion) =>
    setDashboard((current) => {
      if (!current) return current;
      const exists = current.regions.some((item) => item.key === region.key);
      const regions = sortRegions(
        exists ? current.regions.map((item) => (item.key === region.key ? region : item)) : [...current.regions, region],
      );
      return {
        ...current,
        stats: {
          ...current.stats,
          totalRegions: exists ? current.stats.totalRegions : current.stats.totalRegions + 1,
          activeRegions: regions.filter((item) => item.isActive).length,
        },
        regions,
      };
    });

  const reviewItem = async (
    key: string,
    url: string,
    action: BusinessAction | EventAction | PostAction,
    onSuccess: () => void,
    successMessage: string,
    fallbackError: string,
  ) => {
    setProcessingKey(key);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? fallbackError);
      onSuccess();
      setMessage(successMessage);
    } catch (reviewError) {
      console.error(fallbackError, reviewError);
      setError(reviewError instanceof Error ? reviewError.message : fallbackError);
    } finally {
      setProcessingKey(null);
    }
  };

  const submitBusinessReview = (businessId: string, action: BusinessAction) =>
    reviewItem(
      `business:${businessId}:${action}`,
      `/api/admin/businesses/${businessId}/review`,
      action,
      () =>
        setDashboard((current) =>
          current
            ? {
                ...current,
                stats: {
                  ...current.stats,
                  pendingBusinesses: Math.max(current.stats.pendingBusinesses - 1, 0),
                  publishedBusinesses: action === 'approve' ? current.stats.publishedBusinesses + 1 : current.stats.publishedBusinesses,
                },
                pendingBusinesses: current.pendingBusinesses.filter((item) => item.id !== businessId),
              }
            : current,
        ),
      action === 'approve' ? 'Negocio aprovado e publicado.' : action === 'suspend' ? 'Negocio suspenso.' : 'Negocio rejeitado.',
      'Nao foi possivel revisar o negocio.',
    );

  const submitEventReview = (eventId: string, action: EventAction) =>
    reviewItem(
      `event:${eventId}:${action}`,
      `/api/admin/events/${eventId}/review`,
      action,
      () =>
        setDashboard((current) =>
          current
            ? {
                ...current,
                stats: {
                  ...current.stats,
                  pendingEvents: Math.max(current.stats.pendingEvents - 1, 0),
                  publishedEvents: action === 'approve' ? current.stats.publishedEvents + 1 : current.stats.publishedEvents,
                },
                pendingEvents: current.pendingEvents.filter((item) => item.id !== eventId),
              }
            : current,
        ),
      action === 'approve' ? 'Evento aprovado.' : 'Evento removido da fila.',
      'Nao foi possivel revisar o evento.',
    );

  const submitPostReview = (postId: string, action: PostAction) =>
    reviewItem(
      `post:${postId}:${action}`,
      `/api/admin/community/posts/${postId}/review`,
      action,
      () =>
        setDashboard((current) =>
          current
            ? {
                ...current,
                stats: {
                  ...current.stats,
                  pendingPosts: Math.max(current.stats.pendingPosts - 1, 0),
                  publishedPosts: action === 'approve' ? current.stats.publishedPosts + 1 : current.stats.publishedPosts,
                },
                pendingPosts: current.pendingPosts.filter((item) => item.id !== postId),
              }
            : current,
        ),
      action === 'approve' ? 'Publicacao aprovada e liberada.' : 'Publicacao removida da fila.',
      'Nao foi possivel revisar a publicacao.',
    );

  const resetRegionForm = () => {
    setEditingRegionKey(null);
    setRegionForm(emptyRegionForm);
  };

  const startRegionEdit = (region: ManagedRegion) => {
    setEditingRegionKey(region.key);
    setRegionForm({
      key: region.key,
      label: region.label,
      city: region.city,
      state: region.state,
      lat: String(region.lat),
      lng: String(region.lng),
      aliases: region.aliases.join(', '),
      isActive: region.isActive,
    });
    setError(null);
    setMessage(null);
  };

  const submitRegion = async () => {
    if (!regionForm.label.trim() || !regionForm.city.trim() || !regionForm.state.trim()) {
      setError('Preencha nome, cidade e estado da regiao.');
      return;
    }
    if (!regionForm.lat.trim() || !regionForm.lng.trim()) {
      setError('Informe latitude e longitude validas.');
      return;
    }

    const requestKey = editingRegionKey ? `region:${editingRegionKey}:save` : 'region:create';
    setProcessingKey(requestKey);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(editingRegionKey ? `/api/admin/regions/${editingRegionKey}` : '/api/admin/regions', {
        method: editingRegionKey ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: regionForm.key.trim() || undefined,
          label: regionForm.label.trim(),
          city: regionForm.city.trim(),
          state: regionForm.state.trim(),
          lat: Number(regionForm.lat),
          lng: Number(regionForm.lng),
          aliases: regionForm.aliases.split(',').map((item) => item.trim()).filter(Boolean),
          isActive: regionForm.isActive,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? 'Nao foi possivel salvar a regiao.');
      updateDashboardRegion(payload.region);
      setMessage(editingRegionKey ? 'Regiao atualizada.' : 'Regiao criada.');
      resetRegionForm();
    } catch (saveError) {
      console.error('Failed to save region:', saveError);
      setError(saveError instanceof Error ? saveError.message : 'Nao foi possivel salvar a regiao.');
    } finally {
      setProcessingKey(null);
    }
  };

  const toggleRegionStatus = async (region: ManagedRegion) => {
    setProcessingKey(`region:${region.key}:toggle`);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/regions/${region.key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: region.label,
          city: region.city,
          state: region.state,
          lat: region.lat,
          lng: region.lng,
          aliases: region.aliases,
          isActive: !region.isActive,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? 'Nao foi possivel atualizar a regiao.');
      updateDashboardRegion(payload.region);
      setMessage(payload.region.isActive ? 'Regiao ativada.' : 'Regiao desativada.');
    } catch (toggleError) {
      console.error('Failed to toggle region status:', toggleError);
      setError(toggleError instanceof Error ? toggleError.message : 'Nao foi possivel atualizar a regiao.');
    } finally {
      setProcessingKey(null);
    }
  };

  const statsCards = dashboard
    ? [
        { label: 'Usuarios', value: dashboard.stats.totalUsers, icon: <Users size={20} />, accent: 'bg-blue-50 text-blue-800' },
        { label: 'Donos de negocios', value: dashboard.stats.businessOwners, icon: <Store size={20} />, accent: 'bg-emerald-50 text-emerald-800' },
        { label: 'Negocios publicados', value: dashboard.stats.publishedBusinesses, icon: <Building2 size={20} />, accent: 'bg-orange-50 text-orange-800' },
        { label: 'Eventos publicados', value: dashboard.stats.publishedEvents, icon: <CalendarDays size={20} />, accent: 'bg-cyan-50 text-cyan-800' },
        { label: 'Posts publicados', value: dashboard.stats.publishedPosts, icon: <MessageSquareText size={20} />, accent: 'bg-violet-50 text-violet-800' },
        { label: 'Regioes ativas', value: dashboard.stats.activeRegions, icon: <Globe2 size={20} />, accent: 'bg-sky-50 text-sky-800' },
      ]
    : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="px-5 mt-4">
        <div className="rounded-[32px] bg-gradient-to-br from-[#004691] via-[#0C58B6] to-[#27A0FF] p-5 text-white shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em]">
                <ShieldCheck size={14} />
                Admin
              </div>
              <h1 className="text-2xl font-bold leading-tight">Painel de moderacao</h1>
              <p className="max-w-[260px] text-sm text-white/80">Revise conteudos pendentes e mantenha o catalogo de regioes.</p>
            </div>
            <button type="button" onClick={() => loadDashboard(true)} disabled={refreshing || loading} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white transition hover:bg-white/20 disabled:opacity-60" aria-label="Atualizar painel admin">
              <RefreshCcw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-3xl bg-white/12 p-4 backdrop-blur-sm">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/70">Aguardando revisao</p>
              <p className="mt-2 text-3xl font-bold">{totalPending}</p>
            </div>
            <div className="rounded-3xl bg-white/12 p-4 backdrop-blur-sm">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/70">Responsavel logado</p>
              <p className="mt-2 text-sm font-bold leading-tight">{user.name}</p>
              <p className="text-xs text-white/70">{user.email || 'Administrador'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-4">
        {error ? <Feedback tone="error" text={error} /> : null}
        {message ? <Feedback tone="success" text={message} /> : null}
        <div className="grid grid-cols-2 gap-3">
          {loading && !dashboard
            ? Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-[104px] animate-pulse rounded-3xl bg-white shadow-sm" />)
            : statsCards.map((card) => (
                <div key={card.label} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${card.accent}`}>{card.icon}</div>
                  <p className="mt-4 text-2xl font-bold text-slate-900">{card.value}</p>
                  <p className="text-xs font-medium text-slate-500">{card.label}</p>
                </div>
              ))}
        </div>
      </div>

      <div className="px-5 space-y-4">
        <section className="space-y-3">
          <SectionHeader title="Gestao de regioes" count={dashboard?.stats.totalRegions ?? 0} />
          <div className="rounded-[32px] border border-slate-100 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-700">{editingRegionKey ? 'Editar regiao' : 'Nova regiao'}</p>
                <p className="text-xs text-slate-400">Cadastre regioes validas para onboarding, perfil e filtros locais.</p>
              </div>
              {editingRegionKey ? (
                <button type="button" onClick={resetRegionForm} className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500">
                  Cancelar
                </button>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormInput className="col-span-2" value={regionForm.label} onChange={(value) => setRegionForm((current) => ({ ...current, label: value }))} placeholder="Nome da regiao" />
              <FormInput value={regionForm.city} onChange={(value) => setRegionForm((current) => ({ ...current, city: value }))} placeholder="Cidade" />
              <FormInput value={regionForm.state} onChange={(value) => setRegionForm((current) => ({ ...current, state: value.toUpperCase() }))} placeholder="Estado" />
              <FormInput value={regionForm.lat} onChange={(value) => setRegionForm((current) => ({ ...current, lat: value }))} placeholder="Latitude" />
              <FormInput value={regionForm.lng} onChange={(value) => setRegionForm((current) => ({ ...current, lng: value }))} placeholder="Longitude" />
              {!editingRegionKey ? (
                <FormInput className="col-span-2" value={regionForm.key} onChange={(value) => setRegionForm((current) => ({ ...current, key: value }))} placeholder="Chave opcional (ex: miami-fl)" />
              ) : (
                <div className="col-span-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  Chave da regiao: <span className="font-bold text-slate-700">{editingRegionKey}</span>
                </div>
              )}
              <FormInput className="col-span-2" value={regionForm.aliases} onChange={(value) => setRegionForm((current) => ({ ...current, aliases: value }))} placeholder="Aliases separados por virgula" />
            </div>
            <label className="inline-flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
              <input type="checkbox" checked={regionForm.isActive} onChange={(event) => setRegionForm((current) => ({ ...current, isActive: event.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-[#004691] focus:ring-[#004691]" />
              Regiao ativa para novos usuarios
            </label>
            <button type="button" onClick={submitRegion} disabled={processingKey === 'region:create' || processingKey === `region:${editingRegionKey}:save`} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#004691] px-4 text-sm font-bold text-white shadow-md disabled:opacity-60">
              {editingRegionKey ? <PencilLine size={16} /> : <Plus size={16} />}
              {editingRegionKey ? (processingKey === `region:${editingRegionKey}:save` ? 'Salvando regiao...' : 'Salvar alteracoes') : processingKey === 'region:create' ? 'Criando regiao...' : 'Cadastrar regiao'}
            </button>
          </div>
          <div className="space-y-3">
            {loading && !dashboard ? Array.from({ length: 2 }).map((_, index) => <div key={index} className="h-[184px] animate-pulse rounded-3xl bg-white shadow-sm" />) : null}
            {dashboard?.regions.map((region) => (
              <div key={region.key} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold text-[#004691]">{region.label}</p>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${region.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {region.isActive ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{region.key}</p>
                  </div>
                  <MapPinned size={18} className="text-slate-300" />
                </div>
                <div className="mt-4 space-y-1 text-sm text-slate-600">
                  <p>{region.city}, {region.state}</p>
                  <p>Lat {region.lat} • Lng {region.lng}</p>
                  <p>Atualizada em {formatDateTime(region.updatedAt)}</p>
                </div>
                {region.aliases.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {region.aliases.map((alias) => (
                      <span key={`${region.key}-${alias}`} className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">{alias}</span>
                    ))}
                  </div>
                ) : null}
                <div className="mt-4 flex gap-2">
                  <ActionButton label="Editar" tone="neutral" disabled={processingKey !== null} onClick={() => startRegionEdit(region)} />
                  <ActionButton label={region.isActive ? 'Desativar' : 'Ativar'} tone={region.isActive ? 'danger' : 'primary'} disabled={processingKey !== null} loading={processingKey === `region:${region.key}:toggle`} onClick={() => toggleRegionStatus(region)} />
                </div>
              </div>
            ))}
            {dashboard && dashboard.regions.length === 0 ? <EmptyState text="Nenhuma regiao cadastrada ainda." /> : null}
          </div>
        </section>

        <ModerationSection title="Negocios em aprovacao" count={dashboard?.pendingBusinesses.length ?? 0} emptyLabel="Nenhum negocio aguardando revisao." loading={loading && !dashboard}>
          {dashboard?.pendingBusinesses.map((business) => (
            <QueueCard key={business.id} title={business.name} subtitle={business.category} lines={[business.locationLabel || business.address, `Criado por ${business.createdBy.name || business.createdBy.email || 'Usuario'}`, `Enviado em ${formatDateTime(business.createdAt)}`]}>
              <ActionButton label="Aprovar" tone="primary" disabled={processingKey !== null} loading={processingKey === `business:${business.id}:approve`} onClick={() => submitBusinessReview(business.id, 'approve')} />
              <ActionButton label="Rejeitar" tone="danger" disabled={processingKey !== null} loading={processingKey === `business:${business.id}:reject`} onClick={() => submitBusinessReview(business.id, 'reject')} />
            </QueueCard>
          ))}
        </ModerationSection>

        <ModerationSection title="Eventos em aprovacao" count={dashboard?.pendingEvents.length ?? 0} emptyLabel="Nenhum evento aguardando revisao." loading={loading && !dashboard}>
          {dashboard?.pendingEvents.map((event) => (
            <QueueCard key={event.id} title={event.title} subtitle={event.venueName} lines={[event.locationLabel, `Comeca em ${formatDateTime(event.startsAt)}`, `Enviado por ${event.createdBy.name || event.createdBy.email || 'Usuario'}`]}>
              <ActionButton label="Publicar" tone="primary" disabled={processingKey !== null} loading={processingKey === `event:${event.id}:approve`} onClick={() => submitEventReview(event.id, 'approve')} />
              <ActionButton label="Rejeitar" tone="danger" disabled={processingKey !== null} loading={processingKey === `event:${event.id}:reject`} onClick={() => submitEventReview(event.id, 'reject')} />
            </QueueCard>
          ))}
        </ModerationSection>

        <ModerationSection title="Posts em revisao" count={dashboard?.pendingPosts.length ?? 0} emptyLabel="Nenhuma publicacao aguardando moderacao." loading={loading && !dashboard}>
          {dashboard?.pendingPosts.map((post) => (
            <div key={post.id} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <img src={post.author.image || `https://picsum.photos/seed/${post.author.id}/100`} alt={post.author.name || 'Autor'} className="h-11 w-11 rounded-2xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#004691]">{post.author.name || 'Usuario da comunidade'}</p>
                  <p className="text-xs text-slate-400">{post.locationLabel} • {formatDateTime(post.createdAt)}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-700">{summarize(post.content)}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <ActionButton label="Aprovar" tone="primary" disabled={processingKey !== null} loading={processingKey === `post:${post.id}:approve`} onClick={() => submitPostReview(post.id, 'approve')} />
                <ActionButton label="Remover" tone="danger" disabled={processingKey !== null} loading={processingKey === `post:${post.id}:remove`} onClick={() => submitPostReview(post.id, 'remove')} />
              </div>
            </div>
          ))}
        </ModerationSection>
      </div>
    </div>
  );
};

const Feedback: React.FC<{ tone: 'error' | 'success'; text: string }> = ({ tone, text }) => (
  <div className={`flex items-start gap-3 rounded-3xl px-4 py-4 text-sm ${tone === 'error' ? 'border border-red-100 bg-red-50 text-red-700' : 'border border-emerald-100 bg-emerald-50 text-emerald-700'}`}>
    {tone === 'error' ? <CircleAlert size={18} className="mt-0.5 shrink-0" /> : <BadgeCheck size={18} className="mt-0.5 shrink-0" />}
    <p>{text}</p>
  </div>
);

const SectionHeader: React.FC<{ title: string; count: number }> = ({ title, count }) => (
  <div className="flex items-center justify-between">
    <h2 className="text-lg font-bold text-[#004691]">{title}</h2>
    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 shadow-sm">{count}</span>
  </div>
);

const ModerationSection: React.FC<{ title: string; count: number; emptyLabel: string; loading: boolean; children: React.ReactNode }> = ({ title, count, emptyLabel, loading, children }) => (
  <section className="space-y-3">
    <SectionHeader title={title} count={count} />
    {loading ? <div className="space-y-3">{Array.from({ length: 2 }).map((_, index) => <div key={index} className="h-[184px] animate-pulse rounded-3xl bg-white shadow-sm" />)}</div> : count === 0 ? <EmptyState text={emptyLabel} /> : <div className="space-y-3">{children}</div>}
  </section>
);

const QueueCard: React.FC<{ title: string; subtitle: string; lines: string[]; children: React.ReactNode }> = ({ title, subtitle, lines, children }) => (
  <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-lg font-bold text-[#004691]">{title}</p>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{subtitle}</p>
      </div>
      <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700">Pendente</span>
    </div>
    <div className="mt-4 space-y-1 text-sm text-slate-600">{lines.map((line) => <p key={line}>{line}</p>)}</div>
    <div className="mt-4 flex gap-2">{children}</div>
  </div>
);

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-5 py-7 text-center text-sm font-medium text-slate-500">{text}</div>
);

const FormInput: React.FC<{ value: string; onChange: (value: string) => void; placeholder: string; className?: string }> = ({ value, onChange, placeholder, className = '' }) => (
  <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={`rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200 ${className}`} />
);

const ActionButton: React.FC<{ label: string; tone: 'primary' | 'danger' | 'neutral'; disabled?: boolean; loading?: boolean; onClick: () => void }> = ({ label, tone, disabled = false, loading = false, onClick }) => (
  <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl px-4 text-sm font-bold transition disabled:opacity-60 ${tone === 'primary' ? 'bg-[#004691] text-white hover:bg-[#00386f]' : tone === 'danger' ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
    {loading ? 'Processando...' : label}
  </button>
);

export default AdminPanel;

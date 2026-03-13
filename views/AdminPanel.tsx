'use client';

import React, { startTransition, useEffect, useState } from 'react';
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  CircleAlert,
  MessageSquareText,
  RefreshCcw,
  ShieldCheck,
  Store,
  Users,
} from 'lucide-react';
import type { User } from '../types';

interface AdminDashboardStats {
  totalUsers: number;
  businessOwners: number;
  publishedBusinesses: number;
  publishedEvents: number;
  publishedPosts: number;
  pendingBusinesses: number;
  pendingEvents: number;
  pendingPosts: number;
}

interface AdminActor {
  id: string;
  name: string | null;
  email: string | null;
  image?: string | null;
}

interface PendingBusiness {
  id: string;
  name: string;
  category: string;
  address: string;
  locationLabel: string;
  createdAt: string;
  createdBy: AdminActor;
}

interface PendingEvent {
  id: string;
  title: string;
  venueName: string;
  locationLabel: string;
  startsAt: string;
  createdAt: string;
  createdBy: AdminActor;
}

interface PendingPost {
  id: string;
  content: string;
  locationLabel: string;
  createdAt: string;
  author: AdminActor;
}

interface AdminDashboardData {
  stats: AdminDashboardStats;
  pendingBusinesses: PendingBusiness[];
  pendingEvents: PendingEvent[];
  pendingPosts: PendingPost[];
}

type BusinessAction = 'approve' | 'reject' | 'suspend';
type EventAction = 'approve' | 'reject' | 'cancel';
type PostAction = 'approve' | 'remove';

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));

const summarize = (value: string, limit = 150) =>
  value.length > limit ? `${value.slice(0, limit).trimEnd()}...` : value;

const AdminPanel: React.FC<{ user: User }> = ({ user }) => {
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingKey, setProcessingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadDashboard = async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/dashboard', {
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Nao foi possivel carregar o painel admin.');
      }

      startTransition(() => {
        setDashboard(payload);
      });
    } catch (loadError) {
      console.error('Failed to load admin dashboard:', loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Nao foi possivel carregar o painel admin.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    const fetchInitialDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/admin/dashboard', {
          cache: 'no-store',
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error ?? 'Nao foi possivel carregar o painel admin.');
        }

        if (!ignore) {
          startTransition(() => {
            setDashboard(payload);
          });
        }
      } catch (loadError) {
        console.error('Failed to load admin dashboard:', loadError);

        if (!ignore) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Nao foi possivel carregar o painel admin.',
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchInitialDashboard();

    return () => {
      ignore = true;
    };
  }, []);

  const totalPending = dashboard
    ? dashboard.stats.pendingBusinesses +
      dashboard.stats.pendingEvents +
      dashboard.stats.pendingPosts
    : 0;

  const submitBusinessReview = async (businessId: string, action: BusinessAction) => {
    setProcessingKey(`business:${businessId}:${action}`);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/businesses/${businessId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Nao foi possivel revisar o negocio.');
      }

      setDashboard((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          stats: {
            ...current.stats,
            pendingBusinesses: Math.max(current.stats.pendingBusinesses - 1, 0),
            publishedBusinesses:
              action === 'approve'
                ? current.stats.publishedBusinesses + 1
                : current.stats.publishedBusinesses,
          },
          pendingBusinesses: current.pendingBusinesses.filter((item) => item.id !== businessId),
        };
      });

      setMessage(
        action === 'approve'
          ? 'Negocio aprovado e publicado.'
          : action === 'suspend'
            ? 'Negocio suspenso.'
            : 'Negocio rejeitado.',
      );
    } catch (reviewError) {
      console.error('Failed to review business:', reviewError);
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : 'Nao foi possivel revisar o negocio.',
      );
    } finally {
      setProcessingKey(null);
    }
  };

  const submitEventReview = async (eventId: string, action: EventAction) => {
    setProcessingKey(`event:${eventId}:${action}`);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/events/${eventId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Nao foi possivel revisar o evento.');
      }

      setDashboard((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          stats: {
            ...current.stats,
            pendingEvents: Math.max(current.stats.pendingEvents - 1, 0),
            publishedEvents:
              action === 'approve'
                ? current.stats.publishedEvents + 1
                : current.stats.publishedEvents,
          },
          pendingEvents: current.pendingEvents.filter((item) => item.id !== eventId),
        };
      });

      setMessage(action === 'approve' ? 'Evento aprovado.' : 'Evento removido da fila.');
    } catch (reviewError) {
      console.error('Failed to review event:', reviewError);
      setError(
        reviewError instanceof Error ? reviewError.message : 'Nao foi possivel revisar o evento.',
      );
    } finally {
      setProcessingKey(null);
    }
  };

  const submitPostReview = async (postId: string, action: PostAction) => {
    setProcessingKey(`post:${postId}:${action}`);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/community/posts/${postId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Nao foi possivel revisar a publicacao.');
      }

      setDashboard((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          stats: {
            ...current.stats,
            pendingPosts: Math.max(current.stats.pendingPosts - 1, 0),
            publishedPosts:
              action === 'approve'
                ? current.stats.publishedPosts + 1
                : current.stats.publishedPosts,
          },
          pendingPosts: current.pendingPosts.filter((item) => item.id !== postId),
        };
      });

      setMessage(
        action === 'approve'
          ? 'Publicacao aprovada e liberada.'
          : 'Publicacao removida da fila.',
      );
    } catch (reviewError) {
      console.error('Failed to review post:', reviewError);
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : 'Nao foi possivel revisar a publicacao.',
      );
    } finally {
      setProcessingKey(null);
    }
  };

  const statsCards = dashboard
    ? [
        {
          label: 'Usuarios',
          value: dashboard.stats.totalUsers,
          icon: <Users size={20} />,
          accent: 'bg-blue-50 text-blue-800',
        },
        {
          label: 'Donos de negocios',
          value: dashboard.stats.businessOwners,
          icon: <Store size={20} />,
          accent: 'bg-emerald-50 text-emerald-800',
        },
        {
          label: 'Negocios publicados',
          value: dashboard.stats.publishedBusinesses,
          icon: <Building2 size={20} />,
          accent: 'bg-orange-50 text-orange-800',
        },
        {
          label: 'Eventos publicados',
          value: dashboard.stats.publishedEvents,
          icon: <CalendarDays size={20} />,
          accent: 'bg-cyan-50 text-cyan-800',
        },
        {
          label: 'Posts publicados',
          value: dashboard.stats.publishedPosts,
          icon: <MessageSquareText size={20} />,
          accent: 'bg-violet-50 text-violet-800',
        },
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
              <p className="max-w-[260px] text-sm text-white/80">
                Revise negocios, eventos e publicacoes pendentes da plataforma.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadDashboard(true)}
              disabled={refreshing || loading}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white transition hover:bg-white/20 disabled:opacity-60"
              aria-label="Atualizar painel admin"
            >
              <RefreshCcw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-3xl bg-white/12 p-4 backdrop-blur-sm">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/70">
                Aguardando revisao
              </p>
              <p className="mt-2 text-3xl font-bold">{totalPending}</p>
            </div>

            <div className="rounded-3xl bg-white/12 p-4 backdrop-blur-sm">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/70">
                Responsavel logado
              </p>
              <p className="mt-2 text-sm font-bold leading-tight">{user.name}</p>
              <p className="text-xs text-white/70">{user.email || 'Administrador'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-4">
        {error ? (
          <div className="flex items-start gap-3 rounded-3xl border border-red-100 bg-red-50 px-4 py-4 text-sm text-red-700">
            <CircleAlert size={18} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}

        {message ? (
          <div className="flex items-start gap-3 rounded-3xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
            <BadgeCheck size={18} className="mt-0.5 shrink-0" />
            <p>{message}</p>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          {loading && !dashboard
            ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[104px] animate-pulse rounded-3xl bg-white shadow-sm"
                />
              ))
            : statsCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"
                >
                  <div
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${card.accent}`}
                  >
                    {card.icon}
                  </div>
                  <p className="mt-4 text-2xl font-bold text-slate-900">{card.value}</p>
                  <p className="text-xs font-medium text-slate-500">{card.label}</p>
                </div>
              ))}
        </div>
      </div>

      <div className="px-5 space-y-4">
        <ModerationSection
          title="Negocios em aprovacao"
          count={dashboard?.pendingBusinesses.length ?? 0}
          emptyLabel="Nenhum negocio aguardando revisao."
          loading={loading && !dashboard}
        >
          {dashboard?.pendingBusinesses.map((business) => (
            <div
              key={business.id}
              className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-[#004691]">{business.name}</p>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    {business.category}
                  </p>
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700">
                  Pendente
                </span>
              </div>

              <div className="mt-4 space-y-1 text-sm text-slate-600">
                <p>{business.locationLabel || business.address}</p>
                <p>Criado por {business.createdBy.name || business.createdBy.email || 'Usuario'}</p>
                <p>Enviado em {formatDateTime(business.createdAt)}</p>
              </div>

              <div className="mt-4 flex gap-2">
                <ActionButton
                  label="Aprovar"
                  tone="primary"
                  disabled={processingKey !== null}
                  loading={processingKey === `business:${business.id}:approve`}
                  onClick={() => submitBusinessReview(business.id, 'approve')}
                />
                <ActionButton
                  label="Rejeitar"
                  tone="danger"
                  disabled={processingKey !== null}
                  loading={processingKey === `business:${business.id}:reject`}
                  onClick={() => submitBusinessReview(business.id, 'reject')}
                />
              </div>
            </div>
          ))}
        </ModerationSection>

        <ModerationSection
          title="Eventos em aprovacao"
          count={dashboard?.pendingEvents.length ?? 0}
          emptyLabel="Nenhum evento aguardando revisao."
          loading={loading && !dashboard}
        >
          {dashboard?.pendingEvents.map((event) => (
            <div
              key={event.id}
              className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-[#004691]">{event.title}</p>
                  <p className="text-xs font-medium text-slate-500">{event.venueName}</p>
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700">
                  Revisao
                </span>
              </div>

              <div className="mt-4 space-y-1 text-sm text-slate-600">
                <p>{event.locationLabel}</p>
                <p>Comeca em {formatDateTime(event.startsAt)}</p>
                <p>Enviado por {event.createdBy.name || event.createdBy.email || 'Usuario'}</p>
              </div>

              <div className="mt-4 flex gap-2">
                <ActionButton
                  label="Publicar"
                  tone="primary"
                  disabled={processingKey !== null}
                  loading={processingKey === `event:${event.id}:approve`}
                  onClick={() => submitEventReview(event.id, 'approve')}
                />
                <ActionButton
                  label="Rejeitar"
                  tone="danger"
                  disabled={processingKey !== null}
                  loading={processingKey === `event:${event.id}:reject`}
                  onClick={() => submitEventReview(event.id, 'reject')}
                />
              </div>
            </div>
          ))}
        </ModerationSection>

        <ModerationSection
          title="Posts em revisao"
          count={dashboard?.pendingPosts.length ?? 0}
          emptyLabel="Nenhuma publicacao aguardando moderacao."
          loading={loading && !dashboard}
        >
          {dashboard?.pendingPosts.map((post) => (
            <div
              key={post.id}
              className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <img
                  src={post.author.image || `https://picsum.photos/seed/${post.author.id}/100`}
                  alt={post.author.name || 'Autor'}
                  className="h-11 w-11 rounded-2xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#004691]">
                    {post.author.name || 'Usuario da comunidade'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {post.locationLabel} • {formatDateTime(post.createdAt)}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-700">
                    {summarize(post.content)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <ActionButton
                  label="Aprovar"
                  tone="primary"
                  disabled={processingKey !== null}
                  loading={processingKey === `post:${post.id}:approve`}
                  onClick={() => submitPostReview(post.id, 'approve')}
                />
                <ActionButton
                  label="Remover"
                  tone="danger"
                  disabled={processingKey !== null}
                  loading={processingKey === `post:${post.id}:remove`}
                  onClick={() => submitPostReview(post.id, 'remove')}
                />
              </div>
            </div>
          ))}
        </ModerationSection>
      </div>
    </div>
  );
};

const ModerationSection: React.FC<{
  title: string;
  count: number;
  emptyLabel: string;
  loading: boolean;
  children: React.ReactNode;
}> = ({ title, count, emptyLabel, loading, children }) => (
  <section className="space-y-3">
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-bold text-[#004691]">{title}</h2>
      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 shadow-sm">
        {count}
      </span>
    </div>

    {loading ? (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="h-[184px] animate-pulse rounded-3xl bg-white shadow-sm"
          />
        ))}
      </div>
    ) : count === 0 ? (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-5 py-7 text-center text-sm font-medium text-slate-500">
        {emptyLabel}
      </div>
    ) : (
      <div className="space-y-3">{children}</div>
    )}
  </section>
);

const ActionButton: React.FC<{
  label: string;
  tone: 'primary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}> = ({ label, tone, disabled = false, loading = false, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl px-4 text-sm font-bold transition disabled:opacity-60 ${
      tone === 'primary'
        ? 'bg-[#004691] text-white hover:bg-[#00386f]'
        : 'bg-red-50 text-red-700 hover:bg-red-100'
    }`}
  >
    {loading ? 'Processando...' : label}
  </button>
);

export default AdminPanel;

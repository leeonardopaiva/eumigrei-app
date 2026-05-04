'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Check, X } from 'lucide-react';
import { useToast } from './ToastProvider';

type PendingFriendRequest = {
  id: string;
  createdAt: string;
  requester: {
    id: string;
    name?: string | null;
    username?: string | null;
    image?: string | null;
    locationLabel?: string | null;
  };
};

type PendingCommunityPost = {
  id: string;
  content: string;
  createdAt: string;
  locationLabel: string;
  author: {
    id: string;
    name?: string | null;
    username?: string | null;
    image?: string | null;
  };
};

const getInitials = (name?: string | null) =>
  (name || 'U')
    .split(' ')
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

const FriendRequestBell: React.FC = () => {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState<PendingFriendRequest[]>([]);
  const [pendingPosts, setPendingPosts] = useState<PendingCommunityPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadRequests = async () => {
    setLoading(true);

    try {
      const [friendResponse, postResponse] = await Promise.all([
        fetch('/api/friends/requests', { cache: 'no-store' }),
        fetch('/api/admin/community/posts', { cache: 'no-store' }),
      ]);
      const payload = await friendResponse.json().catch(() => null);

      if (!friendResponse.ok) {
        throw new Error(payload?.error ?? 'Nao foi possivel carregar solicitacoes.');
      }

      setRequests(Array.isArray(payload?.requests) ? payload.requests : []);

      if (postResponse.ok) {
        const postPayload = await postResponse.json().catch(() => null);
        setPendingPosts(Array.isArray(postPayload?.posts) ? postPayload.posts : []);
      } else {
        setPendingPosts([]);
      }
    } catch (error) {
      console.error('Failed to load friend requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostDecision = async (postId: string, action: 'approve' | 'remove') => {
    setProcessingId(postId);

    try {
      const response = await fetch(`/api/admin/community/posts/${postId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Nao foi possivel revisar a publicacao.');
      }

      setPendingPosts((current) => current.filter((post) => post.id !== postId));
      showToast(action === 'approve' ? 'Publicacao aprovada.' : 'Publicacao recusada.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Nao foi possivel revisar a publicacao.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const notificationCount = requests.length + pendingPosts.length;

  useEffect(() => {
    void loadRequests();
    const intervalId = window.setInterval(() => void loadRequests(), 60000);

    return () => window.clearInterval(intervalId);
  }, []);

  const handleDecision = async (requestId: string, action: 'accept' | 'decline') => {
    setProcessingId(requestId);

    try {
      const response = await fetch(`/api/friends/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Nao foi possivel responder a solicitacao.');
      }

      setRequests((current) => current.filter((request) => request.id !== requestId));
      showToast(payload?.message ?? 'Solicitacao respondida.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Nao foi possivel responder a solicitacao.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300"
        aria-label="Solicitacoes de amizade"
      >
        <Bell size={18} />
        {notificationCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-[80] w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-2 text-left shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
          <div className="px-2 py-2">
            <p className="text-sm font-bold text-slate-900">Solicitacoes</p>
            <p className="text-xs text-slate-400">Conexoes pendentes da comunidade.</p>
          </div>

          <div className="max-h-[360px] space-y-1.5 overflow-y-auto">
            {loading && notificationCount === 0 ? (
              <div className="rounded-xl px-4 py-5 text-center text-sm font-medium text-slate-500">
                Carregando...
              </div>
            ) : notificationCount === 0 ? (
              <div className="rounded-xl px-4 py-5 text-center text-sm font-medium text-slate-500">
                Nenhuma solicitacao pendente.
              </div>
            ) : (
              <>
              {requests.map((request) => {
                const requesterName = request.requester.name || 'Usuario da comunidade';

                return (
                  <div key={request.id} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={request.requester.username ? `/${request.requester.username}` : '/'}
                        onClick={() => setOpen(false)}
                        className="shrink-0"
                      >
                        {request.requester.image ? (
                          <img
                            src={request.requester.image}
                            alt={requesterName}
                            className="h-11 w-11 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-50 text-sm font-bold text-[#28B8C7]">
                            {getInitials(requesterName)}
                          </div>
                        )}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">{requesterName}</p>
                        <p className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                          @{request.requester.username || 'perfil'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => void handleDecision(request.id, 'accept')}
                        disabled={processingId === request.id}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#0D6EFD] px-3 text-xs font-bold text-white disabled:opacity-60"
                      >
                        <Check size={14} />
                        Aceitar
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDecision(request.id, 'decline')}
                        disabled={processingId === request.id}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 disabled:opacity-60"
                      >
                        <X size={14} />
                        Recusar
                      </button>
                    </div>
                  </div>
                );
              })}
              {pendingPosts.map((post) => {
                const authorName = post.author.name || 'Usuario da comunidade';

                return (
                  <div key={post.id} className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <div className="flex items-center gap-3">
                      {post.author.image ? (
                        <img src={post.author.image} alt={authorName} className="h-11 w-11 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-bold text-amber-700">
                          {getInitials(authorName)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">Post aguardando aprovacao</p>
                        <p className="truncate text-xs text-slate-500">{authorName} em {post.locationLabel}</p>
                      </div>
                    </div>
                    <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-700">{post.content}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => void handlePostDecision(post.id, 'approve')}
                        disabled={processingId === post.id}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#0D6EFD] px-3 text-xs font-bold text-white disabled:opacity-60"
                      >
                        <Check size={14} />
                        Aprovar
                      </button>
                      <button
                        type="button"
                        onClick={() => void handlePostDecision(post.id, 'remove')}
                        disabled={processingId === post.id}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-white px-3 text-xs font-bold text-slate-600 disabled:opacity-60"
                      >
                        <X size={14} />
                        Recusar
                      </button>
                    </div>
                  </div>
                );
              })}
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default FriendRequestBell;

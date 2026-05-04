import React, { startTransition, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Copy, ExternalLink, Share2, UserPlus } from 'lucide-react';
import CommunityComposer from '@/components/community/CommunityComposer';
import FeedPostCard from '@/components/community/FeedPostCard';
import type { ComposerMode } from '@/components/community/utils';
import { isYoutubeUrl } from '@/components/community/utils';
import { useToast } from '@/components/feedback/ToastProvider';
import { normalizeUrlFieldValue } from '@/lib/forms/validation';
import { trackAnalyticsEvent } from '@/lib/analytics';
import type { BannerAd, PersonaMode, Post, ProfessionalProfileIdentity, ReferralSummary, User } from '@/types';

const getPostTimestamp = (post: Post) => new Date(post.createdAt).getTime() || 0;

const Community: React.FC<{
  user: User;
  personaMode?: PersonaMode;
  professionalIdentity?: ProfessionalProfileIdentity | null;
}> = ({ user, personaMode = 'personal', professionalIdentity = null }) => {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const targetPostId = searchParams.get('post');
  const [composerMode, setComposerMode] = useState<ComposerMode>('text');
  const [postContent, setPostContent] = useState('');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [postExternalUrl, setPostExternalUrl] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [banners, setBanners] = useState<BannerAd[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [submittingBannerId, setSubmittingBannerId] = useState<string | null>(null);
  const [referralSummary, setReferralSummary] = useState<ReferralSummary>({
    referralUrl: null,
    registrationCount: 0,
  });
  const isProfessionalMode = personaMode === 'professional' && Boolean(professionalIdentity);
  const composerAvatar =
    isProfessionalMode && professionalIdentity?.imageUrl ? professionalIdentity.imageUrl : user.avatar;
  const composerHref =
    isProfessionalMode && professionalIdentity
      ? professionalIdentity.publicPath
      : user.username
        ? `/perfil/${encodeURIComponent(user.username)}`
        : undefined;
  const composerName = isProfessionalMode && professionalIdentity ? professionalIdentity.name : user.name;
  const activeRegionKey = isProfessionalMode
    ? professionalIdentity?.regionKey || user.regionKey || ''
    : user.regionKey || '';

  const loadPosts = async (options?: { silent?: boolean }) => {
    try {
      const query = activeRegionKey ? `?region=${encodeURIComponent(activeRegionKey)}` : '';
      const response = await fetch(`/api/community/posts${query}`, { cache: 'no-store' });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Nao foi possivel carregar a comunidade.');
      }

      startTransition(() => {
        setPosts(payload.posts ?? []);
      });
    } catch (error) {
      console.error('Failed to load community feed:', error);

      if (!options?.silent) {
        showToast('Nao foi possivel carregar a comunidade.', 'error');
      }
    }
  };

  useEffect(() => {
    void loadPosts({ silent: true });
  }, [activeRegionKey, user.username]);

  useEffect(() => {
    if (!targetPostId || posts.length === 0) {
      return;
    }

    window.requestAnimationFrame(() => {
      document.getElementById(`post-${targetPostId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
  }, [posts.length, targetPostId]);

  useEffect(() => {
    let ignore = false;

    const loadFeedBanners = async () => {
      try {
        const response = await fetch('/api/banners?placement=feed', { cache: 'no-store' });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error ?? 'Nao foi possivel carregar banners do feed.');
        }

        if (!ignore) {
          setBanners(Array.isArray(payload?.banners) ? payload.banners : []);
        }
      } catch (error) {
        console.error('Failed to load community banners:', error);

        if (!ignore) {
          setBanners([]);
        }
      }
    };

    void loadFeedBanners();

    return () => {
      ignore = true;
    };
  }, [user.regionKey]);

  useEffect(() => {
    let ignore = false;

    const loadReferralSummary = async () => {
      try {
        const response = await fetch('/api/referrals/summary', { cache: 'no-store' });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error ?? 'Nao foi possivel carregar seu link de indicacao.');
        }

        if (!ignore) {
          setReferralSummary({
            referralUrl: payload?.referralUrl ?? null,
            registrationCount: Number(payload?.registrationCount ?? 0),
          });
        }
      } catch (error) {
        console.error('Failed to load referral summary:', error);

        if (!ignore) {
          setReferralSummary({
            referralUrl: null,
            registrationCount: 0,
          });
        }
      }
    };

    void loadReferralSummary();

    return () => {
      ignore = true;
    };
  }, []);

  const resetComposer = () => {
    setComposerMode('text');
    setPostContent('');
    setPostImageUrl('');
    setPostExternalUrl('');
  };

  const handleComposerModeChange = (mode: ComposerMode) => {
    setComposerMode(mode);

    if (mode === 'photo' || mode === 'text') {
      setPostExternalUrl('');
    }

    if (mode === 'link' || mode === 'video' || mode === 'text') {
      setPostImageUrl('');
    }
  };

  const handleCopyReferralLink = async () => {
    if (!referralSummary.referralUrl) {
      showToast('Seu link de indicacao ainda nao esta disponivel.', 'error');
      return;
    }

    try {
      await navigator.clipboard.writeText(referralSummary.referralUrl);
      showToast('Link de indicacao copiado.', 'success');
    } catch {
      showToast(referralSummary.referralUrl, 'info', 5000);
    }
  };

  const handleShareReferralLink = async () => {
    if (!referralSummary.referralUrl) {
      showToast('Seu link de indicacao ainda nao esta disponivel.', 'error');
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Emigrei',
          text: 'Entre para a comunidade brasileira no exterior pela Emigrei.',
          url: referralSummary.referralUrl,
        });
        return;
      } catch {
        // fallback below
      }
    }

    await handleCopyReferralLink();
  };

  const handlePublish = async () => {
    const normalizedImageUrl = normalizeUrlFieldValue(postImageUrl);
    const normalizedExternalUrl = normalizeUrlFieldValue(postExternalUrl);

    if (composerMode === 'photo' && !normalizedImageUrl) {
      showToast('Adicione uma imagem para publicar uma foto.', 'error');
      return;
    }

    if (composerMode === 'link') {
      if (!normalizedExternalUrl) {
        showToast('Informe o link externo da publicacao.', 'error');
        return;
      }

      if (!postContent.trim()) {
        showToast('Adicione uma descricao para o link.', 'error');
        return;
      }
    }

    if (composerMode === 'video') {
      if (!normalizedExternalUrl) {
        showToast('Informe o link do video.', 'error');
        return;
      }

      if (!isYoutubeUrl(normalizedExternalUrl)) {
        showToast('Por enquanto, o video externo precisa ser um link do YouTube.', 'error');
        return;
      }
    }

    if (!postContent.trim() && !normalizedImageUrl && !normalizedExternalUrl) {
      showToast('Escreva algo antes de publicar.', 'error');
      return;
    }

    setPublishing(true);

    try {
      const content =
        postContent.trim() ||
        (composerMode === 'photo'
          ? 'Compartilhando uma imagem com a comunidade.'
          : composerMode === 'video'
            ? 'Compartilhando um video com a comunidade.'
            : 'Compartilhando algo com a comunidade.');

      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          imageUrl: normalizedImageUrl,
          externalUrl: normalizedExternalUrl,
          personaMode: isProfessionalMode ? 'professional' : 'personal',
          businessId: isProfessionalMode ? professionalIdentity?.id : undefined,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        showToast(payload?.error ?? 'Nao foi possivel publicar agora.', 'error');
        return;
      }

      showToast(payload?.message ?? 'Post publicado.', 'success');

      if (payload?.post?.status === 'PUBLISHED') {
        setPosts((current) => [payload.post, ...current]);
      } else {
        await loadPosts({ silent: true });
      }

      resetComposer();
    } catch (error) {
      console.error('Failed to publish post:', error);
      showToast('Nao foi possivel publicar agora.', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/community/posts/${postId}/reactions`, { method: 'POST' });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Nao foi possivel curtir o post.');
      }

      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? {
                ...post,
                viewerHasLiked: payload.liked,
                likeCount:
                  typeof payload?.likeCount === 'number'
                    ? payload.likeCount
                    : payload.liked
                      ? post.likeCount + 1
                      : Math.max(post.likeCount - 1, 0),
                likedBy: Array.isArray(payload?.likedBy) ? payload.likedBy : post.likedBy,
              }
            : post,
        ),
      );
    } catch (error) {
      console.error('Failed to toggle like:', error);
      showToast('Nao foi possivel curtir esse post agora.', 'error');
    }
  };

  const handleAddComment = async (postId: string, content: string) => {
    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Nao foi possivel comentar.');
      }

      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? {
                ...post,
                commentCount: post.commentCount + 1,
                comments: [...post.comments, payload.comment].slice(-3),
              }
            : post,
        ),
      );
    } catch (error) {
      showToast('Nao foi possivel comentar agora.', 'error');
      throw error;
    }
  };

  const handleUpdatePost = async (
    postId: string,
    content: string,
    imageUrl: string,
    externalUrl: string,
  ) => {
    try {
      const response = await fetch(`/api/community/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          imageUrl: normalizeUrlFieldValue(imageUrl),
          externalUrl: normalizeUrlFieldValue(externalUrl),
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Nao foi possivel atualizar a publicacao.');
      }

      showToast(payload?.message ?? 'Publicacao atualizada.', 'success');
      await loadPosts({ silent: true });
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Nao foi possivel atualizar a publicacao.',
        'error',
      );
      throw error;
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/community/posts/${postId}`, { method: 'DELETE' });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Nao foi possivel remover a publicacao.');
      }

      showToast(payload?.message ?? 'Publicacao removida.', 'success');
      setPosts((current) => current.filter((post) => post.id !== postId));
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Nao foi possivel remover a publicacao.',
        'error',
      );
      throw error;
    }
  };

  const handleUpdateComment = async (postId: string, commentId: string, content: string) => {
    try {
      const response = await fetch(`/api/community/posts/${postId}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Nao foi possivel atualizar o comentario.');
      }

      showToast(payload?.message ?? 'Comentario atualizado.', 'success');
      await loadPosts({ silent: true });
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Nao foi possivel atualizar o comentario.',
        'error',
      );
      throw error;
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      const response = await fetch(`/api/community/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Nao foi possivel remover o comentario.');
      }

      showToast(payload?.message ?? 'Comentario removido.', 'success');
      await loadPosts({ silent: true });
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Nao foi possivel remover o comentario.',
        'error',
      );
      throw error;
    }
  };

  const handleSharePost = async (post: Post) => {
    const postPath = `/community?post=${post.id}`;
    const postUrl =
      typeof window === 'undefined'
        ? postPath
        : `${window.location.origin}${postPath}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Publicacao na Emigrei',
          text: post.content,
          url: postUrl,
        });
        return;
      } catch {
        // fallback below
      }
    }

    try {
      await navigator.clipboard.writeText(postUrl);
      showToast('Link da publicacao copiado.', 'success');
    } catch {
      showToast(postUrl, 'info', 5000);
    }
  };

  const handleBannerLinkClick = (banner: BannerAd) => {
    if (!banner.targetUrl) {
      showToast('Esse banner ainda nao tem um link configurado.', 'error');
      return;
    }

    trackAnalyticsEvent({
      type: 'banner_click',
      targetType: 'banner',
      targetKey: banner.id,
      label: banner.name,
      sourcePath: '/community',
      sourceSection: 'community_feed_banner',
      regionKey: user.regionKey,
    });

    window.open(banner.targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleBannerRegistration = async (banner: BannerAd) => {
    setSubmittingBannerId(banner.id);

    try {
      const response = await fetch(`/api/banners/${banner.id}/registration`, {
        method: 'POST',
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Nao foi possivel registrar seu interesse.');
      }

      showToast(payload?.message ?? 'Cadastro registrado.', 'success');
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Nao foi possivel registrar seu interesse.',
        'error',
      );
    } finally {
      setSubmittingBannerId(null);
    }
  };

  const displayedPosts = [...posts].sort(
    (left, right) => getPostTimestamp(right) - getPostTimestamp(left),
  );
  const feedBanners = banners.slice(0, 2);
  const getBannerAfterPost = (postIndex: number) => {
    if (displayedPosts.length < 5) {
      return null;
    }

    if (postIndex === 4) {
      return feedBanners[0] ?? null;
    }

    if (postIndex === 12) {
      return feedBanners[1] ?? null;
    }

    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="mt-4 px-5">
        <h1 className="mb-4 text-2xl font-bold text-cyan-900">Comunidade</h1>
        <div className="mb-4 flex items-center border-b border-slate-100">
          <span className="border-b-2 border-cyan-700 pb-2 text-sm font-bold text-cyan-900">
           {/*  Recentes */}
          </span>
        </div>
      </div>

      <div className="px-5">
        <CommunityComposer.Root>
          <CommunityComposer.Editor
            avatar={composerAvatar}
            avatarHref={composerHref}
            value={postContent}
            onChange={setPostContent}
            placeholder={
              composerMode === 'link'
                ? 'Adicione uma descricao para o link...'
                : composerMode === 'video'
                  ? 'Adicione um contexto para o video...'
                  : isProfessionalMode
                    ? `Publique como ${composerName}...`
                    : 'No que voce esta pensando?'
            }
          />
          {isProfessionalMode ? (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] font-bold text-blue-700">
              Publicando como pagina profissional: {composerName}
            </div>
          ) : null}
          <CommunityComposer.MediaField
            mode={composerMode}
            imageUrl={postImageUrl}
            externalUrl={postExternalUrl}
            onImageChange={setPostImageUrl}
            onExternalChange={setPostExternalUrl}
          />
          <CommunityComposer.Actions
            mode={composerMode}
            onModeChange={handleComposerModeChange}
            onPublish={handlePublish}
            publishing={publishing}
          />
        </CommunityComposer.Root>
      </div>

      <div className="px-5">
        <div className="theme-gradient theme-shadow group relative overflow-hidden rounded-3xl p-4 text-white shadow-lg">
          <div className="relative z-10 flex items-center justify-between">
            <div className="max-w-[72%]">
              <div className="mb-1 flex items-center gap-2">
                <UserPlus size={16} className="text-white/90" />
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                  Indique a Emigrei
                </span>
              </div>
              <h4 className="mb-2 text-sm font-bold">
                Compartilhe seu link unico e acompanhe quantos cadastros vieram dele.
              </h4>
              <p className="text-[11px] font-medium text-white/80">
                {referralSummary.registrationCount}
                {' '}
                {referralSummary.registrationCount === 1
                  ? 'cadastro confirmado pelo seu link'
                  : 'cadastros confirmados pelo seu link'}
              </p>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
              <Share2 size={30} />
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-white/12 p-3">
            <p className="truncate text-xs font-semibold text-white/90">
              {referralSummary.referralUrl ?? `https://emigrei.com.br/convite/${user.username}`}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => void handleCopyReferralLink()}
                className="rounded-full bg-white px-4 py-2 text-[11px] font-bold text-cyan-700 transition-colors hover:bg-slate-100"
              >
                <span className="inline-flex items-center gap-2">
                  <Copy size={14} />
                  Copiar link
                </span>
              </button>
              <button
                type="button"
                onClick={() => void handleShareReferralLink()}
                className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-[11px] font-bold text-white transition-colors hover:bg-white/20"
              >
                <span className="inline-flex items-center gap-2">
                  <Share2 size={14} />
                  Compartilhar
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-5 pb-20">
        {displayedPosts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center text-sm font-medium text-slate-500">
            Ninguem publicou por aqui ainda. Seja o primeiro da sua regiao.
          </div>
        ) : null}
        {displayedPosts.map((post, index) => {
          const banner = getBannerAfterPost(index);

          return (
            <React.Fragment key={post.id}>
              <div id={`post-${post.id}`} className={targetPostId === post.id ? 'scroll-mt-24 rounded-3xl ring-2 ring-cyan-200' : 'scroll-mt-24'}>
                <FeedPostCard
                  post={post}
                  onToggleLike={() => handleToggleLike(post.id)}
                  onAddComment={(content) => handleAddComment(post.id, content)}
                  onUpdatePost={(content, imageUrl, externalUrl) =>
                    handleUpdatePost(post.id, content, imageUrl, externalUrl)
                  }
                  onDeletePost={() => handleDeletePost(post.id)}
                  onUpdateComment={(commentId, content) =>
                    handleUpdateComment(post.id, commentId, content)
                  }
                  onDeleteComment={(commentId) => handleDeleteComment(post.id, commentId)}
                  onSharePost={() => handleSharePost(post)}
                />
              </div>
              {banner ? (
                <FeedBannerCard
                  banner={banner}
                  submitting={submittingBannerId === banner.id}
                  onOpen={() => handleBannerLinkClick(banner)}
                  onRegister={() => void handleBannerRegistration(banner)}
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

const FeedBannerCard: React.FC<{
  banner: BannerAd;
  submitting: boolean;
  onOpen: () => void;
  onRegister: () => void;
}> = ({ banner, submitting, onOpen, onRegister }) => (
  <div className="relative overflow-hidden rounded-[32px] bg-slate-950 shadow-lg">
    <img src={banner.imageUrl} alt={banner.name} className="h-[220px] w-full object-cover opacity-90" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
    <div className="absolute left-5 right-5 top-5 flex items-center justify-between gap-3">
      <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur">
        Divulgacao
      </span>
      <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur">
        {banner.regionLabel || 'Global'}
      </span>
    </div>
    <div className="absolute bottom-5 left-5 right-5">
      <h3 className="max-w-[85%] text-2xl font-bold leading-tight text-white drop-shadow">
        {banner.name}
      </h3>
      {banner.type === 'REGISTRATION' ? (
        <button
          type="button"
          onClick={onRegister}
          disabled={submitting}
          className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#FF8C00] px-5 text-sm font-bold text-white shadow-xl transition hover:bg-[#E07B00] disabled:opacity-70"
        >
          <UserPlus size={18} strokeWidth={2.8} />
          {submitting ? 'Registrando...' : 'Tenho interesse'}
        </button>
      ) : (
        <button
          type="button"
          onClick={onOpen}
          className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#FF8C00] px-5 text-sm font-bold text-white shadow-xl transition hover:bg-[#E07B00]"
        >
          <ExternalLink size={18} strokeWidth={2.8} />
          Abrir link
        </button>
      )}
    </div>
  </div>
);

export default Community;

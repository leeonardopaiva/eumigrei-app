import React, { startTransition, useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import CommunityComposer from '@/components/community/CommunityComposer';
import FeedPostCard from '@/components/community/FeedPostCard';
import type { ComposerMode } from '@/components/community/utils';
import { isYoutubeUrl } from '@/components/community/utils';
import { useToast } from '@/components/feedback/ToastProvider';
import { normalizeUrlFieldValue } from '@/lib/forms/validation';
import { getImmigrationHelp } from '@/services/geminiService';
import type { Post, User } from '@/types';

const Community: React.FC<{ user: User }> = ({ user }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('Destaques');
  const [composerMode, setComposerMode] = useState<ComposerMode>('text');
  const [postContent, setPostContent] = useState('');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [postExternalUrl, setPostExternalUrl] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const loadPosts = async (options?: { silent?: boolean }) => {
    try {
      const response = await fetch('/api/community/posts', { cache: 'no-store' });
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

  const handleAskAi = async () => {
    setAiLoading(true);
    const result = await getImmigrationHelp(
      'Quais os documentos para renovar passaporte brasileiro?',
    );
    setAiResponse(result);
    setAiLoading(false);
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
                likeCount: payload.liked ? post.likeCount + 1 : Math.max(post.likeCount - 1, 0),
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="mt-4 px-5">
        <h1 className="mb-4 text-2xl font-bold text-cyan-900">Comunidade</h1>
        <div className="mb-4 flex items-center gap-4 overflow-x-auto whitespace-nowrap border-b border-slate-100 scrollbar-hide">
          {['Destaques', 'Recente', 'Populares'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 text-sm font-bold transition-all ${
                activeTab === tab ? 'border-b-2 border-cyan-700 text-cyan-900' : 'text-slate-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <CategoryPill label="Ajuda" />
          <CategoryPill label="Dicas" />
        </div>
      </div>

      <div className="px-5">
        <CommunityComposer.Root>
          <CommunityComposer.Editor
            avatar={user.avatar}
            value={postContent}
            onChange={setPostContent}
            placeholder={
              composerMode === 'link'
                ? 'Adicione uma descricao para o link...'
                : composerMode === 'video'
                  ? 'Adicione um contexto para o video...'
                  : 'No que voce esta pensando?'
            }
          />
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
        <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#28B8C7] to-[#1E96A4] p-4 text-white shadow-lg">
          <div className="relative z-10 flex items-center justify-between">
            <div className="max-w-[70%]">
              <div className="mb-1 flex items-center gap-2">
                <Sparkles size={16} className="animate-pulse text-yellow-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                  Emigrei AI
                </span>
              </div>
              <h4 className="mb-2 text-sm font-bold">
                Duvidas sobre passaporte ou visto? Pergunte agora!
              </h4>
              <button
                onClick={handleAskAi}
                disabled={aiLoading}
                className="rounded-full bg-white px-4 py-1.5 text-[10px] font-bold text-cyan-600 transition-colors hover:bg-slate-100"
              >
                {aiLoading ? 'Consultando...' : 'Pedir Ajuda IA'}
              </button>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
              <Sparkles size={32} />
            </div>
          </div>
          {aiResponse ? (
            <div className="mt-4 animate-in rounded-xl bg-white/10 p-3 text-xs leading-relaxed slide-in-from-top-2 duration-300">
              {aiResponse}
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 px-5 pb-20">
        {posts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center text-sm font-medium text-slate-500">
            Ninguem publicou por aqui ainda. Seja o primeiro da sua regiao.
          </div>
        ) : null}
        {posts.map((post) => (
          <FeedPostCard
            key={post.id}
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
          />
        ))}
      </div>
    </div>
  );
};

const CategoryPill: React.FC<{ label: string }> = ({ label }) => (
  <button className="whitespace-nowrap rounded-2xl border border-slate-50 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
    {label}
  </button>
);

export default Community;

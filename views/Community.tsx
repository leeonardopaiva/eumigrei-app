import React, { startTransition, useEffect, useState } from 'react';
import {
  Camera,
  Play,
  Link as LinkIcon,
  MoreHorizontal,
  ThumbsUp,
  MessageSquare,
  Share2,
  Sparkles,
} from 'lucide-react';
import { useToast } from '../components/feedback/ToastProvider';
import CloudinaryImageField from '../components/forms/CloudinaryImageField';
import { Post, User } from '../types';
import { normalizeUrlFieldValue } from '../lib/forms/validation';
import { getImmigrationHelp } from '../services/geminiService';

const Community: React.FC<{ user: User }> = ({ user }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('Destaques');
  const [postContent, setPostContent] = useState('');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [showImageComposer, setShowImageComposer] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    const fetchPosts = async () => {
      try {
        const response = await fetch('/api/community/posts');
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error ?? 'Nao foi possivel carregar a comunidade.');
        }

        if (!ignore) {
          startTransition(() => {
            setPosts(payload.posts ?? []);
          });
        }
      } catch (error) {
        console.error('Failed to load community feed:', error);
      }
    };

    fetchPosts();

    return () => {
      ignore = true;
    };
  }, []);

  const handleAskAi = async () => {
    setAiLoading(true);
    const result = await getImmigrationHelp(
      'Quais os documentos para renovar passaporte brasileiro?',
    );
    setAiResponse(result);
    setAiLoading(false);
  };

  const handlePublish = async () => {
    if (!postContent.trim() && !postImageUrl.trim()) {
      showToast('Escreva algo antes de publicar.', 'error');
      return;
    }

    setPublishing(true);

    try {
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: postContent.trim() || 'Compartilhando uma imagem com a comunidade.',
          imageUrl: normalizeUrlFieldValue(postImageUrl),
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        showToast(payload?.error ?? 'Nao foi possivel publicar agora.', 'error');
        return;
      }

      showToast(payload?.message ?? 'Post publicado.', 'success');
      setPostContent('');
      setPostImageUrl('');
      setShowImageComposer(false);

      if (payload?.post?.status === 'PUBLISHED') {
        setPosts((current) => [payload.post, ...current]);
      }
    } catch (error) {
      console.error('Failed to publish post:', error);
      showToast('Nao foi possivel publicar agora.', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/community/posts/${postId}/reactions`, {
        method: 'POST',
      });
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
    }
  };

  const handleAddComment = async (postId: string, content: string) => {
    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      console.error('Failed to add comment:', error);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="px-5 mt-4">
        <h1 className="text-2xl font-bold text-blue-900 mb-4">Comunidade</h1>
        <div className="flex items-center gap-4 border-b border-slate-100 mb-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
          {['Destaques', 'Recente', 'Populares'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 text-sm font-bold transition-all ${
                activeTab === tab ? 'text-blue-900 border-b-2 border-blue-900' : 'text-slate-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <CategoryPill icon="👋" label="Ajuda" />
          <CategoryPill icon="💡" label="Dicas" />
          <CategoryPill icon="🛒" label="Mercado" />
          <CategoryPill icon="🏠" label="Moradia" />
        </div>
      </div>

      <div className="px-5">
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-50 space-y-4">
          <div className="flex items-center gap-3">
            <img src={user.avatar} className="w-10 h-10 rounded-full object-cover" alt="User" />
            <input
              type="text"
              value={postContent}
              onChange={(event) => setPostContent(event.target.value)}
              placeholder="No que voce esta pensando?"
              className="flex-1 bg-slate-50 border-none rounded-2xl py-2 px-4 text-sm focus:ring-0"
            />
          </div>
          {showImageComposer ? (
            <CloudinaryImageField
              value={postImageUrl}
              onChange={setPostImageUrl}
              folder="community"
              placeholder="Link da imagem do post"
              hint="Envie uma imagem pela Cloudinary ou cole uma URL publica."
            />
          ) : null}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setShowImageComposer((current) => !current)}
                className="flex items-center gap-1 text-green-500 text-xs font-bold"
              >
                <Camera size={16} /> Foto
              </button>
              <button className="flex items-center gap-1 text-blue-500 text-xs font-bold">
                <Play size={16} /> Video
              </button>
              <button className="flex items-center gap-1 text-blue-400 text-xs font-bold">
                <LinkIcon size={16} /> Link
              </button>
            </div>
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="bg-blue-900 text-white px-6 py-2 rounded-2xl text-xs font-bold shadow-md hover:bg-blue-800 transition-colors disabled:opacity-60"
            >
              {publishing ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </div>
      </div>

      <div className="px-5">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-4 shadow-lg text-white relative overflow-hidden group">
          <div className="relative z-10 flex items-center justify-between">
            <div className="max-w-[70%]">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={16} className="text-yellow-400 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Eumigrei AI</span>
              </div>
              <h4 className="font-bold text-sm mb-2">Duvidas sobre passaporte ou visto? Pergunte agora!</h4>
              <button
                onClick={handleAskAi}
                disabled={aiLoading}
                className="bg-white text-blue-600 px-4 py-1.5 rounded-full text-[10px] font-bold hover:bg-slate-100 transition-colors"
              >
                {aiLoading ? 'Consultando...' : 'Pedir Ajuda IA'}
              </button>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center">
              <Sparkles size={32} />
            </div>
          </div>
          {aiResponse ? (
            <div className="mt-4 p-3 bg-white/10 rounded-xl text-xs leading-relaxed animate-in slide-in-from-top-2 duration-300">
              {aiResponse}
            </div>
          ) : null}
        </div>
      </div>

      <div className="px-5 space-y-4 pb-20">
        {posts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center text-sm font-medium text-slate-500">
            Ninguem publicou por aqui ainda. Seja o primeiro da sua regiao.
          </div>
        ) : null}
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onToggleLike={() => handleToggleLike(post.id)}
            onAddComment={(content) => handleAddComment(post.id, content)}
          />
        ))}
      </div>
    </div>
  );
};

const CategoryPill: React.FC<{ icon: string; label: string }> = ({ icon, label }) => (
  <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap">
    <span>{icon}</span>
    {label}
  </button>
);

const formatRelativeTime = (value: string) => {
  const date = new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.round((Date.now() - date) / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} min atras`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} h atras`;
  }

  return `${Math.round(diffHours / 24)} d atras`;
};

const PostCard: React.FC<{
  post: Post;
  onToggleLike: () => void;
  onAddComment: (content: string) => Promise<void>;
}> = ({ post, onToggleLike, onAddComment }) => {
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) {
      return;
    }

    setSubmittingComment(true);
    await onAddComment(commentText);
    setCommentText('');
    setSubmittingComment(false);
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-50 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={post.author.image || `https://picsum.photos/seed/${post.author.id}/100`}
            className="w-10 h-10 rounded-full object-cover"
            alt={post.author.name}
          />
          <div>
            <h5 className="font-bold text-blue-900 text-sm">{post.author.name}</h5>
            <p className="text-[10px] text-slate-400">
              {formatRelativeTime(post.createdAt)} • {post.locationLabel}
            </p>
          </div>
        </div>
        <button className="text-slate-400">
          <MoreHorizontal size={20} />
        </button>
      </div>
      <p className="text-slate-700 text-sm leading-relaxed">{post.content}</p>
      {post.imageUrl ? (
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-slate-50">
          <img src={post.imageUrl} className="max-h-[420px] w-full object-cover" alt="Imagem da publicacao" />
        </div>
      ) : null}
      <div className="pt-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleLike}
            className={`flex items-center gap-1.5 font-bold text-xs ${
              post.viewerHasLiked ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <ThumbsUp size={16} /> {post.likeCount}
          </button>
          <button className="flex items-center gap-1.5 text-slate-400 font-bold text-xs">
            <MessageSquare size={16} /> {post.commentCount}
          </button>
        </div>
        <button className="text-slate-400">
          <Share2 size={16} />
        </button>
      </div>

      {post.comments.map((comment) => (
        <div key={comment.id} className="bg-slate-50 rounded-2xl p-3 flex gap-3">
          <img
            src={comment.author.image || `https://picsum.photos/seed/${comment.author.id}/100`}
            className="w-8 h-8 rounded-full object-cover"
            alt={comment.author.name}
          />
          <div>
            <h6 className="font-bold text-blue-900 text-xs mb-1">{comment.author.name}</h6>
            <p className="text-[11px] text-slate-600 leading-tight">{comment.content}</p>
          </div>
        </div>
      ))}

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={commentText}
          onChange={(event) => setCommentText(event.target.value)}
          placeholder="Escreva um comentario..."
          className="flex-1 rounded-2xl bg-slate-50 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
        />
        <button
          type="button"
          onClick={handleCommentSubmit}
          disabled={submittingComment}
          className="rounded-2xl bg-blue-900 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
        >
          {submittingComment ? '...' : 'Responder'}
        </button>
      </div>
    </div>
  );
};

export default Community;

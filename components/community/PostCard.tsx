import React from 'react';
import Link from 'next/link';
import {
  Link as LinkIcon,
  MessageSquare,
  MoreHorizontal,
  Share2,
  ThumbsUp,
} from 'lucide-react';
import CloudinaryImageField from '@/components/forms/CloudinaryImageField';
import {
  buildYoutubeEmbedUrl,
  formatRelativeTime,
  getExternalHostname,
} from '@/components/community/utils';

type RootProps = {
  children: React.ReactNode;
  className?: string;
};

type HeaderProps = {
  authorImage: string;
  authorName: string;
  authorHref?: string;
  createdAt: string;
  locationLabel: string;
  menu?: React.ReactNode;
};

type MenuProps = {
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

type BodyProps = {
  postId: string;
  content: string;
  imageUrl?: string | null;
  externalUrl?: string | null;
};

type EditorProps = {
  content: string;
  imageUrl: string;
  externalUrl: string;
  onContentChange: (value: string) => void;
  onImageChange: (value: string) => void;
  onExternalChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
};

type ActionsProps = {
  liked: boolean;
  likeCount: number;
  commentCount: number;
  onToggleLike: () => void;
  onToggleComments?: () => void;
  commentsExpanded?: boolean;
  onOpenLikes?: () => void;
  onLikesHoverStart?: () => void;
  onLikesHoverEnd?: () => void;
  likesPreview?: React.ReactNode;
  onShare?: () => void;
};

type CommentItemProps = {
  authorImage: string;
  authorName: string;
  authorHref?: string;
  content: React.ReactNode;
  menu?: React.ReactNode;
  footer?: React.ReactNode;
};

type CommentComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
};

const Root: React.FC<RootProps> = ({ children, className = '' }) => (
  <div className={`space-y-4 rounded-3xl border border-slate-50 bg-white p-5 shadow-sm ${className}`.trim()}>
    {children}
  </div>
);

const Header: React.FC<HeaderProps> = ({
  authorImage,
  authorName,
  authorHref,
  createdAt,
  locationLabel,
  menu,
}) => (
  <div className="flex items-center justify-between">
    {authorHref ? (
      <Link href={authorHref} className="flex items-center gap-3 transition hover:opacity-90">
        <img src={authorImage} className="h-10 w-10 rounded-full object-cover" alt={authorName} />
        <div>
          <h5 className="text-sm font-bold text-cyan-900">{authorName}</h5>
          <p className="text-[10px] text-slate-400">
            {formatRelativeTime(createdAt)} | {locationLabel}
          </p>
        </div>
      </Link>
    ) : (
      <div className="flex items-center gap-3">
        <img src={authorImage} className="h-10 w-10 rounded-full object-cover" alt={authorName} />
        <div>
          <h5 className="text-sm font-bold text-cyan-900">{authorName}</h5>
          <p className="text-[10px] text-slate-400">
            {formatRelativeTime(createdAt)} | {locationLabel}
          </p>
        </div>
      </div>
    )}
    {menu}
  </div>
);

const Menu: React.FC<MenuProps> = ({ open, onToggle, children }) => (
  <div className="relative">
    <button
      type="button"
      onClick={onToggle}
      className="rounded-full p-2 text-slate-400 transition hover:bg-slate-50"
    >
      <MoreHorizontal size={20} />
    </button>
    {open ? (
      <div className="absolute right-0 top-10 z-10 min-w-[160px] rounded-2xl border border-slate-100 bg-white p-2 shadow-xl">
        {children}
      </div>
    ) : null}
  </div>
);

const MenuItem: React.FC<{
  tone?: 'default' | 'danger';
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ tone = 'default', disabled = false, onClick, children }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={`block w-full rounded-xl px-3 py-2 text-left text-xs font-bold disabled:opacity-60 ${
      tone === 'danger' ? 'text-red-700 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50'
    }`}
  >
    {children}
  </button>
);

const Body: React.FC<BodyProps> = ({ postId, content, imageUrl, externalUrl }) => {
  const youtubeEmbedUrl = buildYoutubeEmbedUrl(externalUrl);
  const externalHostname = getExternalHostname(externalUrl);

  return (
    <>
      <p className="text-sm leading-relaxed text-slate-700">{content}</p>

      {youtubeEmbedUrl ? (
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-slate-950">
          <iframe
            src={youtubeEmbedUrl}
            title={`Video externo ${postId}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="aspect-video w-full"
          />
        </div>
      ) : null}

      {externalUrl && !youtubeEmbedUrl ? (
        <a
          href={externalUrl}
          target="_blank"
          rel="noreferrer"
          className="block rounded-3xl border border-slate-100 bg-slate-50 p-4 transition hover:bg-slate-100"
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            <LinkIcon size={14} />
            Link externo
          </div>
          <p className="mt-2 break-all text-sm font-bold text-[#28B8C7]">{externalUrl}</p>
          {externalHostname ? (
            <p className="mt-1 text-xs font-medium text-slate-500">{externalHostname}</p>
          ) : null}
        </a>
      ) : null}

      {imageUrl ? (
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-slate-50">
          <img
            src={imageUrl}
            className="max-h-[420px] w-full object-cover"
            alt="Imagem da publicacao"
          />
        </div>
      ) : null}
    </>
  );
};

const Editor: React.FC<EditorProps> = ({
  content,
  imageUrl,
  externalUrl,
  onContentChange,
  onImageChange,
  onExternalChange,
  onSave,
  onCancel,
  saving,
}) => (
  <div className="space-y-3 rounded-3xl border border-cyan-100 bg-cyan-50/50 p-4">
    <textarea
      rows={4}
      value={content}
      onChange={(event) => onContentChange(event.target.value)}
      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-200"
    />
    <CloudinaryImageField
      value={imageUrl}
      onChange={onImageChange}
      folder="community"
      placeholder="Link da imagem do post"
      hint="Atualize a imagem da publicacao quando precisar."
    />
    <input
      type="url"
      value={externalUrl}
      onChange={(event) => onExternalChange(event.target.value)}
      placeholder="Link externo ou YouTube"
      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-200"
    />
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="flex-1 rounded-2xl bg-cyan-600 px-4 py-3 text-xs font-bold text-white disabled:opacity-60"
      >
        {saving ? 'Salvando...' : 'Salvar publicacao'}
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-600 disabled:opacity-60"
      >
        Cancelar
      </button>
    </div>
  </div>
);

const Actions: React.FC<ActionsProps> = ({
  liked,
  likeCount,
  commentCount,
  onToggleLike,
  onToggleComments,
  commentsExpanded = false,
  onOpenLikes,
  onLikesHoverStart,
  onLikesHoverEnd,
  likesPreview,
  onShare,
}) => (
  <div className="flex items-center justify-between pt-2">
    <div className="flex items-center gap-4">
      <div
        className="relative flex items-center gap-1.5"
        onMouseEnter={onLikesHoverStart}
        onMouseLeave={onLikesHoverEnd}
      >
        <button
          type="button"
          onClick={onToggleLike}
          className={`flex items-center gap-1.5 text-xs font-bold ${
            liked ? 'text-cyan-600' : 'text-slate-500'
          }`}
        >
          <ThumbsUp size={16} />
        </button>
        <button
          type="button"
          onClick={onOpenLikes}
          disabled={likeCount === 0}
          className={`text-xs font-bold ${
            likeCount > 0 ? 'text-slate-500 hover:text-cyan-600' : 'text-slate-300'
          } disabled:cursor-default`}
        >
          {likeCount}
        </button>
        {likesPreview}
      </div>
      <button
        type="button"
        onClick={onToggleComments}
        disabled={commentCount === 0 || !onToggleComments}
        className={`flex items-center gap-1.5 text-xs font-bold ${
          commentCount > 0 && onToggleComments
            ? commentsExpanded
              ? 'text-cyan-600'
              : 'text-slate-500 hover:text-cyan-600'
            : 'text-slate-300'
        } disabled:cursor-default`}
      >
        <MessageSquare size={16} /> {commentCount}
      </button>
    </div>
    <button type="button" onClick={onShare} className="text-slate-400 transition hover:text-cyan-600">
      <Share2 size={16} />
    </button>
  </div>
);

const CommentItem: React.FC<CommentItemProps> = ({
  authorImage,
  authorName,
  authorHref,
  content,
  menu,
  footer,
}) => (
  <div className="rounded-2xl bg-slate-50 p-3">
    <div className="flex gap-3">
      {authorHref ? (
        <Link href={authorHref} className="block transition hover:opacity-90">
          <img src={authorImage} className="h-8 w-8 rounded-full object-cover" alt={authorName} />
        </Link>
      ) : (
        <img src={authorImage} className="h-8 w-8 rounded-full object-cover" alt={authorName} />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            {authorHref ? (
              <Link href={authorHref} className="mb-1 block text-xs font-bold text-cyan-900 transition hover:opacity-90">
                {authorName}
              </Link>
            ) : (
              <h6 className="mb-1 text-xs font-bold text-cyan-900">{authorName}</h6>
            )}
            {content}
          </div>
          {menu}
        </div>
        {footer}
      </div>
    </div>
  </div>
);

const CommentComposer: React.FC<CommentComposerProps> = ({
  value,
  onChange,
  onSubmit,
  submitting,
}) => (
  <div className="flex items-center gap-2">
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Escreva um comentario..."
      className="flex-1 rounded-2xl bg-slate-50 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-100"
    />
    <button
      type="button"
      onClick={onSubmit}
      disabled={submitting}
      className="rounded-2xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
    >
      {submitting ? '...' : 'Responder'}
    </button>
  </div>
);

const PostCard = {
  Root,
  Header,
  Menu,
  MenuItem,
  Body,
  Editor,
  Actions,
  CommentItem,
  CommentComposer,
};

export default PostCard;

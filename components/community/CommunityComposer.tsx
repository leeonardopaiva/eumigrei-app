import React from 'react';
import { Camera, Link as LinkIcon, Play } from 'lucide-react';
import CloudinaryImageField from '@/components/forms/CloudinaryImageField';
import type { ComposerMode } from '@/components/community/utils';

type RootProps = {
  children: React.ReactNode;
};

type EditorProps = {
  avatar: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

type MediaFieldProps = {
  mode: ComposerMode;
  imageUrl: string;
  externalUrl: string;
  onImageChange: (value: string) => void;
  onExternalChange: (value: string) => void;
};

type ActionsProps = {
  mode: ComposerMode;
  onModeChange: (mode: ComposerMode) => void;
  onPublish: () => void;
  publishing: boolean;
};

type ModeButtonProps = {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
};

const Root: React.FC<RootProps> = ({ children }) => (
  <div className="space-y-4 rounded-3xl border border-slate-50 bg-white p-4 shadow-sm">
    {children}
  </div>
);

const Editor: React.FC<EditorProps> = ({ avatar, value, onChange, placeholder }) => (
  <div className="flex items-start gap-3">
    <img src={avatar} className="h-10 w-10 rounded-full object-cover" alt="User" />
    <textarea
      rows={3}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="min-h-[96px] flex-1 rounded-2xl border-none bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100"
    />
  </div>
);

const MediaField: React.FC<MediaFieldProps> = ({
  mode,
  imageUrl,
  externalUrl,
  onImageChange,
  onExternalChange,
}) => {
  if (mode === 'photo') {
    return (
      <CloudinaryImageField
        value={imageUrl}
        onChange={onImageChange}
        folder="community"
        placeholder="Link da imagem do post"
        hint="Envie uma imagem pela Cloudinary ou cole uma URL publica."
      />
    );
  }

  if (mode === 'link' || mode === 'video') {
    return (
      <input
        type="url"
        value={externalUrl}
        onChange={(event) => onExternalChange(event.target.value)}
        placeholder={mode === 'video' ? 'Cole o link do YouTube' : 'Cole o link externo'}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
      />
    );
  }

  return null;
};

const ModeButton: React.FC<ModeButtonProps> = ({ active, icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-1 text-xs font-bold ${
      active ? 'text-blue-700' : 'text-slate-500'
    }`}
  >
    {icon} {label}
  </button>
);

const Actions: React.FC<ActionsProps> = ({ mode, onModeChange, onPublish, publishing }) => (
  <div className="flex items-center justify-between pt-2">
    <div className="flex items-center gap-4">
      <ModeButton
        active={mode === 'photo'}
        icon={<Camera size={16} />}
        label="Foto"
        onClick={() => onModeChange(mode === 'photo' ? 'text' : 'photo')}
      />
      <ModeButton
        active={mode === 'video'}
        icon={<Play size={16} />}
        label="Video"
        onClick={() => onModeChange(mode === 'video' ? 'text' : 'video')}
      />
      <ModeButton
        active={mode === 'link'}
        icon={<LinkIcon size={16} />}
        label="Link"
        onClick={() => onModeChange(mode === 'link' ? 'text' : 'link')}
      />
    </div>
    <button
      onClick={onPublish}
      disabled={publishing}
      className="rounded-2xl bg-blue-900 px-6 py-2 text-xs font-bold text-white shadow-md transition-colors hover:bg-blue-800 disabled:opacity-60"
    >
      {publishing ? 'Publicando...' : 'Publicar'}
    </button>
  </div>
);

const CommunityComposer = {
  Root,
  Editor,
  MediaField,
  Actions,
};

export default CommunityComposer;

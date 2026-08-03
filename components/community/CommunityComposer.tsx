import React from 'react';
import Link from 'next/link';
import { BriefcaseBusiness, Camera, Link as LinkIcon, Play, UserRound } from 'lucide-react';
import CloudinaryImageField from '@/components/forms/CloudinaryImageField';
import type { ComposerMode } from '@/components/community/utils';
import { handleAvatarError } from '@/lib/avatar';
import type { PersonaMode } from '@/types';
import { Button } from '@/components/ui/Button';

type RootProps = {
  children: React.ReactNode;
};

type EditorProps = {
  avatar: string;
  avatarHref?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

type AuthorSwitchProps = {
  value: PersonaMode;
  onChange: (value: PersonaMode) => void;
  personalName: string;
  professionalName?: string | null;
  professionalDisabled?: boolean;
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
};

type ModeButtonProps = {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
};

const Root: React.FC<RootProps> = ({ children }) => (
  <div className="space-y-4 rounded-card bg-surface p-4">
    {children}
  </div>
);

const Editor: React.FC<EditorProps> = ({ avatar, avatarHref, value, onChange, placeholder }) => (
  <div className="flex items-start gap-3">
    {avatarHref ? (
      <Link href={avatarHref} className="transition hover:opacity-90">
        <img src={avatar} className="h-10 w-10 rounded-full object-cover" alt="User" onError={handleAvatarError} />
      </Link>
    ) : (
      <img src={avatar} className="h-10 w-10 rounded-full object-cover" alt="User" onError={handleAvatarError} />
    )}
    <textarea
      rows={3}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="min-h-[96px] flex-1 rounded-md border-none bg-bg px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand-200"
    />
  </div>
);

const AuthorSwitch: React.FC<AuthorSwitchProps> = ({
  value,
  onChange,
  personalName,
  professionalName,
  professionalDisabled = false,
}) => (
  <div className="flex rounded-full bg-bg p-1" role="tablist" aria-label="Perfil da publicação">
    <button
      type="button"
      onClick={() => onChange('personal')}
      role="tab"
      aria-selected={value === 'personal'}
      className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-bold transition ${
        value === 'personal' ? 'bg-brand-500 text-white' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      <UserRound size={15} />
      <span className="truncate">Como {personalName}</span>
    </button>
    <button
      type="button"
      onClick={() => {
        if (!professionalDisabled) {
          onChange('professional');
        }
      }}
      disabled={professionalDisabled}
      role="tab"
      aria-selected={value === 'professional'}
      className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-bold transition ${
        value === 'professional'
          ? 'bg-brand-500 text-white'
          : professionalDisabled
            ? 'cursor-not-allowed text-slate-300'
            : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      <BriefcaseBusiness size={15} />
      <span className="truncate">Como {professionalName || 'negocio'}</span>
    </button>
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
        className="w-full rounded-full border border-input px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-200"
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
      active ? 'text-brand-500' : 'text-muted-foreground'
    }`}
  >
    {icon} {label}
  </button>
);

const Actions: React.FC<ActionsProps> = ({ mode, onModeChange, onPublish }) => (
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
    <Button onClick={onPublish} size="sm">
      Publicar
    </Button>
  </div>
);

const CommunityComposer = {
  Root,
  AuthorSwitch,
  Editor,
  MediaField,
  Actions,
};

export default CommunityComposer;

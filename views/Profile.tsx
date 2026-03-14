import React, { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Copy, Globe, Mail, MapPin, PencilLine, Phone, Save, UserRound } from 'lucide-react';
import { useToast } from '../components/feedback/ToastProvider';
import CloudinaryImageField from '../components/forms/CloudinaryImageField';
import RegionSelector from '../components/RegionSelector';
import { formatLoosePhoneInput } from '../lib/forms/phone';
import { normalizeUrlFieldValue } from '../lib/forms/validation';
import { normalizeUsernameInput } from '../lib/username';
import { User } from '../types';

const DEFAULT_AVATAR_URL = 'https://picsum.photos/seed/eumigrei-user/200';

type ProfileFormState = {
  name: string;
  username: string;
  email: string;
  phone: string;
};

const Profile: React.FC<{ user: User }> = ({ user }) => {
  const { update } = useSession();
  const { showToast } = useToast();
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [editingAccount, setEditingAccount] = useState(false);
  const [editingRegion, setEditingRegion] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [selectedRegionKey, setSelectedRegionKey] = useState(user.regionKey || '');
  const [savingRegion, setSavingRegion] = useState(false);
  const [accountForm, setAccountForm] = useState<ProfileFormState>({
    name: user.name,
    username: user.username || '',
    email: user.email || '',
    phone: user.phone || '',
  });

  useEffect(() => {
    setSelectedRegionKey(user.regionKey || '');
  }, [user.regionKey]);

  useEffect(() => {
    setAvatarUrl(user.avatar === DEFAULT_AVATAR_URL ? '' : user.avatar);
  }, [user.avatar]);

  useEffect(() => {
    setAccountForm({
      name: user.name,
      username: user.username || '',
      email: user.email || '',
      phone: user.phone || '',
    });
  }, [user.email, user.name, user.phone, user.username]);

  const publicProfileUrl = useMemo(() => {
    return user.username
      ? `https://eumigrei.com.br/${user.username}`
      : 'https://eumigrei.com.br/seu-nome-publico';
  }, [user.username]);

  const handleAvatarSave = async () => {
    setSavingAvatar(true);

    try {
      const response = await fetch('/api/profile/image', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: normalizeUrlFieldValue(avatarUrl) || undefined,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        showToast(payload?.error ?? 'Nao foi possivel atualizar sua foto.', 'error');
        return;
      }

      await update();
      setEditingAvatar(false);
      showToast(avatarUrl ? 'Foto do perfil atualizada.' : 'Foto do perfil removida.', 'success');
    } catch (error) {
      console.error('Failed to update profile image:', error);
      showToast('Nao foi possivel atualizar sua foto.', 'error');
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleAccountSave = async () => {
    if (!accountForm.name.trim()) {
      showToast('Informe seu nome para salvar o perfil.', 'error');
      return;
    }

    if (!accountForm.username.trim()) {
      showToast('Escolha um nome publico disponivel.', 'error');
      return;
    }

    setSavingAccount(true);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: accountForm.name.trim(),
          username: normalizeUsernameInput(accountForm.username),
          phone: accountForm.phone.trim() || undefined,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        showToast(payload?.error ?? 'Nao foi possivel atualizar seus dados.', 'error');
        return;
      }

      await update();
      setEditingAccount(false);
      showToast('Seus dados foram atualizados.', 'success');
    } catch (error) {
      console.error('Failed to update profile data:', error);
      showToast('Nao foi possivel atualizar seus dados.', 'error');
    } finally {
      setSavingAccount(false);
    }
  };

  const handleRegionSave = async () => {
    if (!selectedRegionKey) {
      showToast('Selecione uma regiao valida antes de salvar.', 'error');
      return;
    }

    setSavingRegion(true);

    try {
      const response = await fetch('/api/profile/region', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ regionKey: selectedRegionKey }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        showToast(payload?.error ?? 'Nao foi possivel atualizar a sua regiao.', 'error');
        return;
      }

      await update();
      setEditingRegion(false);
      showToast('Regiao atualizada com sucesso.', 'success');
    } catch (error) {
      console.error('Failed to update region:', error);
      showToast('Nao foi possivel atualizar a sua regiao.', 'error');
    } finally {
      setSavingRegion(false);
    }
  };

  const handleCopyPublicUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicProfileUrl);
      showToast('Link publico copiado.', 'success');
    } catch {
      showToast(publicProfileUrl, 'info', 5000);
    }
  };

  return (
    <div className="animate-in space-y-5 px-5 pb-24 pt-6 fade-in duration-500">
      <section className="rounded-[32px] bg-gradient-to-br from-[#004691] via-[#0C58B6] to-[#27A0FF] p-5 text-white shadow-xl">
        <div className="flex items-start gap-4">
          <div className="relative">
            <img
              src={user.avatar}
              className="h-24 w-24 rounded-[28px] border-4 border-white/30 object-cover shadow-lg"
              alt={user.name}
            />
            <button
              type="button"
              onClick={() => setEditingAvatar((current) => !current)}
              className="absolute -bottom-2 -right-2 rounded-full border-2 border-white bg-white p-2 text-[#004691] shadow-lg"
            >
              <PencilLine size={14} />
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/70">Meu perfil</p>
            <h1 className="mt-2 text-2xl font-bold">{user.name}</h1>
            <p className="mt-1 text-sm font-semibold text-white/80">
              {user.username ? `@${user.username}` : 'Defina seu nome publico'}
            </p>
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white/90">
              <MapPin size={14} />
              {user.location}
            </p>
          </div>
        </div>

        {editingAvatar ? (
          <div className="mt-5 rounded-[28px] bg-white/10 p-4 backdrop-blur-sm">
            <CloudinaryImageField
              value={avatarUrl}
              onChange={setAvatarUrl}
              folder="profiles"
              placeholder="Link da foto do perfil"
              hint="Envie sua foto pela Cloudinary ou cole uma URL publica."
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleAvatarSave}
                disabled={savingAvatar}
                className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#004691] shadow-md disabled:opacity-60"
              >
                {savingAvatar ? 'Salvando...' : 'Salvar foto'}
              </button>
              <button
                type="button"
                onClick={() => setAvatarUrl('')}
                disabled={savingAvatar}
                className="rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                Remover
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-[32px] border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Nome publico
            </p>
            <h2 className="mt-2 text-xl font-bold text-[#004691]">
              {user.username ? `@${user.username}` : 'Ainda nao definido'}
            </h2>
            <p className="mt-2 break-all text-sm text-slate-500">{publicProfileUrl}</p>
          </div>
          <button
            type="button"
            onClick={() => void handleCopyPublicUrl()}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600"
          >
            <Copy size={14} />
            Copiar
          </button>
        </div>
      </section>

      <section className="rounded-[32px] border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Dados da conta
            </p>
            <h2 className="mt-2 text-xl font-bold text-[#004691]">Edite seus dados</h2>
            <p className="mt-1 text-sm text-slate-500">
              Nome, telefone e nome publico que sera usado para divulgacao.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingAccount((current) => !current);
              setAccountForm({
                name: user.name,
                username: user.username || '',
                email: user.email || '',
                phone: user.phone || '',
              });
            }}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600"
          >
            <PencilLine size={14} />
            {editingAccount ? 'Fechar' : 'Editar'}
          </button>
        </div>

        {editingAccount ? (
          <div className="mt-5 space-y-3 rounded-[28px] bg-slate-50 p-4">
            <FormInput
              value={accountForm.name}
              onChange={(value) => setAccountForm((current) => ({ ...current, name: value }))}
              placeholder="Nome completo"
              icon={<UserRound size={16} />}
            />
            <FormInput
              value={accountForm.username}
              onChange={(value) =>
                setAccountForm((current) => ({
                  ...current,
                  username: normalizeUsernameInput(value),
                }))
              }
              placeholder="Nome publico"
              icon={<Globe size={16} />}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <FormInput
                value={accountForm.email}
                onChange={(value) => setAccountForm((current) => ({ ...current, email: value }))}
                placeholder="Email"
                icon={<Mail size={16} />}
                type="email"
                disabled
              />
              <FormInput
                value={accountForm.phone}
                onChange={(value) =>
                  setAccountForm((current) => ({
                    ...current,
                    phone: formatLoosePhoneInput(value),
                  }))
                }
                placeholder="Telefone"
                icon={<Phone size={16} />}
                type="tel"
              />
            </div>
            <p className="text-xs font-medium text-slate-500">
              O email fica bloqueado nesta v1. Para trocar, vamos exigir verificacao real.
            </p>
            <button
              type="button"
              onClick={handleAccountSave}
              disabled={savingAccount}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#004691] px-4 text-sm font-bold text-white shadow-md disabled:opacity-60"
            >
              <Save size={16} />
              {savingAccount ? 'Salvando...' : 'Salvar dados'}
            </button>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <ProfileMeta label="Email" value={user.email || 'Nao informado'} icon={<Mail size={16} />} />
            <ProfileMeta label="Telefone" value={user.phone || 'Nao informado'} icon={<Phone size={16} />} />
          </div>
        )}
      </section>

      <section className="rounded-[32px] border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Regiao ativa
            </p>
            <h2 className="mt-2 text-xl font-bold text-[#004691]">{user.location}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Comunidade, negocios e eventos priorizam esta regiao.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditingRegion((current) => !current)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600"
          >
            <PencilLine size={14} />
            {editingRegion ? 'Fechar' : 'Alterar'}
          </button>
        </div>

        {editingRegion ? (
          <div className="mt-5 space-y-4">
            <RegionSelector
              value={selectedRegionKey}
              onChange={(region) => {
                setSelectedRegionKey(region.key);
              }}
              hint="Voce pode manter sua localizacao atual ou trocar manualmente para outra regiao existente."
            />

            <button
              type="button"
              onClick={handleRegionSave}
              disabled={savingRegion}
              className="w-full rounded-2xl bg-[#004691] px-4 py-3 text-sm font-bold text-white shadow-md disabled:opacity-60"
            >
              {savingRegion ? 'Salvando...' : 'Salvar regiao'}
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
};

const FormInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  type?: string;
  disabled?: boolean;
}> = ({ value, onChange, placeholder, icon, type = 'text', disabled = false }) => (
  <label className="relative block">
    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
      {icon}
    </span>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
    />
  </label>
);

const ProfileMeta: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({
  label,
  value,
  icon,
}) => (
  <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-4">
    <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
      {icon}
      {label}
    </div>
    <p className="mt-2 break-all text-sm font-semibold text-slate-700">{value}</p>
  </div>
);

export default Profile;

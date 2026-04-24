'use client';

import React, { useState } from 'react';
import { ImagePlus, PencilLine, Plus } from 'lucide-react';
import CloudinaryImageField from '../forms/CloudinaryImageField';
import FieldErrorMessage from '../forms/FieldErrorMessage';
import RegionSelector from '../RegionSelector';
import {
  type FieldErrors,
  hasFieldErrors,
  normalizeUrlFieldValue,
  requiredFieldError,
  validateRequiredUrlField,
} from '@/lib/forms/validation';

export type ManagedBanner = {
  id: string;
  name: string;
  imageUrl: string;
  type: 'LINK' | 'REGISTRATION';
  placement: 'HOME' | 'FEED' | 'BOTH';
  targetUrl: string | null;
  regionKey: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  region: {
    key: string;
    label: string;
  } | null;
  _count?: {
    registrations: number;
  };
  registrations?: Array<{
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    locationLabel: string | null;
    createdAt: string;
  }>;
};

type BannerFormState = {
  name: string;
  imageUrl: string;
  type: 'LINK' | 'REGISTRATION';
  placement: 'HOME' | 'FEED' | 'BOTH';
  targetUrl: string;
  regionKey: string;
  isActive: boolean;
};

type BannerField = 'name' | 'imageUrl' | 'targetUrl';

const emptyBannerForm: BannerFormState = {
  name: '',
  imageUrl: '',
  type: 'LINK',
  placement: 'HOME',
  targetUrl: '',
  regionKey: '',
  isActive: true,
};

const BANNER_PREVIEW_LIMIT = 5;

interface BannerManagementSectionProps {
  banners: ManagedBanner[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  onError: (message: string | null) => void;
  onMessage: (message: string | null) => void;
}

const BannerManagementSection: React.FC<BannerManagementSectionProps> = ({
  banners,
  loading,
  onRefresh,
  onError,
  onMessage,
}) => {
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerForm, setBannerForm] = useState<BannerFormState>(emptyBannerForm);
  const [processingKey, setProcessingKey] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<BannerField>>({});
  const [showAllBanners, setShowAllBanners] = useState(false);

  const visibleBanners = showAllBanners ? banners : banners.slice(0, BANNER_PREVIEW_LIMIT);

  const clearFieldError = (field: BannerField) => {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      return {
        ...current,
        [field]: undefined,
      };
    });
  };

  const resetBannerForm = () => {
    setEditingBannerId(null);
    setBannerForm(emptyBannerForm);
    setFieldErrors({});
  };

  const startBannerEdit = (banner: ManagedBanner) => {
    setEditingBannerId(banner.id);
    setBannerForm({
      name: banner.name,
      imageUrl: banner.imageUrl,
      type: banner.type,
      placement: banner.placement,
      targetUrl: banner.targetUrl || '',
      regionKey: banner.regionKey || '',
      isActive: banner.isActive,
    });
    onError(null);
    onMessage(null);
    setFieldErrors({});
  };

  const runBannerAction = async (
    key: string,
    request: () => Promise<Response>,
    successMessage: string,
    resetForm = false,
  ) => {
    setProcessingKey(key);
    onError(null);
    onMessage(null);

    try {
      const response = await request();
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Nao foi possivel salvar o banner.');
      }

      if (resetForm) {
        resetBannerForm();
      }

      onMessage(successMessage);
      await onRefresh();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Nao foi possivel salvar o banner.');
    } finally {
      setProcessingKey(null);
    }
  };

  const submitBanner = async () => {
    const nextErrors: FieldErrors<BannerField> = {};

    if (!bannerForm.name.trim()) {
      nextErrors.name = requiredFieldError('o nome do banner');
    }

    const imageUrlError = validateRequiredUrlField(bannerForm.imageUrl, 'o link da imagem');
    if (imageUrlError) {
      nextErrors.imageUrl = imageUrlError;
    }

    if (bannerForm.type === 'LINK') {
      const targetUrlError = validateRequiredUrlField(bannerForm.targetUrl, 'o link de destino');
      if (targetUrlError) {
        nextErrors.targetUrl = targetUrlError;
      }
    }

    setFieldErrors(nextErrors);

    if (hasFieldErrors(nextErrors)) {
      onError(
        bannerForm.type === 'LINK'
          ? 'Preencha nome, imagem e link do banner.'
          : 'Preencha nome e imagem do banner.',
      );
      return;
    }

    const route = editingBannerId ? `/api/admin/banners/${editingBannerId}` : '/api/admin/banners';

    await runBannerAction(
      editingBannerId ? `banner:${editingBannerId}:save` : 'banner:create',
      () =>
        fetch(route, {
          method: editingBannerId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: bannerForm.name.trim(),
            imageUrl: normalizeUrlFieldValue(bannerForm.imageUrl),
            type: bannerForm.type,
            placement: bannerForm.placement,
            targetUrl: bannerForm.type === 'LINK' ? normalizeUrlFieldValue(bannerForm.targetUrl) : undefined,
            regionKey: bannerForm.regionKey || undefined,
            isActive: bannerForm.isActive,
          }),
        }),
      editingBannerId ? 'Banner atualizado.' : 'Banner criado.',
      true,
    );
  };

  const toggleBannerStatus = async (banner: ManagedBanner) => {
    await runBannerAction(
      `banner:${banner.id}:toggle`,
      () =>
        fetch(`/api/admin/banners/${banner.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: banner.name,
            imageUrl: banner.imageUrl,
            type: banner.type,
            placement: banner.placement,
            targetUrl: banner.type === 'LINK' ? banner.targetUrl : undefined,
            regionKey: banner.regionKey || undefined,
            isActive: !banner.isActive,
          }),
        }),
      banner.isActive ? 'Banner ocultado.' : 'Banner ativado.',
    );
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#28B8C7]">Banners</h2>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 shadow-sm">
          {banners.length}
        </span>
      </div>
      <p className="text-sm text-slate-500">
        Cadastre um ou mais banners e limite a exibicao por regiao ou para toda a plataforma.
      </p>

      <div className="space-y-3 rounded-[32px] border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-slate-700">
              {editingBannerId ? 'Editar banner' : 'Novo banner'}
            </p>
            <p className="text-xs text-slate-400">
              Defina nome, imagem, tipo de acao e se ele sera global ou regional.
            </p>
          </div>
          {editingBannerId ? (
            <button
              type="button"
              onClick={resetBannerForm}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500"
            >
              Cancelar
            </button>
          ) : null}
        </div>

        <input
          value={bannerForm.name}
          onChange={(event) => {
            clearFieldError('name');
            setBannerForm((current) => ({ ...current, name: event.target.value }));
          }}
          placeholder="Nome do banner"
          aria-invalid={Boolean(fieldErrors.name)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-200"
        />
        <FieldErrorMessage message={fieldErrors.name} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Tipo de banner
            </span>
            <select
              value={bannerForm.type}
              onChange={(event) => {
                clearFieldError('targetUrl');
                setBannerForm((current) => ({
                  ...current,
                  type: event.target.value as BannerFormState['type'],
                  targetUrl: event.target.value === 'LINK' ? current.targetUrl : '',
                }));
              }}
              className="mt-2 w-full bg-transparent text-sm font-bold text-slate-700 outline-none"
            >
              <option value="LINK">Link externo</option>
              <option value="REGISTRATION">Cadastro de interesse</option>
            </select>
          </label>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
            {bannerForm.type === 'LINK'
              ? 'O usuario clica no icone e abre o destino em nova aba.'
              : 'O usuario clica no botao e os dados do perfil sao salvos como lead do banner.'}
          </div>
        </div>
        <label className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Local de exibicao
          </span>
          <select
            value={bannerForm.placement}
            onChange={(event) =>
              setBannerForm((current) => ({
                ...current,
                placement: event.target.value as BannerFormState['placement'],
              }))
            }
            className="mt-2 w-full bg-transparent text-sm font-bold text-slate-700 outline-none"
          >
            <option value="HOME">Home</option>
            <option value="FEED">Feed da comunidade</option>
            <option value="BOTH">Home e feed</option>
          </select>
        </label>
        <CloudinaryImageField
          value={bannerForm.imageUrl}
          onChange={(value) => setBannerForm((current) => ({ ...current, imageUrl: value }))}
          onClearError={() => clearFieldError('imageUrl')}
          error={fieldErrors.imageUrl}
          folder="banners"
          placeholder="Link da imagem do banner"
          hint="Envie o banner via Cloudinary ou cole uma URL publica."
        />
        {bannerForm.type === 'LINK' ? (
          <>
            <input
              value={bannerForm.targetUrl}
              onChange={(event) => {
                clearFieldError('targetUrl');
                setBannerForm((current) => ({ ...current, targetUrl: event.target.value }));
              }}
              onBlur={() =>
                setBannerForm((current) => ({
                  ...current,
                  targetUrl: normalizeUrlFieldValue(current.targetUrl),
                }))
              }
              placeholder="Link de destino"
              aria-invalid={Boolean(fieldErrors.targetUrl)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-200"
            />
            <FieldErrorMessage message={fieldErrors.targetUrl} />
          </>
        ) : null}
        <RegionSelector
          value={bannerForm.regionKey}
          onChange={(region) =>
            setBannerForm((current) => ({ ...current, regionKey: region.key }))
          }
          onClear={() => setBannerForm((current) => ({ ...current, regionKey: '' }))}
          allowEmpty
          emptyLabel="Todas as regioes"
          hint="Alcance: deixe vazio para global. Escolha uma regiao para exibir apenas para usuarios daquela area."
        />
        <label className="inline-flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
          <input
            type="checkbox"
            checked={bannerForm.isActive}
            onChange={(event) =>
              setBannerForm((current) => ({ ...current, isActive: event.target.checked }))
            }
            className="h-4 w-4 rounded border-slate-300 text-[#28B8C7] focus:ring-[#28B8C7]"
          />
          Banner ativo para exibicao
        </label>
        <button
          type="button"
          onClick={() => void submitBanner()}
          disabled={processingKey === 'banner:create' || processingKey === `banner:${editingBannerId}:save`}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#28B8C7] px-4 text-sm font-bold text-white shadow-md disabled:opacity-60"
        >
          {editingBannerId ? <PencilLine size={16} /> : <Plus size={16} />}
          {editingBannerId
            ? processingKey === `banner:${editingBannerId}:save`
              ? 'Salvando banner...'
              : 'Salvar banner'
            : processingKey === 'banner:create'
              ? 'Criando banner...'
              : 'Cadastrar banner'}
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="h-[200px] animate-pulse rounded-3xl bg-white shadow-sm" />
          ))}
        </div>
      ) : banners.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-5 py-7 text-center text-sm font-medium text-slate-500">
          Nenhum banner cadastrado ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {banners.length > BANNER_PREVIEW_LIMIT ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowAllBanners((current) => !current)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-800"
              >
                {showAllBanners ? 'Mostrar menos' : `Ver todos (${banners.length})`}
                {!showAllBanners ? (
                  <span className="ml-2 text-slate-400">
                    mostrando {Math.min(banners.length, BANNER_PREVIEW_LIMIT)}
                  </span>
                ) : null}
              </button>
            </div>
          ) : null}
          {visibleBanners.map((banner) => (
            <div key={banner.id} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-4">
                <img
                  src={banner.imageUrl}
                  alt={banner.name}
                  className="h-20 w-20 rounded-2xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold text-[#28B8C7]">{banner.name}</p>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                        {banner.region?.label || 'Todas as regioes'}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {banner.type === 'LINK' ? 'Tipo: link externo' : 'Tipo: cadastro de interesse'}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        Local: {banner.placement === 'HOME' ? 'Home' : banner.placement === 'FEED' ? 'Feed' : 'Home e Feed'}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                        banner.isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {banner.isActive ? 'Ativo' : 'Oculto'}
                    </span>
                  </div>
                  {banner.type === 'LINK' && banner.targetUrl ? (
                    <a
                      href={banner.targetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-cyan-600 hover:text-cyan-700"
                    >
                      <ImagePlus size={14} />
                      Abrir destino
                    </a>
                  ) : (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-medium text-cyan-600">
                        {banner._count?.registrations ?? 0} cadastro(s) de interesse registrados.
                      </p>
                      {banner.registrations && banner.registrations.length > 0 ? (
                        <div className="rounded-2xl bg-slate-50 px-3 py-2">
                          {banner.registrations.slice(0, 3).map((registration) => (
                            <p key={registration.id} className="truncate text-xs text-slate-500">
                              {registration.name || registration.email || 'Usuario'} · {registration.locationLabel || 'Sem regiao'}
                            </p>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )}
                  <p className="mt-2 text-xs text-slate-400">
                    Atualizado em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(banner.updatedAt))}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    editingBannerId === banner.id ? resetBannerForm() : startBannerEdit(banner)
                  }
                  disabled={processingKey !== null}
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl bg-slate-100 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-200 disabled:opacity-60"
                >
                  {editingBannerId === banner.id ? 'Fechar' : 'Editar'}
                </button>
                <button
                  type="button"
                  onClick={() => void toggleBannerStatus(banner)}
                  disabled={processingKey !== null}
                  className={`inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl px-4 text-sm font-bold transition disabled:opacity-60 ${
                    banner.isActive
                      ? 'bg-red-50 text-red-700 hover:bg-red-100'
                      : 'bg-[#28B8C7] text-white hover:bg-[#1E96A4]'
                  }`}
                >
                  {processingKey === `banner:${banner.id}:toggle`
                    ? 'Processando...'
                    : banner.isActive
                      ? 'Ocultar'
                      : 'Ativar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default BannerManagementSection;

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
  targetUrl: string;
  regionKey: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  region: {
    key: string;
    label: string;
  } | null;
};

type BannerFormState = {
  name: string;
  imageUrl: string;
  targetUrl: string;
  regionKey: string;
  isActive: boolean;
};

type BannerField = 'name' | 'imageUrl' | 'targetUrl';

const emptyBannerForm: BannerFormState = {
  name: '',
  imageUrl: '',
  targetUrl: '',
  regionKey: '',
  isActive: true,
};

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
      targetUrl: banner.targetUrl,
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

    const targetUrlError = validateRequiredUrlField(bannerForm.targetUrl, 'o link de destino');
    if (targetUrlError) {
      nextErrors.targetUrl = targetUrlError;
    }

    setFieldErrors(nextErrors);

    if (hasFieldErrors(nextErrors)) {
      onError('Preencha nome, imagem e link do banner.');
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
            targetUrl: normalizeUrlFieldValue(bannerForm.targetUrl),
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
            targetUrl: banner.targetUrl,
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
        <h2 className="text-lg font-bold text-[#004691]">Banner Ads</h2>
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
              Defina nome, imagem, link de destino e se ele sera global ou regional.
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
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
        />
        <FieldErrorMessage message={fieldErrors.name} />
        <CloudinaryImageField
          value={bannerForm.imageUrl}
          onChange={(value) => setBannerForm((current) => ({ ...current, imageUrl: value }))}
          onClearError={() => clearFieldError('imageUrl')}
          error={fieldErrors.imageUrl}
          folder="banners"
          placeholder="Link da imagem do banner"
          hint="Envie o banner via Cloudinary ou cole uma URL publica."
        />
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
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
        />
        <FieldErrorMessage message={fieldErrors.targetUrl} />
        <RegionSelector
          value={bannerForm.regionKey}
          onChange={(region) =>
            setBannerForm((current) => ({ ...current, regionKey: region.key }))
          }
          onClear={() => setBannerForm((current) => ({ ...current, regionKey: '' }))}
          allowEmpty
          emptyLabel="Todas as regioes"
          hint="Banners sem regiao aparecem para toda a plataforma. Com regiao, so para usuarios daquela area."
        />
        <label className="inline-flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
          <input
            type="checkbox"
            checked={bannerForm.isActive}
            onChange={(event) =>
              setBannerForm((current) => ({ ...current, isActive: event.target.checked }))
            }
            className="h-4 w-4 rounded border-slate-300 text-[#004691] focus:ring-[#004691]"
          />
          Banner visivel na Home
        </label>
        <button
          type="button"
          onClick={() => void submitBanner()}
          disabled={processingKey === 'banner:create' || processingKey === `banner:${editingBannerId}:save`}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#004691] px-4 text-sm font-bold text-white shadow-md disabled:opacity-60"
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
          {banners.map((banner) => (
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
                      <p className="text-lg font-bold text-[#004691]">{banner.name}</p>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                        {banner.region?.label || 'Todas as regioes'}
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
                  <a
                    href={banner.targetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    <ImagePlus size={14} />
                    Abrir destino
                  </a>
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
                      : 'bg-[#004691] text-white hover:bg-[#00386f]'
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

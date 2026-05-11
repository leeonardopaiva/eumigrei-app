'use client';

import React, { useState } from 'react';
import { ImagePlus, PencilLine, Plus, Target, WalletCards } from 'lucide-react';
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
  campaignStatus: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ENDED';
  objective: 'TRAFFIC' | 'LEAD' | 'AWARENESS';
  billingMode: 'FLAT' | 'CPC' | 'CPM' | 'CPL';
  paymentStatus: 'NOT_REQUIRED' | 'PENDING' | 'PAID' | 'FAILED';
  targetInterests: string[];
  targetKeywords: string[];
  targetCategories: string[];
  startsAt: string | null;
  endsAt: string | null;
  dailyBudgetCents: number | null;
  totalBudgetCents: number | null;
  bidCents: number;
  spentCents: number;
  checkoutUrl: string | null;
  paymentProvider: string | null;
  createdAt: string;
  updatedAt: string;
  region: {
    key: string;
    label: string;
  } | null;
  _count?: {
    registrations: number;
    impressions: number;
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
  campaignStatus: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ENDED';
  objective: 'TRAFFIC' | 'LEAD' | 'AWARENESS';
  billingMode: 'FLAT' | 'CPC' | 'CPM' | 'CPL';
  paymentStatus: 'NOT_REQUIRED' | 'PENDING' | 'PAID' | 'FAILED';
  targetInterests: string;
  targetKeywords: string;
  targetCategories: string;
  startsAt: string;
  endsAt: string;
  dailyBudget: string;
  totalBudget: string;
  bid: string;
  checkoutUrl: string;
  paymentProvider: string;
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
  campaignStatus: 'ACTIVE',
  objective: 'TRAFFIC',
  billingMode: 'FLAT',
  paymentStatus: 'NOT_REQUIRED',
  targetInterests: '',
  targetKeywords: '',
  targetCategories: '',
  startsAt: '',
  endsAt: '',
  dailyBudget: '',
  totalBudget: '',
  bid: '',
  checkoutUrl: '',
  paymentProvider: '',
};

const BANNER_PREVIEW_LIMIT = 5;

const splitTargets = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const centsFromCurrency = (value: string) => {
  const normalized = value.replace(',', '.').trim();
  if (!normalized) {
    return undefined;
  }

  return Math.round(Number(normalized) * 100);
};

const currencyFromCents = (value: number | null | undefined) =>
  typeof value === 'number' ? (value / 100).toFixed(2).replace('.', ',') : '';

const toLocalDateTimeValue = (value: string | null | undefined) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const fromLocalDateTimeValue = (value: string) =>
  value ? new Date(value).toISOString() : undefined;

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
      campaignStatus: banner.campaignStatus,
      objective: banner.objective,
      billingMode: banner.billingMode,
      paymentStatus: banner.paymentStatus,
      targetInterests: banner.targetInterests.join(', '),
      targetKeywords: banner.targetKeywords.join(', '),
      targetCategories: banner.targetCategories.join(', '),
      startsAt: toLocalDateTimeValue(banner.startsAt),
      endsAt: toLocalDateTimeValue(banner.endsAt),
      dailyBudget: currencyFromCents(banner.dailyBudgetCents),
      totalBudget: currencyFromCents(banner.totalBudgetCents),
      bid: currencyFromCents(banner.bidCents),
      checkoutUrl: banner.checkoutUrl || '',
      paymentProvider: banner.paymentProvider || '',
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

  const buildBannerPayload = (form: BannerFormState) => ({
    name: form.name.trim(),
    imageUrl: normalizeUrlFieldValue(form.imageUrl),
    type: form.type,
    placement: form.placement,
    targetUrl: form.type === 'LINK' ? normalizeUrlFieldValue(form.targetUrl) : undefined,
    regionKey: form.regionKey || undefined,
    isActive: form.isActive,
    campaignStatus: form.campaignStatus,
    objective: form.objective,
    billingMode: form.billingMode,
    paymentStatus: form.paymentStatus,
    targetInterests: splitTargets(form.targetInterests),
    targetKeywords: splitTargets(form.targetKeywords),
    targetCategories: splitTargets(form.targetCategories),
    startsAt: fromLocalDateTimeValue(form.startsAt),
    endsAt: fromLocalDateTimeValue(form.endsAt),
    dailyBudgetCents: centsFromCurrency(form.dailyBudget),
    totalBudgetCents: centsFromCurrency(form.totalBudget),
    bidCents: centsFromCurrency(form.bid) ?? 0,
    checkoutUrl: form.checkoutUrl ? normalizeUrlFieldValue(form.checkoutUrl) : undefined,
    paymentProvider: form.paymentProvider.trim() || undefined,
  });

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
          body: JSON.stringify(buildBannerPayload(bannerForm)),
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
            campaignStatus: banner.campaignStatus,
            objective: banner.objective,
            billingMode: banner.billingMode,
            paymentStatus: banner.paymentStatus,
            targetInterests: banner.targetInterests,
            targetKeywords: banner.targetKeywords,
            targetCategories: banner.targetCategories,
            startsAt: banner.startsAt ?? undefined,
            endsAt: banner.endsAt ?? undefined,
            dailyBudgetCents: banner.dailyBudgetCents ?? undefined,
            totalBudgetCents: banner.totalBudgetCents ?? undefined,
            bidCents: banner.bidCents,
            checkoutUrl: banner.checkoutUrl ?? undefined,
            paymentProvider: banner.paymentProvider ?? undefined,
          }),
        }),
      banner.isActive ? 'Banner ocultado.' : 'Banner ativado.',
    );
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold theme-text">Banners</h2>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 shadow-sm">
          {banners.length}
        </span>
      </div>
      <p className="text-sm text-slate-500">
        Cadastre um ou mais banners e limite a exibicao por regiao ou para toda a plataforma.
      </p>

      <div className="space-y-5 rounded-[32px] border border-slate-100 bg-white p-5 shadow-sm">
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

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Nome
          </label>
          <input
            value={bannerForm.name}
            onChange={(event) => {
              clearFieldError('name');
              setBannerForm((current) => ({ ...current, name: event.target.value }));
            }}
            placeholder="Nome do banner"
            aria-invalid={Boolean(fieldErrors.name)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 theme-ring"
          />
          <FieldErrorMessage message={fieldErrors.name} />
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Tipo</p>
            <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
              {[
                { value: 'LINK' as const, label: 'Link' },
                { value: 'REGISTRATION' as const, label: 'Cadastro' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    clearFieldError('targetUrl');
                    setBannerForm((current) => ({
                      ...current,
                      type: option.value,
                      targetUrl: option.value === 'LINK' ? current.targetUrl : '',
                    }));
                  }}
                  className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
                    bannerForm.type === option.value
                      ? 'bg-white theme-text shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {bannerForm.type === 'LINK'
                ? 'Abre um destino externo pelo botao do banner.'
                : 'Salva os dados do perfil como lead do banner.'}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Exibicao</p>
            <div className="mt-2 grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1">
              {[
                { value: 'HOME' as const, label: 'Home' },
                { value: 'FEED' as const, label: 'Feed' },
                { value: 'BOTH' as const, label: 'Ambos' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setBannerForm((current) => ({
                      ...current,
                      placement: option.value,
                    }))
                  }
                  className={`rounded-xl px-2 py-2 text-xs font-bold transition sm:text-sm ${
                    bannerForm.placement === option.value
                      ? 'bg-white theme-text shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Imagem</p>
          <CloudinaryImageField
            value={bannerForm.imageUrl}
            onChange={(value) => setBannerForm((current) => ({ ...current, imageUrl: value }))}
            onClearError={() => clearFieldError('imageUrl')}
            error={fieldErrors.imageUrl}
            folder="banners"
            placeholder="Link da imagem do banner"
            hint="Envie o banner via Cloudinary ou cole uma URL publica."
          />
        </div>
        {bannerForm.type === 'LINK' ? (
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Link de destino
            </label>
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
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 theme-ring"
            />
            <FieldErrorMessage message={fieldErrors.targetUrl} />
          </div>
        ) : null}

        <div className="space-y-3 rounded-3xl bg-slate-50 p-4">
          <RegionSelector
            value={bannerForm.regionKey}
            onChange={(region) =>
              setBannerForm((current) => ({ ...current, regionKey: region.key }))
            }
            onClear={() => setBannerForm((current) => ({ ...current, regionKey: '' }))}
            allowEmpty
            emptyLabel="Global"
            hint="Deixe global para todas as regioes ou escolha uma regiao especifica."
          />
          <label className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-600">
            <span>Banner ativo</span>
            <input
              type="checkbox"
              checked={bannerForm.isActive}
              onChange={(event) =>
                setBannerForm((current) => ({ ...current, isActive: event.target.checked }))
              }
              className="h-4 w-4 rounded border-slate-300 theme-text theme-ring"
            />
          </label>
        </div>

        <div className="space-y-4 rounded-3xl border border-slate-200 theme-soft-surface p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white theme-text">
              <Target size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">Segmentacao Ads Lite</p>
              <p className="text-xs leading-5 text-slate-500">
                Use listas separadas por virgula. O app cruza esses dados com interesses do perfil,
                regiao e buscas recentes.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Interesses
              </span>
              <input
                value={bannerForm.targetInterests}
                onChange={(event) =>
                  setBannerForm((current) => ({ ...current, targetInterests: event.target.value }))
                }
                placeholder="moradia, emprego"
                className="w-full rounded-2xl border border-white bg-white px-4 py-3 text-sm outline-none focus:ring-2 theme-ring"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Buscas
              </span>
              <input
                value={bannerForm.targetKeywords}
                onChange={(event) =>
                  setBannerForm((current) => ({ ...current, targetKeywords: event.target.value }))
                }
                placeholder="advogado, visto"
                className="w-full rounded-2xl border border-white bg-white px-4 py-3 text-sm outline-none focus:ring-2 theme-ring"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Categorias
              </span>
              <input
                value={bannerForm.targetCategories}
                onChange={(event) =>
                  setBannerForm((current) => ({ ...current, targetCategories: event.target.value }))
                }
                placeholder="restaurante, servicos"
                className="w-full rounded-2xl border border-white bg-white px-4 py-3 text-sm outline-none focus:ring-2 theme-ring"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Status
              </span>
              <select
                value={bannerForm.campaignStatus}
                onChange={(event) =>
                  setBannerForm((current) => ({
                    ...current,
                    campaignStatus: event.target.value as BannerFormState['campaignStatus'],
                  }))
                }
                className="w-full rounded-2xl border border-white bg-white px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:ring-2 theme-ring"
              >
                <option value="DRAFT">Rascunho</option>
                <option value="ACTIVE">Ativa</option>
                <option value="PAUSED">Pausada</option>
                <option value="ENDED">Encerrada</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Objetivo
              </span>
              <select
                value={bannerForm.objective}
                onChange={(event) =>
                  setBannerForm((current) => ({
                    ...current,
                    objective: event.target.value as BannerFormState['objective'],
                  }))
                }
                className="w-full rounded-2xl border border-white bg-white px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:ring-2 theme-ring"
              >
                <option value="TRAFFIC">Trafego</option>
                <option value="LEAD">Leads</option>
                <option value="AWARENESS">Alcance</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Pagamento
              </span>
              <select
                value={bannerForm.paymentStatus}
                onChange={(event) =>
                  setBannerForm((current) => ({
                    ...current,
                    paymentStatus: event.target.value as BannerFormState['paymentStatus'],
                  }))
                }
                className="w-full rounded-2xl border border-white bg-white px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:ring-2 theme-ring"
              >
                <option value="NOT_REQUIRED">Sem cobranca</option>
                <option value="PENDING">Aguardando pagamento</option>
                <option value="PAID">Pago</option>
                <option value="FAILED">Falhou</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Inicio
              </span>
              <input
                type="datetime-local"
                value={bannerForm.startsAt}
                onChange={(event) =>
                  setBannerForm((current) => ({ ...current, startsAt: event.target.value }))
                }
                className="w-full rounded-2xl border border-white bg-white px-4 py-3 text-sm outline-none focus:ring-2 theme-ring"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Fim
              </span>
              <input
                type="datetime-local"
                value={bannerForm.endsAt}
                onChange={(event) =>
                  setBannerForm((current) => ({ ...current, endsAt: event.target.value }))
                }
                className="w-full rounded-2xl border border-white bg-white px-4 py-3 text-sm outline-none focus:ring-2 theme-ring"
              />
            </label>
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-50 text-slate-600">
              <WalletCards size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">Orcamento e cobranca</p>
              <p className="text-xs leading-5 text-slate-500">
                Por enquanto o pagamento e controlado manualmente; o link de checkout prepara a
                integracao com Stripe ou Mercado Pago.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Modelo
              </span>
              <select
                value={bannerForm.billingMode}
                onChange={(event) =>
                  setBannerForm((current) => ({
                    ...current,
                    billingMode: event.target.value as BannerFormState['billingMode'],
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:ring-2 theme-ring"
              >
                <option value="FLAT">Pacote fixo</option>
                <option value="CPC">CPC</option>
                <option value="CPM">CPM</option>
                <option value="CPL">CPL</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Diario
              </span>
              <input
                value={bannerForm.dailyBudget}
                onChange={(event) =>
                  setBannerForm((current) => ({ ...current, dailyBudget: event.target.value }))
                }
                placeholder="50,00"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 theme-ring"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Total
              </span>
              <input
                value={bannerForm.totalBudget}
                onChange={(event) =>
                  setBannerForm((current) => ({ ...current, totalBudget: event.target.value }))
                }
                placeholder="300,00"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 theme-ring"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Lance
              </span>
              <input
                value={bannerForm.bid}
                onChange={(event) =>
                  setBannerForm((current) => ({ ...current, bid: event.target.value }))
                }
                placeholder="1,50"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 theme-ring"
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={bannerForm.paymentProvider}
              onChange={(event) =>
                setBannerForm((current) => ({ ...current, paymentProvider: event.target.value }))
              }
              placeholder="Provedor: mercado-pago ou stripe"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 theme-ring"
            />
            <input
              value={bannerForm.checkoutUrl}
              onChange={(event) =>
                setBannerForm((current) => ({ ...current, checkoutUrl: event.target.value }))
              }
              onBlur={() =>
                setBannerForm((current) => ({
                  ...current,
                  checkoutUrl: current.checkoutUrl ? normalizeUrlFieldValue(current.checkoutUrl) : '',
                }))
              }
              placeholder="Link de checkout"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 theme-ring"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => void submitBanner()}
          disabled={processingKey === 'banner:create' || processingKey === `banner:${editingBannerId}:save`}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl theme-bg px-4 text-sm font-bold text-white shadow-md disabled:opacity-60"
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
                      <p className="text-lg font-bold theme-text">{banner.name}</p>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                        {banner.region?.label || 'Todas as regioes'}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {banner.type === 'LINK' ? 'Tipo: link externo' : 'Tipo: cadastro de interesse'}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        Local: {banner.placement === 'HOME' ? 'Home' : banner.placement === 'FEED' ? 'Feed' : 'Home e Feed'}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        Campanha: {banner.campaignStatus} · Objetivo: {banner.objective} · Pagamento: {banner.paymentStatus}
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
                      className="mt-3 inline-flex items-center gap-2 text-sm font-medium theme-text theme-text"
                    >
                      <ImagePlus size={14} />
                      Abrir destino
                    </a>
                  ) : (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-medium theme-text">
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
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="rounded-2xl bg-slate-50 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                        Impressoes
                      </p>
                      <p className="text-sm font-bold text-slate-700">
                        {banner._count?.impressions ?? 0}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                        Leads
                      </p>
                      <p className="text-sm font-bold text-slate-700">
                        {banner._count?.registrations ?? 0}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                        Total
                      </p>
                      <p className="text-sm font-bold text-slate-700">
                        {banner.totalBudgetCents ? `R$ ${currencyFromCents(banner.totalBudgetCents)}` : 'Livre'}
                      </p>
                    </div>
                  </div>
                  {banner.targetInterests.length || banner.targetKeywords.length || banner.targetCategories.length ? (
                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      Segmentos: {[...banner.targetInterests, ...banner.targetKeywords, ...banner.targetCategories].slice(0, 8).join(', ')}
                    </p>
                  ) : null}
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
                      : 'theme-bg text-white theme-bg-hover'
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

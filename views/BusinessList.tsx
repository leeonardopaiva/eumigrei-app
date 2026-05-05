import React, { startTransition, useDeferredValue, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useToast } from '../components/feedback/ToastProvider';
import StarRating from '../components/engagement/StarRating';
import CloudinaryImageField from '../components/forms/CloudinaryImageField';
import FieldErrorMessage from '../components/forms/FieldErrorMessage';
import { BriefcaseBusiness, Heart, MapPin, Plus, Search, UserRound } from 'lucide-react';
import RegionSelector from '../components/RegionSelector';
import { formatLoosePhoneInput } from '../lib/forms/phone';
import {
  type FieldErrors,
  hasFieldErrors,
  normalizeUrlFieldValue,
  requiredFieldError,
  validateOptionalUrlField,
  validatePhoneField,
} from '../lib/forms/validation';
import { Business, PersonaMode, ProfessionalProfileIdentity } from '../types';

const SAMPLE_BUSINESSES: Business[] = [
  {
    id: 'sample-1',
    name: 'Minas Grill',
    category: 'Restaurante',
    address: '57 Cambridge St.',
    imageUrl: 'https://picsum.photos/seed/grill/200',
    locationLabel: 'Boston, 02108',
  },
  {
    id: 'sample-2',
    name: 'Supermercado Brasileiro',
    category: 'Mercado',
    address: '67 Chestnut Ave.',
    imageUrl: 'https://picsum.photos/seed/market/200',
    locationLabel: 'Boston, 02108',
  },
];

const emptyForm = {
  name: '',
  category: 'Restaurante',
  description: '',
  address: '',
  regionKey: '',
  phone: '',
  whatsapp: '',
  website: '',
  instagram: '',
  imageUrl: '',
};

type BusinessField =
  | 'name'
  | 'phone'
  | 'address'
  | 'regionKey'
  | 'description'
  | 'website'
  | 'imageUrl';

type BusinessListProps = {
  personaMode?: PersonaMode;
  professionalIdentity?: ProfessionalProfileIdentity | null;
};

const BusinessList: React.FC<BusinessListProps> = ({
  personaMode = 'personal',
  professionalIdentity = null,
}) => {
  const { data: session, update } = useSession();
  const { showToast } = useToast();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [resultScope, setResultScope] = useState<'local' | 'global'>('local');
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<BusinessField>>({});
  const deferredSearch = useDeferredValue(search);
  const isProfessionalMode = personaMode === 'professional' && Boolean(professionalIdentity);
  const activeRegionKey = isProfessionalMode
    ? professionalIdentity?.regionKey || session?.user?.regionKey || ''
    : session?.user?.regionKey || '';

  const clearFieldError = (field: BusinessField) => {
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

  useEffect(() => {
    if (session?.user?.regionKey) {
      setCreateForm((current) =>
        current.regionKey ? current : { ...current, regionKey: session.user.regionKey || '' },
      );
    }
  }, [session?.user?.regionKey]);

  useEffect(() => {
    let ignore = false;

    const fetchBusinesses = async () => {
      try {
        const params = new URLSearchParams();
        if (activeFilter && activeFilter !== 'Todos') {
          params.set('category', activeFilter);
        }
        if (deferredSearch.trim()) {
          params.set('search', deferredSearch.trim());
        }
        if (activeRegionKey) {
          params.set('region', activeRegionKey);
        }

        const response = await fetch(`/api/businesses?${params.toString()}`);
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error ?? 'Nao foi possivel carregar negocios.');
        }

        if (!ignore) {
          startTransition(() => {
            setBusinesses(payload.businesses ?? []);
            setResultScope(payload.scope === 'global' ? 'global' : 'local');
          });
        }
      } catch (error) {
        console.error('Failed to load businesses:', error);
        if (!ignore) {
          setBusinesses(SAMPLE_BUSINESSES);
          setResultScope('global');
        }
      }
    };

    fetchBusinesses();

    return () => {
      ignore = true;
    };
  }, [activeFilter, activeRegionKey, deferredSearch, refreshKey]);

  const handleCreateBusiness = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: FieldErrors<BusinessField> = {};

    if (!createForm.name.trim()) {
      nextErrors.name = requiredFieldError('o nome do negocio');
    }

    if (!createForm.phone.trim()) {
      nextErrors.phone = requiredFieldError('o telefone');
    } else {
      const phoneError = validatePhoneField(createForm.phone, 'O telefone');
      if (phoneError) {
        nextErrors.phone = phoneError;
      }
    }

    if (!createForm.address.trim()) {
      nextErrors.address = requiredFieldError('o endereco');
    }

    if (!createForm.regionKey.trim()) {
      nextErrors.regionKey = requiredFieldError('uma regiao');
    }

    if (!createForm.description.trim()) {
      nextErrors.description = requiredFieldError('a descricao');
    }

    const websiteError = validateOptionalUrlField(createForm.website, 'O website');
    if (websiteError) {
      nextErrors.website = websiteError;
    }

    const imageUrlError = validateOptionalUrlField(createForm.imageUrl, 'O link da imagem');
    if (imageUrlError) {
      nextErrors.imageUrl = imageUrlError;
    }

    setFieldErrors(nextErrors);

    if (hasFieldErrors(nextErrors)) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...createForm,
          website: normalizeUrlFieldValue(createForm.website),
          imageUrl: normalizeUrlFieldValue(createForm.imageUrl),
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        showToast(payload?.error ?? 'Nao foi possivel enviar seu negocio.', 'error');
        return;
      }

      showToast('Seu negocio foi enviado para aprovacao.', 'success');
      await update();
      setCreateForm(emptyForm);
      setShowCreateForm(false);
      setRefreshKey((current) => current + 1);
    } catch (error) {
      console.error('Failed to create business:', error);
      showToast('Nao foi possivel enviar seu negocio.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFavoriteToggle = async (business: Business) => {
    try {
      const response = await fetch(`/api/businesses/${business.slug || business.id}/favorite`, {
        method: business.isFavorite ? 'DELETE' : 'POST',
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        showToast(payload?.error ?? 'Nao foi possivel atualizar seus favoritos.', 'error');
        return;
      }

      setBusinesses((current) =>
        current.map((item) =>
          item.id === business.id
            ? {
                ...item,
                isFavorite: Boolean(payload?.isFavorite),
              }
            : item,
        ),
      );
    } catch (error) {
      console.error('Failed to toggle business favorite from list:', error);
      showToast('Nao foi possivel atualizar seus favoritos.', 'error');
    }
  };

  return (
    <div className="px-5 space-y-6 animate-in fade-in duration-500">
      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-cyan-900">Negocios</h1>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {isProfessionalMode
                ? `Editando como ${professionalIdentity?.name}. Os demais negocios ficam apenas para consulta.`
                : 'Cadastrando como pessoa. Ao criar um negocio, sua vitrine profissional sera ativada.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateForm((current) => !current)}
            className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-md"
          >
            <Plus size={14} /> Cadastrar
          </button>
        </div>
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar negocios brasileiros..."
            className="w-full bg-slate-100/80 rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-0"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        </div>

        <div className={`rounded-3xl border p-4 ${
          isProfessionalMode ? 'border-blue-100 bg-blue-50/60' : 'border-slate-100 bg-white'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
              isProfessionalMode ? 'bg-white text-[#0F4C81]' : 'bg-cyan-50 text-cyan-700'
            }`}>
              {isProfessionalMode ? <BriefcaseBusiness size={20} /> : <UserRound size={20} />}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Indicando negocio
              </p>
              <p className={`mt-1 text-sm font-bold ${isProfessionalMode ? 'text-[#0F4C81]' : 'text-slate-800'}`}>
                {isProfessionalMode
                  ? `Como ${professionalIdentity?.name}`
                  : `Como ${session?.user?.name || 'pessoa da comunidade'}`}
              </p>
              <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">
                {isProfessionalMode
                  ? 'Use este modo para gerenciar sua propria vitrine profissional.'
                  : 'Indique um negocio local. Depois da aprovacao, ele ativa a vitrine profissional.'}
              </p>
            </div>
          </div>
        </div>

        {showCreateForm ? (
          <form
            onSubmit={handleCreateBusiness}
            className="space-y-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"
          >
            <input
              required
              value={createForm.name}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, name: event.target.value }))
              }
              onInput={() => clearFieldError('name')}
              aria-invalid={Boolean(fieldErrors.name)}
              placeholder="Nome do negocio"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-200"
            />
            <FieldErrorMessage message={fieldErrors.name} />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={createForm.category}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, category: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-200"
              >
                {['Restaurante', 'Mercado', 'Beleza', 'Saude'].map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <input
                required
                value={createForm.phone}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    phone: formatLoosePhoneInput(event.target.value),
                  }))
                }
                onInput={() => clearFieldError('phone')}
                aria-invalid={Boolean(fieldErrors.phone)}
                placeholder="Telefone"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-200"
              />
            </div>
            <FieldErrorMessage message={fieldErrors.phone} />
            <input
              required
              value={createForm.address}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, address: event.target.value }))
              }
              onInput={() => clearFieldError('address')}
              aria-invalid={Boolean(fieldErrors.address)}
              placeholder="Endereco"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-200"
            />
            <FieldErrorMessage message={fieldErrors.address} />
            <RegionSelector
              value={createForm.regionKey}
              onChange={(region) => {
                clearFieldError('regionKey');
                setCreateForm((current) => ({ ...current, regionKey: region.key }));
              }}
              hint="Escolha uma regiao existente para padronizar a publicacao."
            />
            <FieldErrorMessage message={fieldErrors.regionKey} />
            <textarea
              required
              rows={3}
              value={createForm.description}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, description: event.target.value }))
              }
              onInput={() => clearFieldError('description')}
              aria-invalid={Boolean(fieldErrors.description)}
              placeholder="Descricao do negocio"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-200"
            />
            <FieldErrorMessage message={fieldErrors.description} />
            <div className="grid grid-cols-2 gap-3">
              <input
                value={createForm.website}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, website: event.target.value }))
                }
                onInput={() => clearFieldError('website')}
                aria-invalid={Boolean(fieldErrors.website)}
                placeholder="Website"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-200"
              />
              <input
                value={createForm.instagram}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, instagram: event.target.value }))
                }
                placeholder="Instagram"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-200"
              />
            </div>
            <FieldErrorMessage message={fieldErrors.website} />
            <CloudinaryImageField
              value={createForm.imageUrl}
              onChange={(value) =>
                setCreateForm((current) => ({ ...current, imageUrl: value }))
              }
              onClearError={() => clearFieldError('imageUrl')}
              error={fieldErrors.imageUrl}
              folder="businesses"
              placeholder="Link da imagem de capa"
              hint="Envie a capa pela Cloudinary ou cole uma URL publica."
            />
            <button
              type="submit"
              disabled={submitting || !createForm.regionKey}
              className="w-full rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-bold text-white shadow-md disabled:opacity-60"
            >
              {submitting ? 'Enviando...' : 'Enviar para aprovacao'}
            </button>
          </form>
        ) : null}

      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['Todos', 'Restaurante', 'Mercado', 'Beleza', 'Saude'].map((category) => (
          <button
            key={category}
            onClick={() => setActiveFilter(category)}
            className={`px-6 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shadow-sm border ${
              activeFilter === category
                ? 'bg-cyan-600 text-white border-cyan-700'
                : 'bg-white text-cyan-900 border-slate-100'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="space-y-4 pb-20">
        <h2 className="font-bold text-cyan-900">Negocios disponiveis</h2>
        {resultScope === 'global' && businesses.length > 0 ? (
          <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
            Ainda nao ha negocios publicados na sua regiao. Mostrando resultados de outras regioes.
          </div>
        ) : null}
        {businesses.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center text-sm font-medium text-slate-500">
            Nenhum negocio publicado nesta regiao ainda.
          </div>
        ) : null}
        {businesses.map((business) => {
          const isPendingReview = business.status === 'PENDING_REVIEW' || business.isPendingReview;

          return (
          <div
            key={business.id}
            className={`relative flex min-h-32 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:border-slate-200 ${
              isPendingReview ? 'bg-slate-50 opacity-65 grayscale' : ''
            }`}
          >
            <Link
              href={`/negocios/${business.slug || business.id}`}
              className="absolute inset-0 z-20"
              aria-label={`Abrir ${business.name}`}
            />
            <img
              src={business.imageUrl || `https://picsum.photos/seed/${business.id}/200`}
              className="w-28 shrink-0 self-stretch object-cover"
              alt={business.name}
            />
            <div className="relative z-10 flex flex-1 flex-col justify-between p-4">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-bold text-cyan-900">{business.name}</h4>
                  {!isPendingReview ? (
                    <button
                      type="button"
                      onClick={() => void handleFavoriteToggle(business)}
                      className={`relative z-30 rounded-full p-2 ${
                        business.isFavorite ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'
                      }`}
                      aria-label={business.isFavorite ? 'Remover dos favoritos' : 'Favoritar negocio'}
                    >
                      <Heart size={14} fill={business.isFavorite ? 'currentColor' : 'none'} />
                    </button>
                  ) : null}
                </div>
                {isPendingReview ? (
                  <span className="mt-2 inline-flex w-fit rounded-xl border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                    Aguardando aprovacao
                  </span>
                ) : null}
                <div className="mt-2">
                  <StarRating
                    average={business.ratingAverage ?? 0}
                    count={business.ratingCount ?? 0}
                    compact
                  />
                </div>
                <p className="text-cyan-600 text-[10px] font-bold mt-0.5">{business.category}</p>
                <div className="flex items-center gap-1 text-slate-500 text-[10px] mt-1">
                  <MapPin size={10} /> {business.address}
                </div>
              </div>
              <span className="self-end rounded-xl bg-cyan-600 px-4 py-1.5 text-[10px] font-bold text-white shadow-sm">
                {business.canEdit ? 'Editar perfil' : 'Ver perfil'}
              </span>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
};

export default BusinessList;


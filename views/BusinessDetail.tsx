import React, { useEffect, useState } from 'react';
import {
  Copy,
  Globe2,
  Heart,
  Images,
  Instagram,
  MapPin,
  MessageCircle,
  PencilLine,
  Phone,
  Share2,
} from 'lucide-react';
import StarRating from '../components/engagement/StarRating';
import { useToast } from '../components/feedback/ToastProvider';
import CloudinaryImageField from '../components/forms/CloudinaryImageField';
import ImageGalleryField from '../components/forms/ImageGalleryField';
import { normalizeUrlFieldValue } from '../lib/forms/validation';
import { User } from '../types';

interface BusinessDetailProps {
  businessId?: string;
  user: User;
}

type BusinessDetailState = {
  id: string;
  slug: string;
  name: string;
  description: string;
  address: string;
  category: string;
  imageUrl: string;
  galleryUrls: string[];
  phone: string;
  whatsapp: string;
  website: string;
  instagram: string;
  ratingAverage: number;
  ratingCount: number;
  viewerRating: number | null;
  isFavorite: boolean;
  canRate: boolean;
  locationLabel: string;
  createdByName: string;
  canEdit: boolean;
  publicPath: string;
};

const defaultBusiness: BusinessDetailState = {
  id: '',
  slug: '',
  name: 'Negocio local',
  description: 'Os detalhes deste negocio ainda nao foram carregados.',
  address: 'Endereco indisponivel',
  category: 'Negocio',
  imageUrl: 'https://picsum.photos/seed/minasgrill/800/600',
  galleryUrls: [],
  phone: '',
  whatsapp: '',
  website: '',
  instagram: '',
  ratingAverage: 0,
  ratingCount: 0,
  viewerRating: null,
  isFavorite: false,
  canRate: false,
  locationLabel: '',
  createdByName: 'Comunidade local',
  canEdit: false,
  publicPath: '',
};

const normalizePhoneLink = (value: string) => {
  const digits = value.replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : '';
};

const normalizeWhatsappLink = (value: string) => {
  const digits = value.replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}` : '';
};

const BusinessDetail: React.FC<BusinessDetailProps> = ({ businessId, user }) => {
  const { showToast } = useToast();
  const [business, setBusiness] = useState<BusinessDetailState>(defaultBusiness);
  const [loading, setLoading] = useState(true);
  const [editingMedia, setEditingMedia] = useState(false);
  const [savingMedia, setSavingMedia] = useState(false);
  const [coverDraft, setCoverDraft] = useState('');
  const [galleryDraft, setGalleryDraft] = useState<string[]>([]);

  useEffect(() => {
    let ignore = false;

    const fetchBusiness = async () => {
      if (!businessId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const response = await fetch(`/api/businesses/${businessId}`);
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error ?? 'Negocio nao encontrado.');
        }

        if (!ignore) {
          const nextBusiness: BusinessDetailState = {
            id: payload.business.id,
            slug: payload.business.slug,
            name: payload.business.name,
            description: payload.business.description || defaultBusiness.description,
            address: payload.business.address,
            category: payload.business.category,
            imageUrl: payload.business.imageUrl || defaultBusiness.imageUrl,
            galleryUrls: Array.isArray(payload.business.galleryUrls) ? payload.business.galleryUrls : [],
            phone: payload.business.phone || '',
            whatsapp: payload.business.whatsapp || '',
            website: payload.business.website || '',
            instagram: payload.business.instagram || '',
            ratingAverage: Number(payload.business.ratingAverage ?? 0),
            ratingCount: Number(payload.business.ratingCount ?? 0),
            viewerRating: payload.business.viewerRating ?? null,
            isFavorite: Boolean(payload.business.isFavorite),
            canRate: Boolean(payload.business.canRate),
            locationLabel: payload.business.locationLabel || '',
            createdByName: payload.business.createdBy?.name || 'Comunidade local',
            canEdit: Boolean(payload.business.canEdit),
            publicPath: payload.business.publicPath || `/negocios/${payload.business.slug || payload.business.id}`,
          };

          setBusiness(nextBusiness);
          setCoverDraft(nextBusiness.imageUrl);
          setGalleryDraft(nextBusiness.galleryUrls);
        }
      } catch (error) {
        console.error('Failed to load business detail:', error);
        if (!ignore) {
          showToast(error instanceof Error ? error.message : 'Nao foi possivel carregar o negocio.', 'error');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void fetchBusiness();

    return () => {
      ignore = true;
    };
  }, [businessId, showToast]);

  const handleCopyUrl = async () => {
    const publicUrl =
      typeof window === 'undefined'
        ? business.publicPath
        : `${window.location.origin}${business.publicPath}`;

    try {
      await navigator.clipboard.writeText(publicUrl);
      showToast('Link do negocio copiado.', 'success');
    } catch {
      showToast(publicUrl, 'info', 5000);
    }
  };

  const handleShare = async () => {
    const publicUrl =
      typeof window === 'undefined'
        ? business.publicPath
        : `${window.location.origin}${business.publicPath}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: business.name,
          text: business.description,
          url: publicUrl,
        });
        return;
      } catch {
        return;
      }
    }

    await handleCopyUrl();
  };

  const handleSaveMedia = async () => {
    setSavingMedia(true);

    try {
      const response = await fetch(`/api/businesses/${business.slug || business.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: normalizeUrlFieldValue(coverDraft),
          galleryUrls: galleryDraft,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        showToast(payload?.error ?? 'Nao foi possivel salvar a galeria.', 'error');
        return;
      }

      const nextImageUrl = payload.business.imageUrl || defaultBusiness.imageUrl;
      const nextGalleryUrls = Array.isArray(payload.business.galleryUrls) ? payload.business.galleryUrls : [];

      setBusiness((current) => ({
        ...current,
        imageUrl: nextImageUrl,
        galleryUrls: nextGalleryUrls,
      }));
      setCoverDraft(nextImageUrl);
      setGalleryDraft(nextGalleryUrls);
      setEditingMedia(false);
      showToast('Capa e galeria atualizadas.', 'success');
    } catch (error) {
      console.error('Failed to save business media:', error);
      showToast('Nao foi possivel salvar a galeria.', 'error');
    } finally {
      setSavingMedia(false);
    }
  };

  const handleFavoriteToggle = async () => {
    try {
      const response = await fetch(`/api/businesses/${business.slug || business.id}/favorite`, {
        method: business.isFavorite ? 'DELETE' : 'POST',
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        showToast(payload?.error ?? 'Nao foi possivel atualizar seus favoritos.', 'error');
        return;
      }

      setBusiness((current) => ({
        ...current,
        isFavorite: Boolean(payload?.isFavorite),
      }));
      showToast(
        payload?.isFavorite ? 'Negocio adicionado aos favoritos.' : 'Negocio removido dos favoritos.',
        'success',
      );
    } catch (error) {
      console.error('Failed to toggle business favorite:', error);
      showToast('Nao foi possivel atualizar seus favoritos.', 'error');
    }
  };

  const handleRateBusiness = async (stars: number) => {
    try {
      const response = await fetch(`/api/businesses/${business.slug || business.id}/rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stars }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        if (payload?.viewerRating) {
          setBusiness((current) => ({
            ...current,
            viewerRating: payload.viewerRating,
          }));
        }

        showToast(payload?.error ?? 'Nao foi possivel registrar sua avaliacao.', 'error');
        return;
      }

      setBusiness((current) => ({
        ...current,
        viewerRating: payload.viewerRating,
        ratingAverage: payload.ratingAverage,
        ratingCount: payload.ratingCount,
      }));
      showToast('Sua avaliacao foi registrada.', 'success');
    } catch (error) {
      console.error('Failed to rate business:', error);
      showToast('Nao foi possivel registrar sua avaliacao.', 'error');
    }
  };

  const publicUrl =
    typeof window === 'undefined'
      ? business.publicPath
      : `${window.location.origin}${business.publicPath}`;

  const callHref = normalizePhoneLink(business.phone || business.whatsapp);
  const whatsappHref = normalizeWhatsappLink(business.whatsapp || business.phone);
  const galleryImages = [business.imageUrl, ...business.galleryUrls].filter(Boolean);

  if (loading) {
    return (
      <div className="animate-in space-y-4 px-5 py-6 fade-in duration-500">
        <div className="h-64 animate-pulse rounded-[32px] bg-white shadow-sm" />
        <div className="space-y-3 rounded-[32px] bg-white p-5 shadow-sm">
          <div className="h-8 w-2/3 animate-pulse rounded-full bg-slate-100" />
          <div className="h-4 w-1/2 animate-pulse rounded-full bg-slate-100" />
          <div className="h-28 animate-pulse rounded-3xl bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in pb-24 fade-in duration-500">
      <div className="relative h-72">
        <img src={business.imageUrl} className="h-full w-full object-cover" alt={business.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
        <div className="absolute right-4 top-4 flex gap-2">
          <button
            type="button"
            onClick={() => void handleFavoriteToggle()}
            className={`rounded-full p-2 shadow backdrop-blur ${
              business.isFavorite
                ? 'bg-rose-500 text-white'
                : 'bg-white/80 text-cyan-900'
            }`}
          >
            <Heart size={20} fill={business.isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button
            type="button"
            onClick={() => void handleShare()}
            className="rounded-full bg-white/80 p-2 text-cyan-900 shadow backdrop-blur"
          >
            <Share2 size={20} />
          </button>
        </div>
        <div className="absolute bottom-5 left-5 right-5">
          <div className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-white backdrop-blur-sm">
            {business.category}
          </div>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-white">{business.name}</h1>
          <p className="mt-2 text-sm text-white/85">{business.locationLabel}</p>
        </div>
      </div>

      <div className="-mt-8 space-y-5 rounded-t-[36px] bg-white px-5 pt-6">
        <div className="rounded-[28px] border border-slate-100 bg-slate-50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="theme-text inline-flex items-center gap-2 text-sm font-bold">
                <Globe2 size={16} />
                URL publica
              </div>
              <p className="break-all text-sm text-slate-600">{publicUrl}</p>
              <p className="text-xs text-slate-400">Criado por {business.createdByName}</p>
            </div>
            <button
              type="button"
              onClick={() => void handleCopyUrl()}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600"
            >
              <Copy size={14} />
              Copiar link
            </button>
          </div>
          <div className="mt-4 rounded-[24px] border border-white bg-white/80 p-4">
            <StarRating
              average={business.ratingAverage}
              count={business.ratingCount}
              viewerRating={business.viewerRating}
              interactive={business.canRate && business.viewerRating === null}
              disabled={!business.canRate || business.viewerRating !== null}
              onRate={(stars) => void handleRateBusiness(stars)}
            />
            {!business.canRate ? (
              <p className="mt-2 text-xs font-medium text-slate-500">
                Proprietarios e administradores nao podem avaliar este negocio.
              </p>
            ) : business.viewerRating ? (
              <p className="mt-2 text-xs font-medium text-slate-500">
                Sua avaliacao ja foi registrada com {business.viewerRating} estrela{business.viewerRating > 1 ? 's' : ''}.
              </p>
            ) : (
              <p className="mt-2 text-xs font-medium text-slate-500">
                Cada usuario pode avaliar este negocio uma unica vez.
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {business.phone ? (
            <a
              href={callHref || undefined}
              className="flex items-center gap-3 rounded-[28px] border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div className="theme-icon-surface flex h-12 w-12 items-center justify-center rounded-2xl">
                <Phone size={20} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Telefone</p>
                <p className="mt-1 text-sm font-bold text-slate-700">{business.phone}</p>
              </div>
            </a>
          ) : null}

          {business.whatsapp ? (
            <a
              href={whatsappHref || undefined}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-[28px] border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <MessageCircle size={20} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">WhatsApp</p>
                <p className="mt-1 text-sm font-bold text-slate-700">{business.whatsapp}</p>
              </div>
            </a>
          ) : null}
        </div>

        <div className="space-y-3 rounded-[32px] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
            <MapPin size={16} />
            Endereco
          </div>
          <p className="theme-text text-base font-bold">{business.address}</p>
          <p className="text-sm leading-relaxed text-slate-600">{business.description}</p>
          <div className="flex flex-wrap gap-2">
            {business.website ? (
              <a
                href={business.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700"
              >
                <Globe2 size={14} />
                Website
              </a>
            ) : null}
            {business.instagram ? (
              <a
                href={`https://instagram.com/${business.instagram.replace(/^@/, '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700"
              >
                <Instagram size={14} />
                {business.instagram}
              </a>
            ) : null}
          </div>
        </div>

        {business.canEdit ? (
          <div className="theme-soft-surface space-y-3 rounded-[32px] border p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="theme-text inline-flex items-center gap-2 text-sm font-bold">
                  <PencilLine size={16} />
                  Gestao de capa e galeria
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {user.role === 'ADMIN'
                    ? 'Voce pode editar a capa e a galeria deste negocio como administrador.'
                    : 'Voce pode manter a vitrine do seu negocio atualizada com novas imagens.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingMedia((current) => !current);
                  setCoverDraft(business.imageUrl);
                  setGalleryDraft(business.galleryUrls);
                }}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600"
              >
                {editingMedia ? 'Fechar' : 'Editar'}
              </button>
            </div>

            {editingMedia ? (
              <div className="space-y-4 rounded-[28px] bg-white p-4 shadow-sm">
                <CloudinaryImageField
                  value={coverDraft}
                  onChange={setCoverDraft}
                  folder="businesses"
                  placeholder="Link da imagem de capa"
                  hint="Essa imagem aparece no topo da pagina do negocio."
                />
                <ImageGalleryField
                  value={galleryDraft}
                  onChange={setGalleryDraft}
                  folder="businesses"
                  hint="Use a galeria para mostrar ambiente, produtos e servicos."
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleSaveMedia()}
                    disabled={savingMedia}
                    className="theme-bg theme-shadow flex-1 rounded-2xl px-4 py-3 text-sm font-bold disabled:opacity-60"
                  >
                    {savingMedia ? 'Salvando...' : 'Salvar midia'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMedia(false);
                      setCoverDraft(business.imageUrl);
                      setGalleryDraft(business.galleryUrls);
                    }}
                    disabled={savingMedia}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-3 pb-8">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
            <Images size={16} />
            Galeria
          </div>
          {galleryImages.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm font-medium text-slate-500">
              Nenhuma imagem adicional cadastrada ainda.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {galleryImages.map((imageUrl, index) => (
                <div key={`${imageUrl}-${index}`} className="overflow-hidden rounded-[28px] border border-slate-100 bg-slate-50 shadow-sm">
                  <img
                    src={imageUrl}
                    className="aspect-square w-full object-cover"
                    alt={`${business.name} - imagem ${index + 1}`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessDetail;

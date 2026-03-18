import React, { useEffect, useState } from 'react';
import {
  CalendarDays,
  Clock3,
  Copy,
  Globe2,
  Heart,
  Images,
  MapPin,
  PencilLine,
  Share2,
} from 'lucide-react';
import StarRating from '../components/engagement/StarRating';
import { useToast } from '../components/feedback/ToastProvider';
import CloudinaryImageField from '../components/forms/CloudinaryImageField';
import ImageGalleryField from '../components/forms/ImageGalleryField';
import { normalizeUrlFieldValue } from '../lib/forms/validation';
import { User } from '../types';

interface EventDetailProps {
  eventId?: string;
  user: User;
}

type EventDetailState = {
  id: string;
  slug: string;
  title: string;
  description: string;
  venueName: string;
  startsAt: string;
  endsAt: string | null;
  locationLabel: string;
  city: string;
  state: string;
  externalUrl: string;
  imageUrl: string;
  galleryUrls: string[];
  ratingAverage: number;
  ratingCount: number;
  viewerRating: number | null;
  isFavorite: boolean;
  canRate: boolean;
  createdByName: string;
  canEdit: boolean;
  publicPath: string;
};

const defaultEvent: EventDetailState = {
  id: '',
  slug: '',
  title: 'Evento da comunidade',
  description: 'Os detalhes deste evento ainda nao foram carregados.',
  venueName: 'Local a definir',
  startsAt: new Date().toISOString(),
  endsAt: null,
  locationLabel: '',
  city: '',
  state: '',
  externalUrl: '',
  imageUrl: 'https://picsum.photos/seed/emigrei-event/900/600',
  galleryUrls: [],
  ratingAverage: 0,
  ratingCount: 0,
  viewerRating: null,
  isFavorite: false,
  canRate: false,
  createdByName: 'Comunidade Emigrei',
  canEdit: false,
  publicPath: '',
};

const formatEventDateTime = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

const EventDetail: React.FC<EventDetailProps> = ({ eventId, user }) => {
  const { showToast } = useToast();
  const [event, setEvent] = useState<EventDetailState>(defaultEvent);
  const [loading, setLoading] = useState(true);
  const [editingMedia, setEditingMedia] = useState(false);
  const [savingMedia, setSavingMedia] = useState(false);
  const [coverDraft, setCoverDraft] = useState('');
  const [galleryDraft, setGalleryDraft] = useState<string[]>([]);

  useEffect(() => {
    let ignore = false;

    const fetchEvent = async () => {
      if (!eventId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const response = await fetch(`/api/events/${eventId}`);
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error ?? 'Evento nao encontrado.');
        }

        if (!ignore) {
          const nextEvent: EventDetailState = {
            id: payload.event.id,
            slug: payload.event.slug,
            title: payload.event.title,
            description: payload.event.description || defaultEvent.description,
            venueName: payload.event.venueName,
            startsAt: payload.event.startsAt,
            endsAt: payload.event.endsAt || null,
            locationLabel: payload.event.locationLabel || '',
            city: payload.event.city || '',
            state: payload.event.state || '',
            externalUrl: payload.event.externalUrl || '',
            imageUrl: payload.event.imageUrl || defaultEvent.imageUrl,
            galleryUrls: Array.isArray(payload.event.galleryUrls) ? payload.event.galleryUrls : [],
            ratingAverage: Number(payload.event.ratingAverage ?? 0),
            ratingCount: Number(payload.event.ratingCount ?? 0),
            viewerRating: payload.event.viewerRating ?? null,
            isFavorite: Boolean(payload.event.isFavorite),
            canRate: Boolean(payload.event.canRate),
            createdByName: payload.event.createdBy?.name || 'Comunidade Emigrei',
            canEdit: Boolean(payload.event.canEdit),
            publicPath: payload.event.publicPath || `/eventos/${payload.event.slug || payload.event.id}`,
          };

          setEvent(nextEvent);
          setCoverDraft(nextEvent.imageUrl);
          setGalleryDraft(nextEvent.galleryUrls);
        }
      } catch (error) {
        console.error('Failed to load event detail:', error);
        if (!ignore) {
          showToast(error instanceof Error ? error.message : 'Nao foi possivel carregar o evento.', 'error');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void fetchEvent();

    return () => {
      ignore = true;
    };
  }, [eventId, showToast]);

  const publicUrl =
    typeof window === 'undefined'
      ? event.publicPath
      : `${window.location.origin}${event.publicPath}`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      showToast('Link do evento copiado.', 'success');
    } catch {
      showToast(publicUrl, 'info', 5000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description,
          url: publicUrl,
        });
        return;
      } catch {
        return;
      }
    }

    await handleCopyUrl();
  };

  const handleFavoriteToggle = async () => {
    try {
      const response = await fetch(`/api/events/${event.slug || event.id}/favorite`, {
        method: event.isFavorite ? 'DELETE' : 'POST',
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        showToast(payload?.error ?? 'Nao foi possivel atualizar seus favoritos.', 'error');
        return;
      }

      setEvent((current) => ({
        ...current,
        isFavorite: Boolean(payload?.isFavorite),
      }));
      showToast(
        payload?.isFavorite ? 'Evento adicionado aos favoritos.' : 'Evento removido dos favoritos.',
        'success',
      );
    } catch (error) {
      console.error('Failed to toggle event favorite:', error);
      showToast('Nao foi possivel atualizar seus favoritos.', 'error');
    }
  };

  const handleRateEvent = async (stars: number) => {
    try {
      const response = await fetch(`/api/events/${event.slug || event.id}/rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stars }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        if (payload?.viewerRating) {
          setEvent((current) => ({
            ...current,
            viewerRating: payload.viewerRating,
          }));
        }

        showToast(payload?.error ?? 'Nao foi possivel registrar sua avaliacao.', 'error');
        return;
      }

      setEvent((current) => ({
        ...current,
        viewerRating: payload.viewerRating,
        ratingAverage: payload.ratingAverage,
        ratingCount: payload.ratingCount,
      }));
      showToast('Sua avaliacao foi registrada.', 'success');
    } catch (error) {
      console.error('Failed to rate event:', error);
      showToast('Nao foi possivel registrar sua avaliacao.', 'error');
    }
  };

  const handleSaveMedia = async () => {
    setSavingMedia(true);

    try {
      const response = await fetch(`/api/events/${event.slug || event.id}`, {
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
        showToast(payload?.error ?? 'Nao foi possivel salvar a galeria do evento.', 'error');
        return;
      }

      const nextImageUrl = payload.event.imageUrl || defaultEvent.imageUrl;
      const nextGalleryUrls = Array.isArray(payload.event.galleryUrls) ? payload.event.galleryUrls : [];

      setEvent((current) => ({
        ...current,
        imageUrl: nextImageUrl,
        galleryUrls: nextGalleryUrls,
      }));
      setCoverDraft(nextImageUrl);
      setGalleryDraft(nextGalleryUrls);
      setEditingMedia(false);
      showToast('Capa e galeria do evento atualizadas.', 'success');
    } catch (error) {
      console.error('Failed to save event media:', error);
      showToast('Nao foi possivel salvar a galeria do evento.', 'error');
    } finally {
      setSavingMedia(false);
    }
  };

  const galleryImages = [event.imageUrl, ...event.galleryUrls].filter(Boolean);

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
        <img src={event.imageUrl} className="h-full w-full object-cover" alt={event.title} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
        <div className="absolute right-4 top-4 flex gap-2">
          <button
            type="button"
            onClick={() => void handleFavoriteToggle()}
            className={`rounded-full p-2 shadow backdrop-blur ${
              event.isFavorite ? 'bg-rose-500 text-white' : 'bg-white/80 text-cyan-900'
            }`}
          >
            <Heart size={20} fill={event.isFavorite ? 'currentColor' : 'none'} />
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
            Evento
          </div>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-white">{event.title}</h1>
          <p className="mt-2 text-sm text-white/85">{event.locationLabel}</p>
        </div>
      </div>

      <div className="-mt-8 space-y-5 rounded-t-[36px] bg-white px-5 pt-6">
        <div className="rounded-[28px] border border-slate-100 bg-slate-50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-sm font-bold text-[#28B8C7]">
                <Globe2 size={16} />
                URL publica
              </div>
              <p className="break-all text-sm text-slate-600">{publicUrl}</p>
              <p className="text-xs text-slate-400">Publicado por {event.createdByName}</p>
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
              average={event.ratingAverage}
              count={event.ratingCount}
              viewerRating={event.viewerRating}
              interactive={event.canRate && event.viewerRating === null}
              disabled={!event.canRate || event.viewerRating !== null}
              onRate={(stars) => void handleRateEvent(stars)}
            />
            {!event.canRate ? (
              <p className="mt-2 text-xs font-medium text-slate-500">
                Organizadores e administradores nao podem avaliar este evento.
              </p>
            ) : event.viewerRating ? (
              <p className="mt-2 text-xs font-medium text-slate-500">
                Sua avaliacao ja foi registrada com {event.viewerRating} estrela{event.viewerRating > 1 ? 's' : ''}.
              </p>
            ) : (
              <p className="mt-2 text-xs font-medium text-slate-500">
                Cada usuario pode avaliar este evento uma unica vez.
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-[28px] border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-[#28B8C7]">
              <CalendarDays size={20} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Data e hora</p>
              <p className="mt-1 text-sm font-bold text-slate-700">{formatEventDateTime(event.startsAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-[28px] border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Clock3 size={20} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Encerramento</p>
              <p className="mt-1 text-sm font-bold text-slate-700">
                {event.endsAt ? formatEventDateTime(event.endsAt) : 'Nao informado'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-[32px] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
            <MapPin size={16} />
            Local do evento
          </div>
          <p className="text-base font-bold text-[#28B8C7]">{event.venueName}</p>
          <div className="space-y-1 text-sm text-slate-600">
            <p>{event.locationLabel}</p>
            {event.city || event.state ? (
              <p>
                {event.city}
                {event.city && event.state ? ', ' : ''}
                {event.state}
              </p>
            ) : null}
          </div>
          <p className="text-sm leading-relaxed text-slate-600">{event.description}</p>
          {event.externalUrl ? (
            <a
              href={event.externalUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700"
            >
              <Globe2 size={14} />
              Link do evento
            </a>
          ) : null}
        </div>

        {event.canEdit ? (
          <div className="space-y-3 rounded-[32px] border border-cyan-100 bg-cyan-50/60 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 text-sm font-bold text-[#28B8C7]">
                  <PencilLine size={16} />
                  Gestao de capa e galeria
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {user.role === 'ADMIN'
                    ? 'Voce pode editar a capa e a galeria deste evento como administrador.'
                    : 'Mantenha a pagina do seu evento atualizada com novas imagens.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingMedia((current) => !current);
                  setCoverDraft(event.imageUrl);
                  setGalleryDraft(event.galleryUrls);
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
                  folder="events"
                  placeholder="Link da imagem de capa"
                  hint="Essa imagem aparece no topo da pagina do evento."
                />
                <ImageGalleryField
                  value={galleryDraft}
                  onChange={setGalleryDraft}
                  folder="events"
                  hint="Use a galeria para mostrar ambiente, palestrantes e bastidores."
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleSaveMedia()}
                    disabled={savingMedia}
                    className="flex-1 rounded-2xl bg-[#28B8C7] px-4 py-3 text-sm font-bold text-white shadow-md disabled:opacity-60"
                  >
                    {savingMedia ? 'Salvando...' : 'Salvar midia'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMedia(false);
                      setCoverDraft(event.imageUrl);
                      setGalleryDraft(event.galleryUrls);
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
                    alt={`${event.title} - imagem ${index + 1}`}
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

export default EventDetail;

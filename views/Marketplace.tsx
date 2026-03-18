import React, { startTransition, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import StarRating from '../components/engagement/StarRating';
import { useToast } from '../components/feedback/ToastProvider';
import CloudinaryImageField from '../components/forms/CloudinaryImageField';
import FieldErrorMessage from '../components/forms/FieldErrorMessage';
import ImageGalleryField from '../components/forms/ImageGalleryField';
import { Heart, MapPin, Plus } from 'lucide-react';
import RegionSelector from '../components/RegionSelector';
import {
  type FieldErrors,
  hasFieldErrors,
  normalizeUrlFieldValue,
  requiredFieldError,
  validateOptionalUrlField,
} from '../lib/forms/validation';
import { EventItem } from '../types';

const SAMPLE_EVENTS: EventItem[] = [
  {
    id: 'sample-event-1',
    title: 'Torneio de Futebol Brasileiro',
    startsAt: new Date(Date.now() + 2 * 86400000).toISOString(),
    venueName: 'Everett Soccer Field',
    locationLabel: 'Boston, 02108',
    imageUrl: 'https://picsum.photos/seed/soccer/300',
  },
  {
    id: 'sample-event-2',
    title: 'Feira Gastronômica Brasileira',
    startsAt: new Date(Date.now() + 5 * 86400000).toISOString(),
    venueName: 'Charles River Park',
    locationLabel: 'Boston, 02108',
    imageUrl: 'https://picsum.photos/seed/foodfest/300',
  },
];

const emptyForm: {
  title: string;
  description: string;
  venueName: string;
  startsAt: string;
  endsAt: string;
  regionKey: string;
  externalUrl: string;
  imageUrl: string;
  galleryUrls: string[];
} = {
  title: '',
  description: '',
  venueName: '',
  startsAt: '',
  endsAt: '',
  regionKey: '',
  externalUrl: '',
  imageUrl: '',
  galleryUrls: [],
};

type EventField =
  | 'title'
  | 'description'
  | 'venueName'
  | 'startsAt'
  | 'regionKey'
  | 'externalUrl'
  | 'imageUrl';

const Marketplace: React.FC = () => {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('Proximos');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [resultScope, setResultScope] = useState<'local' | 'global'>('local');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<EventField>>({});

  const clearFieldError = (field: EventField) => {
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

    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events');
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error ?? 'Nao foi possivel carregar eventos.');
        }

        if (!ignore) {
          startTransition(() => {
            setEvents(payload.events ?? []);
            setResultScope(payload.scope === 'global' ? 'global' : 'local');
          });
        }
      } catch (error) {
        console.error('Failed to load events:', error);
        if (!ignore) {
          setEvents(SAMPLE_EVENTS);
          setResultScope('global');
        }
      }
    };

    fetchEvents();

    return () => {
      ignore = true;
    };
  }, []);

  const handleCreateEvent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: FieldErrors<EventField> = {};

    if (!createForm.title.trim()) {
      nextErrors.title = requiredFieldError('o titulo do evento');
    }

    if (!createForm.description.trim()) {
      nextErrors.description = requiredFieldError('a descricao do evento');
    }

    if (!createForm.venueName.trim()) {
      nextErrors.venueName = requiredFieldError('o local do evento');
    }

    if (!createForm.startsAt.trim()) {
      nextErrors.startsAt = requiredFieldError('a data de inicio');
    }

    if (!createForm.regionKey.trim()) {
      nextErrors.regionKey = requiredFieldError('uma regiao');
    }

    const externalUrlError = validateOptionalUrlField(createForm.externalUrl, 'O link externo');
    if (externalUrlError) {
      nextErrors.externalUrl = externalUrlError;
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
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...createForm,
          startsAt: createForm.startsAt ? new Date(createForm.startsAt).toISOString() : '',
          endsAt: createForm.endsAt ? new Date(createForm.endsAt).toISOString() : undefined,
          externalUrl: normalizeUrlFieldValue(createForm.externalUrl),
          imageUrl: normalizeUrlFieldValue(createForm.imageUrl),
          galleryUrls: createForm.galleryUrls,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        showToast(payload?.error ?? 'Nao foi possivel enviar o evento.', 'error');
        return;
      }

      showToast('Seu evento foi enviado para aprovacao.', 'success');
      setCreateForm(emptyForm);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create event:', error);
      showToast('Nao foi possivel enviar o evento.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFavoriteToggle = async (eventItem: EventItem) => {
    try {
      const response = await fetch(`/api/events/${eventItem.slug || eventItem.id}/favorite`, {
        method: eventItem.isFavorite ? 'DELETE' : 'POST',
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        showToast(payload?.error ?? 'Nao foi possivel atualizar seus favoritos.', 'error');
        return;
      }

      setEvents((current) =>
        current.map((item) =>
          item.id === eventItem.id
            ? {
                ...item,
                isFavorite: Boolean(payload?.isFavorite),
              }
            : item,
        ),
      );
    } catch (error) {
      console.error('Failed to toggle event favorite from list:', error);
      showToast('Nao foi possivel atualizar seus favoritos.', 'error');
    }
  };

  return (
    <div className="px-5 space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-cyan-900">Agenda de Eventos</h1>
          <button
            type="button"
            onClick={() => setShowCreateForm((current) => !current)}
            className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-md"
          >
            <Plus size={14} /> Criar
          </button>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {['Hoje', 'Esta semana', 'Proximos', 'Cultural', 'Networking'].map((tab) => (
                <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shadow-sm border ${activeTab === tab ? 'bg-cyan-600 text-white border-cyan-700' : 'bg-white text-cyan-900 border-slate-100'}`}
                >
                    {tab}
                </button>
            ))}
        </div>

        {showCreateForm ? (
          <form
            onSubmit={handleCreateEvent}
            className="space-y-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"
          >
            <input
              required
              value={createForm.title}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, title: event.target.value }))
              }
              onInput={() => clearFieldError('title')}
              aria-invalid={Boolean(fieldErrors.title)}
              placeholder="Titulo do evento"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-200"
            />
            <FieldErrorMessage message={fieldErrors.title} />
            <textarea
              required
              rows={3}
              value={createForm.description}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, description: event.target.value }))
              }
              onInput={() => clearFieldError('description')}
              aria-invalid={Boolean(fieldErrors.description)}
              placeholder="Descricao do evento"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-200"
            />
            <FieldErrorMessage message={fieldErrors.description} />
            <input
              required
              value={createForm.venueName}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, venueName: event.target.value }))
              }
              onInput={() => clearFieldError('venueName')}
              aria-invalid={Boolean(fieldErrors.venueName)}
              placeholder="Local"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-200"
            />
            <FieldErrorMessage message={fieldErrors.venueName} />
            <div className="grid grid-cols-2 gap-3">
              <input
                required
                type="datetime-local"
                value={createForm.startsAt}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, startsAt: event.target.value }))
                }
                onInput={() => clearFieldError('startsAt')}
                aria-invalid={Boolean(fieldErrors.startsAt)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-200"
              />
              <input
                type="datetime-local"
                value={createForm.endsAt}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, endsAt: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-200"
              />
            </div>
            <FieldErrorMessage message={fieldErrors.startsAt} />
            <RegionSelector
              value={createForm.regionKey}
              onChange={(region) => {
                clearFieldError('regionKey');
                setCreateForm((current) => ({ ...current, regionKey: region.key }));
              }}
              hint="Escolha uma regiao existente para padronizar a agenda."
            />
            <FieldErrorMessage message={fieldErrors.regionKey} />
            <input
              value={createForm.externalUrl}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, externalUrl: event.target.value }))
              }
              onInput={() => clearFieldError('externalUrl')}
              aria-invalid={Boolean(fieldErrors.externalUrl)}
              placeholder="Link externo do evento"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-200"
            />
            <FieldErrorMessage message={fieldErrors.externalUrl} />
            <CloudinaryImageField
              value={createForm.imageUrl}
              onChange={(value) =>
                setCreateForm((current) => ({ ...current, imageUrl: value }))
              }
              onClearError={() => clearFieldError('imageUrl')}
              error={fieldErrors.imageUrl}
              folder="events"
              placeholder="Link da imagem do evento"
              hint="Envie a imagem do evento pela Cloudinary ou cole uma URL publica."
            />
            <ImageGalleryField
              value={createForm.galleryUrls}
              onChange={(value) =>
                setCreateForm((current) => ({ ...current, galleryUrls: value }))
              }
              folder="events"
              hint="Adicione mais imagens para a pagina detalhada do evento."
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

      <div className="space-y-4">
        <h2 className="font-bold text-cyan-900">Eventos proximos</h2>
        {resultScope === 'global' && events.length > 0 ? (
          <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
            Ainda nao ha eventos publicados na sua regiao. Mostrando eventos de outras regioes.
          </div>
        ) : null}
        {events.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center text-sm font-medium text-slate-500">
            Nenhum evento aprovado nesta regiao ainda.
          </div>
        ) : null}
        {events.map((item) => (
          <EventCard
            key={item.id}
            item={item}
            href={`/eventos/${item.slug || item.id}`}
            title={item.title}
            date={formatEventDate(item.startsAt)}
            location={item.venueName}
            region={item.locationLabel}
            img={item.imageUrl || `https://picsum.photos/seed/${item.id}/300`}
            onToggleFavorite={() => void handleFavoriteToggle(item)}
          />
        ))}
      </div>
    </div>
  );
};

const formatEventDate = (value: string) => {
  const date = new Date(value);
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const EventCard: React.FC<{
  item: EventItem;
  href: string;
  title: string;
  date: string;
  location: string;
  region: string;
  img: string;
  onToggleFavorite: () => void;
}> = ({ item, href, title, date, location, region, img, onToggleFavorite }) => (
    <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-50 flex gap-4">
        <img src={img} className="w-24 h-24 rounded-2xl object-cover" alt={title} />
        <div className="flex-1 flex flex-col justify-between">
            <div>
                <div className="flex items-start justify-between gap-3">
                    <h4 className="font-bold text-cyan-900 text-sm leading-tight">{title}</h4>
                    <button
                        type="button"
                        onClick={onToggleFavorite}
                        className={`rounded-full p-2 ${item.isFavorite ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}
                        aria-label={item.isFavorite ? 'Remover dos favoritos' : 'Favoritar evento'}
                    >
                        <Heart size={14} fill={item.isFavorite ? 'currentColor' : 'none'} />
                    </button>
                </div>
                <p className="text-slate-500 text-[10px] mt-1 font-medium">{date}</p>
                <div className="flex items-center gap-1 text-cyan-600 text-[10px] font-bold mt-2">
                    <MapPin size={10} fill="currentColor" /> {location}
                </div>
                <p className="mt-1 text-[10px] text-slate-400">{region}</p>
                <div className="mt-2">
                    <StarRating average={item.ratingAverage ?? 0} count={item.ratingCount ?? 0} compact />
                </div>
            </div>
            <Link href={href} className="self-end bg-cyan-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-bold shadow-sm">
                Ver evento
            </Link>
        </div>
    </div>
);

export default Marketplace;

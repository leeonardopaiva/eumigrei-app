import React, { startTransition, useEffect, useState } from 'react';
import { MapPin, Plus } from 'lucide-react';
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

const emptyForm = {
  title: '',
  description: '',
  venueName: '',
  startsAt: '',
  endsAt: '',
  locationLabel: '',
  externalUrl: '',
  imageUrl: '',
};

const Marketplace: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Proximos');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [resultScope, setResultScope] = useState<'local' | 'global'>('local');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState(emptyForm);

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
    setFeedback(null);
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
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setFeedback(payload?.error ?? 'Nao foi possivel enviar o evento.');
        return;
      }

      setFeedback('Seu evento foi enviado para aprovacao.');
      setCreateForm(emptyForm);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create event:', error);
      setFeedback('Nao foi possivel enviar o evento.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-5 space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-blue-900">Agenda de Eventos</h1>
          <button
            type="button"
            onClick={() => setShowCreateForm((current) => !current)}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-900 px-4 py-2 text-xs font-bold text-white shadow-md"
          >
            <Plus size={14} /> Criar
          </button>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {['Hoje', 'Esta semana', 'Proximos', 'Cultural', 'Networking'].map((tab) => (
                <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shadow-sm border ${activeTab === tab ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-blue-900 border-slate-100'}`}
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
              placeholder="Titulo do evento"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
            <textarea
              required
              rows={3}
              value={createForm.description}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Descricao do evento"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
            <input
              required
              value={createForm.venueName}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, venueName: event.target.value }))
              }
              placeholder="Local"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                required
                type="datetime-local"
                value={createForm.startsAt}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, startsAt: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />
              <input
                type="datetime-local"
                value={createForm.endsAt}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, endsAt: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <input
              required
              value={createForm.locationLabel}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, locationLabel: event.target.value }))
              }
              placeholder="Cidade / regiao"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-blue-900 px-4 py-3 text-sm font-bold text-white shadow-md disabled:opacity-60"
            >
              {submitting ? 'Enviando...' : 'Enviar para aprovacao'}
            </button>
          </form>
        ) : null}

        {feedback ? (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
            {feedback}
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        <h2 className="font-bold text-blue-900">Eventos proximos</h2>
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
            title={item.title}
            date={formatEventDate(item.startsAt)}
            location={item.venueName}
            region={item.locationLabel}
            img={item.imageUrl || `https://picsum.photos/seed/${item.id}/300`}
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

const EventCard: React.FC<{ title: string; date: string; location: string; region: string; img: string }> = ({ title, date, location, region, img }) => (
    <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-50 flex gap-4">
        <img src={img} className="w-24 h-24 rounded-2xl object-cover" alt={title} />
        <div className="flex-1 flex flex-col justify-between">
            <div>
                <h4 className="font-bold text-blue-900 text-sm leading-tight">{title}</h4>
                <p className="text-slate-500 text-[10px] mt-1 font-medium">{date}</p>
                <div className="flex items-center gap-1 text-blue-600 text-[10px] font-bold mt-2">
                    <MapPin size={10} fill="currentColor" /> {location}
                </div>
                <p className="mt-1 text-[10px] text-slate-400">{region}</p>
            </div>
            <button className="self-end bg-blue-900 text-white px-4 py-1.5 rounded-xl text-[10px] font-bold shadow-sm">
                Ver evento
            </button>
        </div>
    </div>
);

export default Marketplace;

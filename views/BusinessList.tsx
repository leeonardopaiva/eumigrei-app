import React, { startTransition, useDeferredValue, useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Star, MapPin, Plus } from 'lucide-react';
import { Business } from '../types';

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
  phone: '',
  whatsapp: '',
  website: '',
  instagram: '',
  imageUrl: '',
};

const BusinessList: React.FC = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeFilter, setActiveFilter] = useState('Restaurante');
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState(emptyForm);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    let ignore = false;

    const fetchBusinesses = async () => {
      try {
        const params = new URLSearchParams();
        if (activeFilter) {
          params.set('category', activeFilter);
        }
        if (deferredSearch.trim()) {
          params.set('search', deferredSearch.trim());
        }

        const response = await fetch(`/api/businesses?${params.toString()}`);
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error ?? 'Nao foi possivel carregar negocios.');
        }

        if (!ignore) {
          startTransition(() => {
            setBusinesses(payload.businesses ?? []);
          });
        }
      } catch (error) {
        console.error('Failed to load businesses:', error);
        if (!ignore) {
          setBusinesses(SAMPLE_BUSINESSES);
        }
      }
    };

    fetchBusinesses();

    return () => {
      ignore = true;
    };
  }, [activeFilter, deferredSearch]);

  const handleCreateBusiness = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setFeedback(payload?.error ?? 'Nao foi possivel enviar seu negocio.');
        return;
      }

      setFeedback('Seu negocio foi enviado para aprovacao.');
      setCreateForm(emptyForm);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create business:', error);
      setFeedback('Nao foi possivel enviar seu negocio.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-5 space-y-6 animate-in fade-in duration-500">
      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-blue-900">Negocios</h1>
          <button
            type="button"
            onClick={() => setShowCreateForm((current) => !current)}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-900 px-4 py-2 text-xs font-bold text-white shadow-md"
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
              placeholder="Nome do negocio"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={createForm.category}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, category: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
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
                  setCreateForm((current) => ({ ...current, phone: event.target.value }))
                }
                placeholder="Telefone"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <input
              required
              value={createForm.address}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, address: event.target.value }))
              }
              placeholder="Endereco"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
            <textarea
              required
              rows={3}
              value={createForm.description}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Descricao do negocio"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                value={createForm.website}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, website: event.target.value }))
                }
                placeholder="Website"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />
              <input
                value={createForm.instagram}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, instagram: event.target.value }))
                }
                placeholder="Instagram"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
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

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['Restaurante', 'Mercado', 'Beleza', 'Saude'].map((category) => (
          <button
            key={category}
            onClick={() => setActiveFilter(category)}
            className={`px-6 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shadow-sm border ${
              activeFilter === category
                ? 'bg-blue-900 text-white border-blue-900'
                : 'bg-white text-blue-900 border-slate-100'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="space-y-4 pb-20">
        <h2 className="font-bold text-blue-900">Negocios disponiveis</h2>
        {businesses.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center text-sm font-medium text-slate-500">
            Nenhum negocio publicado nesta regiao ainda.
          </div>
        ) : null}
        {businesses.map((business) => (
          <div key={business.id} className="bg-white rounded-3xl p-4 shadow-sm border border-slate-50 flex gap-4">
            <img
              src={business.imageUrl || `https://picsum.photos/seed/${business.id}/200`}
              className="w-24 h-24 rounded-2xl object-cover"
              alt={business.name}
            />
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-blue-900">{business.name}</h4>
                <div className="flex items-center gap-1 text-yellow-400 text-xs">
                  {[...Array(5)].map((_, index) => (
                    <Star key={index} size={12} fill={index < 4 ? 'currentColor' : 'none'} />
                  ))}
                  <span className="text-slate-400 text-[10px] font-medium ml-1">
                    comunidade local
                  </span>
                </div>
                <p className="text-blue-600 text-[10px] font-bold mt-0.5">{business.category}</p>
                <div className="flex items-center gap-1 text-slate-500 text-[10px] mt-1">
                  <MapPin size={10} /> {business.address}
                </div>
              </div>
              <Link href={`/negocios/${business.id}`} className="self-end bg-blue-900 text-white px-4 py-1.5 rounded-xl text-[10px] font-bold shadow-sm">
                Ver perfil
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BusinessList;

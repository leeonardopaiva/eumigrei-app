'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  MapPin,
  Search,
  ArrowRight,
  ChevronDown,
  Building2,
  Users,
  CalendarDays,
  type LucideIcon,
} from 'lucide-react';
import { useToast } from '../components/feedback/ToastProvider';
import RegionSelector from '../components/RegionSelector';
import { BannerAd, User } from '../types';

const Home: React.FC<{ user: User }> = ({ user }) => {
  const { update } = useSession();
  const { showToast } = useToast();
  const [editingRegion, setEditingRegion] = useState(false);
  const [selectedRegionKey, setSelectedRegionKey] = useState(user.regionKey || '');
  const [savingRegion, setSavingRegion] = useState(false);
  const [banners, setBanners] = useState<BannerAd[]>([]);

  useEffect(() => {
    setSelectedRegionKey(user.regionKey || '');
  }, [user.regionKey]);

  useEffect(() => {
    let ignore = false;

    const fetchBanners = async () => {
      try {
        const response = await fetch('/api/banners', { cache: 'no-store' });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error ?? 'Nao foi possivel carregar banners.');
        }

        if (!ignore) {
          setBanners(Array.isArray(payload?.banners) ? payload.banners : []);
        }
      } catch (error) {
        console.error('Failed to load home banners:', error);

        if (!ignore) {
          setBanners([]);
        }
      }
    };

    void fetchBanners();

    return () => {
      ignore = true;
    };
  }, [user.regionKey]);

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
      showToast('Regiao de visualizacao atualizada.', 'success');
    } catch (error) {
      console.error('Failed to update region from home:', error);
      showToast('Nao foi possivel atualizar a sua regiao.', 'error');
    } finally {
      setSavingRegion(false);
    }
  };

  return (
    <div className="animate-in space-y-6 px-6 fade-in slide-in-from-bottom-4 duration-500">
      <div className="mt-4">
        <p className="text-lg font-medium text-slate-500">Ola, {user.name}!</p>
        <button
          type="button"
          onClick={() => {
            setEditingRegion((current) => !current);
          }}
          className="mt-1 inline-flex items-center gap-2 rounded-2xl border border-transparent text-left text-2xl font-bold text-[#333] transition hover:border-slate-200 hover:bg-white/70 hover:px-2 hover:py-1"
        >
          <span>{user.location}</span>
          <div className="rounded-full bg-white p-1 shadow-sm">
            <MapPin size={18} className="text-[#28A745]" />
          </div>
          <ChevronDown
            size={18}
            className={`text-slate-400 transition-transform ${editingRegion ? 'rotate-180' : ''}`}
          />
        </button>

        {editingRegion ? (
          <div className="mt-4 rounded-[28px] border border-slate-100 bg-white/95 p-4 shadow-sm backdrop-blur">
            <RegionSelector
              value={selectedRegionKey}
              onChange={(region) => {
                setSelectedRegionKey(region.key);
              }}
              autoDetect
              hint="Escolha a regiao para priorizar negocios, comunidade e eventos."
            />

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={handleRegionSave}
                disabled={savingRegion}
                className="flex-1 rounded-2xl bg-[#28B8C7] px-4 py-3 text-sm font-bold text-white shadow-md disabled:opacity-60"
              >
                {savingRegion ? 'Salvando...' : 'Salvar regiao'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingRegion(false);
                  setSelectedRegionKey(user.regionKey || '');
                }}
                disabled={savingRegion}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 disabled:opacity-60"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : null}

      </div>

      <div className="relative overflow-hidden rounded-full shadow-sm">
        <input
          type="text"
          placeholder="Busque negocios, eventos e temas da comunidade"
          className="w-full border-none bg-white py-5 pl-14 pr-6 text-sm placeholder:text-slate-400 focus:ring-0"
        />
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <ServiceCard href="/negocios" icon={Building2} label="Negocios" />
        <ServiceCard href="/community" icon={Users} label="Comunidade" />
        <ServiceCard href="/eventos" icon={CalendarDays} label="Eventos" />
      </div>

      {banners.length > 0 ? (
        <div className="space-y-3">
          <div className="flex snap-x gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {banners.map((banner) => (
              <a
                key={banner.id}
                href={banner.targetUrl}
                target="_blank"
                rel="noreferrer"
                className="group relative h-[240px] min-w-full snap-center overflow-hidden rounded-[40px] shadow-lg"
              >
                <img
                  src={banner.imageUrl}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  alt={banner.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                <div className="absolute left-8 top-8 right-8">
                  <div className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-sm">
                    {banner.regionLabel || 'Toda a comunidade'}
                  </div>
                  <h3 className="mt-4 text-3xl font-bold leading-tight text-white drop-shadow-md">
                    {banner.name}
                  </h3>
                </div>
                <div className="absolute bottom-8 left-8 flex h-14 w-14 items-center justify-center rounded-full bg-[#FF8C00] text-white shadow-2xl transition-colors group-hover:bg-[#E07B00]">
                  <ArrowRight size={24} strokeWidth={3} />
                </div>
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <div className="h-10" />
    </div>
  );
};

const ServiceCard: React.FC<{ href: string; icon: LucideIcon; label: string }> = ({
  href,
  icon: Icon,
  label,
}) => (
  <Link
    href={href}
    className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-slate-50 bg-white p-5 shadow-sm transition-all hover:shadow-md active:scale-95"
  >
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-[#28B8C7]">
      <Icon size={24} strokeWidth={2.2} />
    </div>
    <span className="text-center text-[11px] font-bold leading-tight text-[#333]">{label}</span>
  </Link>
);

export default Home;

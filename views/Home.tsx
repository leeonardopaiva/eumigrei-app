'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  MapPin,
  Search,
  ChevronDown,
  ExternalLink,
  Building2,
  Briefcase,
  Users,
  CalendarDays,
  Newspaper,
  ShoppingBag,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { useToast } from '../components/feedback/ToastProvider';
import RegionSelector from '../components/RegionSelector';
import { trackAnalyticsEvent } from '../lib/analytics';
import { BannerAd, User } from '../types';

const animatedSearchTerms = ['restaurantes', 'bares', 'eventos', 'pessoas'];

const Home: React.FC<{ user: User }> = ({ user }) => {
  const router = useRouter();
  const { update } = useSession();
  const { showToast } = useToast();
  const [editingRegion, setEditingRegion] = useState(false);
  const [selectedRegionKey, setSelectedRegionKey] = useState(user.regionKey || '');
  const [savingRegion, setSavingRegion] = useState(false);
  const [banners, setBanners] = useState<BannerAd[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [submittingBannerId, setSubmittingBannerId] = useState<string | null>(null);
  const [searchPlaceholderIndex, setSearchPlaceholderIndex] = useState(0);

  useEffect(() => {
    setSelectedRegionKey(user.regionKey || '');
  }, [user.regionKey]);

  useEffect(() => {
    if (activeBannerIndex <= Math.max(banners.length - 1, 0)) {
      return;
    }

    setActiveBannerIndex(0);
  }, [activeBannerIndex, banners.length]);

  useEffect(() => {
    if (banners.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveBannerIndex((current) => (current + 1) % banners.length);
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [banners.length]);

  useEffect(() => {
    let ignore = false;

    const fetchBanners = async () => {
      try {
        const response = await fetch('/api/banners?placement=home', { cache: 'no-store' });
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

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSearchPlaceholderIndex((current) => (current + 1) % animatedSearchTerms.length);
    }, 2200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

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

  const handleDisabledFeatureClick = (targetKey: string, label: string) => {
    showToast(`${label} chega em breve.`, 'info');
    trackAnalyticsEvent({
      type: 'disabled_feature_click',
      targetType: 'feature',
      targetKey,
      label,
      sourcePath: '/',
      sourceSection: 'home_services',
      regionKey: user.regionKey,
    });
  };

  const handleBannerLinkClick = (banner: BannerAd) => {
    if (!banner.targetUrl) {
      showToast('Esse banner ainda nao tem um link configurado.', 'error');
      return;
    }

    trackAnalyticsEvent({
      type: 'banner_click',
      targetType: 'banner',
      targetKey: banner.id,
      label: banner.name,
      sourcePath: '/',
      sourceSection: 'home_banner',
      regionKey: user.regionKey,
    });

    window.open(banner.targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleBannerRegistration = async (banner: BannerAd) => {
    setSubmittingBannerId(banner.id);

    try {
      const response = await fetch(`/api/banners/${banner.id}/registration`, {
        method: 'POST',
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Nao foi possivel registrar seu interesse.');
      }

      showToast(payload?.message ?? 'Cadastro registrado.', 'success');
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Nao foi possivel registrar seu interesse.',
        'error',
      );
    } finally {
      setSubmittingBannerId(null);
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
                className="theme-bg theme-shadow flex-1 rounded-2xl px-4 py-3 text-sm font-bold disabled:opacity-60"
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

      <form
        onSubmit={(event) => {
          event.preventDefault();
          const trimmed = searchQuery.trim();

          if (!trimmed) {
            return;
          }

          router.push(`/buscar?q=${encodeURIComponent(trimmed)}`);
        }}
        className="relative overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm transition-all theme-outline-ring"
      >
        {!searchQuery ? (
          <div className="pointer-events-none absolute inset-y-0 left-14 right-6 flex items-center text-sm text-slate-400">
            <span>Busque por&nbsp;</span>
            <span
              key={animatedSearchTerms[searchPlaceholderIndex]}
              className="theme-text animate-in font-bold fade-in duration-300"
            >
              {animatedSearchTerms[searchPlaceholderIndex]}
            </span>
          </div>
        ) : null}
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder=""
          className="w-full bg-transparent py-5 pl-14 pr-6 text-sm text-slate-700 outline-none"
        />
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
      </form>

      <div className="grid grid-cols-3 gap-3">
        <ServiceCard href="/negocios" icon={Building2} label="Negocios" />
        <ServiceCard href="/community" icon={Users} label="Comunidade" />
        <ServiceCard href="/eventos" icon={CalendarDays} label="Eventos" />
        <ServiceCard
          href="/vagas"
          icon={Briefcase}
          label="Vagas"
          disabled
          onDisabledClick={() => handleDisabledFeatureClick('vagas', 'Vagas')}
        />
        <ServiceCard
          href="/marketplace"
          icon={ShoppingBag}
          label="Marketplace"
          disabled
          onDisabledClick={() => handleDisabledFeatureClick('marketplace', 'Marketplace')}
        />
        <ServiceCard
          href="/noticias"
          icon={Newspaper}
          label="Noticias"
          disabled
          onDisabledClick={() => handleDisabledFeatureClick('noticias', 'Noticias')}
        />
      </div>

      {banners.length > 0 ? (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-[40px]">
            <div
              className="flex transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-${activeBannerIndex * 100}%)` }}
            >
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className="group relative h-[240px] w-full flex-none overflow-hidden rounded-[40px] shadow-lg"
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
                  {banner.type === 'REGISTRATION' ? (
                    <button
                      type="button"
                      onClick={() => void handleBannerRegistration(banner)}
                      disabled={submittingBannerId === banner.id}
                      className="absolute bottom-8 left-8 inline-flex min-h-14 items-center gap-3 rounded-full bg-[#FF8C00] px-5 text-sm font-bold text-white shadow-2xl transition-colors hover:bg-[#E07B00] disabled:opacity-70"
                    >
                      <UserPlus size={20} strokeWidth={2.8} />
                      {submittingBannerId === banner.id ? 'Registrando...' : 'Tenho interesse'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleBannerLinkClick(banner)}
                      className="absolute bottom-8 left-8 flex h-14 w-14 items-center justify-center rounded-full bg-[#FF8C00] text-white shadow-2xl transition-colors hover:bg-[#E07B00]"
                      aria-label={`Abrir ${banner.name}`}
                    >
                      <ExternalLink size={22} strokeWidth={3} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          {banners.length > 1 ? (
            <div className="flex items-center justify-center gap-2">
              {banners.map((banner, index) => (
                <button
                  key={banner.id}
                  type="button"
                  onClick={() => setActiveBannerIndex(index)}
                  aria-label={`Ir para banner ${index + 1}`}
                  className={`h-2.5 rounded-full transition-all ${
                    index === activeBannerIndex ? 'theme-bg w-6' : 'w-2.5 bg-slate-300'
                  }`}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="h-10" />
    </div>
  );
};

const ServiceCard: React.FC<{
  href: string;
  icon: LucideIcon;
  label: string;
  disabled?: boolean;
  onDisabledClick?: () => void;
}> = ({
  href,
  icon: Icon,
  label,
  disabled = false,
  onDisabledClick,
}) => {
  const classes = `flex flex-col items-center justify-center gap-3 rounded-3xl border p-5 shadow-sm transition-all ${
    disabled
      ? 'cursor-pointer border-slate-200 bg-slate-50/90 opacity-70'
      : 'border-slate-50 bg-white hover:shadow-md active:scale-95'
  }`;

  const content = (
    <>
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
          disabled ? 'bg-slate-200 text-slate-500' : 'theme-icon-surface'
        }`}
      >
        <Icon size={24} strokeWidth={2.2} />
      </div>
      <div className="space-y-1 text-center">
        <span className={`block text-[11px] font-bold leading-tight ${disabled ? 'text-slate-500' : 'text-[#333]'}`}>
          {label}
        </span>
        {disabled ? (
          <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Em breve
          </span>
        ) : null}
      </div>
    </>
  );

  if (disabled) {
    return (
      <button type="button" aria-disabled="true" onClick={onDisabledClick} className={classes}>
        {content}
      </button>
    );
  }

  return (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
};

export default Home;

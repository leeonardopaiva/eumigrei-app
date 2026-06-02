'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  MapPin,
  ChevronDown,
  ExternalLink,
  Building2,
  Briefcase,
  MessageSquare,
  Users,
  CalendarDays,
  Newspaper,
  ShoppingBag,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { useToast } from '../components/feedback/ToastProvider';
import RegionSelector from '../components/RegionSelector';
import UnifiedSearchInput from '../components/search/UnifiedSearchInput';
import { useRegionBanners, useRegionCommunityPosts, useRegionGroups } from '../hooks/useRegionContent';
import { DEFAULT_AVATAR_URL } from '../lib/avatar';
import { formatRelativeTime } from '../components/community/utils';
import { trackAnalyticsEvent } from '../lib/analytics';
import { BannerAd, User } from '../types';

const animatedSearchTerms = ['restaurantes', 'bares', 'eventos', 'pessoas'];

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

const formatCompactMemberCount = (count: number) => {
  if (count < 1000) {
    return `${count}`;
  }

  const compactValue = count / 1000;
  const formattedValue = Number.isInteger(compactValue) ? compactValue.toFixed(0) : compactValue.toFixed(1);

  return `${formattedValue.replace('.', ',')}k`;
};

const Home: React.FC<{ user: User }> = ({ user }) => {
  const router = useRouter();
  const { update } = useSession();
  const { showToast } = useToast();
  const [editingRegion, setEditingRegion] = useState(false);
  const [selectedRegionKey, setSelectedRegionKey] = useState(user.regionKey || '');
  const [savingRegion, setSavingRegion] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [submittingBannerId, setSubmittingBannerId] = useState<string | null>(null);
  const [searchPlaceholderIndex, setSearchPlaceholderIndex] = useState(0);
  const { data: banners } = useRegionBanners('home', user.regionKey);
  const { data: communityPosts } = useRegionCommunityPosts(user.regionKey, 4);
  const { data: popularGroups } = useRegionGroups(user.regionKey, 2);

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
    <div className="animate-in space-y-5 px-5 fade-in slide-in-from-bottom-4 duration-500 lg:px-0">
      <div className="mt-3">
        <button
          type="button"
          onClick={() => {
            setEditingRegion((current) => !current);
          }}
          className="inline-flex items-center gap-2 text-left text-sm font-semibold text-[#1f2a37] transition hover:text-[#00509D]"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#EAF4FF] text-[#00509D]">
            <MapPin size={16} />
          </span>
          <span className="leading-none">{user.location}</span>
          <ChevronDown
            size={16}
            className={`text-[#00509D] transition-transform ${editingRegion ? 'rotate-180' : ''}`}
          />
        </button>

        {editingRegion ? (
          <div className="mt-3">
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
                className="theme-bg theme-shadow flex-1 rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-60"
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
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 disabled:opacity-60"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <UnifiedSearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        animatedTerms={animatedSearchTerms}
        animatedIndex={searchPlaceholderIndex}
        onSubmit={() => {
          const trimmed = searchQuery.trim();
          if (!trimmed) return;
          router.push(`/buscar?q=${encodeURIComponent(trimmed)}`);
        }}
      />

      <div className="grid grid-cols-3 gap-3">
        <ServiceCard href="/negocios" icon={Building2} label="Negocios" onActivate={() => router.push('/negocios')} />
        <ServiceCard href="/community" icon={Users} label="Comunidade" onActivate={() => router.push('/community')} />
        <ServiceCard href="/eventos" icon={CalendarDays} label="Eventos" onActivate={() => router.push('/eventos')} />
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
          href="/moradia"
          icon={Newspaper}
          label="Moradia"
          disabled
          onDisabledClick={() => handleDisabledFeatureClick('moradia', 'Moradia')}
        />
      </div>

      {banners.length > 0 ? (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl">
            <div
              className="flex transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-${activeBannerIndex * 100}%)` }}
            >
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className="group relative h-[240px] w-full flex-none overflow-hidden rounded-2xl shadow-sm"
                >
                  <img
                    src={banner.imageUrl}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    alt={banner.name}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                  <div className="absolute left-8 top-8 right-8">
                    <div className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-sm">
                      Patrocinado · {banner.regionLabel || 'Toda a comunidade'}
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
                      className="absolute bottom-8 left-8 inline-flex min-h-12 items-center gap-3 rounded-xl bg-[#FF8C00] px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#E07B00] disabled:opacity-70"
                    >
                      <UserPlus size={20} strokeWidth={2.8} />
                      {submittingBannerId === banner.id ? 'Registrando...' : 'Tenho interesse'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleBannerLinkClick(banner)}
                      className="absolute bottom-8 left-8 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF8C00] text-white shadow-sm transition-colors hover:bg-[#E07B00]"
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

      {communityPosts.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Comunidade agora</h3>
              <p className="text-[11px] text-slate-500">Os 4 posts mais recentes</p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/community')}
              className="text-sm font-semibold text-[#00509D]"
            >
              Ver tudo
            </button>
          </div>
          <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {communityPosts.map((post) => (
              <Link
                key={post.id}
                href={`/community?post=${encodeURIComponent(post.id)}`}
                className="flex items-start gap-3 px-3 py-3.5 transition hover:bg-slate-50 sm:px-4"
              >
                <img
                  src={post.author.image || DEFAULT_AVATAR_URL}
                  alt={post.author.name}
                  className="h-9 w-9 flex-none rounded-full object-cover"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[13px] font-bold text-slate-900">{post.author.name}</p>
                    <span className="text-[10px] text-slate-300">•</span>
                    <p className="whitespace-nowrap text-[11px] text-slate-500">
                      {formatRelativeTime(post.createdAt)}
                    </p>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-slate-600">{post.content}</p>
                </div>

                <div className="ml-1 mt-0.5 flex flex-none flex-col items-end gap-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-[#F4F8FF] px-3 py-1.5 text-[11px] font-bold text-[#00509D]">
                    <MessageSquare size={14} className="text-[#00509D]" />
                    <span>{post.commentCount} comentários</span>
                  </div>
                  {post.imageUrl ? (
                    <img
                      src={post.imageUrl}
                      alt="Miniatura do post"
                      className="h-10 w-10 rounded-full border border-slate-100 object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full border border-dashed border-slate-200 bg-slate-50" />
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {popularGroups.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Grupos populares</h3>
              <p className="text-[11px] text-slate-500">Mais ativos e recentes na sua região</p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/grupos')}
              className="text-sm font-semibold text-[#00509D]"
            >
              Ver tudo
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {popularGroups.map((group) => {
              const previewMembers = group.memberPreviews.slice(0, 4);
              const missingAvatars = Math.max(group.memberCount - previewMembers.length, 0);

              return (
                <Link
                  key={group.id}
                  href={group.publicPath}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                    {group.imageUrl ? (
                      <img src={group.imageUrl} alt={group.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#EAF4FF] to-[#D9ECFF] text-sm font-bold text-[#00509D]">
                        {getInitials(group.name)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-slate-900">{group.name}</p>
                    <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                      {formatCompactMemberCount(group.memberCount)} membros
                    </p>

                    <div className="mt-2 flex items-center">
                      <div className="flex items-center">
                        {previewMembers.map((member, index) => (
                          <div
                            key={member.id}
                            className={`relative h-6 w-6 overflow-hidden rounded-full border-2 border-white bg-slate-100 ${
                              index === 0 ? '' : '-ml-2'
                            }`}
                          >
                            {member.image ? (
                              <img
                                src={member.image}
                                alt={member.name || 'Membro do grupo'}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-slate-200 text-[9px] font-bold text-slate-600">
                                {getInitials(member.name || 'Membro')}
                              </div>
                            )}
                          </div>
                        ))}

                        {missingAvatars > 0 ? (
                          <div className="-ml-2 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-[#EAF4FF] px-1 text-[9px] font-bold text-[#00509D]">
                            +{missingAvatars}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
};

const ServiceCard: React.FC<{
  href: string;
  icon: LucideIcon;
  label: string;
  disabled?: boolean;
  onDisabledClick?: () => void;
  onActivate?: () => void;
}> = ({
  href,
  icon: Icon,
  label,
  disabled = false,
  onDisabledClick,
  onActivate,
}) => {
  const classes = `flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 shadow-sm transition-all ${
    disabled
      ? 'cursor-pointer border-slate-200 bg-white opacity-60'
      : 'border-slate-200 bg-white hover:border-slate-300 active:scale-95'
  }`;

  const content = (
    <>
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          disabled ? 'bg-slate-100 text-slate-400' : 'theme-icon-surface'
        }`}
      >
        <Icon size={21} strokeWidth={2.2} />
      </div>
      <div className="space-y-1 text-center">
        <span className={`block text-[11px] font-bold leading-tight ${disabled ? 'text-slate-500' : 'text-[#333]'}`}>
          {label}
        </span>
        {disabled ? (
          <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">
            {/* Em breve */}
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

  if (onActivate) {
    return (
      <button type="button" onClick={onActivate} className={classes}>
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

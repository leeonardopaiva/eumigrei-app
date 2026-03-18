import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Images, MapPin, MessageSquareText, UserPlus, Users } from 'lucide-react';
import StarRating from '../components/engagement/StarRating';
import { Logo } from '../components/Layout';
import { PublicUserProfile, User } from '../types';

type PublicProfileProps = {
  username: string;
  viewer?: User | null;
  embedded?: boolean;
};

type PublicTab = 'about' | 'businesses' | 'events' | 'posts';

const defaultProfile: PublicUserProfile = {
  id: '',
  name: 'Perfil publico',
  username: '',
  image: null,
  locationLabel: null,
  joinedAt: new Date().toISOString(),
  publicPath: '/',
  friendFeature: {
    available: false,
    canRequest: false,
  },
  stats: {
    friendCount: 0,
    businessCount: 0,
    eventCount: 0,
    postCount: 0,
  },
  businesses: [],
  events: [],
  posts: [],
};

const formatJoinedDate = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
  }).format(new Date(value));

const formatEventDate = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

const PublicProfile: React.FC<PublicProfileProps> = ({ username, viewer, embedded = false }) => {
  const [profile, setProfile] = useState<PublicUserProfile>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PublicTab>('about');

  useEffect(() => {
    let ignore = false;

    const loadProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/users/${encodeURIComponent(username)}/public`, {
          cache: 'no-store',
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload?.profile) {
          throw new Error(payload?.error ?? 'Nao foi possivel carregar este perfil publico.');
        }

        if (!ignore) {
          setProfile(payload.profile);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar este perfil.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      ignore = true;
    };
  }, [username]);

  const isOwnProfile = viewer?.username === profile.username;
  const pageContainerClass = embedded
    ? 'animate-in px-5 pb-24 pt-6 fade-in duration-500'
    : 'min-h-screen bg-texture px-4 py-5 sm:px-6 lg:px-8 lg:py-8';
  const contentClass = embedded
    ? 'space-y-5'
    : 'mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-5xl items-start justify-center';
  const cardClass = embedded
    ? 'space-y-5'
    : 'w-full max-w-4xl space-y-5 rounded-[40px] bg-white/90 p-5 shadow-xl backdrop-blur';

  if (loading) {
    return (
      <div className={pageContainerClass}>
        <div className={contentClass}>
          <div className={cardClass}>
            {!embedded ? (
              <div className="mb-6 flex justify-center">
                <Logo size="lg" />
              </div>
            ) : null}
            <div className="h-56 animate-pulse rounded-[36px] bg-white shadow-sm" />
            <div className="h-48 animate-pulse rounded-[36px] bg-white shadow-sm" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={pageContainerClass}>
        <div className={contentClass}>
          <div className={cardClass}>
            {!embedded ? (
              <div className="mb-6 flex justify-center">
                <Logo size="lg" />
              </div>
            ) : null}
            <div className="rounded-[32px] border border-red-100 bg-red-50 p-6 text-center">
              <h1 className="text-xl font-bold text-red-700">Perfil indisponivel</h1>
              <p className="mt-3 text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'about' as const, label: 'Sobre' },
    { id: 'businesses' as const, label: 'Negocios' },
    { id: 'events' as const, label: 'Eventos' },
    { id: 'posts' as const, label: 'Comunidade' },
  ];

  return (
    <div className={pageContainerClass}>
      <div className={contentClass}>
        <div className={cardClass}>
          {!embedded ? (
            <div className="mb-6 flex justify-center">
              <Logo size="lg" />
            </div>
          ) : null}

          <section className="overflow-hidden rounded-[36px] bg-white shadow-sm">
            <div className="h-40 bg-gradient-to-br from-[#28B8C7] via-[#1EA7B6] to-[#6ADDE6]" />
            <div className="-mt-16 px-5 pb-5">
              <div className="mx-auto h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-white shadow-lg">
                <img
                  src={profile.image || `https://picsum.photos/seed/${profile.username}/320`}
                  alt={profile.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-4 text-center">
                <h1 className="text-3xl font-bold text-slate-900">{profile.name}</h1>
                <p className="mt-2 text-sm font-semibold text-slate-600">@{profile.username}</p>
                {profile.locationLabel ? (
                  <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
                    <MapPin size={14} />
                    {profile.locationLabel}
                  </p>
                ) : null}
                <p className="mt-4 text-sm text-slate-500">
                  Na comunidade desde {formatJoinedDate(profile.joinedAt)}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                {profile.friendFeature.canRequest && !isOwnProfile ? (
                  <button
                    type="button"
                    disabled
                    className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#28B8C7] px-5 text-sm font-bold text-white opacity-80"
                  >
                    <UserPlus size={16} />
                    Adicionar em breve
                  </button>
                ) : null}
                {!viewer && !isOwnProfile ? (
                  <Link
                    href="/"
                    className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700"
                  >
                    Entrar para interagir
                  </Link>
                ) : null}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={<Users size={16} />} value={profile.stats.friendCount} label="Conexoes" />
            <StatCard icon={<Images size={16} />} value={profile.stats.businessCount} label="Negocios" />
            <StatCard icon={<CalendarDays size={16} />} value={profile.stats.eventCount} label="Eventos" />
            <StatCard icon={<MessageSquareText size={16} />} value={profile.stats.postCount} label="Posts visiveis" />
          </section>

          <section className="overflow-x-auto rounded-[30px] bg-white p-2 shadow-sm">
            <div className="flex min-w-max gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                    activeTab === tab.id ? 'bg-[#28B8C7] text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </section>

          {activeTab === 'about' ? (
            <section className="rounded-[32px] border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Perfil publico</p>
              <h2 className="mt-2 text-xl font-bold text-[#28B8C7]">Resumo do perfil</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Este espaco mostra os dados publicos do usuario, negocios e eventos publicados,
                e ja esta preparado para receber conexoes entre usuarios em uma proxima etapa.
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-500">
                Link publico: <span className="font-semibold text-slate-700">{profile.publicPath}</span>
              </p>
            </section>
          ) : null}

          {activeTab === 'businesses' ? (
            <section className="space-y-3">
              {profile.businesses.length === 0 ? (
                <EmptyPublicState text="Nenhum negocio publico disponivel para este perfil." />
              ) : (
                profile.businesses.map((business) => (
                  <Link
                    key={business.id}
                    href={`/negocios/${business.slug}`}
                    className="flex gap-4 rounded-[32px] border border-slate-100 bg-white p-4 shadow-sm"
                  >
                    <img
                      src={business.imageUrl || `https://picsum.photos/seed/${business.id}/300`}
                      alt={business.name}
                      className="h-24 w-24 rounded-2xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-bold text-[#28B8C7]">{business.name}</p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        {business.category}
                      </p>
                      {business.locationLabel ? (
                        <p className="mt-2 text-sm text-slate-500">{business.locationLabel}</p>
                      ) : null}
                      <div className="mt-3">
                        <StarRating average={business.ratingAverage} count={business.ratingCount} compact />
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </section>
          ) : null}

          {activeTab === 'events' ? (
            <section className="space-y-3">
              {profile.events.length === 0 ? (
                <EmptyPublicState text="Nenhum evento publico disponivel para este perfil." />
              ) : (
                profile.events.map((event) => (
                  <Link
                    key={event.id}
                    href={`/eventos/${event.slug}`}
                    className="flex gap-4 rounded-[32px] border border-slate-100 bg-white p-4 shadow-sm"
                  >
                    <img
                      src={event.imageUrl || `https://picsum.photos/seed/${event.id}/300`}
                      alt={event.title}
                      className="h-24 w-24 rounded-2xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-bold text-[#28B8C7]">{event.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{formatEventDate(event.startsAt)}</p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        {event.venueName}
                      </p>
                      {event.locationLabel ? (
                        <p className="mt-2 text-sm text-slate-500">{event.locationLabel}</p>
                      ) : null}
                      <div className="mt-3">
                        <StarRating average={event.ratingAverage} count={event.ratingCount} compact />
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </section>
          ) : null}

          {activeTab === 'posts' ? (
            <section className="space-y-3">
              {profile.posts.length === 0 ? (
                <EmptyPublicState text="Nenhuma publicacao visivel nesta regiao para este perfil." />
              ) : (
                profile.posts.map((post) => (
                  <div key={post.id} className="rounded-[32px] border border-slate-100 bg-white p-5 shadow-sm">
                    <p className="text-sm leading-7 text-slate-700">{post.content}</p>
                    {post.imageUrl ? (
                      <img
                        src={post.imageUrl}
                        alt="Midia da publicacao"
                        className="mt-4 h-48 w-full rounded-[24px] object-cover"
                      />
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium text-slate-500">
                      <span>{post.locationLabel}</span>
                      <span>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(post.createdAt))}</span>
                      <span>{post._count.reactions} curtidas</span>
                      <span>{post._count.comments} comentarios</span>
                    </div>
                  </div>
                ))
              )}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; value: number; label: string }> = ({
  icon,
  value,
  label,
}) => (
  <div className="rounded-[28px] border border-slate-100 bg-white p-4 text-center shadow-sm">
    <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-[#28B8C7]">
      {icon}
    </div>
    <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
    <p className="text-xs font-medium text-slate-500">{label}</p>
  </div>
);

const EmptyPublicState: React.FC<{ text: string }> = ({ text }) => (
  <div className="rounded-[32px] border border-dashed border-slate-200 bg-white px-5 py-8 text-center text-sm font-medium text-slate-500">
    {text}
  </div>
);

export default PublicProfile;

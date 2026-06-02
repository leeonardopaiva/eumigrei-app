export const RESERVED_PUBLIC_ROUTES = new Set([
  'admin',
  'community',
  'marketplace',
  'buscar',
  'noticias',
  'eventos',
  'negocios',
  'perfil',
  'profile',
  'profissional',
  'vagas',
  'convite',
  'grupos',
]);

export type AppRouteContext = {
  segments: string[];
  rootSegment?: string;
  referralUsername: string | null;
  publicProfileUsername: string | null;
  professionalProfileUsername: string | null;
  groupSlug: string | null;
};

export const parseAppRoute = (pathname: string): AppRouteContext => {
  const segments = pathname.split('/').filter(Boolean);
  const rootSegment = segments[0];
  const referralUsername =
    rootSegment === 'convite' && segments.length >= 2 ? decodeURIComponent(segments[1]) : null;
  const publicProfileUsername =
    rootSegment === 'perfil' && segments.length >= 2
      ? decodeURIComponent(segments[1])
      : segments.length === 1 && rootSegment && !RESERVED_PUBLIC_ROUTES.has(rootSegment)
        ? decodeURIComponent(rootSegment)
        : null;
  const professionalProfileUsername =
    rootSegment === 'profissional' && segments.length >= 2 ? decodeURIComponent(segments[1]) : null;
  const groupSlug = rootSegment === 'grupos' && segments.length >= 2 ? decodeURIComponent(segments[1]) : null;

  return {
    segments,
    rootSegment,
    referralUsername,
    publicProfileUsername,
    professionalProfileUsername,
    groupSlug,
  };
};

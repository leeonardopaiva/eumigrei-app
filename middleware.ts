import { getToken } from 'next-auth/jwt';
import { NextResponse, type NextRequest } from 'next/server';

const CANONICAL_HOST = 'gringoou.com';
const REDIRECT_HOSTS = new Set(['emigrei.com', 'www.emigrei.com']);
const PUBLIC_ASSET_PREFIXES = ['/_next/', '/assets/', '/favicon', '/robots.txt', '/sitemap.xml'];
const PUBLIC_AUTH_PATHS = ['/api/auth', '/login', '/access-blocked', '/maintenance'];

const isTruthyEnv = (value?: string | null) =>
  Boolean(value && ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase()));

const parseCsv = (value?: string | null) =>
  (value || '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

const isPublicPath = (pathname: string) =>
  PUBLIC_ASSET_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
  PUBLIC_AUTH_PATHS.some((prefix) => pathname.startsWith(prefix));

const isAllowedDuringMaintenance = (tokenEmail?: string | null, tokenUserId?: string | null) => {
  const allowlistedEmails = parseCsv(process.env.MAINTENANCE_ALLOWLIST_EMAILS);
  const allowlistedUserIds = parseCsv(process.env.MAINTENANCE_ALLOWLIST_USER_IDS);

  return Boolean(
    (tokenEmail && allowlistedEmails.includes(tokenEmail.trim().toLowerCase())) ||
      (tokenUserId && allowlistedUserIds.includes(tokenUserId.trim().toLowerCase())),
  );
};

const buildMaintenanceResponse = (request: NextRequest) => {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: 'A plataforma esta temporariamente em manutencao.' },
      { status: 503 },
    );
  }

  const url = request.nextUrl.clone();
  url.pathname = '/maintenance';
  url.search = '';
  return NextResponse.redirect(url, 307);
};

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0].toLowerCase();

  if (!host || !REDIRECT_HOSTS.has(host)) {
    if (!isPublicPath(request.nextUrl.pathname)) {
      const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
      const isApiRequest = request.nextUrl.pathname.startsWith('/api/');
      const maintenanceEnabled = isTruthyEnv(process.env.MAINTENANCE_MODE);
      const isAllowed = isAllowedDuringMaintenance(token?.email ?? null, token?.sub ?? null);

      if (!isAllowed) {
        if (isApiRequest) {
          return NextResponse.json(
            {
              error: maintenanceEnabled
                ? 'A plataforma esta temporariamente restrita.'
                : 'Nao autenticado.',
            },
            { status: maintenanceEnabled ? 503 : 401 },
          );
        }

        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.search = '';
        return NextResponse.redirect(url, 307);
      }

      if (!token) {
        if (isApiRequest) {
          return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 });
        }

        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.search = '';
        return NextResponse.redirect(url, 307);
      }
    }

    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.hostname = CANONICAL_HOST;
  url.protocol = 'https:';

  return NextResponse.redirect(url, 308);
}

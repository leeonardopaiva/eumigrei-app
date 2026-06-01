import { NextResponse, type NextRequest } from 'next/server';

const CANONICAL_HOST = 'gringoou.com';
const REDIRECT_HOSTS = new Set(['www.gringoou.com', 'emigrei.com', 'www.emigrei.com']);

export function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0].toLowerCase();

  if (!host || !REDIRECT_HOSTS.has(host)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.hostname = CANONICAL_HOST;
  url.protocol = 'https:';

  return NextResponse.redirect(url, 308);
}

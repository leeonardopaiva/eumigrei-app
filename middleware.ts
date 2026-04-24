import { NextResponse, type NextRequest } from 'next/server';

const CANONICAL_HOST = 'www.emigrei.com';
const APEX_HOST = 'emigrei.com';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0].toLowerCase();

  if (host !== APEX_HOST) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.hostname = CANONICAL_HOST;
  url.protocol = 'https:';

  return NextResponse.redirect(url, 308);
}

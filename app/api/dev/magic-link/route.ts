import { NextRequest, NextResponse } from 'next/server';
import { getDevMagicLink, isDevAuthEnabled } from '@/lib/dev-magic-links';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (!isDevAuthEnabled) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const email = request.nextUrl.searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const magicLink = getDevMagicLink(email);

  return NextResponse.json({
    url: magicLink?.url ?? null,
    expiresAt: magicLink?.expiresAt ?? null,
  });
}

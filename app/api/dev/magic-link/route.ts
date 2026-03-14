import { NextRequest, NextResponse } from 'next/server';
import { getDevMagicLink, isDevAuthEnabled } from '@/lib/dev-magic-links';
import { buildRateLimitHeaders, consumeRateLimit, getRateLimitKey } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (!isDevAuthEnabled) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const rateLimit = await consumeRateLimit({
    scope: 'dev:magic-link',
    key: getRateLimitKey(request),
    max: 12,
    windowMs: 5 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: buildRateLimitHeaders(rateLimit) },
    );
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

import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { getReferralSummary } from '@/lib/referrals';

export async function GET(request: Request) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const summary = await getReferralSummary(
    session.user.id,
    session.user.username,
    request,
  );

  return NextResponse.json(summary);
}

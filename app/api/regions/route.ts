import { NextResponse } from 'next/server';
import { listRegions } from '@/lib/region-store';

export const runtime = 'nodejs';

export async function GET() {
  const regions = await listRegions({ activeOnly: true });
  return NextResponse.json({ regions });
}

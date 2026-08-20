import { AdAccountRole } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AD_ACCOUNT_COOKIE, getAdAccountMembership, MAX_AD_ACCOUNTS_PER_USER } from '@/lib/ads/account';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AD_BUSINESS_CATEGORY_VALUES } from '@/lib/ads/categories';
import { normalizeInternationalPhone } from '@/lib/phone';

const accountSchema = z.object({
  name: z.string().trim().min(2).max(120),
  websiteUrl: z.preprocess((value) => (value === '' ? undefined : value), z.string().url().optional()),
  phone: z.string().trim().min(8).max(30),
  businessAddress: z.string().trim().max(300).optional(),
  businessCategory: z.enum(AD_BUSINESS_CATEGORY_VALUES as [string, ...string[]]),
  subcategories: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  country: z.string().trim().length(2).transform((value) => value.toUpperCase()),
  currency: z.literal('USD'),
  timezone: z.string().trim().min(2).max(80),
  isAgency: z.boolean().default(false),
  logoUrl: z.preprocess((value) => (value === '' ? undefined : value), z.string().url().optional()),
  useWebsitePhotos: z.boolean().default(true),
});

export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 });

  const [memberships, selected] = await Promise.all([
    prisma.adAccountUser.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' },
      select: {
        role: true,
        adAccount: {
          select: { id: true, name: true, logoUrl: true, country: true, currency: true, timezone: true },
        },
      },
    }),
    getAdAccountMembership(session.user.id),
  ]);

  return NextResponse.json({
    accounts: memberships.map(({ role, adAccount }) => ({ ...adAccount, role })),
    selectedAccountId: selected?.adAccountId ?? null,
    maxAccounts: MAX_AD_ACCOUNTS_PER_USER,
    canCreateAccount: memberships.length < MAX_AD_ACCOUNTS_PER_USER,
  });
}

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 });

  const parsed = accountSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados da empresa invalidos.' }, { status: 400 });
  }

  const account = await prisma.$transaction(async (transaction) => {
    // Serializes account creation for this user so parallel requests cannot bypass the limit.
    await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${session.user.id}))`;
    const accountCount = await transaction.adAccountUser.count({ where: { userId: session.user.id } });
    if (accountCount >= MAX_AD_ACCOUNTS_PER_USER) return null;

    const created = await transaction.adAccount.create({ data: { ...parsed.data, phone: normalizeInternationalPhone(parsed.data.phone) } });
    await transaction.adAccountUser.create({ data: { adAccountId: created.id, userId: session.user.id, role: AdAccountRole.BUSINESS_ADMIN } });
    await transaction.user.update({ where: { id: session.user.id }, data: { isAdvertiser: true } });
    return created;
  });

  if (!account) {
    return NextResponse.json(
      { error: `Voce pode gerenciar no maximo ${MAX_AD_ACCOUNTS_PER_USER} contas de negocio.`, code: 'AD_ACCOUNT_LIMIT_REACHED' },
      { status: 409 },
    );
  }

  const response = NextResponse.json({ account }, { status: 201 });
  response.cookies.set(AD_ACCOUNT_COOKIE, account.id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

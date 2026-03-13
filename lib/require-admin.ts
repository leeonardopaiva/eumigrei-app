import { UserRole } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { syncAdminRole } from '@/lib/admin';

export async function requireAdminSession() {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return {
      session: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const effectiveRole =
    session.user.role === UserRole.ADMIN
      ? UserRole.ADMIN
      : await syncAdminRole(session.user.id, session.user.email);

  if (effectiveRole !== UserRole.ADMIN) {
    return {
      session: null,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return {
    session: {
      ...session,
      user: {
        ...session.user,
        role: UserRole.ADMIN,
      },
    },
    response: null,
  };
}

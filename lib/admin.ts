import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const adminEmails = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

export function isConfiguredAdminEmail(email?: string | null) {
  return Boolean(email && adminEmails.includes(email.toLowerCase()));
}

export async function syncAdminRole(userId: string, email?: string | null) {
  if (!isConfiguredAdminEmail(email)) {
    return UserRole.USER;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user || user.role === UserRole.ADMIN) {
    return UserRole.ADMIN;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: UserRole.ADMIN },
  });

  return UserRole.ADMIN;
}

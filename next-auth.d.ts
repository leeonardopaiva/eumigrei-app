import type { DefaultSession } from 'next-auth';
import type { UserRole } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      role: UserRole;
      phone?: string | null;
      locationLabel?: string | null;
      regionKey?: string | null;
      onboardingCompleted: boolean;
    };
  }

  interface User {
    role: UserRole;
    phone?: string | null;
    locationLabel?: string | null;
    regionKey?: string | null;
    onboardingCompleted: boolean;
  }
}

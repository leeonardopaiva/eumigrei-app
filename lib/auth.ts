import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { getServerSession, type NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import GoogleProvider from 'next-auth/providers/google';
import { getStoredUserRole, isConfiguredAdminEmail, syncAdminRole } from '@/lib/admin';
import {
  emailFrom,
  emailProviderServer,
  isEmailAuthConfigured,
  sendMagicLinkVerification,
} from '@/lib/email-auth';
import { prisma } from '@/lib/prisma';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

export const isGoogleAuthConfigured = Boolean(
  googleClientId && googleClientSecret && process.env.NEXTAUTH_SECRET,
);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'database',
  },
  pages: {
    signIn: '/',
  },
  providers: [
    ...(isEmailAuthConfigured
      ? [
          EmailProvider({
            server: emailProviderServer,
            from: emailFrom,
            maxAge: 15 * 60,
            sendVerificationRequest: sendMagicLinkVerification,
          }),
        ]
      : []),
    ...(isGoogleAuthConfigured
      ? [
        GoogleProvider({
          clientId: googleClientId!,
          clientSecret: googleClientSecret!,
        }),
      ]
      : []),
  ],
  callbacks: {
    async signIn({ user }) {
      if (user.id && isConfiguredAdminEmail(user.email)) {
        await syncAdminRole(user.id, user.email);
      }

      return true;
    },
    async session({ session, user }) {
      if (!session.user) {
        return session;
      }

      const effectiveRole = await getStoredUserRole(user.id);

      session.user.id = user.id;
      session.user.role = effectiveRole;
      session.user.username = user.username;
      session.user.phone = user.phone;
      session.user.locationLabel = user.locationLabel;
      session.user.regionKey = user.regionKey;
      session.user.onboardingCompleted = user.onboardingCompleted;

      return session;
    },
  },
};

export function getServerAuthSession() {
  return getServerSession(authOptions);
}

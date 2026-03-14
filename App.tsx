'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import Layout from './components/Layout';
import AdminPanel from './views/AdminPanel';
import Home from './views/Home';
import Community from './views/Community';
import Marketplace from './views/Marketplace';
import Profile from './views/Profile';
import BusinessList from './views/BusinessList';
import BusinessDetail from './views/BusinessDetail';
import EventDetail from './views/EventDetail';
import Registration from './views/Registration';
import { UserRole, type User } from './types';

const GOOGLE_AUTH_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED !== 'false';
const EMAIL_AUTH_ENABLED = process.env.NEXT_PUBLIC_EMAIL_AUTH_ENABLED !== 'false';
const DEV_AUTH_ENABLED =
  process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_DEV_AUTH_ENABLED === 'true';

const mapUserRole = (role?: string | null): UserRole => {
  switch (role) {
    case UserRole.ADMIN:
      return UserRole.ADMIN;
    case UserRole.BUSINESS_OWNER:
      return UserRole.BUSINESS_OWNER;
    default:
      return UserRole.USER;
  }
};

const buildCurrentUser = (sessionUser: {
  id: string;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  image?: string | null;
  phone?: string | null;
  locationLabel?: string | null;
  regionKey?: string | null;
  role?: string | null;
}): User => ({
  id: sessionUser.id,
  name: sessionUser.name || 'Comunidade Eumigrei',
  username: sessionUser.username,
  role: mapUserRole(sessionUser.role),
  avatar: sessionUser.image || 'https://picsum.photos/seed/eumigrei-user/200',
  location: sessionUser.locationLabel || 'Defina sua regiao',
  regionKey: sessionUser.regionKey,
  email: sessionUser.email,
  phone: sessionUser.phone,
});

const AdminAccessDenied: React.FC = () => (
  <div className="px-5 pt-4">
    <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-red-50 text-red-600">
        <ShieldAlert size={28} />
      </div>
      <h1 className="mt-5 text-2xl font-bold text-[#004691]">Acesso restrito</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Seu usuario nao possui permissao de administrador para acessar esta area.
      </p>
      <Link
        href="/"
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#004691] px-5 text-sm font-bold text-white"
      >
        Voltar para home
      </Link>
    </div>
  </div>
);

const App: React.FC = () => {
  const pathname = usePathname() || '/';
  const { data: session, status, update } = useSession();
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [registrationNotice, setRegistrationNotice] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [requestingMagicLink, setRequestingMagicLink] = useState(false);

  const resolveDevMagicLink = async (email: string) => {
    if (!DEV_AUTH_ENABLED) {
      return false;
    }

    const response = await fetch(`/api/dev/magic-link?email=${encodeURIComponent(email)}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return false;
    }

    const payload = await response.json().catch(() => null);

    if (!payload?.url) {
      return false;
    }

    window.location.assign(payload.url);
    return true;
  };

  const handleGoogleLogin = async () => {
    setRegistrationError(null);
    setRegistrationNotice(null);

    try {
      await signIn('google', { callbackUrl: pathname || '/' });
    } catch (error) {
      console.error('Google sign-in failed:', error);
      setRegistrationError('Nao foi possivel entrar com Google agora.');
    }
  };

  const requestMagicLink = async (email: string, isLocalTest = false) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setRegistrationError('Informe um email para continuar.');
      return;
    }

    setRegistrationError(null);
    setRegistrationNotice(null);
    setRequestingMagicLink(true);

    try {
      const result = await signIn('email', {
        email: normalizedEmail,
        redirect: false,
        callbackUrl: pathname || '/',
      });

      if (!result || result.error) {
        setRegistrationError(result?.error || 'Nao foi possivel enviar o link de acesso.');
        return;
      }

      const redirected = await resolveDevMagicLink(normalizedEmail);

      if (redirected) {
        setRegistrationNotice('Abrindo o acesso local de teste...');
        return;
      }

      setRegistrationNotice(
        isLocalTest
          ? 'Magic link de teste gerado. Se o redirecionamento nao abrir, confira o terminal local.'
          : 'Enviamos um magic link para o seu email. Abra o link para entrar.',
      );
    } catch (error) {
      console.error('Email sign-in failed:', error);
      setRegistrationError('Nao foi possivel enviar o link de acesso.');
    } finally {
      setRequestingMagicLink(false);
    }
  };

  const handleEmailLogin = async (email: string) => {
    await requestMagicLink(email);
  };

  const handleProfileCompletion = async (values: {
    name: string;
    username: string;
    email: string;
    phone: string;
    regionKey: string;
  }) => {
    setRegistrationError(null);
    setRegistrationNotice(null);
    setSavingProfile(true);

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setRegistrationError(payload?.error ?? 'Nao foi possivel salvar seu perfil.');
        return;
      }

      await update();
    } catch (error) {
      console.error('Profile completion failed:', error);
      setRegistrationError('Nao foi possivel salvar seu perfil.');
    } finally {
      setSavingProfile(false);
    }
  };

  if (status === 'loading') {
    return null;
  }

  if (!session?.user) {
    return (
      <Registration
        mode="signin"
        googleEnabled={GOOGLE_AUTH_ENABLED}
        emailEnabled={EMAIL_AUTH_ENABLED}
        onGoogleLogin={handleGoogleLogin}
        onEmailLogin={handleEmailLogin}
        submitting={requestingMagicLink}
        error={registrationError}
        notice={registrationNotice}
      />
    );
  }

  if (!session.user.onboardingCompleted || !session.user.username) {
    return (
      <Registration
        mode="complete-profile"
        googleEnabled={GOOGLE_AUTH_ENABLED}
        emailEnabled={EMAIL_AUTH_ENABLED}
        onGoogleLogin={handleGoogleLogin}
        onCompleteProfile={handleProfileCompletion}
        submitting={savingProfile}
        error={registrationError}
        notice={registrationNotice}
        defaultValues={{
          name: session.user.name || '',
          username: session.user.username || '',
          email: session.user.email || '',
          phone: session.user.phone || '',
          regionKey: session.user.regionKey || '',
        }}
      />
    );
  }

  const currentUser = buildCurrentUser(session.user);
  const segments = pathname.split('/').filter(Boolean);
  const rootSegment = segments[0];

  const content = (() => {
    if (segments.length === 0) {
      return <Home user={currentUser} />;
    }

    if (rootSegment === 'negocios' && segments.length === 1) {
      return <BusinessList />;
    }

    if (rootSegment === 'negocios' && segments.length === 2) {
      return <BusinessDetail businessId={decodeURIComponent(segments[1])} user={currentUser} />;
    }

    if ((rootSegment === 'eventos' || rootSegment === 'marketplace') && segments.length === 2) {
      return <EventDetail eventId={decodeURIComponent(segments[1])} user={currentUser} />;
    }

    switch (rootSegment) {
      case 'admin':
        return currentUser.role === UserRole.ADMIN ? (
          <AdminPanel user={currentUser} />
        ) : (
          <AdminAccessDenied />
        );
      case 'community':
        return <Community user={currentUser} />;
      case 'marketplace':
      case 'eventos':
        return <Marketplace />;
      case 'profile':
        return <Profile user={currentUser} />;
      default:
        return <Home user={currentUser} />;
    }
  })();

  return (
    <Layout user={currentUser} onSignOut={() => signOut({ callbackUrl: '/' })}>
      {content}
    </Layout>
  );
};

export default App;

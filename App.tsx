'use client';

import React, { useEffect, useState } from 'react';
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
import SearchResults from './views/SearchResults';
import BusinessList from './views/BusinessList';
import BusinessDetail from './views/BusinessDetail';
import EventDetail from './views/EventDetail';
import PublicProfile from './views/PublicProfile';
import PublicProfessionalProfile from './views/PublicProfessionalProfile';
import Registration from './views/Registration';
import { UserRole, type PersonaMode, type User } from './types';

const GOOGLE_AUTH_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED !== 'false';
const EMAIL_AUTH_ENABLED = false;
const PASSWORD_AUTH_ENABLED = false;
const DEV_AUTH_ENABLED =
  process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_DEV_AUTH_ENABLED === 'true';
const PERSONA_MODE_STORAGE_KEY = 'emigrei:persona-mode';
const RESERVED_PUBLIC_ROUTES = new Set([
  'admin',
  'community',
  'marketplace',
  'buscar',
  'noticias',
  'eventos',
  'negocios',
  'perfil',
  'profile',
  'profissional',
  'vagas',
  'convite',
]);

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
  name: sessionUser.name || 'Comunidade Emigrei',
  username: sessionUser.username,
  role: mapUserRole(sessionUser.role),
  avatar: sessionUser.image || 'https://picsum.photos/seed/emigrei-user/200',
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
      <h1 className="mt-5 text-2xl font-bold text-[#28B8C7]">Acesso restrito</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Seu usuario nao possui permissao de administrador para acessar esta area.
      </p>
      <Link
        href="/"
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#28B8C7] px-5 text-sm font-bold text-white"
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
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [personaMode, setPersonaMode] = useState<PersonaMode>('personal');
  const segments = pathname.split('/').filter(Boolean);
  const rootSegment = segments[0];
  const referralUsername =
    rootSegment === 'convite' && segments.length >= 2 ? decodeURIComponent(segments[1]) : null;
  const publicProfileUsername =
    rootSegment === 'perfil' && segments.length >= 2
      ? decodeURIComponent(segments[1])
      : segments.length === 1 && rootSegment && !RESERVED_PUBLIC_ROUTES.has(rootSegment)
        ? decodeURIComponent(rootSegment)
        : null;
  const professionalProfileUsername =
    rootSegment === 'profissional' && segments.length >= 2 ? decodeURIComponent(segments[1]) : null;
  const sessionRole = mapUserRole(session?.user?.role);
  const canUseProfessionalMode = sessionRole === UserRole.BUSINESS_OWNER;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!session?.user?.id) {
      setPersonaMode('personal');
      return;
    }

    if (!canUseProfessionalMode) {
      window.localStorage.removeItem(PERSONA_MODE_STORAGE_KEY);
      setPersonaMode('personal');
      return;
    }

    const storedMode = window.localStorage.getItem(PERSONA_MODE_STORAGE_KEY);
    setPersonaMode(storedMode === 'professional' ? 'professional' : 'personal');
  }, [canUseProfessionalMode, session?.user?.id]);

  useEffect(() => {
    if (typeof window === 'undefined' || !session?.user?.id || !canUseProfessionalMode) {
      return;
    }

    window.localStorage.setItem(PERSONA_MODE_STORAGE_KEY, personaMode);
  }, [canUseProfessionalMode, personaMode, session?.user?.id]);

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
    setAuthSubmitting(true);

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
      setAuthSubmitting(false);
    }
  };

  const handleEmailLogin = async (email: string) => {
    await requestMagicLink(email);
  };

  const performPasswordLogin = async (email: string, password: string) => {
    const result = await signIn('credentials', {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
      callbackUrl: pathname || '/',
    });

    if (!result || result.error) {
      return {
        ok: false,
        error: result?.error || 'Nao foi possivel entrar com email e senha.',
      };
    }

    if (result.url) {
      window.location.assign(result.url);
    } else {
      window.location.assign(pathname || '/');
    }

    return { ok: true };
  };

  const handlePasswordLogin = async (values: { email: string; password: string }) => {
    setRegistrationError(null);
    setRegistrationNotice(null);
    setAuthSubmitting(true);

    try {
      const result = await performPasswordLogin(values.email, values.password);

      if (!result.ok) {
        setRegistrationError('Email ou senha invalidos.');
      }
    } catch (error) {
      console.error('Credentials sign-in failed:', error);
      setRegistrationError('Nao foi possivel entrar com email e senha.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handlePasswordRegister = async (values: {
    email: string;
    password: string;
    captchaToken: string;
    captchaAnswer: string;
  }) => {
    setRegistrationError(null);
    setRegistrationNotice(null);
    setAuthSubmitting(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setRegistrationError(payload?.error ?? 'Nao foi possivel criar a conta.');
        return;
      }

      setRegistrationNotice(payload?.message ?? 'Conta criada. Entrando...');
      const result = await performPasswordLogin(values.email, values.password);

      if (!result.ok) {
        setRegistrationNotice('Conta criada. Agora entre com seu email e senha.');
      }
    } catch (error) {
      console.error('Password registration failed:', error);
      setRegistrationError('Nao foi possivel criar a conta.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleProfileCompletion = async (values: {
    name: string;
    username: string;
    email: string;
    phone: string;
    regionKey: string;
    referralUsername?: string | null;
  }) => {
    setRegistrationError(null);
    setRegistrationNotice(null);
    setSavingProfile(true);

    try {
      const onboardingPayload = {
        ...values,
        referralUsername: values.referralUsername ?? undefined,
      };

      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(onboardingPayload),
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

  if (professionalProfileUsername && !session?.user) {
    return <PublicProfessionalProfile username={professionalProfileUsername} />;
  }

  if (publicProfileUsername && !session?.user) {
    return <PublicProfile username={publicProfileUsername} />;
  }

  if (!session?.user) {
    return (
      <Registration
        mode="signin"
        googleEnabled={GOOGLE_AUTH_ENABLED}
        emailEnabled={EMAIL_AUTH_ENABLED}
        passwordEnabled={PASSWORD_AUTH_ENABLED}
        onGoogleLogin={handleGoogleLogin}
        onEmailLogin={handleEmailLogin}
        onPasswordLogin={handlePasswordLogin}
        onPasswordRegister={handlePasswordRegister}
        submitting={authSubmitting}
        error={registrationError}
        notice={registrationNotice}
        referralUsername={referralUsername}
      />
    );
  }

  if (!session.user.onboardingCompleted || !session.user.username) {
    return (
      <Registration
        mode="complete-profile"
        googleEnabled={GOOGLE_AUTH_ENABLED}
        emailEnabled={EMAIL_AUTH_ENABLED}
        passwordEnabled={PASSWORD_AUTH_ENABLED}
        onGoogleLogin={handleGoogleLogin}
        onCompleteProfile={handleProfileCompletion}
        submitting={savingProfile}
        error={registrationError}
        notice={registrationNotice}
        referralUsername={referralUsername}
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

  if (professionalProfileUsername) {
    return (
      <Layout
        user={currentUser}
        personaMode={personaMode}
        canUseProfessionalMode={canUseProfessionalMode}
        onPersonaModeChange={setPersonaMode}
        onSignOut={() => signOut({ callbackUrl: '/' })}
      >
        <PublicProfessionalProfile username={professionalProfileUsername} viewer={currentUser} embedded />
      </Layout>
    );
  }

  if (publicProfileUsername) {
    return (
      <Layout
        user={currentUser}
        personaMode={personaMode}
        canUseProfessionalMode={canUseProfessionalMode}
        onPersonaModeChange={setPersonaMode}
        onSignOut={() => signOut({ callbackUrl: '/' })}
      >
        <PublicProfile username={publicProfileUsername} viewer={currentUser} embedded />
      </Layout>
    );
  }

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
      case 'buscar':
        return <SearchResults />;
      case 'marketplace':
      case 'eventos':
        return <Marketplace />;
      case 'profile':
        return (
          <Profile
            user={currentUser}
            personaMode={personaMode}
            canUseProfessionalMode={canUseProfessionalMode}
            onPersonaModeChange={setPersonaMode}
          />
        );
      default:
        return <Home user={currentUser} />;
    }
  })();

  return (
    <Layout
      user={currentUser}
      personaMode={personaMode}
      canUseProfessionalMode={canUseProfessionalMode}
      onPersonaModeChange={setPersonaMode}
      onSignOut={() => signOut({ callbackUrl: '/' })}
    >
      {content}
    </Layout>
  );
};

export default App;




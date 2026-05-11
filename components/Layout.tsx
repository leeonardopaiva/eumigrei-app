'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Briefcase,
  Calendar,
  Home as HomeIcon,
  Menu,
  MessageSquarePlus,
  Newspaper,
  ShieldCheck,
  ShoppingBag,
  Store,
  User as UserIcon,
  Users,
} from 'lucide-react';
import SuggestionButton from './feedback/SuggestionButton';
import FriendRequestBell from './feedback/FriendRequestBell';
import PersonaModeDropdown from './profile/PersonaModeDropdown';
import { useToast } from './feedback/ToastProvider';
import { trackAnalyticsEvent } from '../lib/analytics';
import { handleAvatarError } from '../lib/avatar';
import { PersonaMode, ProfessionalProfileIdentity, User, UserRole } from '../types';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  professional?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '', professional = false }) => {
  const textClass = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  }[size];

  return (
    <Link href="/" aria-label="Home">
      <span
        className={`inline-block select-none font-black tracking-tight transition-all duration-300 ${
          professional ? 'text-[#145DA0]' : 'theme-text'
        } ${textClass} ${className}`}
      >
        Gringoou
      </span>
    </Link>
  );
};

interface LayoutWithUserProps {
  children: React.ReactNode;
  user: User;
  personaMode?: PersonaMode;
  canUseProfessionalMode?: boolean;
  professionalIdentity?: ProfessionalProfileIdentity | null;
  onPersonaModeChange?: (mode: PersonaMode) => void;
  onSignOut?: () => void;
}

type NavigationItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
  badge?: string;
};

const navigationItems: NavigationItem[] = [
  { href: '/', label: 'Home', icon: <HomeIcon size={22} /> },
  { href: '/negocios', label: 'Negócios', icon: <Store size={18} /> },
  { href: '/community', label: 'Comunidade', icon: <Users size={18} /> },
  { href: '/eventos', label: 'Eventos', icon: <Calendar size={18} /> },
  { href: '/vagas', label: 'Vagas', icon: <Briefcase size={18} />, disabled: true, badge: '' },
  {
    href: '/marketplace',
    label: 'Marketplace',
    icon: <ShoppingBag size={18} />,
    disabled: true,
    badge: '',
  },
  { href: '/noticias', label: 'Notícias', icon: <Newspaper size={18} />, disabled: true, badge: '' },
];

const SidebarContent: React.FC<{
  user: User;
  sourcePath: string;
  personaMode: PersonaMode;
  canUseProfessionalMode: boolean;
  professionalIdentity?: ProfessionalProfileIdentity | null;
  accentColorClass: string;
  isActive: (path: string) => boolean;
  onPersonaModeChange?: (mode: PersonaMode) => void;
  onItemClick?: () => void;
  onSignOut?: () => void;
}> = ({
  user,
  sourcePath,
  personaMode,
  canUseProfessionalMode,
  professionalIdentity,
  accentColorClass,
  isActive,
  onPersonaModeChange,
  onItemClick,
  onSignOut,
}) => {
  const { showToast } = useToast();
  const isProfessionalTheme = personaMode === 'professional';
  const activeName =
    isProfessionalTheme && professionalIdentity ? professionalIdentity.name : user.name;
  const activeAvatar =
    isProfessionalTheme && professionalIdentity?.imageUrl ? professionalIdentity.imageUrl : user.avatar;
  const activeSubtitle =
    isProfessionalTheme && professionalIdentity
      ? 'Perfil profissional'
      : user.username
        ? `@${user.username}`
        : 'Membro da comunidade';
  const publicProfileHref =
    isProfessionalTheme && professionalIdentity
      ? professionalIdentity.publicPath
      : isProfessionalTheme
        ? '/negocios'
      : user.username
        ? `/perfil/${encodeURIComponent(user.username)}`
        : '/profile';

  const handleDisabledNavigation = (item: NavigationItem) => {
    onItemClick?.();
    showToast(`${item.label} chega em breve.`, 'info');
    trackAnalyticsEvent({
      type: 'disabled_feature_click',
      targetType: 'feature',
      targetKey: item.href.replace(/^\//, ''),
      label: item.label,
      sourcePath,
      sourceSection: 'sidebar_navigation',
      regionKey: user.regionKey,
    });
  };

  return (
    <div className="space-y-4 p-5 pb-20 pt-10 lg:flex lg:h-full lg:flex-col lg:justify-between lg:p-8">
      <div className="space-y-4">
        <div className="mb-8 flex flex-col gap-6">
          <Logo size="md" professional={isProfessionalTheme} />
          <div className="flex items-center gap-3">
            <Link href={publicProfileHref} onClick={onItemClick} className="relative transition hover:opacity-90">
              <img
                src={activeAvatar}
                className="h-14 w-14 rounded-full border-2 border-white object-cover shadow-md"
                alt={activeName}
                onError={handleAvatarError}
              />
            </Link>
            <div>
              <div className="flex items-center gap-1">
                <h2 className={`text-xl font-bold ${accentColorClass}`}>{activeName}</h2>
                {canUseProfessionalMode && onPersonaModeChange ? (
                  <PersonaModeDropdown
                    value={personaMode}
                    onChange={onPersonaModeChange}
                    personalSubtitle={user.username ? `@${user.username}` : 'Membro da comunidade'}
                    professionalSubtitle={professionalIdentity?.name || 'Cadastre um negocio'}
                    professionalDisabled={!professionalIdentity}
                    align="right"
                    trigger="chevron"
                    menuClassName="z-30"
                  />
                ) : null}
              </div>
              <p className={`text-[10px] font-medium uppercase tracking-wider ${isProfessionalTheme ? 'theme-text-soft' : 'text-slate-500'}`}>
                {activeSubtitle}
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white/80 p-1.5 shadow-sm backdrop-blur-md">
          {navigationItems.map((item) => (
            <MenuListItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActive(item.href)}
              disabled={item.disabled}
              badge={item.badge}
              onClick={onItemClick}
              onDisabledClick={() => handleDisabledNavigation(item)}
            />
          ))}
          {user.role === UserRole.ADMIN ? (
            <MenuListItem
              href="/admin"
              label="Admin"
              icon={<ShieldCheck size={18} />}
              active={isActive('/admin')}
              onClick={onItemClick}
            />
          ) : null}
          <MenuListItem
            href="/profile"
            label={isProfessionalTheme ? 'Meu negocio' : 'Meu perfil'}
            icon={<UserIcon size={18} />}
            active={isActive('/profile')}
            onClick={onItemClick}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Link
          href="/negocios?create=1"
          onClick={onItemClick}
          className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#6366F1] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#2563EB]/30 transition hover:brightness-105"
        >
          Cadastrar meu negocio
        </Link>
        <Link
          href="/eventos?create=1"
          onClick={onItemClick}
          className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#F97316] via-[#FB923C] to-[#F59E0B] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#F97316]/30 transition hover:brightness-105"
        >
          Cadastrar meu evento
        </Link>
      </div>

      {onSignOut ? (
        <button
          type="button"
          onClick={() => {
            onItemClick?.();
            onSignOut();
          }}
          className="theme-bg theme-shadow w-full rounded-xl px-4 py-3 text-sm font-bold"
        >
          Sair
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => {
          onItemClick?.();
          window.dispatchEvent(new CustomEvent('emigrei:open-suggestion-modal'));
        }}
        className="theme-soft-surface mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold shadow-sm"
      >
        <MessageSquarePlus size={16} />
        Enviar sugestao
      </button>
    </div>
  );
};

const Layout: React.FC<LayoutWithUserProps> = ({
  children,
  user,
  personaMode = 'personal',
  canUseProfessionalMode = false,
  professionalIdentity,
  onPersonaModeChange,
  onSignOut,
}) => {
  const pathname = usePathname() || '/';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isProfessionalTheme = canUseProfessionalMode && personaMode === 'professional';
  const accentColorClass = 'theme-text';
  const accentSolidClass = 'theme-bg';
  const activeName =
    isProfessionalTheme && professionalIdentity ? professionalIdentity.name : user.name;
  const activeAvatar =
    isProfessionalTheme && professionalIdentity?.imageUrl ? professionalIdentity.imageUrl : user.avatar;
  const activeLocation =
    isProfessionalTheme && professionalIdentity?.locationLabel
      ? professionalIdentity.locationLabel
      : user.location;
  const publicProfileHref =
    isProfessionalTheme && professionalIdentity
      ? professionalIdentity.publicPath
      : isProfessionalTheme
        ? '/negocios'
      : user.username
        ? `/perfil/${encodeURIComponent(user.username)}`
        : '/profile';
  const panelClass = isProfessionalTheme
    ? 'border-blue-100/80 bg-blue-50/80'
    : 'border-white/50 bg-white/85';

  const isActive = (path: string) =>
    path === '/' ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);

  const handleMenuItemClick = () => setIsMenuOpen(false);

  return (
    <div className="app-shell min-h-screen bg-texture" data-persona={isProfessionalTheme ? 'professional' : 'personal'}>
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-texture font-sans shadow-xl lg:max-w-none lg:bg-transparent lg:shadow-none">
        {isMenuOpen ? (
          <div
            className="fixed inset-0 z-50 animate-in bg-black/40 backdrop-blur-sm fade-in duration-300"
            onClick={() => setIsMenuOpen(false)}
          />
        ) : null}

        <div
          className={`fixed inset-y-0 left-0 z-[60] w-[85%] max-w-[380px] overflow-y-auto border-r border-slate-200 bg-white/90 shadow-xl backdrop-blur-xl transition-transform duration-300 ease-out ${
            isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } ${panelClass}`}
        >
          <SidebarContent
            user={user}
            sourcePath={pathname}
            personaMode={personaMode}
            canUseProfessionalMode={canUseProfessionalMode}
            professionalIdentity={professionalIdentity}
            accentColorClass={accentColorClass}
            isActive={isActive}
            onPersonaModeChange={onPersonaModeChange}
            onItemClick={handleMenuItemClick}
            onSignOut={onSignOut}
          />
        </div>

        <div className="relative flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-40 flex items-center justify-between bg-transparent px-5 pb-2 pt-6 lg:border-b lg:border-slate-200/80 lg:bg-white/88 lg:px-8 lg:py-5 lg:backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setIsMenuOpen(true)}
                className={`p-1 ${accentColorClass}`}
              >
                <Menu size={28} />
              </button>
              <Logo size="sm" professional={isProfessionalTheme} />
            </div>

            <div className="hidden items-center gap-3 lg:flex">
              <FriendRequestBell />
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-3 py-2 shadow-sm">
                <Link href={publicProfileHref} className="transition hover:opacity-90">
                  <img
                    src={activeAvatar}
                    className="h-10 w-10 rounded-full object-cover"
                    alt={activeName}
                    onError={handleAvatarError}
                  />
                </Link>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800">{activeName}</p>
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                    {activeLocation}
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:hidden">
              <FriendRequestBell />
            </div>
          </header>

          <main className="scrollbar-hide flex-1 overflow-y-auto">
            <div className="w-full lg:px-8">{children}</div>
          </main>

          <SuggestionButton />

          <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-6 lg:hidden">
            <nav className={`flex w-full max-w-[360px] items-center justify-between rounded-full border border-white/10 px-2 py-2 shadow-xl ${accentSolidClass}`}>
              <NavItem href="/" icon={<HomeIcon size={20} />} active={isActive('/')} accentColorClass={accentColorClass} />
              <NavItem href="/negocios" icon={<Store size={20} />} active={isActive('/negocios')} accentColorClass={accentColorClass} />
              <NavItem href="/community" icon={<Users size={20} />} active={isActive('/community')} accentColorClass={accentColorClass} />
              <NavItem href="/eventos" icon={<Calendar size={20} />} active={isActive('/eventos')} accentColorClass={accentColorClass} />
              <NavItem href={publicProfileHref} icon={<UserIcon size={20} />} active={isActive('/profile') || isActive('/perfil')} accentColorClass={accentColorClass} />
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

const MenuListItem: React.FC<{
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  badge?: string;
  onClick?: () => void;
  onDisabledClick?: () => void;
}> = ({ href, label, icon, active = false, disabled = false, badge, onClick, onDisabledClick }) => {
  const classes = `flex items-center gap-3 px-4 py-3 transition-colors first:rounded-t-xl last:rounded-b-xl ${
    disabled
      ? 'cursor-pointer opacity-60 hover:bg-white/30'
      : `hover:bg-white/50 ${active ? 'bg-white/40' : ''}`
  }`;

  const content = (
    <>
      <div className={disabled ? 'text-slate-400' : 'theme-text'}>{icon}</div>
      <span className={`text-sm font-bold ${disabled ? 'text-slate-400' : 'text-slate-700'}`}>
        {label}
      </span>
      {badge ? (
        <span className="ml-auto rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
          {badge}
        </span>
      ) : null}
    </>
  );

  if (disabled) {
    return (
      <button type="button" aria-disabled="true" onClick={onDisabledClick} className={classes}>
        {content}
      </button>
    );
  }

  return (
    <Link href={href} onClick={onClick} className={classes}>
      {content}
    </Link>
  );
};

const NavItem: React.FC<{ href: string; icon: React.ReactNode; active: boolean; accentColorClass: string }> = ({
  href,
  icon,
  active,
  accentColorClass,
}) => (
  <Link
    href={href}
    className={`flex items-center justify-center transition-all duration-300 ${
      active
        ? `h-11 w-11 scale-105 rounded-full bg-white ${accentColorClass} shadow-sm`
        : 'h-10 w-10 text-white/70 hover:text-white'
    }`}
  >
    {icon}
  </Link>
);

export default Layout;

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
import { useToast } from './feedback/ToastProvider';
import PersonaModeSwitch from './profile/PersonaModeSwitch';
import { trackAnalyticsEvent } from '../lib/analytics';
import { PersonaMode, User, UserRole } from '../types';

const logoPrimaryUrl = '/assets/logo-emigrei.png';
const logoFallbackUrl = '/assets/logo26.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const heightClass = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-14',
  }[size];

  return (
    <Link href="/" aria-label="Home">
      <img
        src={logoPrimaryUrl}
        alt="emigrei"
        className={`${heightClass} w-auto object-contain transition-all duration-300 ${className}`}
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = logoFallbackUrl;
        }}
      />
    </Link>
  );
};

interface LayoutWithUserProps {
  children: React.ReactNode;
  user: User;
  personaMode?: PersonaMode;
  canUseProfessionalMode?: boolean;
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
  { href: '/negocios', label: 'Negocios', icon: <Store size={18} /> },
  { href: '/community', label: 'Comunidade', icon: <Users size={18} /> },
  { href: '/eventos', label: 'Eventos', icon: <Calendar size={18} /> },
  { href: '/vagas', label: 'Vagas', icon: <Briefcase size={18} />, disabled: true, badge: 'Em breve' },
  {
    href: '/marketplace',
    label: 'Marketplace',
    icon: <ShoppingBag size={18} />,
    disabled: true,
    badge: 'Em breve',
  },
  {
    href: '/noticias',
    label: 'Noticias',
    icon: <Newspaper size={18} />,
    disabled: true,
    badge: 'Em breve',
  },
  { href: '/profile', label: 'Meu perfil', icon: <UserIcon size={18} /> },
];

const SidebarContent: React.FC<{
  user: User;
  sourcePath: string;
  personaMode: PersonaMode;
  canUseProfessionalMode: boolean;
  onPersonaModeChange?: (mode: PersonaMode) => void;
  isActive: (path: string) => boolean;
  onItemClick?: () => void;
  onSignOut?: () => void;
}> = ({
  user,
  sourcePath,
  personaMode,
  canUseProfessionalMode,
  onPersonaModeChange,
  isActive,
  onItemClick,
  onSignOut,
}) => {
  const { showToast } = useToast();

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
          <Logo size="md" />
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={user.avatar}
                className="h-14 w-14 rounded-full border-2 border-white object-cover shadow-md"
                alt="User"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#28B8C7]">{user.name}</h2>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                {user.username ? `@${user.username}` : 'Membro da comunidade'}
              </p>
            </div>
          </div>
          {canUseProfessionalMode && onPersonaModeChange ? (
            <div className="space-y-2 rounded-3xl border border-slate-100 bg-white/80 p-3 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Contexto ativo
              </p>
              <PersonaModeSwitch value={personaMode} onChange={onPersonaModeChange} className="w-full" />
            </div>
          ) : null}
        </div>

        <div className="divide-y divide-slate-100 rounded-3xl border border-white/50 bg-white/70 p-2 shadow-sm backdrop-blur-md">
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
        </div>
      </div>

      {onSignOut ? (
        <button
          type="button"
          onClick={() => {
            onItemClick?.();
            onSignOut();
          }}
          className="w-full rounded-2xl bg-[#28B8C7] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#28B8C7]/20"
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
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-sm"
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
  onPersonaModeChange,
  onSignOut,
}) => {
  const pathname = usePathname() || '/';
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) =>
    path === '/' ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);

  const handleMenuItemClick = () => setIsMenuOpen(false);

  return (
    <div className="min-h-screen bg-texture">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-texture font-sans shadow-2xl lg:max-w-none lg:bg-transparent lg:shadow-none">
        {isMenuOpen ? (
          <div
            className="fixed inset-0 z-50 animate-in bg-black/40 backdrop-blur-sm fade-in duration-300"
            onClick={() => setIsMenuOpen(false)}
          />
        ) : null}

        <div
          className={`fixed inset-y-0 left-0 z-[60] w-[85%] max-w-[380px] overflow-y-auto border-r border-white/50 bg-white/85 shadow-2xl backdrop-blur-xl transition-transform duration-300 ease-out ${
            isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <SidebarContent
            user={user}
            sourcePath={pathname}
            personaMode={personaMode}
            canUseProfessionalMode={canUseProfessionalMode}
            onPersonaModeChange={onPersonaModeChange}
            isActive={isActive}
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
                className="p-1 text-[#28B8C7]"
              >
                <Menu size={28} />
              </button>
              <Logo size="sm" />
            </div>

            <div className="hidden items-center gap-3 rounded-full border border-slate-200/80 px-3 py-2 shadow-sm lg:flex">
              <img
                src={user.avatar}
                className="h-10 w-10 rounded-full object-cover"
                alt={user.name}
              />
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">{user.name}</p>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  {user.location}
                </p>
              </div>
            </div>

            <div className="h-7 w-7 lg:hidden" />
          </header>

          <main className="scrollbar-hide flex-1 overflow-y-auto">
            <div className="w-full lg:px-8">{children}</div>
          </main>

          <SuggestionButton />

          <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-6 lg:hidden">
            <nav className="flex w-full max-w-[360px] items-center justify-between rounded-full border border-white/10 bg-[#28B8C7] px-2 py-2 shadow-2xl">
              <NavItem href="/" icon={<HomeIcon size={20} />} active={isActive('/')} />
              <NavItem href="/negocios" icon={<Store size={20} />} active={isActive('/negocios')} />
              <NavItem href="/community" icon={<Users size={20} />} active={isActive('/community')} />
              <NavItem href="/eventos" icon={<Calendar size={20} />} active={isActive('/eventos')} />
              <NavItem href="/profile" icon={<UserIcon size={20} />} active={isActive('/profile')} />
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
  const classes = `flex items-center gap-3 px-4 py-3.5 transition-colors first:rounded-t-2xl last:rounded-b-2xl ${
    disabled
      ? 'cursor-pointer opacity-60 hover:bg-white/30'
      : `hover:bg-white/50 ${active ? 'bg-white/40' : ''}`
  }`;

  const content = (
    <>
      <div className={disabled ? 'text-slate-400' : 'text-[#28B8C7]'}>{icon}</div>
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

const NavItem: React.FC<{ href: string; icon: React.ReactNode; active: boolean }> = ({
  href,
  icon,
  active,
}) => (
  <Link
    href={href}
    className={`flex items-center justify-center transition-all duration-300 ${
      active
        ? 'h-12 w-12 scale-105 rounded-full bg-white text-[#28B8C7] shadow-lg'
        : 'h-11 w-11 text-white/70 hover:text-white'
    }`}
  >
    {icon}
  </Link>
);

export default Layout;



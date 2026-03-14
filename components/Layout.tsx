'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  Home as HomeIcon,
  Menu,
  ShieldCheck,
  Store,
  User as UserIcon,
  Users,
} from 'lucide-react';
import { User, UserRole } from '../types';

const logo26Url = '/assets/logo26.svg';
const logo26FallbackUrl = '/assets/logo26.png';

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
        src={logo26Url}
        alt="eumigrei"
        className={`${heightClass} w-auto object-contain transition-all duration-300 ${className}`}
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = logo26FallbackUrl;
        }}
      />
    </Link>
  );
};

interface LayoutWithUserProps {
  children: React.ReactNode;
  user: User;
  onSignOut?: () => void;
}

const Layout: React.FC<LayoutWithUserProps> = ({ children, user, onSignOut }) => {
  const pathname = usePathname() || '/';
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) =>
    path === '/' ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);

  const handleMenuItemClick = () => setIsMenuOpen(false);

  return (
    <div className="relative mx-auto flex min-h-screen max-w-md flex-col overflow-hidden bg-texture font-sans shadow-2xl">
      {isMenuOpen ? (
        <div
          className="absolute inset-0 z-50 animate-in bg-black/40 backdrop-blur-sm fade-in duration-300"
          onClick={() => setIsMenuOpen(false)}
        />
      ) : null}

      <div
        className={`absolute left-0 top-0 z-[60] h-full w-[85%] overflow-y-auto bg-texture shadow-2xl transition-transform duration-300 ease-out ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-4 p-5 pb-20 pt-10">
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
                <h2 className="text-xl font-bold text-[#004691]">{user.name}</h2>
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  {user.username ? `@${user.username}` : 'Membro da comunidade'}
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100 rounded-3xl border border-white/50 bg-white/70 p-2 shadow-sm backdrop-blur-md">
            <MenuListItem
              href="/"
              label="Home"
              icon={<HomeIcon size={22} />}
              active={isActive('/')}
              onClick={handleMenuItemClick}
            />
            <MenuListItem
              href="/negocios"
              label="Negocios"
              icon={<Store size={18} />}
              active={isActive('/negocios')}
              onClick={handleMenuItemClick}
            />
            <MenuListItem
              href="/community"
              label="Comunidade"
              icon={<Users size={18} />}
              active={isActive('/community')}
              onClick={handleMenuItemClick}
            />
            <MenuListItem
              href="/eventos"
              label="Eventos"
              icon={<Calendar size={18} />}
              active={isActive('/eventos')}
              onClick={handleMenuItemClick}
            />
            <MenuListItem
              href="/profile"
              label="Meu perfil"
              icon={<UserIcon size={18} />}
              active={isActive('/profile')}
              onClick={handleMenuItemClick}
            />
            {user.role === UserRole.ADMIN ? (
              <MenuListItem
                href="/admin"
                label="Admin"
                icon={<ShieldCheck size={18} />}
                active={isActive('/admin')}
                onClick={handleMenuItemClick}
              />
            ) : null}
          </div>

          {onSignOut ? (
            <button
              type="button"
              onClick={() => {
                handleMenuItemClick();
                onSignOut();
              }}
              className="w-full rounded-2xl bg-[#004691] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#004691]/20"
            >
              Sair
            </button>
          ) : null}
        </div>
      </div>

      <header className="sticky top-0 z-40 flex items-center justify-between bg-transparent px-5 pb-2 pt-6">
        <button type="button" onClick={() => setIsMenuOpen(true)} className="p-1 text-[#004691]">
          <Menu size={28} />
        </button>
        <Logo size="sm" />
        <div className="h-7 w-7" />
      </header>

      <main className="scrollbar-hide flex-1 overflow-y-auto">{children}</main>

      <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-6">
        <nav className="flex w-full max-w-[360px] items-center justify-between rounded-full border border-white/10 bg-[#004691] px-2 py-2 shadow-2xl">
          <NavItem href="/" icon={<HomeIcon size={20} />} active={isActive('/')} />
          <NavItem href="/negocios" icon={<Store size={20} />} active={isActive('/negocios')} />
          <NavItem href="/community" icon={<Users size={20} />} active={isActive('/community')} />
          <NavItem href="/eventos" icon={<Calendar size={20} />} active={isActive('/eventos')} />
          <NavItem href="/profile" icon={<UserIcon size={20} />} active={isActive('/profile')} />
        </nav>
      </div>
    </div>
  );
};

const MenuListItem: React.FC<{
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}> = ({ href, label, icon, active = false, onClick }) => (
  <Link
    href={href}
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3.5 transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-white/50 ${
      active ? 'bg-white/40' : ''
    }`}
  >
    <div className="text-[#004691]">{icon}</div>
    <span className="text-sm font-bold text-slate-700">{label}</span>
  </Link>
);

const NavItem: React.FC<{ href: string; icon: React.ReactNode; active: boolean }> = ({
  href,
  icon,
  active,
}) => (
  <Link
    href={href}
    className={`flex items-center justify-center transition-all duration-300 ${
      active
        ? 'h-12 w-12 scale-105 rounded-full bg-white text-[#004691] shadow-lg'
        : 'h-11 w-11 text-white/70 hover:text-white'
    }`}
  >
    {icon}
  </Link>
);

export default Layout;

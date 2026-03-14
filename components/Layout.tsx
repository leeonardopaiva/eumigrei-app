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

const navigationItems = [
  { href: '/', label: 'Home', icon: <HomeIcon size={22} /> },
  { href: '/negocios', label: 'Negocios', icon: <Store size={18} /> },
  { href: '/community', label: 'Comunidade', icon: <Users size={18} /> },
  { href: '/eventos', label: 'Eventos', icon: <Calendar size={18} /> },
  { href: '/profile', label: 'Meu perfil', icon: <UserIcon size={18} /> },
];

const SidebarContent: React.FC<{
  user: User;
  isActive: (path: string) => boolean;
  onItemClick?: () => void;
  onSignOut?: () => void;
}> = ({ user, isActive, onItemClick, onSignOut }) => (
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
            <h2 className="text-xl font-bold text-[#004691]">{user.name}</h2>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              {user.username ? `@${user.username}` : 'Membro da comunidade'}
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-100 rounded-3xl border border-white/50 bg-white/70 p-2 shadow-sm backdrop-blur-md">
        {navigationItems.map((item) => (
          <MenuListItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isActive(item.href)}
            onClick={onItemClick}
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
        className="w-full rounded-2xl bg-[#004691] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#004691]/20"
      >
        Sair
      </button>
    ) : null}
  </div>
);

const Layout: React.FC<LayoutWithUserProps> = ({ children, user, onSignOut }) => {
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
                className="p-1 text-[#004691]"
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

          <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-6 lg:hidden">
            <nav className="flex w-full max-w-[360px] items-center justify-between rounded-full border border-white/10 bg-[#004691] px-2 py-2 shadow-2xl">
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

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  CloudUpload,
  Flag,
  ImageIcon,
  LayoutGrid,
  LogOut,
  MapPin,
  Menu,
  Megaphone,
  Search,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import GringoouLogo from '@/components/icons/GringoouLogo';
import { Avatar } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { User } from '@/types';

const navigation = [
  { href: '/admin', label: 'Visao Geral', icon: LayoutGrid, exact: true },
  { href: '/admin/ads', label: 'Anuncios Pagos', icon: Megaphone },
  { href: '/admin/moderation', label: 'Moderacao', icon: ShieldCheck },
  { href: '/admin/businesses', label: 'Negocios', icon: BriefcaseBusiness },
  { href: '/admin/events', label: 'Eventos', icon: CalendarDays },
  { href: '/admin/users', label: 'Usuarios', icon: Users },
  { href: '/admin/regions', label: 'Regioes', icon: MapPin },
  { href: '/admin/imports', label: 'Importacoes', icon: CloudUpload },
  { href: '/admin/banners', label: 'Banners', icon: ImageIcon },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
];

const labels: Record<string, string> = {
  ads: 'Anuncios', moderation: 'Moderacao', businesses: 'Negocios', events: 'Eventos', users: 'Usuarios',
  regions: 'Regioes', imports: 'Importacoes', banners: 'Banners', analytics: 'Analytics',
};

export default function AdminShell({ user, children }: { user: User; children: React.ReactNode }) {
  const pathname = usePathname() || '/admin';
  const [mobileOpen, setMobileOpen] = useState(false);
  const segment = pathname.split('/')[2] || '';
  const sectionLabel = labels[segment] || 'Visao Geral';

  const sidebar = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-[74px] items-center border-b border-slate-200 px-6"><GringoouLogo size={25} /></div>
      <div className="flex-1 overflow-y-auto px-3 py-5">
        <p className="px-3 pb-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Principal</p>
        <nav className="space-y-1" aria-label="Navegacao administrativa">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={cn('flex h-11 items-center gap-3 rounded-2xl px-3 text-sm font-semibold transition', active ? 'bg-[#EAF1FF] text-[#2B5DF5]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')}>
                <Icon size={18} strokeWidth={2} />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-t border-slate-200 p-4">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar src={user.avatar} name={user.name} size="sm" />
          <div className="min-w-0"><p className="truncate text-xs font-bold text-slate-900">{user.name}</p><p className="text-[10px] text-slate-400">Administrador</p></div>
        </div>
        <Link href="/inicio" className="mt-2 flex items-center gap-2 rounded-xl px-2 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50"><Flag size={14} />Voltar a comunidade</Link>
        <button type="button" onClick={() => signOut({ callbackUrl: '/login' })} className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-xs font-bold text-red-600 hover:bg-red-50"><LogOut size={14} />Sair</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#132F40]">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-56 border-r border-slate-200 lg:block">{sidebar}</aside>
      {mobileOpen ? <div className="fixed inset-0 z-[80] lg:hidden"><button type="button" aria-label="Fechar menu" className="absolute inset-0 bg-slate-950/35" onClick={() => setMobileOpen(false)} /><aside className="relative h-full w-72 shadow-xl">{sidebar}<button type="button" aria-label="Fechar" className="absolute right-3 top-5 rounded-full p-2 text-slate-500" onClick={() => setMobileOpen(false)}><X size={20} /></button></aside></div> : null}
      <div className="lg:pl-56">
        <header className="sticky top-0 z-40 flex h-[74px] items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-7">
          <div className="flex items-center gap-3"><button type="button" className="rounded-xl p-2 text-slate-600 lg:hidden" onClick={() => setMobileOpen(true)}><Menu size={22} /></button><span className="text-sm font-extrabold">{segment === 'ads' ? 'Moderador' : 'Admin'}</span><span className="text-slate-300">›</span><span className="text-sm font-bold">{sectionLabel}</span></div>
          <div className="flex items-center gap-2">
            <div className="hidden w-56 sm:block"><div className="flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-[#F8FAFC] px-4"><Search size={16} className="text-slate-400" /><input aria-label="Buscar no painel" placeholder="Buscar..." className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" /></div></div>
            <button type="button" aria-label="Notificacoes" className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-400"><Bell size={17} /><span className="absolute -right-0.5 -top-0.5 h-4 min-w-4 rounded-full bg-red-500 px-1 text-[9px] font-bold leading-4 text-white">4</span></button>
            <button type="button" className="flex h-10 items-center gap-2 rounded-full border border-slate-200 px-2.5"><Avatar src={user.avatar} name={user.name} size="xs" /><span className="hidden max-w-28 truncate text-xs font-bold sm:block">{user.name}</span><ChevronDown size={14} className="text-slate-400" /></button>
          </div>
        </header>
        <main className="min-h-[calc(100vh-74px)]">{children}</main>
      </div>
    </div>
  );
}

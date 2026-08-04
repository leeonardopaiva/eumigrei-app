'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, CircleHelp, LayoutDashboard, Megaphone, Settings } from 'lucide-react';
import GringoouLogo from '@/components/icons/GringoouLogo';
import { cn } from '@/lib/cn';

const items = [
  { href: '/ads', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/ads/criar', label: 'Criar anuncio', icon: Megaphone },
  { href: '/ads/relatorios', label: 'Relatorios', icon: BarChart3 },
  { href: '/ads/configuracoes', label: 'Configuracoes', icon: Settings },
  { href: '/ads/ajuda', label: 'Ajuda', icon: CircleHelp },
];

export function AdsSidebar() {
  const pathname = usePathname();
  return (
    <aside className="border-b border-border bg-white md:fixed md:inset-y-0 md:left-0 md:z-50 md:w-64 md:border-b-0 md:border-r">
      <div className="flex h-16 items-center gap-3 px-5 md:h-20">
        <GringoouLogo size={34} />
        <div><p className="font-extrabold text-text">Gringoou Ads</p><p className="text-caption text-muted-foreground">Gerenciador de anuncios</p></div>
      </div>
      <nav className="flex gap-2 overflow-x-auto px-3 pb-3 md:block md:space-y-1 md:overflow-visible md:pb-0" aria-label="Menu do Ads Manager">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.href === '/ads' ? pathname === item.href : pathname?.startsWith(item.href);
          return <Link key={item.href} href={item.href} className={cn('flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-body-sm font-semibold transition', active ? 'bg-brand-100 text-brand-600' : 'text-muted-foreground hover:bg-slate-50 hover:text-text')}><Icon size={18} />{item.label}</Link>;
        })}
      </nav>
      <div className="absolute bottom-5 left-3 right-3 hidden rounded-2xl bg-brand-100 p-4 md:block"><p className="text-caption font-bold uppercase tracking-wide text-brand-600">Ambiente isolado</p><p className="mt-1 text-caption text-muted-foreground">Campanhas e pagamentos separados do feed social.</p></div>
    </aside>
  );
}

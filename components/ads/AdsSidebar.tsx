'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { BarChart3, CirclePlus, LayoutDashboard, LogOut } from 'lucide-react';
import GringoouLogo from '@/components/icons/GringoouLogo';
import { cn } from '@/lib/cn';

const items = [
  { href: '/ads', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/ads/criar', label: 'Criar Anuncio', icon: CirclePlus },
  { href: '/ads/relatorios', label: 'Relatorios', icon: BarChart3 },
];

export function AdsSidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed left-0 top-[72px] z-40 hidden h-[calc(100vh-72px)] w-[272px] border-r border-slate-200 bg-white md:flex md:flex-col">
      <div className="flex items-center px-7 pb-10 pt-9">
        <GringoouLogo size={34} />
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-5" aria-label="Menu do Ads Manager">
        <p className="px-3 pb-3 pt-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">Anuncios</p>
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.href === '/ads' ? pathname === item.href : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-4 py-3 text-[14px] font-bold transition',
                active ? 'bg-[#e4f1ff] text-[#0787f9]' : 'text-[#243b53] hover:bg-slate-50',
              )}
            >
              <Icon size={18} strokeWidth={2.2} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 px-5 py-5">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 px-4 py-2.5 text-[13px] font-bold text-red-600 transition hover:bg-red-50"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  );
}

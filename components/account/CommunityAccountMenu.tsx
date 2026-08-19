'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { BriefcaseBusiness, ChevronDown, LogOut, Settings, UserRound } from 'lucide-react';
import { Avatar } from '@/components/ui';

type BusinessAccount = { id: string; name: string; logoUrl: string | null };

type CommunityAccountMenuProps = {
  user: { name: string; avatar: string; email?: string | null };
  profileHref: string;
};

export function CommunityAccountMenu({ user, profileHref }: CommunityAccountMenuProps) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<BusinessAccount[]>([]);

  useEffect(() => {
    void fetch('/api/ads/accounts', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => setAccounts(payload?.accounts ?? []))
      .catch(() => setAccounts([]));
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  async function openBusiness(accountId: string) {
    await fetch('/api/ads/accounts/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adAccountId: accountId }),
    });
    setOpen(false);
    router.push('/ads/overview');
  }

  return (
    <div ref={rootRef} className="relative">
      <button type="button" aria-label="Abrir menu da conta" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="flex items-center gap-1 rounded-full p-0.5 transition hover:bg-slate-100">
        <Avatar src={user.avatar} name={user.name} size="md" />
        <ChevronDown size={14} className="hidden text-slate-400 sm:block" />
      </button>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+10px)] z-[80] w-[310px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-950/10">
          <div className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Conectado como</p>
            <button type="button" onClick={() => { setOpen(false); router.push(profileHref); }} className="mt-3 flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-slate-50">
              <Avatar src={user.avatar} name={user.name} size="md" />
              <span className="min-w-0 flex-1"><strong className="block truncate text-sm text-slate-900">{user.name}</strong><span className="block truncate text-xs text-slate-500">{user.email || 'Conta pessoal'}</span></span>
              <UserRound size={18} className="text-slate-400" />
            </button>
          </div>
          <div className="border-t border-slate-100 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Negócios</p>
            {accounts.length ? accounts.map((account) => (
              <button key={account.id} type="button" onClick={() => void openBusiness(account.id)} className="mt-2 flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-brand-50">
                <Avatar src={account.logoUrl} name={account.name} size="md" />
                <span className="min-w-0 flex-1"><strong className="block truncate text-sm text-slate-900">{account.name}</strong><span className="block truncate text-xs text-slate-500">Conta de negócio</span></span>
                <BriefcaseBusiness size={18} className="text-brand-500" />
              </button>
            )) : (
              <button type="button" onClick={() => { setOpen(false); router.push('/ads/register'); }} className="mt-2 flex w-full items-center gap-3 rounded-xl p-3 text-left text-sm font-bold text-brand-600 hover:bg-brand-50">
                <BriefcaseBusiness size={18} /> Anunciar seu negócio
              </button>
            )}
          </div>
          <div className="border-t border-slate-100 p-2">
            <button type="button" onClick={() => { setOpen(false); router.push('/profile'); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"><Settings size={17} />Configurações pessoais</button>
            <button type="button" onClick={() => void signOut({ callbackUrl: '/login' })} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"><LogOut size={17} />Sair</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

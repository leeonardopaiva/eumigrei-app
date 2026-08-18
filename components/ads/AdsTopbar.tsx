'use client';

import { useSession } from 'next-auth/react';
import { Bell, ChevronDown, Menu } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { useAdAccount } from '@/components/ads/AdAccountProvider';
import GringoouLogo from '@/components/icons/GringoouLogo';

type AdsTopbarProps = { onMenuToggle: () => void };

export function AdsTopbar({ onMenuToggle }: AdsTopbarProps) {
  const { data: session } = useSession();
  const { account, accounts, selectAccount } = useAdAccount();
  const accountName = session?.user?.name || 'Anunciante';
  const accountId = session?.user?.id ? session.user.id.slice(0, 7) : '-';
  const accountAvatar = session?.user?.image || null;

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-slate-200 bg-white">
      <div className="flex h-[72px] items-center justify-between gap-4 px-4 md:justify-end md:px-7 md:pl-[calc(1.75rem+272px)]">
        <div className="flex items-center gap-3 md:hidden">
          <button type="button" onClick={onMenuToggle} aria-label="Abrir menu" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-[#132f40]">
            <Menu size={21} />
          </button>
          <GringoouLogo size={28} />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Notificacoes"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <Bell size={18} />
          </button>
          <div className="flex items-center gap-2">
            <Avatar src={accountAvatar} name={accountName} size="md" />
            <div className="hidden min-w-0 sm:block">
              {accounts.length > 1 ? (
                <div className="relative flex items-center gap-1">
                  <select
                    aria-label="Conta comercial selecionada"
                    value={account?.id ?? ''}
                    onChange={(event) => void selectAccount(event.target.value)}
                    className="max-w-[210px] appearance-none bg-transparent pr-5 text-body-sm font-bold text-[#132f40] outline-none"
                  >
                    {accounts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-0 text-slate-400" />
                </div>
              ) : <span className="block max-w-[210px] truncate text-body-sm font-bold text-[#132f40]">{account?.name ?? accountName}</span>}
              <p className="truncate text-[12px] text-slate-400">Account ID: {(account?.id ?? accountId).slice(0, 10)}...</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

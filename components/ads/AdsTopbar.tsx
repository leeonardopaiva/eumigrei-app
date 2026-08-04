'use client';

import { useSession } from 'next-auth/react';
import { Bell, ChevronDown } from 'lucide-react';
import { Avatar } from '@/components/ui';

export function AdsTopbar() {
  const { data: session } = useSession();
  const accountName = session?.user?.name || 'Anunciante';
  const accountId = session?.user?.id ? session.user.id.slice(0, 7) : '-';
  const accountAvatar = session?.user?.image || null;

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-slate-200 bg-white">
      <div className="flex h-[72px] items-center justify-end gap-4 px-4 md:px-7 md:pl-[calc(1.75rem+272px)]">
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
              <div className="flex items-center gap-2">
                <span className="truncate text-body-sm font-bold text-[#132f40]">{accountName}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </div>
              <p className="truncate text-[12px] text-slate-400">Account ID: {accountId}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

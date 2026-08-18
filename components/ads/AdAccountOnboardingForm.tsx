'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import GringoouLogo from '@/components/icons/GringoouLogo';
import { Button, Card, Input, Select } from '@/components/ui';
import { useAdAccount } from '@/components/ads/AdAccountProvider';
import { BusinessCategoryField } from '@/components/ads/BusinessCategoryField';
import { formatInternationalPhone } from '@/lib/phone';

export function AdAccountOnboardingForm() {
  const router = useRouter();
  const { refreshAccounts } = useAdAccount();
  const [form, setForm] = useState({ name: '', websiteUrl: '', phone: '', businessAddress: '', businessCategory: '', country: 'US', currency: 'USD', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', isAgency: false, useWebsitePhotos: true, subcategories: [] as string[] });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ads/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? 'Nao foi possivel cadastrar a empresa.');
      await refreshAccounts();
      router.replace('/ads/overview');
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Nao foi possivel cadastrar a empresa.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-2xl items-center">
      <Card className="w-full rounded-[28px] border border-slate-200 p-8 shadow-sm">
        <GringoouLogo size={34} />
        <p className="mt-6 text-xs font-bold uppercase tracking-wider text-brand-500">Configuracao inicial</p>
        <h1 className="mt-2 text-3xl font-extrabold text-[#132f40]">Cadastre sua empresa</h1>
        <p className="mt-2 text-sm text-slate-500">Esta sera sua conta comercial no Ads Manager.</p>
        <form onSubmit={submit} className="mt-7 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 sm:col-span-2"><span className="text-sm font-bold">Nome da empresa</span><Input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label>
          <label className="space-y-2 sm:col-span-2"><span className="text-sm font-bold">Website</span><Input type="url" placeholder="https://empresa.com" value={form.websiteUrl} onChange={(event) => setForm((current) => ({ ...current, websiteUrl: event.target.value }))} /></label>
          <label className="space-y-2 sm:col-span-2"><span className="text-sm font-bold">Telefone / WhatsApp comercial</span><Input type="tel" required inputMode="tel" placeholder="+1 (555) 000-0000" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: formatInternationalPhone(event.target.value) }))} /></label>
          <div className="sm:col-span-2"><BusinessCategoryField category={form.businessCategory} subcategories={form.subcategories} onCategoryChange={(businessCategory) => setForm((current) => ({ ...current, businessCategory }))} onSubcategoriesChange={(subcategories) => setForm((current) => ({ ...current, subcategories }))} /></div>
          <label className="space-y-2"><span className="text-sm font-bold">Pais</span><Select value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))}><option value="US">Estados Unidos</option><option value="BR">Brasil</option><option value="PT">Portugal</option><option value="CA">Canada</option></Select></label>
          <label className="space-y-2"><span className="text-sm font-bold">Moeda</span><Select value="USD" disabled><option value="USD">USD - Dolar americano</option></Select></label>
          <label className="space-y-2"><span className="text-sm font-bold">Timezone</span><Input required value={form.timezone} onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))} /></label>
          <label className="flex items-center gap-3 text-sm font-semibold sm:col-span-2"><input type="checkbox" checked={form.isAgency} onChange={(event) => setForm((current) => ({ ...current, isAgency: event.target.checked }))} /> Esta empresa e uma agencia</label>
          {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">{error}</p> : null}
          <div className="sm:col-span-2"><Button type="submit" fullWidth loading={loading}>Continuar para o Ads Manager</Button></div>
        </form>
      </Card>
    </div>
  );
}

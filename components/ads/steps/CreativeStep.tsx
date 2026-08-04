'use client';

import CloudinaryImageField from '@/components/forms/CloudinaryImageField';
import { Badge, Button, Card, Input, Select, Textarea } from '@/components/ui';
import type { AdWizardData } from '@/lib/ads/validation';
import type { AdFieldErrors, PatchAdWizard } from '../types';

const CTA_OPTIONS = ['Saiba mais', 'Fale conosco', 'Comprar agora', 'Ver oferta', 'Participar'];

export function CreativeStep({ state, errors, patch }: { state: AdWizardData; errors: AdFieldErrors; patch: PatchAdWizard }) {
  const destinationLabel = state.goal === 'WHATSAPP' ? 'WhatsApp com DDI' : state.goal === 'MARKETPLACE' ? 'ID do item' : 'URL de destino';

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <Card className="space-y-5">
        <div><Card.Title>Crie o anuncio</Card.Title><Card.Description>O preview acompanha suas alteracoes.</Card.Description></div>
        <label className="block space-y-2"><span className="text-body-sm font-bold">Titulo</span><Input value={state.headline} maxLength={70} onChange={(event) => patch({ headline: event.target.value })} state={errors.headline ? 'error' : 'default'} helperText={errors.headline ?? `${state.headline.length}/70 caracteres`} /></label>
        <label className="block space-y-2"><span className="text-body-sm font-bold">Descricao</span><Textarea value={state.description} maxLength={1700} onChange={(event) => patch({ description: event.target.value })} state={errors.description ? 'error' : 'default'} helperText={errors.description ?? `${state.description.length}/1700 caracteres`} /></label>
        <div><span className="mb-2 block text-body-sm font-bold">Imagem</span><CloudinaryImageField value={state.imageUrl} onChange={(imageUrl) => patch({ imageUrl })} folder="banners" height={220} error={errors.imageUrl} /></div>
        <label className="block space-y-2"><span className="text-body-sm font-bold">Chamada para acao</span><Select value={state.ctaLabel} onChange={(event) => patch({ ctaLabel: event.target.value })}>{CTA_OPTIONS.map((cta) => <option key={cta}>{cta}</option>)}</Select></label>
        <label className="block space-y-2"><span className="text-body-sm font-bold">{destinationLabel}</span><Input value={state.destination} placeholder={state.goal === 'WHATSAPP' ? '15551234567' : state.goal === 'EXTERNAL_URL' ? 'https://seusite.com' : 'ID do item no marketplace'} onChange={(event) => patch({ destination: event.target.value })} state={errors.destination ? 'error' : 'default'} helperText={errors.destination} /></label>
      </Card>
      <div className="lg:sticky lg:top-32 lg:self-start">
        <div className="mx-auto max-w-[350px] rounded-[2.5rem] bg-text p-2 shadow-xl">
          <Card className="rounded-[2rem]" aria-label="Preview do anuncio">
            <Badge tone="neutro">Patrocinado</Badge>
            <div className="mt-4 aspect-[4/3] overflow-hidden rounded-2xl bg-brand-100">{state.imageUrl ? <img src={state.imageUrl} alt="Preview do anuncio" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-body-sm text-muted-foreground">Sua imagem aparecera aqui</div>}</div>
            <Card.Title className="mt-4">{state.headline || 'Titulo do seu anuncio'}</Card.Title>
            <Card.Description className="mt-2 whitespace-pre-wrap">{state.description || 'A descricao do anuncio aparecera neste espaco.'}</Card.Description>
            <Button className="mt-5" fullWidth>{state.ctaLabel}</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}


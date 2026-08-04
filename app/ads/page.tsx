import { Megaphone } from 'lucide-react';
import { AdsPlaceholderPage } from '@/components/ads/AdsPlaceholderPage';
import { Button } from '@/components/ui';

export default function AdsDashboardPage() {
  return <AdsPlaceholderPage title="Dashboard de anuncios" description="Acompanhe suas campanhas, pagamentos e status de moderacao em um ambiente exclusivo."><form action="/ads/criar" className="mt-6"><Button type="submit" iconLeft={<Megaphone size={17} />}>Criar anuncio</Button></form></AdsPlaceholderPage>;
}

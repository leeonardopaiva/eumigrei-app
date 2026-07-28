'use client';

import React, { useState } from 'react';
import { MapPin, Star } from 'lucide-react';
import UnifiedSearchInput from '../components/search/UnifiedSearchInput';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Tabs } from '../components/ui/Tabs';
import { STATIC_HOUSING } from '../lib/static-catalog';

const housingFilters = [
  { label: 'Apartamento', value: 'apartamento' },
  { label: 'Casa', value: 'casa' },
  { label: 'Quarto', value: 'quarto' },
];

const HousingList: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('apartamento');
  const [search, setSearch] = useState('');

  return (
    <div className="animate-in space-y-5 px-5 pb-24 fade-in duration-500">
      <header className="mt-4 space-y-1">
        <h1 className="text-h2 font-bold text-foreground">Moradia</h1>
        <p className="text-body-sm text-muted-foreground">Encontre seu próximo lar na comunidade.</p>
      </header>

      <UnifiedSearchInput value={search} onChange={setSearch} staticPlaceholder="Buscar imóveis..." />
      <div className="scrollbar-hide overflow-x-auto">
        <Tabs items={housingFilters} value={activeFilter} onChange={setActiveFilter} />
      </div>

      <section className="space-y-3" aria-labelledby="housing-title">
        <h2 id="housing-title" className="text-body-sm font-bold text-foreground">Imóveis disponíveis</h2>
        {STATIC_HOUSING.map((item) => (
          <Card key={item.id} padded={false} className="flex min-h-36 border border-border shadow-xs">
            <img src={item.img} className="w-32 shrink-0 object-cover sm:w-40" alt={item.title} />
            <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
              <div>
                <h3 className="text-body-sm font-bold leading-snug text-foreground">{item.title}</h3>
                <div className="mt-1 flex items-center gap-1 text-amber-500" aria-label={`Avaliação ${item.rating} de 5`}>
                  <Star size={13} fill="currentColor" aria-hidden="true" />
                  <span className="text-caption font-semibold">{item.rating},0</span>
                </div>
                <p className="mt-1 flex items-center gap-1 text-caption text-muted-foreground">
                  <MapPin size={13} aria-hidden="true" /> {item.location}
                </p>
                <p className="mt-1 text-body-sm font-bold text-foreground">{item.price}</p>
              </div>
              <Button size="xs" className="mt-3 self-end">Ver detalhes</Button>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
};

export default HousingList;

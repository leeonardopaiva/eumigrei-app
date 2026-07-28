'use client';

import React, { useState } from 'react';
import { Briefcase } from 'lucide-react';
import UnifiedSearchInput from '../components/search/UnifiedSearchInput';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Tabs } from '../components/ui/Tabs';
import { STATIC_JOBS } from '../lib/static-catalog';

const jobFilters = [
  { label: 'Tempo integral', value: 'integral' },
  { label: 'Meio período', value: 'parcial' },
  { label: 'Freelancer', value: 'freelancer' },
];

const JobList: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('integral');
  const [search, setSearch] = useState('');

  return (
    <div className="animate-in space-y-5 px-5 pb-24 fade-in duration-500">
      <header className="mt-4 space-y-1">
        <h1 className="text-h2 font-bold text-foreground">Vagas</h1>
        <p className="text-body-sm text-muted-foreground">Oportunidades para a comunidade brasileira.</p>
      </header>

      <UnifiedSearchInput value={search} onChange={setSearch} staticPlaceholder="Buscar vagas brasileiras..." />
      <div className="scrollbar-hide overflow-x-auto">
        <Tabs items={jobFilters} value={activeFilter} onChange={setActiveFilter} />
      </div>

      <section className="space-y-3" aria-labelledby="jobs-title">
        <h2 id="jobs-title" className="text-body-sm font-bold text-foreground">Vagas disponíveis</h2>
        {STATIC_JOBS.map((job) => (
          <Card key={job.id} padded={false} className="flex min-h-32 border border-border shadow-xs">
            <img src={job.img} className="w-28 shrink-0 object-cover sm:w-36" alt={job.title} />
            <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
              <div>
                <h3 className="text-body-sm font-bold leading-snug text-foreground">{job.title}</h3>
                <p className="mt-1 flex items-center gap-1.5 text-caption font-semibold text-brand-500">
                  <Briefcase size={13} aria-hidden="true" /> {job.company}
                </p>
                <p className="mt-1 text-caption text-muted-foreground">{job.salary}</p>
              </div>
              <Button size="xs" className="mt-3 self-end">Ver vaga</Button>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
};

export default JobList;

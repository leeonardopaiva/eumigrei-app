
import React, { useState } from 'react';
import { Search, Briefcase } from 'lucide-react';

const JobList: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('Tempo Integral');

  const jobs = [
    { id: '1', title: 'Atendente de Restaurante', company: 'Basil Café', salary: '$20 - $22/hora', img: 'https://picsum.photos/seed/job1/200' },
    { id: '2', title: 'Assistente Administrativo', company: 'RB Logistics', salary: '$18 - $20/hora', img: 'https://picsum.photos/seed/job2/200' },
    { id: '3', title: 'Motorista Particular', company: 'Transporte Rosa', salary: '$26 - $30/hora', img: 'https://picsum.photos/seed/job3/200' },
    { id: '4', title: 'Manicure', company: 'Saló Viviane', salary: '$16 - $18/hora', img: 'https://picsum.photos/seed/job4/200' },
    { id: '5', title: 'Faxineiro(a)', company: 'Cristal Limposse', salary: '$18 - $22/hora', img: 'https://picsum.photos/seed/job5/200' },
  ];

  return (
    <div className="px-5 space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="mt-4">
        <h1 className="text-2xl font-bold text-blue-900 mb-4">Vagas</h1>
        <div className="relative">
          <input type="text" placeholder="Buscar vagas brasileiras..." className="w-full bg-slate-100/80 rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-0" />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['Tempo Integral', 'Meio Período', 'Freelancer'].map(f => (
          <button 
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-6 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shadow-sm border ${activeFilter === f ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-blue-900 border-slate-100'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="font-bold text-blue-900">Vagas Disponíveis</h2>
        {jobs.map(job => (
          <div key={job.id} className="bg-white rounded-3xl p-4 shadow-sm border border-slate-50 flex gap-4">
            <img src={job.img} className="w-20 h-20 rounded-2xl object-cover" alt={job.title} />
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-blue-900 text-sm leading-tight">{job.title}</h4>
                <div className="flex items-center gap-1 text-blue-600 text-[10px] font-bold mt-1">
                  <Briefcase size={10} fill="currentColor" className="opacity-70" /> {job.company}
                </div>
                <p className="text-slate-500 text-[10px] mt-1">{job.salary}</p>
              </div>
              <button className="self-end bg-blue-900 text-white px-4 py-1.5 rounded-xl text-[10px] font-bold shadow-sm">
                Ver vaga
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobList;

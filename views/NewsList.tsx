
import React, { useState } from 'react';
import { Search, Clock } from 'lucide-react';

const NewsList: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Destaques');

  const news = [
    { title: 'Copa América 2024: Saiba os detalhes da participação do Brasil', source: 'Comunidade Boston', time: '2 horas atrás', img: 'https://picsum.photos/seed/news1/300' },
    { title: 'Os cuidados para turistas brasileiros nos EUA', source: 'Agencia Brasil', time: '3 horas atrás', img: 'https://picsum.photos/seed/news2/300' },
    { title: 'Levantamento aponta aumento de brasileiros empreendedores nos EUA', source: 'G1', time: '5 horas atrás', img: 'https://picsum.photos/seed/news3/300' },
    { title: 'Turismo nacional tem crescimento recorde no primeiro trimestre', source: 'O Globo', time: '8 horas atrás', img: 'https://picsum.photos/seed/news4/300' },
  ];

  return (
    <div className="px-5 space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="mt-4">
        <h1 className="mb-4 text-h2 font-bold text-foreground">Notícias</h1>
        <div className="relative">
          <input type="text" placeholder="Buscar notícias brasileiras..." className="w-full bg-slate-100/80 rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-0" />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['Destaques', 'Comunidade', 'Brasil', 'EUA'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap rounded-full px-6 py-2 text-xs font-bold transition ${activeTab === tab ? 'bg-brand-500 text-white' : 'bg-surface text-foreground hover:bg-brand-100'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="font-bold text-foreground">Notícias recentes</h2>
        {news.map((item, idx) => (
          <div key={idx} className="bg-white rounded-3xl p-4 shadow-sm border border-slate-50 flex gap-4">
            <img src={item.img} className="w-24 h-24 rounded-2xl object-cover" alt="news" />
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h4 className="text-body-sm font-bold leading-tight text-foreground">{item.title}</h4>
                <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-brand-500">
                   <span className="rounded bg-brand-500 p-0.5 text-white"><Clock size={10} /></span> {item.source} • 2
                </div>
                <p className="text-slate-400 text-[10px] mt-1">{item.time}</p>
              </div>
              <button className="self-end rounded-full bg-brand-500 px-4 py-1.5 text-[10px] font-bold text-white">
                Ler notícia
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsList;

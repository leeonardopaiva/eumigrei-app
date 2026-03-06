
import React, { useState } from 'react';
import { Calendar, Filter, MapPin, ChevronRight } from 'lucide-react';

const Marketplace: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Próximos');

  return (
    <div className="px-5 space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="mt-4">
        <h1 className="text-2xl font-bold text-blue-900 mb-4">Agenda de Eventos</h1>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {['Hoje', 'Esta semana', 'Próximos', 'Cultural', 'Networking'].map(tab => (
                <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shadow-sm border ${activeTab === tab ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-blue-900 border-slate-100'}`}
                >
                    {tab}
                </button>
            ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-bold text-blue-900">Eventos Próximos</h2>
        <EventCard 
            title="Torneio de Futebol Brasileiro" 
            date="Sábado, 27 Abr • 11:00" 
            location="Everett Soccer Field" 
            dist="4.2km"
            img="https://picsum.photos/seed/soccer/300" 
        />
        <EventCard 
            title="Feira Gastronômica Brasileira" 
            date="Domingo, 28 Abr • 10:00" 
            location="Charles River Park" 
            dist="3.8km"
            img="https://picsum.photos/seed/foodfest/300" 
        />
        <EventCard 
            title="Festa Brasileira à Fantasia" 
            date="Sábado, 04 Mai • 21:00" 
            location="Lavish Lounge" 
            dist="2.9km"
            img="https://picsum.photos/seed/party/300" 
        />
      </div>
    </div>
  );
};

const EventCard: React.FC<{ title: string; date: string; location: string; dist: string; img: string }> = ({ title, date, location, dist, img }) => (
    <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-50 flex gap-4">
        <img src={img} className="w-24 h-24 rounded-2xl object-cover" alt={title} />
        <div className="flex-1 flex flex-col justify-between">
            <div>
                <h4 className="font-bold text-blue-900 text-sm leading-tight">{title}</h4>
                <p className="text-slate-500 text-[10px] mt-1 font-medium">{date}</p>
                <div className="flex items-center gap-1 text-blue-600 text-[10px] font-bold mt-2">
                    <MapPin size={10} fill="currentColor" /> {location} • {dist}
                </div>
            </div>
            <button className="self-end bg-blue-900 text-white px-4 py-1.5 rounded-xl text-[10px] font-bold shadow-sm">
                Ver evento
            </button>
        </div>
    </div>
);

export default Marketplace;

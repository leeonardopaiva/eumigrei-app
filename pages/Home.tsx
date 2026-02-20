
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Search, ArrowRight } from 'lucide-react';
import { User } from '../types';

const Home: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div className="px-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mt-4">
        <p className="text-slate-500 text-lg font-medium">Olá, {user.name}!</p>
        <div className="flex items-center gap-2 text-[#333] font-bold text-2xl">
          {user.location}
          <div className="p-1 bg-white rounded-full shadow-sm">
            <MapPin size={18} className="text-[#28A745]" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative shadow-sm rounded-full overflow-hidden">
        <input 
          type="text" 
          placeholder="Qual serviço você está buscando?" 
          className="w-full bg-white border-none py-5 pl-14 pr-6 text-sm focus:ring-0 placeholder:text-slate-400"
        />
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-3 gap-3">
        <ServiceCard to="/negocios" icon="🏛️" label="Negócios" />
        <ServiceCard to="/community" icon="🗨️" label="Comunidade" />
        <ServiceCard to="/vagas" icon="💼" label="Vagas de trabalho" />
        <ServiceCard to="/noticias" icon="📰" label="Notícias" />
        <ServiceCard to="/moradia" icon="🏠" label="Moradia" />
        <ServiceCard to="/eventos" icon="📅" label="Eventos" />
      </div>

      {/* Banner Principal */}
      <div className="relative rounded-[40px] overflow-hidden shadow-lg h-[240px] group cursor-pointer">
        <img 
          src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80" 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
          alt="Agendador Residencial" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-8 left-8">
            <h3 className="text-white font-bold text-3xl leading-tight drop-shadow-md">Agendador<br/>Residencial</h3>
        </div>
        <button className="absolute bottom-8 left-8 w-14 h-14 bg-[#FF8C00] text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-[#E07B00] transition-colors">
            <ArrowRight size={24} strokeWidth={3} />
        </button>
      </div>

      {/* Espaçamento para o Bottom Nav */}
      <div className="h-10" />
    </div>
  );
};

const ServiceCard: React.FC<{ to: string; icon: string; label: string }> = ({ to, icon, label }) => (
  <Link to={to} className="flex flex-col items-center justify-center gap-3 p-5 bg-white rounded-3xl shadow-sm hover:shadow-md transition-all active:scale-95 border border-slate-50">
    <div className="text-3xl">{icon}</div>
    <span className="text-[11px] text-[#333] font-bold text-center leading-tight">{label}</span>
  </Link>
);

export default Home;

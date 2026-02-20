
import React, { useState } from 'react';
import { Search, Star, MapPin } from 'lucide-react';

const HousingList: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Apartamento');

  const listings = [
    { id: '1', title: 'Apartamento 2 Quartos', rating: 4, location: 'Everett, MA', price: '$2.400/mês', img: 'https://picsum.photos/seed/apt1/300' },
    { id: '2', title: 'Casa 3 Quartos, 2 Banheiros', rating: 5, location: 'Malden, MA', price: '$3.500/mês', img: 'https://picsum.photos/seed/house1/300' },
    { id: '3', title: 'Quarto para Alugar', rating: 3, location: 'Brighton, MA', price: '$900/mês', img: 'https://picsum.photos/seed/room1/300' },
    { id: '4', title: 'Estúdio Completo', rating: 4, location: 'Revere, MA', price: '$1.750/mês', img: 'https://picsum.photos/seed/studio1/300' },
  ];

  return (
    <div className="px-5 space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="mt-4">
        <h1 className="text-2xl font-bold text-blue-900 mb-4">Moradia</h1>
        <div className="relative">
          <input type="text" placeholder="Buscar imóveis brasileiros..." className="w-full bg-slate-100/80 rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-0" />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['Apartamento', 'Casa', 'Quarto', 'Estúdio'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shadow-sm border ${activeTab === tab ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-blue-900 border-slate-100'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="font-bold text-blue-900">Imóveis Disponíveis</h2>
        {listings.map(item => (
          <div key={item.id} className="bg-white rounded-3xl p-4 shadow-sm border border-slate-50 flex gap-4">
            <img src={item.img} className="w-24 h-24 rounded-2xl object-cover" alt={item.title} />
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-blue-900 text-sm">{item.title}</h4>
                <div className="flex items-center gap-1 text-yellow-400 text-[10px] mt-0.5">
                  {[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < item.rating ? 'currentColor' : 'none'} />)}
                  <span className="text-slate-400 font-medium ml-1">4 horas</span>
                </div>
                <p className="text-slate-500 text-[10px] mt-1">{item.location}</p>
                <p className="text-blue-900 font-bold text-xs mt-1">{item.price}</p>
              </div>
              <button className="self-end bg-blue-900 text-white px-4 py-1.5 rounded-xl text-[10px] font-bold shadow-sm">
                Ver perfil
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HousingList;

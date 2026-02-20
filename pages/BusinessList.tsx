
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, MapPin } from 'lucide-react';

const BusinessList: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('Restaurante');

  const businesses = [
    { id: '1', name: 'Minas Grill', category: 'Restaurante', rating: 4.8, reviews: 85, address: '57 Cambridge St.', image: 'https://picsum.photos/seed/grill/200' },
    { id: '2', name: 'Supermercado Brasileiro', category: 'Mercado', rating: 4.7, reviews: 59, address: '67 Chestnut Ave.', image: 'https://picsum.photos/seed/market/200' },
    { id: '3', name: 'Alex Cabeleireiro', category: 'Beleza', rating: 4.9, reviews: 102, address: '74 Massachusetts Ave.', image: 'https://picsum.photos/seed/hair/200' },
    { id: '4', name: 'Clínica Saúde Brasil', category: 'Saúde', rating: 4.8, reviews: 78, address: '200 Hampshire St.', image: 'https://picsum.photos/seed/health/200' },
  ];

  return (
    <div className="px-5 space-y-6 animate-in fade-in duration-500">
      <div className="mt-4">
        <h1 className="text-2xl font-bold text-blue-900 mb-4">Negócios</h1>
        <div className="relative">
          <input type="text" placeholder="Buscar negócios brasileiros..." className="w-full bg-slate-100/80 rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-0" />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['Restaurante', 'Mercado', 'Beleza', 'Saúde'].map(cat => (
          <button 
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={`px-6 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shadow-sm border ${activeFilter === cat ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-blue-900 border-slate-100'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-4 pb-20">
        <h2 className="font-bold text-blue-900">Negócios Disponíveis</h2>
        {businesses.map(biz => (
          <div key={biz.id} className="bg-white rounded-3xl p-4 shadow-sm border border-slate-50 flex gap-4">
            <img src={biz.image} className="w-24 h-24 rounded-2xl object-cover" alt={biz.name} />
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-blue-900">{biz.name}</h4>
                <div className="flex items-center gap-1 text-yellow-400 text-xs">
                  {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < 4 ? 'currentColor' : 'none'} />)}
                  <span className="text-slate-400 text-[10px] font-medium ml-1">{biz.rating} ({biz.reviews} reviews)</span>
                </div>
                <p className="text-blue-600 text-[10px] font-bold mt-0.5">{biz.category}</p>
                <div className="flex items-center gap-1 text-slate-500 text-[10px] mt-1">
                  <MapPin size={10} /> {biz.address}
                </div>
              </div>
              <Link to={`/negocios/${biz.id}`} className="self-end bg-blue-900 text-white px-4 py-1.5 rounded-xl text-[10px] font-bold shadow-sm">
                Ver perfil
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BusinessList;

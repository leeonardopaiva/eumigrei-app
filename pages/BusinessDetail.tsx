
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Phone, Heart, Star, MapPin, Share2 } from 'lucide-react';

const BusinessDetail: React.FC = () => {
  const { id } = useParams();

  return (
    <div className="animate-in slide-in-from-right duration-500">
      <div className="relative h-64">
        <img src="https://picsum.photos/seed/minasgrill/800/600" className="w-full h-full object-cover" alt="Minas Grill" />
        <div className="absolute top-4 right-4 flex gap-2">
            <button className="bg-white/80 backdrop-blur shadow p-2 rounded-full text-blue-900">
                <Heart size={20} />
            </button>
            <button className="bg-white/80 backdrop-blur shadow p-2 rounded-full text-blue-900">
                <Share2 size={20} />
            </button>
        </div>
      </div>

      <div className="bg-white rounded-t-3xl -mt-8 relative z-10 px-6 pt-6 pb-20 space-y-6">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-bold text-blue-900">Minas Grill</h1>
                <div className="flex items-center gap-1 text-yellow-400 mt-1">
                    {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                    <span className="text-slate-500 text-sm font-medium ml-2">85 avaliações</span>
                </div>
            </div>
            <button className="bg-blue-600 text-white px-6 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-200">
                <Phone size={18} fill="currentColor" /> Ligar
            </button>
        </div>

        <div className="flex items-center gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-2 font-medium">
                <span className="text-xl">🇧🇷</span> Restaurante Brasileiro
            </div>
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            <div className="flex items-center gap-1">
                <MapPin size={16} /> 57 Cambridge St., Boston, MA
            </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                    <img key={i} src={`https://picsum.photos/seed/user${i}/100`} className="w-8 h-8 rounded-full border-2 border-white object-cover" alt="user" />
                ))}
            </div>
            <p className="text-xs text-slate-500">
                Seguido por <span className="font-bold text-blue-900">João, Marina</span> e outros <span className="font-bold text-blue-900">124 pessoas</span> da comunidade
            </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className={`relative overflow-hidden rounded-2xl ${i === 6 ? 'group' : ''}`}>
                    <img src={`https://picsum.photos/seed/food${i}/300`} className="w-full aspect-square object-cover" alt="food" />
                    {i === 6 && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-lg">
                            +48
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default BusinessDetail;

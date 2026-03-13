import React, { useEffect, useState } from 'react';
import { Phone, Heart, Star, MapPin, Share2 } from 'lucide-react';

interface BusinessDetailProps {
  businessId?: string;
}

type BusinessDetailState = {
  name: string;
  description: string;
  address: string;
  category: string;
  imageUrl: string;
  phone: string;
  locationLabel: string;
};

const defaultBusiness: BusinessDetailState = {
  name: 'Minas Grill',
  description:
    'Um espaco brasileiro para a comunidade local, com foco em atendimento acolhedor e servicos confiaveis.',
  address: '57 Cambridge St., Boston, MA',
  category: 'Restaurante Brasileiro',
  imageUrl: 'https://picsum.photos/seed/minasgrill/800/600',
  phone: '(617) 000-0000',
  locationLabel: 'Boston, 02108',
};

const BusinessDetail: React.FC<BusinessDetailProps> = ({ businessId }) => {
  const [business, setBusiness] = useState(defaultBusiness);

  useEffect(() => {
    let ignore = false;

    const fetchBusiness = async () => {
      if (!businessId) {
        return;
      }

      try {
        const response = await fetch(`/api/businesses/${businessId}`);
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error ?? 'Business not found');
        }

        if (!ignore) {
          setBusiness({
            name: payload.business.name,
            description: payload.business.description || defaultBusiness.description,
            address: payload.business.address,
            category: payload.business.category,
            imageUrl: payload.business.imageUrl || defaultBusiness.imageUrl,
            phone: payload.business.phone || defaultBusiness.phone,
            locationLabel: payload.business.locationLabel || defaultBusiness.locationLabel,
          });
        }
      } catch (error) {
        console.error('Failed to load business detail:', error);
      }
    };

    fetchBusiness();

    return () => {
      ignore = true;
    };
  }, [businessId]);

  return (
    <div className="animate-in slide-in-from-right duration-500">
      <div className="relative h-64">
        <img src={business.imageUrl} className="w-full h-full object-cover" alt={business.name} />
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
                <h1 className="text-2xl font-bold text-blue-900">{business.name}</h1>
                <div className="flex items-center gap-1 text-yellow-400 mt-1">
                    {[...Array(5)].map((_, index) => <Star key={index} size={16} fill="currentColor" />)}
                    <span className="text-slate-500 text-sm font-medium ml-2">Listagem local</span>
                </div>
            </div>
            <button className="bg-blue-600 text-white px-6 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-200">
                <Phone size={18} fill="currentColor" /> Ligar
            </button>
        </div>

        <div className="flex items-center gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-2 font-medium">
                <span className="text-xl">BR</span> {business.category}
            </div>
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            <div className="flex items-center gap-1">
                <MapPin size={16} /> {business.address}
            </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="flex -space-x-2">
                {[1, 2, 3].map((index) => (
                    <img key={index} src={`https://picsum.photos/seed/user${index}/100`} className="w-8 h-8 rounded-full border-2 border-white object-cover" alt="user" />
                ))}
            </div>
            <p className="text-xs text-slate-500">
                Seguido por <span className="font-bold text-blue-900">Joao, Marina</span> e outros <span className="font-bold text-blue-900">124 pessoas</span> da comunidade
            </p>
        </div>

        <p className="text-sm leading-relaxed text-slate-600">{business.description}</p>

        <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map((index) => (
                <div key={index} className={`relative overflow-hidden rounded-2xl ${index === 6 ? 'group' : ''}`}>
                    <img src={`https://picsum.photos/seed/food${index}/300`} className="w-full aspect-square object-cover" alt="food" />
                    {index === 6 ? (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-lg">
                            +48
                        </div>
                    ) : null}
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default BusinessDetail;

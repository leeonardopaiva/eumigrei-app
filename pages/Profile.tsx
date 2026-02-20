
import React from 'react';
// Remove 'User' icon as it's not used and conflicts with the User type
import { MoreHorizontal, Plus, MapPin, Globe } from 'lucide-react';
// Import User type from project types
import { User } from '../types';

const Profile: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="px-5 pt-8 flex flex-col items-center">
        <div className="relative mb-6">
            <div className="w-32 h-32 rounded-full border-4 border-blue-50 flex items-center justify-center p-1">
                <img src={user.avatar} className="w-full h-full rounded-full object-cover border-2 border-white shadow-lg" alt="Profile" />
            </div>
            <div className="absolute bottom-1 right-2 bg-blue-600 text-white p-1 rounded-full border-2 border-white">
                <Plus size={16} />
            </div>
        </div>

        <h1 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
            Vinicius Pires <span className="text-blue-500 bg-blue-50 rounded-full p-0.5"><Plus size={12} fill="currentColor" /></span>
        </h1>
        <p className="text-slate-500 text-sm italic mt-2 text-center max-w-[280px]">
            "O brasileiro só aceita título se for de campão."
        </p>

        <div className="flex items-center gap-6 mt-6 text-slate-500 text-xs font-medium">
            <div className="flex items-center gap-1">
                <Globe size={14} /> viniciuspires
            </div>
            <div className="flex items-center gap-1">
                <MapPin size={14} /> Danbury, CT
            </div>
        </div>

        <button className="mt-8 bg-blue-600 text-white px-12 py-3 rounded-2xl font-bold shadow-xl shadow-blue-100 flex items-center gap-2 transition-transform active:scale-95">
            <Plus size={18} /> Adicionar
        </button>
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-around border-b border-slate-100 mb-4 px-5">
            {['Sobre', 'Interesses', 'Fotos', 'Recomendações'].map((tab, i) => (
                <button key={tab} className={`pb-3 text-sm font-bold ${i === 2 ? 'text-blue-900 border-b-2 border-blue-900' : 'text-slate-400'}`}>
                    {tab}
                </button>
            ))}
        </div>

        <div className="px-5 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-blue-900">Fotos</h3>
                <ChevronRight size={20} className="text-slate-400" />
            </div>
            <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="relative rounded-xl overflow-hidden aspect-square">
                        <img src={`https://picsum.photos/seed/profile${i}/400`} className="w-full h-full object-cover" alt="photo" />
                        {i === 6 && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-sm">
                                +48
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

const ChevronRight: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m9 18 6-6-6-6"/>
    </svg>
);

export default Profile;

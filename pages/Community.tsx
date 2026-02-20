
import React, { useState } from 'react';
import { 
  Camera, 
  Play, 
  Link as LinkIcon, 
  MoreHorizontal, 
  ThumbsUp, 
  MessageSquare, 
  Share2,
  Sparkles
} from 'lucide-react';
import { User, Post } from '../types';
import { getImmigrationHelp } from '../services/geminiService';

const Community: React.FC<{ user: User }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState('Destaques');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const handleAskAi = async () => {
    setAiLoading(true);
    const result = await getImmigrationHelp("Quais os documentos para renovar passaporte brasileiro?");
    setAiResponse(result);
    setAiLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Community Tabs */}
      <div className="px-5 mt-4">
        <h1 className="text-2xl font-bold text-blue-900 mb-4">Comunidade</h1>
        <div className="flex items-center gap-4 border-b border-slate-100 mb-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
          {['Destaques', 'Recente', 'Populares'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 text-sm font-bold transition-all ${activeTab === tab ? 'text-blue-900 border-b-2 border-blue-900' : 'text-slate-400'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <CategoryPill icon="👋" label="Ajuda" />
          <CategoryPill icon="💡" label="Dicas" />
          <CategoryPill icon="🛒" label="Mercado" />
          <CategoryPill icon="🏠" label="Moradia" />
        </div>
      </div>

      {/* Post Box */}
      <div className="px-5">
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-50 space-y-4">
          <div className="flex items-center gap-3">
            <img src={user.avatar} className="w-10 h-10 rounded-full object-cover" alt="User" />
            <input 
              type="text" 
              placeholder="No que você está pensando?" 
              className="flex-1 bg-slate-50 border-none rounded-2xl py-2 px-4 text-sm focus:ring-0"
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1 text-green-500 text-xs font-bold">
                <Camera size={16} /> Foto
              </button>
              <button className="flex items-center gap-1 text-blue-500 text-xs font-bold">
                <Play size={16} /> Vídeo
              </button>
              <button className="flex items-center gap-1 text-blue-400 text-xs font-bold">
                <LinkIcon size={16} /> Link
              </button>
            </div>
            <button className="bg-blue-900 text-white px-6 py-2 rounded-2xl text-xs font-bold shadow-md hover:bg-blue-800 transition-colors">
              Publicar
            </button>
          </div>
        </div>
      </div>

      {/* AI Assistant Banner */}
      <div className="px-5">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-4 shadow-lg text-white relative overflow-hidden group">
          <div className="relative z-10 flex items-center justify-between">
            <div className="max-w-[70%]">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={16} className="text-yellow-400 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Eumigrei AI</span>
              </div>
              <h4 className="font-bold text-sm mb-2">Dúvidas sobre o passaporte ou visto? Pergunte agora!</h4>
              <button 
                onClick={handleAskAi}
                disabled={aiLoading}
                className="bg-white text-blue-600 px-4 py-1.5 rounded-full text-[10px] font-bold hover:bg-slate-100 transition-colors"
              >
                {aiLoading ? 'Consultando...' : 'Pedir Ajuda IA'}
              </button>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center">
               <Sparkles size={32} />
            </div>
          </div>
          {aiResponse && (
            <div className="mt-4 p-3 bg-white/10 rounded-xl text-xs leading-relaxed animate-in slide-in-from-top-2 duration-300">
              {aiResponse}
            </div>
          )}
        </div>
      </div>

      {/* Feed */}
      <div className="px-5 space-y-4 pb-20">
        <PostCard 
          author="Vinicius Pires"
          location="Boston, MA"
          time="35 minutos atrás"
          content="Galera! Alguém poderia me esclarecer quais documentos são necessários para renovação do passaporte brasileiro? 🇧🇷 Agradeço a ajuda!"
          likes={4}
          comments={1}
        />

        <PostCard 
          author="Juliana Mendes"
          location="15 km"
          time="35m"
          content="Tem alguma galera brasileira de Cambridge aqui?"
          likes={12}
          comments={5}
        />
      </div>
    </div>
  );
};

const CategoryPill: React.FC<{ icon: string; label: string }> = ({ icon, label }) => (
  <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap">
    <span>{icon}</span>
    {label}
  </button>
);

const PostCard: React.FC<{ author: string; location: string; time: string; content: string; likes: number; comments: number }> = ({ author, location, time, content, likes, comments }) => (
  <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-50 space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img src={`https://picsum.photos/seed/${author}/100`} className="w-10 h-10 rounded-full object-cover" alt={author} />
        <div>
          <h5 className="font-bold text-blue-900 text-sm">{author} 🇧🇷</h5>
          <p className="text-[10px] text-slate-400">{time} • {location}</p>
        </div>
      </div>
      <button className="text-slate-400">
        <MoreHorizontal size={20} />
      </button>
    </div>
    <p className="text-slate-700 text-sm leading-relaxed">
      {content}
    </p>
    <div className="pt-2 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button className="flex items-center gap-1.5 text-blue-600 font-bold text-xs">
          <ThumbsUp size={16} /> {likes}
        </button>
        <button className="flex items-center gap-1.5 text-slate-400 font-bold text-xs">
          <MessageSquare size={16} /> {comments}
        </button>
      </div>
      <button className="text-slate-400">
        <Share2 size={16} />
      </button>
    </div>
    
    {/* Sample Reply */}
    <div className="bg-slate-50 rounded-2xl p-3 flex gap-3">
      <img src={`https://picsum.photos/seed/joao/100`} className="w-8 h-8 rounded-full object-cover" alt="Joao" />
      <div>
        <h6 className="font-bold text-blue-900 text-xs mb-1">João</h6>
        <p className="text-[11px] text-slate-600 leading-tight">Eu usei apenas o passaporte antigo e um comprovante de residência. 👍</p>
      </div>
    </div>
  </div>
);

export default Community;

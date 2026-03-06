
import React from 'react';
import { Shield } from 'lucide-react';
import { Logo } from '../components/Layout';

interface RegistrationProps {
  onLogin: () => void;
}

const Registration: React.FC<RegistrationProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen max-w-md mx-auto bg-texture flex flex-col items-center px-8 pt-20 animate-in fade-in duration-700 overflow-y-auto scrollbar-hide">
      <div className="mb-14">
        <Logo size="lg" />
      </div>

      <div className="text-center space-y-3 mb-12">
        <h1 className="text-2xl font-black text-[#004691] leading-tight">A comunidade brasileira pelo mundo.</h1>
        <p className="text-slate-500 text-sm font-medium">Conecte-se com brasileiros na sua cidade e tenha acesso a serviços exclusivos.</p>
      </div>

      <form className="w-full space-y-4" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
        <div className="space-y-3">
          <input 
            required
            type="text" 
            placeholder="Nome completo" 
            className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-6 text-sm text-slate-900 focus:text-slate-900 focus:ring-2 focus:ring-[#004691] outline-none transition-all shadow-sm placeholder:text-slate-400"
          />
          
          <div className="flex gap-2">
            <div className="bg-white border border-slate-200 rounded-2xl py-4 px-4 flex items-center gap-2 text-sm text-slate-700 shadow-sm">
              <img src="https://flagcdn.com/w20/us.png" className="w-5" alt="US" /> <span className="font-bold">+1</span>
            </div>
            <input 
              required
              type="tel" 
              placeholder="WhatsApp" 
              className="flex-1 bg-white border border-slate-200 rounded-2xl py-4 px-6 text-sm text-slate-900 focus:text-slate-900 focus:ring-2 focus:ring-[#004691] outline-none transition-all shadow-sm placeholder:text-slate-400"
            />
          </div>

          <input 
            required
            type="email" 
            placeholder="Seu melhor e-mail" 
            className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-6 text-sm text-slate-900 focus:text-slate-900 focus:ring-2 focus:ring-[#004691] outline-none transition-all shadow-sm placeholder:text-slate-400"
          />

          <input 
            required
            type="text" 
            placeholder="Onde você mora hoje?" 
            className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-6 text-sm text-slate-900 focus:text-slate-900 focus:ring-2 focus:ring-[#004691] outline-none transition-all shadow-sm placeholder:text-slate-400"
          />
        </div>

        <button 
          type="submit"
          className="w-full bg-[#004691] text-white font-bold py-5 rounded-[32px] mt-8 shadow-2xl shadow-[#004691]/30 hover:bg-[#003670] transition-all active:scale-95 text-lg"
        >
          Entrar na Comunidade
        </button>
      </form>

      <div className="mt-12 mb-10 flex items-center gap-3 px-6 bg-white/40 py-3 rounded-2xl backdrop-blur-sm border border-white/50">
        <Shield size={18} className="text-[#66BB1E] flex-shrink-0" />
        <p className="text-[10px] text-slate-500 leading-tight font-bold uppercase tracking-tight">
          Ambiente 100% seguro e verificado para brasileiros
        </p>
      </div>
    </div>
  );
};

export default Registration;

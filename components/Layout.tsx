
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home as HomeIcon, 
  User as UserIcon, 
  Menu, 
  Search,
  Calendar,
  Store,
  Heart,
  Headphones,
  Settings,
  Rocket,
  ChevronDown,
  LayoutList
} from 'lucide-react';
import { User } from '../types';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Logo utilizando a imagem logo26.png enviada
export const Logo: React.FC<LogoProps> = ({ size = 'md', className = "" }) => {
  const heightClass = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-24'
  }[size];

  return (
    <img 
      src="logo26.png" 
      alt="eumigrei" 
      className={`${heightClass} w-auto object-contain transition-all duration-300 ${className}`}
      onError={(e) => {
        // Fallback visual caso a imagem não carregue
        e.currentTarget.src = "https://placehold.co/400x120/004691/white?text=eumigrei";
      }}
    />
  );
};

interface LayoutWithUserProps {
  children: React.ReactNode;
  user: User;
}

const Layout: React.FC<LayoutWithUserProps> = ({ children, user }) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-texture relative overflow-hidden font-sans shadow-2xl">
      {/* Overlay para fechar o menu */}
      {isMenuOpen && (
        <div 
          className="absolute inset-0 bg-black/40 z-50 animate-in fade-in duration-300 backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
      
      {/* Menu Lateral (Drawer) */}
      <div className={`absolute left-0 top-0 h-full w-[85%] bg-texture z-[60] shadow-2xl transform transition-transform duration-300 ease-out overflow-y-auto ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 pt-10 pb-20 space-y-4">
          <div className="flex flex-col gap-6 mb-8">
            <Logo size="md" />
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src={user.avatar} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md" alt="User" />
                <span className="absolute -bottom-1 -right-1 bg-[#28A745] text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white font-bold">5</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#004691]">{user.name}</h2>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Membro Verificado</p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-md rounded-3xl p-4 shadow-sm border border-white/50">
            <div className="grid grid-cols-4 gap-2 mb-4">
              <QuickAction icon="🏪" label="Market" />
              <QuickAction icon="💬" label="Chat" />
              <QuickAction icon="💼" label="Vagas" />
              <QuickAction icon="🇧🇷" label="Brasil" />
            </div>
            <button className="w-full flex items-center justify-center gap-2 py-2 bg-slate-100/50 rounded-xl text-slate-500 text-xs font-bold">
              OUTROS SERVIÇOS <ChevronDown size={14} />
            </button>
          </div>

          <div className="bg-white/70 backdrop-blur-md rounded-3xl p-2 shadow-sm border border-white/50 divide-y divide-slate-100">
            <MenuListItem to="/negocios" label="Negócios" icon={<Store size={18} />} />
            <MenuListItem to="/noticias" label="Notícias" icon={<LayoutList size={18} />} />
            <MenuListItem to="/eventos" label="Eventos" icon={<Calendar size={18} />} />
            <MenuListItem to="/moradia" label="Moradia" icon={<HomeIcon size={18} />} />
            <MenuListItem to="/profile" label="Favoritos" icon={<Heart size={18} className="text-red-400" />} />
            <MenuListItem to="/" label="Suporte" icon={<Headphones size={18} />} />
            <MenuListItem to="/" label="Configurações" icon={<Settings size={18} />} />
          </div>
        </div>
      </div>

      {/* Header fixo */}
      <header className="px-5 pt-6 pb-2 flex items-center justify-between bg-transparent sticky top-0 z-40">
        <button onClick={() => setIsMenuOpen(true)} className="text-[#004691] p-1">
          <Menu size={28} />
        </button>
        <Logo size="sm" />
        <div className="w-7 h-7" />
      </header>

      {/* Área de conteúdo */}
      <main className="flex-1 overflow-y-auto scrollbar-hide">
        {children}
      </main>

      {/* Navegação Inferior (Dock) */}
      <div className="fixed bottom-6 left-0 right-0 px-8 flex justify-center z-50">
        <nav className="w-full max-w-[340px] bg-[#004691] rounded-full shadow-2xl py-2 px-2 flex items-center justify-between border border-white/10">
          <NavItem to="/" icon={<HomeIcon size={22} />} active={isActive('/')} />
          <NavItem to="/negocios" icon={<LayoutList size={22} />} active={isActive('/negocios')} />
          <NavItem to="/marketplace" icon={<Calendar size={22} />} active={isActive('/marketplace')} />
          <NavItem to="/profile" icon={<UserIcon size={22} />} active={isActive('/profile')} />
        </nav>
      </div>
    </div>
  );
};

const QuickAction: React.FC<{ icon: string; label: string }> = ({ icon, label }) => (
  <div className="flex flex-col items-center gap-1">
    <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm border border-slate-50">{icon}</div>
    <span className="text-[9px] text-slate-600 font-bold text-center uppercase tracking-tighter">{label}</span>
  </div>
);

const MenuListItem: React.FC<{ to: string; label: string; icon: React.ReactNode }> = ({ to, label, icon }) => (
  <Link to={to} className="flex items-center gap-3 py-3.5 px-4 hover:bg-white/50 transition-colors first:rounded-t-2xl last:rounded-b-2xl">
    <div className="text-[#004691]">{icon}</div>
    <span className="text-slate-700 font-bold text-sm">{label}</span>
  </Link>
);

const NavItem: React.FC<{ to: string; icon: React.ReactNode; active: boolean }> = ({ to, icon, active }) => (
  <Link 
    to={to} 
    className={`flex items-center justify-center transition-all duration-300 ${
      active 
      ? 'bg-white text-[#004691] rounded-full w-12 h-12 shadow-lg scale-105' 
      : 'text-white/70 w-11 h-11 hover:text-white'
    }`}
  >
    {icon}
  </Link>
);

export default Layout;

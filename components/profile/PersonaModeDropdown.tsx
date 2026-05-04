import React, { useEffect, useState } from 'react';
import { BriefcaseBusiness, ChevronDown, UserRound } from 'lucide-react';
import type { PersonaMode } from '../../types';

type PersonaModeDropdownProps = {
  value: PersonaMode;
  onChange: (mode: PersonaMode) => void;
  personalSubtitle: string;
  professionalSubtitle: string;
  professionalDisabled?: boolean;
  align?: 'center' | 'left' | 'right';
  trigger?: 'label' | 'chevron';
  buttonClassName?: string;
  menuClassName?: string;
};

const PersonaModeDropdown: React.FC<PersonaModeDropdownProps> = ({
  value,
  onChange,
  personalSubtitle,
  professionalSubtitle,
  professionalDisabled = false,
  align = 'center',
  trigger = 'label',
  buttonClassName = '',
  menuClassName = '',
}) => {
  const [open, setOpen] = useState(false);
  const isProfessional = value === 'professional';

  useEffect(() => {
    setOpen(false);
  }, [value]);

  const menuPositionClass =
    align === 'left'
      ? 'left-0'
      : align === 'right'
        ? 'right-0'
        : 'left-1/2 -translate-x-1/2';

  const handleChange = (mode: PersonaMode) => {
    onChange(mode);
    setOpen(false);
  };

  return (
    <div className="relative">
      {trigger === 'chevron' ? (
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-cyan-700 ${buttonClassName}`.trim()}
          aria-label="Trocar perfil"
        >
          <ChevronDown size={17} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] shadow-sm transition ${
            isProfessional
              ? 'border-blue-100 bg-blue-50/90 text-[#0F4C81]'
              : 'border-slate-200 bg-white/95 text-slate-600'
          } ${buttonClassName}`.trim()}
        >
          {isProfessional ? <BriefcaseBusiness size={14} /> : <UserRound size={14} />}
          {isProfessional ? 'Profissional' : 'Pessoal'}
          <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      )}

      {open ? (
        <div
          className={`absolute top-[calc(100%+0.35rem)] z-20 w-[205px] overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-lg ${menuPositionClass} ${menuClassName}`.trim()}
        >
          <PersonaMenuOption
            title="Pessoal"
            subtitle={personalSubtitle}
            active={!isProfessional}
            icon={<UserRound size={16} />}
            onClick={() => handleChange('personal')}
          />
          <PersonaMenuOption
            title="Profissional"
            subtitle={professionalSubtitle}
            active={isProfessional}
            disabled={professionalDisabled}
            icon={<BriefcaseBusiness size={16} />}
            onClick={() => {
              if (!professionalDisabled) {
                handleChange('professional');
              }
            }}
          />
        </div>
      ) : null}
    </div>
  );
};

const PersonaMenuOption: React.FC<{
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}> = ({ title, subtitle, icon, active = false, disabled = false, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition ${
      active
        ? 'text-[#0F4C81]'
        : disabled
          ? 'cursor-not-allowed text-slate-300'
          : 'text-slate-700 hover:bg-slate-50/80'
    }`}
  >
    <span className={active ? 'text-[#0F4C81]' : disabled ? 'text-slate-300' : 'text-slate-400'}>
      {icon}
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-semibold leading-tight">{title}</span>
      <span className="mt-0.5 block truncate text-[11px] font-medium text-slate-400">
        {subtitle}
      </span>
    </span>
    {active ? <span className="h-1.5 w-1.5 rounded-full bg-[#0F4C81]" /> : null}
  </button>
);

export default PersonaModeDropdown;

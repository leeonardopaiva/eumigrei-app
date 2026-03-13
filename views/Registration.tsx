import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import RegionSelector from '../components/RegionSelector';
import { Logo } from '../components/Layout';

type RegistrationMode = 'signin' | 'complete-profile';

type RegistrationValues = {
  name: string;
  email: string;
  phone: string;
  regionKey: string;
};

interface RegistrationProps {
  mode: RegistrationMode;
  googleEnabled: boolean;
  emailEnabled: boolean;
  devAuthEnabled: boolean;
  onGoogleLogin: () => void;
  onEmailLogin?: (email: string) => Promise<void>;
  onDevLogin?: (email: string) => Promise<void>;
  onCompleteProfile?: (values: RegistrationValues) => Promise<void>;
  submitting?: boolean;
  error?: string | null;
  notice?: string | null;
  defaultValues?: RegistrationValues;
}

const Registration: React.FC<RegistrationProps> = ({
  mode,
  googleEnabled,
  emailEnabled,
  devAuthEnabled,
  onGoogleLogin,
  onEmailLogin,
  onDevLogin,
  onCompleteProfile,
  submitting = false,
  error,
  notice,
  defaultValues,
}) => {
  const [formValues, setFormValues] = useState<RegistrationValues>({
    name: defaultValues?.name || '',
    email: defaultValues?.email || '',
    phone: defaultValues?.phone || '',
    regionKey: defaultValues?.regionKey || '',
  });

  const isOnboarding = mode === 'complete-profile';

  return (
    <div className="min-h-screen max-w-md mx-auto bg-texture flex flex-col items-center px-8 pt-20 animate-in fade-in duration-700 overflow-y-auto scrollbar-hide">
      <div className="mb-14">
        <Logo size="lg" />
      </div>

      <div className="text-center space-y-3 mb-10">
        <h1 className="text-2xl font-black text-[#004691] leading-tight">
          {isOnboarding ? 'Complete seu perfil' : 'A comunidade brasileira pelo mundo.'}
        </h1>
        <p className="text-slate-500 text-sm font-medium">
          {isOnboarding
            ? 'Precisamos da sua regiao para liberar comunidade, negocios e eventos locais.'
            : 'Entre com email, Google ou modo teste para finalizar seu cadastro em poucos segundos.'}
        </p>
      </div>

      {!isOnboarding ? (
        <div className="w-full space-y-4">
          {emailEnabled ? (
            <form
              className="space-y-3"
              onSubmit={async (event) => {
                event.preventDefault();
                await onEmailLogin?.(formValues.email);
              }}
            >
              <input
                required
                type="email"
                placeholder="Seu melhor e-mail"
                value={formValues.email}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, email: event.target.value }))
                }
                className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-6 text-sm text-slate-900 focus:text-slate-900 focus:ring-2 focus:ring-[#004691] outline-none transition-all shadow-sm placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-[32px] bg-[#004691] px-6 py-5 text-base font-bold text-white shadow-2xl shadow-[#004691]/25 transition-all hover:bg-[#003670] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Enviando link...' : 'Continuar com Email'}
              </button>
            </form>
          ) : null}
          {googleEnabled ? (
            <button
              type="button"
              onClick={onGoogleLogin}
              disabled={submitting}
              className="w-full rounded-[32px] border border-slate-200 bg-white px-6 py-5 text-base font-bold text-slate-700 shadow-xl shadow-slate-200/60 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continuar com Google
            </button>
          ) : null}
          {devAuthEnabled ? (
            <button
              type="button"
              onClick={() => onDevLogin?.(formValues.email)}
              disabled={submitting}
              className="w-full rounded-[32px] border border-dashed border-[#004691]/30 bg-[#004691]/5 px-6 py-4 text-sm font-bold text-[#004691] transition-all hover:bg-[#004691]/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Preparando teste...' : 'Entrar em modo teste local'}
            </button>
          ) : null}
          <p className="text-center text-xs font-medium text-slate-400">
            Email envia um magic link. Google cria ou reutiliza sua conta automaticamente.
          </p>
        </div>
      ) : (
        <form
          className="w-full space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            await onCompleteProfile?.(formValues);
          }}
        >
          <div className="space-y-3">
            <input
              required
              type="text"
              placeholder="Nome completo"
              value={formValues.name}
              onChange={(event) =>
                setFormValues((current) => ({ ...current, name: event.target.value }))
              }
              className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-6 text-sm text-slate-900 focus:text-slate-900 focus:ring-2 focus:ring-[#004691] outline-none transition-all shadow-sm placeholder:text-slate-400"
            />

            <div className="flex gap-2">
              <div className="bg-white border border-slate-200 rounded-2xl py-4 px-4 flex items-center gap-2 text-sm text-slate-700 shadow-sm">
                <img src="https://flagcdn.com/w20/us.png" className="w-5" alt="US" />
                <span className="font-bold">+1</span>
              </div>
              <input
                type="tel"
                placeholder="WhatsApp"
                value={formValues.phone}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, phone: event.target.value }))
                }
                className="flex-1 bg-white border border-slate-200 rounded-2xl py-4 px-6 text-sm text-slate-900 focus:text-slate-900 focus:ring-2 focus:ring-[#004691] outline-none transition-all shadow-sm placeholder:text-slate-400"
              />
            </div>

            <input
              required
              type="email"
              placeholder="Seu melhor e-mail"
              value={formValues.email}
              disabled
              className="w-full bg-slate-100 border border-slate-200 rounded-2xl py-4 px-6 text-sm text-slate-500 outline-none transition-all shadow-sm placeholder:text-slate-400"
            />

            <RegionSelector
              value={formValues.regionKey}
              autoDetect
              onChange={(region) =>
                setFormValues((current) => ({
                  ...current,
                  regionKey: region.key,
                }))
              }
              hint={
                formValues.regionKey
                  ? 'Sua regiao inicial foi sugerida pela geolocalizacao, mas voce pode trocar.'
                  : 'Selecione uma regiao existente para receber conteudo local.'
              }
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#004691] text-white font-bold py-5 rounded-[32px] mt-8 shadow-2xl shadow-[#004691]/30 hover:bg-[#003670] transition-all active:scale-95 text-lg disabled:opacity-60"
          >
            {submitting ? 'Salvando...' : 'Entrar na Comunidade'}
          </button>
        </form>
      )}

      {error ? (
        <div className="mt-6 w-full rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      ) : null}

      {notice ? (
        <div className="mt-6 w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
          {notice}
        </div>
      ) : null}

      <div className="mt-12 mb-10 flex items-center gap-3 px-6 bg-white/40 py-3 rounded-2xl backdrop-blur-sm border border-white/50">
        <Shield size={18} className="text-[#66BB1E] flex-shrink-0" />
        <p className="text-[10px] text-slate-500 leading-tight font-bold uppercase tracking-tight">
          Ambiente seguro, com autenticacao e conteudo local.
        </p>
      </div>
    </div>
  );
};

export default Registration;

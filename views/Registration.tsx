import React, { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import FieldErrorMessage from '../components/forms/FieldErrorMessage';
import RegionSelector from '../components/RegionSelector';
import { Logo } from '../components/Layout';
import {
  COUNTRY_CALLING_CODE_OPTIONS,
  findCountryByIso2,
  splitPhoneNumber,
} from '../lib/country-calling-codes';
import { buildInternationalPhone, formatPhoneInputByCountry } from '../lib/forms/phone';
import {
  type FieldErrors,
  hasFieldErrors,
  isValidEmail,
  requiredFieldError,
  validatePhoneField,
} from '../lib/forms/validation';
import { USERNAME_MIN_LENGTH, normalizeUsernameInput, validateUsernameValue } from '../lib/username';

type RegistrationMode = 'signin' | 'complete-profile';

type RegistrationValues = {
  name: string;
  username: string;
  email: string;
  phone: string;
  regionKey: string;
};

interface RegistrationProps {
  mode: RegistrationMode;
  googleEnabled: boolean;
  emailEnabled: boolean;
  onGoogleLogin: () => void;
  onEmailLogin?: (email: string) => Promise<void>;
  onCompleteProfile?: (values: RegistrationValues) => Promise<void>;
  submitting?: boolean;
  error?: string | null;
  notice?: string | null;
  defaultValues?: RegistrationValues;
}

type RegistrationField = 'email' | 'name' | 'username' | 'phone' | 'regionKey';

const Registration: React.FC<RegistrationProps> = ({
  mode,
  googleEnabled,
  emailEnabled,
  onGoogleLogin,
  onEmailLogin,
  onCompleteProfile,
  submitting = false,
  error,
  notice,
  defaultValues,
}) => {
  const initialPhoneState = splitPhoneNumber(defaultValues?.phone);
  const [formValues, setFormValues] = useState<RegistrationValues>({
    name: defaultValues?.name || '',
    username: defaultValues?.username || '',
    email: defaultValues?.email || '',
    phone: initialPhoneState.localNumber,
    regionKey: defaultValues?.regionKey || '',
  });
  const [selectedCountryIso2, setSelectedCountryIso2] = useState(initialPhoneState.country.iso2);
  const [usernameFeedback, setUsernameFeedback] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<RegistrationField>>({});

  const isOnboarding = mode === 'complete-profile';
  const normalizedUsername = normalizeUsernameInput(formValues.username);
  const selectedCountry = findCountryByIso2(selectedCountryIso2);

  useEffect(() => {
    const nextPhoneState = splitPhoneNumber(defaultValues?.phone);

    setSelectedCountryIso2(nextPhoneState.country.iso2);
    setFormValues({
      name: defaultValues?.name || '',
      username: defaultValues?.username || '',
      email: defaultValues?.email || '',
      phone: nextPhoneState.localNumber,
      regionKey: defaultValues?.regionKey || '',
    });
  }, [
    defaultValues?.email,
    defaultValues?.name,
    defaultValues?.phone,
    defaultValues?.regionKey,
    defaultValues?.username,
  ]);

  useEffect(() => {
    if (!isOnboarding) {
      return;
    }

    if (!formValues.username) {
      setUsernameFeedback(null);
      setUsernameAvailable(null);
      setCheckingUsername(false);
      return;
    }

    const validation = validateUsernameValue(formValues.username);

    if (validation.error) {
      setUsernameFeedback(validation.error);
      setUsernameAvailable(false);
      setCheckingUsername(false);
      return;
    }

    let ignore = false;
    const controller = new AbortController();

    setUsernameAvailable(null);
    setUsernameFeedback(`Validando disponibilidade de @${validation.normalized}...`);
    setCheckingUsername(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/usernames/check?username=${encodeURIComponent(validation.normalized)}`,
          {
            cache: 'no-store',
            signal: controller.signal,
          },
        );
        const payload = await response.json().catch(() => null);

        if (ignore) {
          return;
        }

        setUsernameAvailable(Boolean(payload?.available));
        setUsernameFeedback(
          payload?.available
            ? `Nome publico disponivel: @${payload.username}`
            : payload?.reason ?? 'Nao foi possivel validar o nome publico.',
        );
      } catch (usernameError) {
        if (!ignore) {
          console.error('Failed to validate username:', usernameError);
          setUsernameAvailable(false);
          setUsernameFeedback('Nao foi possivel validar o nome publico agora.');
        }
      } finally {
        if (!ignore) {
          setCheckingUsername(false);
        }
      }
    }, 350);

    return () => {
      ignore = true;
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [formValues.username, isOnboarding]);

  const onboardingBlocked =
    isOnboarding &&
    (!formValues.regionKey ||
      checkingUsername ||
      usernameAvailable !== true ||
      normalizedUsername.length < USERNAME_MIN_LENGTH);

  const clearFieldError = (field: RegistrationField) => {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      return {
        ...current,
        [field]: undefined,
      };
    });
  };

  return (
    <div className="min-h-screen bg-texture px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-5xl items-center justify-center">
        <div className="scrollbar-hide flex w-full flex-col items-center overflow-y-auto px-6 py-10 sm:px-8 lg:px-14 lg:py-14">
          <div className="w-full max-w-md">
            <div className="mb-12 flex justify-center">
              <Logo size="lg" />
            </div>

            <div className="mb-10 space-y-3 text-center">
              <h1 className="text-2xl font-black leading-tight text-[#28B8C7]">
                {isOnboarding ? 'Complete seu perfil' : 'A comunidade brasileira pelo mundo.'}
              </h1>
              <p className="text-sm font-medium text-slate-500">
                {isOnboarding
                  ? 'Precisamos da sua regiao para liberar comunidade, negocios e eventos locais.'
                  : 'Entre com email ou Google para finalizar seu cadastro em poucos segundos.'}
              </p>
            </div>

            {!isOnboarding ? (
              <div className="w-full space-y-4">
                {emailEnabled ? (
                  <form
                    className="space-y-3"
                    onSubmit={async (event) => {
                      event.preventDefault();

                      const nextErrors: FieldErrors<RegistrationField> = {};

                      if (!formValues.email.trim()) {
                        nextErrors.email = requiredFieldError('seu email');
                      } else if (!isValidEmail(formValues.email)) {
                        nextErrors.email = 'Informe um email valido.';
                      }

                      setFieldErrors(nextErrors);

                      if (hasFieldErrors(nextErrors)) {
                        return;
                      }

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
                      onInput={() => clearFieldError('email')}
                      aria-invalid={Boolean(fieldErrors.email)}
                      className="w-full rounded-2xl border border-slate-200 bg-white py-4 px-6 text-sm text-slate-900 outline-none transition-all shadow-sm placeholder:text-slate-400 focus:text-slate-900 focus:ring-2 focus:ring-[#28B8C7]"
                    />
                    <FieldErrorMessage message={fieldErrors.email} />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full rounded-[32px] bg-[#28B8C7] px-6 py-5 text-base font-bold text-white shadow-2xl shadow-[#28B8C7]/25 transition-all hover:bg-[#1E96A4] disabled:cursor-not-allowed disabled:opacity-60"
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
                <p className="text-center text-xs font-medium text-slate-400">
                  Email envia um magic link. Google cria ou reutiliza sua conta automaticamente.
                </p>
              </div>
            ) : (
              <form
                className="w-full space-y-4"
                onSubmit={async (event) => {
                  event.preventDefault();

                  const nextErrors: FieldErrors<RegistrationField> = {};

                  if (!formValues.name.trim()) {
                    nextErrors.name = requiredFieldError('seu nome');
                  }

                  if (!formValues.username.trim()) {
                    nextErrors.username = requiredFieldError('seu nome publico');
                  } else if (usernameAvailable !== true) {
                    nextErrors.username =
                      usernameFeedback || 'Escolha um nome publico disponivel.';
                  }

                  if (!formValues.regionKey.trim()) {
                    nextErrors.regionKey = requiredFieldError('uma regiao');
                  }

                  const phoneError = validatePhoneField(formValues.phone, 'O telefone');

                  if (phoneError) {
                    nextErrors.phone = phoneError;
                  }

                  setFieldErrors(nextErrors);

                  if (hasFieldErrors(nextErrors)) {
                    return;
                  }

                  await onCompleteProfile?.({
                    ...formValues,
                    phone: buildInternationalPhone(selectedCountry.iso2, formValues.phone),
                  });
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
                    onInput={() => clearFieldError('name')}
                    aria-invalid={Boolean(fieldErrors.name)}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-4 px-6 text-sm text-slate-900 outline-none transition-all shadow-sm placeholder:text-slate-400 focus:text-slate-900 focus:ring-2 focus:ring-[#28B8C7]"
                  />
                  <FieldErrorMessage message={fieldErrors.name} />

                  <div className="space-y-2">
                    <input
                      required
                      type="text"
                      placeholder="Nome publico (ex: joao-em-boston)"
                      value={formValues.username}
                      onChange={(event) =>
                        setFormValues((current) => ({
                          ...current,
                          username: normalizeUsernameInput(event.target.value),
                        }))
                      }
                      onInput={() => clearFieldError('username')}
                      aria-invalid={Boolean(fieldErrors.username)}
                      className="w-full rounded-2xl border border-slate-200 bg-white py-4 px-6 text-sm text-slate-900 outline-none transition-all shadow-sm placeholder:text-slate-400 focus:text-slate-900 focus:ring-2 focus:ring-[#28B8C7]"
                    />
                    <p className="px-2 text-[11px] font-medium text-slate-400">
                      Esse nome vai identificar seu perfil publico e futuros links como
                      {' '}
                      `emigrei.com.br/{normalizedUsername || 'joao'}`
                    </p>
                    {usernameFeedback ? (
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm font-medium ${
                          usernameAvailable
                            ? 'border border-emerald-100 bg-emerald-50 text-emerald-700'
                            : 'border border-amber-100 bg-amber-50 text-amber-700'
                        }`}
                      >
                        {checkingUsername ? 'Validando nome publico...' : usernameFeedback}
                      </div>
                    ) : null}
                    <FieldErrorMessage
                      message={
                        fieldErrors.username && fieldErrors.username !== usernameFeedback
                          ? fieldErrors.username
                          : null
                      }
                    />
                  </div>

                  <div className="flex gap-2">
                    <label className="min-w-[150px] rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
                      <div className="flex items-center gap-2">
                        <img
                          src={selectedCountry.flagUrl}
                          className="w-5"
                          alt={selectedCountry.iso2.toUpperCase()}
                        />
                        <select
                          value={selectedCountryIso2}
                          onChange={(event) => {
                            setSelectedCountryIso2(event.target.value);
                            clearFieldError('phone');
                          }}
                          className="min-w-0 flex-1 appearance-none bg-transparent text-sm font-bold text-slate-700 outline-none"
                        >
                          {COUNTRY_CALLING_CODE_OPTIONS.map((country) => (
                            <option key={country.iso2} value={country.iso2}>
                              {country.country}
                            </option>
                          ))}
                        </select>
                        <span className="text-xs font-bold text-slate-400">
                          {selectedCountry.dialCode}
                        </span>
                      </div>
                    </label>
                    <input
                      type="tel"
                      placeholder="WhatsApp"
                      value={formValues.phone}
                      onChange={(event) =>
                        setFormValues((current) => ({
                          ...current,
                          phone: formatPhoneInputByCountry(
                            event.target.value,
                            selectedCountry.iso2,
                          ),
                        }))
                      }
                      onInput={() => clearFieldError('phone')}
                      aria-invalid={Boolean(fieldErrors.phone)}
                      className="flex-1 rounded-2xl border border-slate-200 bg-white py-4 px-6 text-sm text-slate-900 outline-none transition-all shadow-sm placeholder:text-slate-400 focus:text-slate-900 focus:ring-2 focus:ring-[#28B8C7]"
                    />
                  </div>
                  <FieldErrorMessage message={fieldErrors.phone} />
                  <p className="px-2 text-[11px] font-medium text-slate-400">
                    O numero sera salvo com codigo internacional: {selectedCountry.dialCode}
                    {' '}
                    99999-9999
                  </p>

                  <input
                    required
                    type="email"
                    placeholder="Seu melhor e-mail"
                    value={formValues.email}
                    disabled
                    className="w-full rounded-2xl border border-slate-200 bg-slate-100 py-4 px-6 text-sm text-slate-500 outline-none transition-all shadow-sm placeholder:text-slate-400"
                  />

                  <RegionSelector
                    value={formValues.regionKey}
                    autoDetect
                    onChange={(region) => {
                      clearFieldError('regionKey');
                      setFormValues((current) => ({
                        ...current,
                        regionKey: region.key,
                      }));
                    }}
                    hint={
                      formValues.regionKey
                        ? 'Sua regiao inicial foi sugerida pela geolocalizacao, mas voce pode trocar.'
                        : 'Selecione uma regiao existente para receber conteudo local.'
                    }
                  />
                  <FieldErrorMessage message={fieldErrors.regionKey} />
                </div>

                <button
                  type="submit"
                  disabled={submitting || onboardingBlocked}
                  className="mt-8 w-full rounded-[32px] bg-[#28B8C7] py-5 text-lg font-bold text-white shadow-2xl shadow-[#28B8C7]/30 transition-all hover:bg-[#1E96A4] active:scale-95 disabled:opacity-60"
                >
                  {submitting
                    ? 'Salvando...'
                    : checkingUsername
                      ? 'Validando nome...'
                      : 'Entrar na Comunidade'}
                </button>
              </form>
            )}

            {error ? (
              <div className="mt-6 w-full rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            ) : null}

            {notice ? (
              <div className="mt-6 w-full rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm font-medium text-cyan-700">
                {notice}
              </div>
            ) : null}

            <div className="mb-2 mt-12 flex items-center gap-3 rounded-2xl border border-white/50 bg-white/40 px-6 py-3 backdrop-blur-sm">
              <Shield size={18} className="flex-shrink-0 text-[#28B8C7]" />
              <p className="text-[10px] font-bold uppercase tracking-tight text-slate-500">
                Ambiente seguro, com autenticacao e conteudo local.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registration;

import React, { useEffect, useState } from 'react';
import { RefreshCcw, Shield } from 'lucide-react';
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
import { getPasswordValidationIssues } from '../lib/forms/password';
import { USERNAME_MIN_LENGTH, normalizeUsernameInput, validateUsernameValue } from '../lib/username';

type RegistrationMode = 'signin' | 'complete-profile';

type RegistrationValues = {
  name: string;
  username: string;
  email: string;
  phone: string;
  regionKey: string;
  referralUsername?: string | null;
};

interface RegistrationProps {
  mode: RegistrationMode;
  googleEnabled: boolean;
  emailEnabled: boolean;
  passwordEnabled: boolean;
  onGoogleLogin: () => void;
  onGoogleSelectAccount?: () => void;
  onEmailLogin?: (email: string) => Promise<void>;
  onPasswordLogin?: (values: { email: string; password: string }) => Promise<void>;
  onPasswordRegister?: (values: {
    email: string;
    password: string;
    captchaToken: string;
    captchaAnswer: string;
  }) => Promise<void>;
  onCompleteProfile?: (values: RegistrationValues) => Promise<void>;
  submitting?: boolean;
  error?: string | null;
  notice?: string | null;
  referralUsername?: string | null;
  defaultValues?: RegistrationValues;
}

type RegistrationField =
  | 'email'
  | 'name'
  | 'username'
  | 'phone'
  | 'regionKey'
  | 'password'
  | 'confirmPassword'
  | 'captchaAnswer';

type PasswordAuthView = 'none' | 'signin' | 'signup';

const Registration: React.FC<RegistrationProps> = ({
  mode,
  googleEnabled,
  emailEnabled,
  passwordEnabled,
  onGoogleLogin,
  onGoogleSelectAccount,
  onEmailLogin,
  onPasswordLogin,
  onPasswordRegister,
  onCompleteProfile,
  submitting = false,
  error,
  notice,
  referralUsername,
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
  const [passwordAuthView, setPasswordAuthView] = useState<PasswordAuthView>('none');
  const [passwordSignIn, setPasswordSignIn] = useState({
    email: '',
    password: '',
  });
  const [passwordSignUp, setPasswordSignUp] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    captchaAnswer: '',
  });
  const [captchaPrompt, setCaptchaPrompt] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);

  const isOnboarding = mode === 'complete-profile';
  const normalizedUsername = normalizeUsernameInput(formValues.username);
  const selectedCountry = findCountryByIso2(selectedCountryIso2);
  const passwordIssues = getPasswordValidationIssues(passwordSignUp.password);
  const showGoogleOnlyAuth = googleEnabled && !emailEnabled && !passwordEnabled;

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

  const loadCaptcha = async () => {
    if (!passwordEnabled) {
      return;
    }

    setLoadingCaptcha(true);

    try {
      const response = await fetch('/api/auth/captcha', { cache: 'no-store' });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.prompt || !payload?.token) {
        throw new Error('Nao foi possivel carregar o captcha.');
      }

      setCaptchaPrompt(payload.prompt);
      setCaptchaToken(payload.token);
    } catch (captchaError) {
      console.error('Failed to load captcha:', captchaError);
      setCaptchaPrompt('');
      setCaptchaToken('');
    } finally {
      setLoadingCaptcha(false);
    }
  };

  useEffect(() => {
    if (!isOnboarding && passwordEnabled && passwordAuthView === 'signup' && !captchaToken) {
      void loadCaptcha();
    }
  }, [captchaToken, isOnboarding, passwordAuthView, passwordEnabled]);

  const openPasswordView = (view: Exclude<PasswordAuthView, 'none'>) => {
    setPasswordAuthView(view);
    setFieldErrors((current) => ({
      ...current,
      email: undefined,
      password: undefined,
      confirmPassword: undefined,
      captchaAnswer: undefined,
    }));

    if (view === 'signup') {
      void loadCaptcha();
    }
  };

  return (
    <div className="min-h-screen bg-texture px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-5xl items-center justify-center">
        <div className="scrollbar-hide flex w-full flex-col items-center overflow-y-auto py-6 sm:py-10">
          <div className="w-full max-w-lg overflow-hidden rounded-[32px] border border-slate-100 bg-white px-7 py-9 shadow-xl shadow-cyan-950/8 sm:px-10 sm:py-11">
            <div className="mb-9 flex justify-center">
              <Logo size="lg" />
            </div>

            <div className="mb-10 space-y-4 text-center">
              <div className="mx-auto h-1 w-10 rounded-full bg-[#28B8C7]" />
              <h1 className="text-3xl font-black leading-tight text-slate-950 sm:text-[2rem]">
                {isOnboarding ? 'Complete seu perfil' : 'A comunidade brasileira pelo mundo.'}
              </h1>
              <p className="mx-auto max-w-md text-sm font-medium leading-relaxed text-slate-500">
                {isOnboarding
                  ? 'Precisamos da sua regiao para liberar comunidade, negocios e eventos locais.'
                  : showGoogleOnlyAuth
                    ? 'Entre com Google para acessar sua conta e finalizar o cadastro em poucos segundos.'
                    : 'Entre com email ou Google para finalizar seu cadastro em poucos segundos.'}
              </p>
              {referralUsername ? (
                <div className="inline-flex rounded-full border border-cyan-100 bg-cyan-50 px-4 py-2 text-xs font-bold text-cyan-700">
                  Voce esta entrando pelo link de @
                  {normalizeUsernameInput(referralUsername)}
                </div>
              ) : null}
            </div>

            {!isOnboarding ? (
              <div className="w-full space-y-6">
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
                      className="flex min-h-14 w-full items-center justify-center rounded-full bg-[#28B8C7] px-6 text-base font-bold text-white shadow-sm transition hover:bg-[#1E96A4] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? 'Enviando link...' : 'Continuar com Email'}
                    </button>
                  </form>
                ) : null}
                {googleEnabled ? (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={onGoogleLogin}
                      disabled={submitting}
                      className="flex min-h-14 w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-6 text-base font-bold text-slate-800 shadow-sm transition hover:border-cyan-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-black text-[#4285F4]">
                        G
                      </span>
                      Continuar com Google
                    </button>
                    {onGoogleSelectAccount ? (
                      <button
                        type="button"
                        onClick={onGoogleSelectAccount}
                        disabled={submitting}
                        className="flex min-h-14 w-full items-center justify-center rounded-full border border-cyan-100 bg-cyan-50/60 px-6 text-base font-bold text-[#28B8C7] transition hover:bg-cyan-50 hover:text-[#1E96A4] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Escolher outra conta
                      </button>
                    ) : null}
                  </div>
                ) : null}
                {passwordEnabled ? (
                  <div className="space-y-4">
                    {passwordAuthView === 'none' ? (
                      <div className="space-y-3">
                        <button
                          type="button"
                          onClick={() => openPasswordView('signin')}
                          className="w-full rounded-[28px] bg-slate-900 px-6 py-5 text-base font-bold text-white shadow-xl transition-all hover:bg-slate-800"
                        >
                          Entrar com Email e Senha
                        </button>
                        <div className="flex items-center gap-3 px-1 py-1">
                          <div className="h-px flex-1 bg-slate-200" />
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                            ou
                          </span>
                          <div className="h-px flex-1 bg-slate-200" />
                        </div>
                        <button
                          type="button"
                          onClick={() => openPasswordView('signup')}
                          className="w-full rounded-[28px] bg-slate-900 px-6 py-5 text-base font-bold text-white shadow-xl transition-all hover:bg-slate-800"
                        >
                          Criar conta por Email e Senha
                        </button>
                        <p className="px-2 text-center text-xs font-medium text-slate-400">
                          Cadastro sem verificacao por email, usado enquanto o magic link nao
                          estiver configurado.
                        </p>
                      </div>
                    ) : null}

                    {passwordAuthView === 'signin' ? (
                      <form
                        className="space-y-3"
                        onSubmit={async (event) => {
                          event.preventDefault();

                          const nextErrors: FieldErrors<RegistrationField> = {};

                          if (!passwordSignIn.email.trim()) {
                            nextErrors.email = requiredFieldError('seu email');
                          } else if (!isValidEmail(passwordSignIn.email)) {
                            nextErrors.email = 'Informe um email valido.';
                          }

                          if (!passwordSignIn.password.trim()) {
                            nextErrors.password = requiredFieldError('sua senha');
                          }

                          setFieldErrors(nextErrors);

                          if (hasFieldErrors(nextErrors)) {
                            return;
                          }

                          await onPasswordLogin?.({
                            email: passwordSignIn.email,
                            password: passwordSignIn.password,
                          });
                        }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-slate-700">Entrar com senha</p>
                            <p className="text-xs text-slate-400">
                              Use sua conta temporaria de email e senha.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPasswordAuthView('none')}
                            className="rounded-2xl px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100"
                          >
                            Voltar
                          </button>
                        </div>
                        <input
                          type="email"
                          placeholder="Seu e-mail"
                          value={passwordSignIn.email}
                          onChange={(event) =>
                            setPasswordSignIn((current) => ({ ...current, email: event.target.value }))
                          }
                          onInput={() => clearFieldError('email')}
                          aria-invalid={Boolean(fieldErrors.email)}
                          className="w-full rounded-2xl border border-slate-200 bg-white py-4 px-6 text-sm text-slate-900 outline-none transition-all shadow-sm placeholder:text-slate-400 focus:text-slate-900 focus:ring-2 focus:ring-[#28B8C7]"
                        />
                        <FieldErrorMessage message={fieldErrors.email} />
                        <input
                          type="password"
                          placeholder="Sua senha"
                          value={passwordSignIn.password}
                          onChange={(event) =>
                            setPasswordSignIn((current) => ({
                              ...current,
                              password: event.target.value,
                            }))
                          }
                          onInput={() => clearFieldError('password')}
                          aria-invalid={Boolean(fieldErrors.password)}
                          className="w-full rounded-2xl border border-slate-200 bg-white py-4 px-6 text-sm text-slate-900 outline-none transition-all shadow-sm placeholder:text-slate-400 focus:text-slate-900 focus:ring-2 focus:ring-[#28B8C7]"
                        />
                        <FieldErrorMessage message={fieldErrors.password} />
                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full rounded-[32px] bg-slate-900 px-6 py-5 text-base font-bold text-white shadow-xl transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {submitting ? 'Entrando...' : 'Entrar com Email e Senha'}
                        </button>
                      </form>
                    ) : null}

                    {passwordAuthView === 'signup' ? (
                      <form
                        className="space-y-3"
                        onSubmit={async (event) => {
                          event.preventDefault();

                          const nextErrors: FieldErrors<RegistrationField> = {};

                          if (!passwordSignUp.email.trim()) {
                            nextErrors.email = requiredFieldError('seu email');
                          } else if (!isValidEmail(passwordSignUp.email)) {
                            nextErrors.email = 'Informe um email valido.';
                          }

                          if (!passwordSignUp.password.trim()) {
                            nextErrors.password = requiredFieldError('uma senha forte');
                          } else if (passwordIssues.length > 0) {
                            nextErrors.password = passwordIssues[0];
                          }

                          if (passwordSignUp.confirmPassword !== passwordSignUp.password) {
                            nextErrors.confirmPassword = 'As senhas precisam ser iguais.';
                          }

                          if (!passwordSignUp.captchaAnswer.trim()) {
                            nextErrors.captchaAnswer = 'Resolva o calculo de verificacao.';
                          }

                          setFieldErrors(nextErrors);

                          if (hasFieldErrors(nextErrors) || !captchaToken) {
                            if (!captchaToken) {
                              await loadCaptcha();
                            }
                            return;
                          }

                          await onPasswordRegister?.({
                            email: passwordSignUp.email,
                            password: passwordSignUp.password,
                            captchaToken,
                            captchaAnswer: passwordSignUp.captchaAnswer,
                          });
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-slate-700">Criar sua conta</p>
                            <p className="text-xs text-slate-400">
                              Cadastro por email e senha sem verificacao por email.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPasswordAuthView('none')}
                            className="rounded-2xl px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100"
                          >
                            Voltar
                          </button>
                        </div>
                        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-700">
                          Cadastro sem verificacao por email. Use este fluxo enquanto o magic link
                          nao estiver configurado.
                        </div>
                        <input
                          type="email"
                          placeholder="Seu e-mail"
                          value={passwordSignUp.email}
                          onChange={(event) =>
                            setPasswordSignUp((current) => ({ ...current, email: event.target.value }))
                          }
                          onInput={() => clearFieldError('email')}
                          aria-invalid={Boolean(fieldErrors.email)}
                          className="w-full rounded-2xl border border-slate-200 bg-white py-4 px-6 text-sm text-slate-900 outline-none transition-all shadow-sm placeholder:text-slate-400 focus:text-slate-900 focus:ring-2 focus:ring-[#28B8C7]"
                        />
                        <FieldErrorMessage message={fieldErrors.email} />
                        <input
                          type="password"
                          placeholder="Crie uma senha"
                          value={passwordSignUp.password}
                          onChange={(event) =>
                            setPasswordSignUp((current) => ({
                              ...current,
                              password: event.target.value,
                            }))
                          }
                          onInput={() => clearFieldError('password')}
                          aria-invalid={Boolean(fieldErrors.password)}
                          className="w-full rounded-2xl border border-slate-200 bg-white py-4 px-6 text-sm text-slate-900 outline-none transition-all shadow-sm placeholder:text-slate-400 focus:text-slate-900 focus:ring-2 focus:ring-[#28B8C7]"
                        />
                        <FieldErrorMessage message={fieldErrors.password} />
                        {passwordSignUp.password ? (
                          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
                            {passwordIssues.length === 0 ? (
                              <p className="font-medium text-emerald-700">Senha forte.</p>
                            ) : (
                              <div className="space-y-1">
                                {passwordIssues.map((issue) => (
                                  <p key={issue}>{issue}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : null}
                        <input
                          type="password"
                          placeholder="Confirme sua senha"
                          value={passwordSignUp.confirmPassword}
                          onChange={(event) =>
                            setPasswordSignUp((current) => ({
                              ...current,
                              confirmPassword: event.target.value,
                            }))
                          }
                          onInput={() => clearFieldError('confirmPassword')}
                          aria-invalid={Boolean(fieldErrors.confirmPassword)}
                          className="w-full rounded-2xl border border-slate-200 bg-white py-4 px-6 text-sm text-slate-900 outline-none transition-all shadow-sm placeholder:text-slate-400 focus:text-slate-900 focus:ring-2 focus:ring-[#28B8C7]"
                        />
                        <FieldErrorMessage message={fieldErrors.confirmPassword} />
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-bold text-slate-700">
                              {loadingCaptcha ? 'Carregando captcha...' : captchaPrompt || 'Captcha temporariamente indisponivel'}
                            </p>
                            <button
                              type="button"
                              onClick={() => void loadCaptcha()}
                              className="rounded-full p-2 text-slate-400 transition hover:bg-white hover:text-slate-600"
                              aria-label="Gerar novo captcha"
                            >
                              <RefreshCcw size={16} className={loadingCaptcha ? 'animate-spin' : ''} />
                            </button>
                          </div>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="Resultado"
                            value={passwordSignUp.captchaAnswer}
                            onChange={(event) =>
                              setPasswordSignUp((current) => ({
                                ...current,
                                captchaAnswer: event.target.value,
                              }))
                            }
                            onInput={() => clearFieldError('captchaAnswer')}
                            aria-invalid={Boolean(fieldErrors.captchaAnswer)}
                            className="mt-3 w-full rounded-2xl border border-slate-200 bg-white py-4 px-6 text-sm text-slate-900 outline-none transition-all shadow-sm placeholder:text-slate-400 focus:text-slate-900 focus:ring-2 focus:ring-[#28B8C7]"
                          />
                          <FieldErrorMessage message={fieldErrors.captchaAnswer} />
                        </div>
                        <button
                          type="submit"
                          disabled={submitting || loadingCaptcha}
                          className="w-full rounded-[32px] bg-slate-900 px-6 py-5 text-base font-bold text-white shadow-xl transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {submitting ? 'Criando conta...' : 'Criar conta com Email'}
                        </button>
                      </form>
                    ) : null}
                  </div>
                ) : null}
                <p className="rounded-2xl bg-slate-50 px-4 py-3 text-center text-xs font-medium leading-relaxed text-slate-500">
                  {showGoogleOnlyAuth
                    ? 'Google cria ou reutiliza sua conta automaticamente.'
                    : emailEnabled
                      ? 'Email envia um magic link. Google cria ou reutiliza sua conta automaticamente.'
                      : 'Google ou email e senha liberam o acesso, e o perfil e concluido no proximo passo.'}
                </p>
              </div>
            ) : (
              <form
                className="w-full space-y-7"
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
                    referralUsername,
                  });
                }}
              >
                <div className="space-y-5">
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
                    className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:text-slate-900"
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
                      className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:text-slate-900"
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

                  <div className="grid gap-3 sm:grid-cols-[170px_1fr]">
                    <label className="flex min-h-14 items-center rounded-2xl border border-slate-200 bg-white px-3">
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
                      className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:text-slate-900"
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
                    className="min-h-14 w-full rounded-2xl border border-slate-200 bg-slate-100 px-5 text-sm text-slate-500 outline-none transition placeholder:text-slate-400"
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
                  className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-[#28B8C7] px-6 text-base font-bold text-white shadow-sm transition hover:bg-[#1E96A4] disabled:opacity-60"
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

            <div className="mt-8 flex items-center gap-3 rounded-2xl border border-cyan-100 bg-cyan-50/70 px-4 py-3">
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

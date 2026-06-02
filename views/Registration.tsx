import React, { useEffect, useState } from 'react';
import { Globe, RefreshCcw, Shield } from 'lucide-react';
import { Button, Card, Input, Separator } from '@heroui/react';
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

const fieldLabel = 'text-xs font-semibold uppercase tracking-[0.22em] text-slate-500';
const inputClass =
  'h-14 rounded-2xl border border-slate-200 bg-white px-5 text-sm shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B84FF]';
const secondaryCardClass = 'border border-slate-200 bg-slate-50 shadow-none';

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
  const [passwordSignIn, setPasswordSignIn] = useState({ email: '', password: '' });
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
            ? `Nome público disponível: @${payload.username}`
            : payload?.reason ?? 'Não foi possível validar o nome público.',
        );
      } catch (usernameError) {
        if (!ignore) {
          console.error('Failed to validate username:', usernameError);
          setUsernameAvailable(false);
          setUsernameFeedback('Não foi possível validar o nome público agora.');
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
        throw new Error('Não foi possível carregar o captcha.');
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

  const submitGoogleLogin = () => {
    onGoogleLogin();
  };

  const submitGoogleSelectAccount = () => {
    if (onGoogleSelectAccount) {
      onGoogleSelectAccount();
      return;
    }

    onGoogleLogin();
  };

  const submitEmailLogin = async (email: string) => {
    const normalizedEmail = email.trim();
    const nextErrors: FieldErrors<RegistrationField> = {};

    if (!normalizedEmail) {
      nextErrors.email = requiredFieldError('seu email');
    } else if (!isValidEmail(normalizedEmail)) {
      nextErrors.email = 'Informe um email valido.';
    }

    setFieldErrors(nextErrors);

    if (hasFieldErrors(nextErrors)) {
      return false;
    }

    await onEmailLogin?.(normalizedEmail);
    return true;
  };

  if (!isOnboarding) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#F6F5EF] px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full bg-[#7CE4E6]/25 blur-3xl" />
          <div className="absolute right-[-5rem] top-24 h-96 w-96 rounded-full bg-[#2A57FF]/12 blur-3xl" />
          <div className="absolute left-[-6rem] bottom-[-6rem] h-96 w-96 rounded-full bg-[#2A57FF]/8 blur-3xl" />
        </div>

        <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
          <Card
            variant="default"
            className="w-full max-w-[540px] overflow-hidden rounded-[32px] border border-white/80 bg-[#F9F9F9] shadow-[0_30px_90px_rgba(15,23,42,0.10)]"
          >
            <Card.Content className="px-6 py-12 sm:px-12 sm:py-14 lg:px-14 lg:py-16">
              <div className="flex flex-col items-center text-center">
                <img src="/assets/logo26.png" alt="Gringoou" className="h-16 w-auto sm:h-[4.5rem]" />
                <p className="mt-5 max-w-sm text-sm leading-6 text-slate-500 sm:text-base">
                  A rede social do imigrante brasileiro.
                </p>
              </div>

              <div className="mt-10 flex flex-col items-center gap-4">
                {googleEnabled ? (
                  <Button
                    type="button"
                    fullWidth
                    size="lg"
                    variant="primary"
                    isDisabled={submitting}
                    onPress={submitGoogleLogin}
                    className="h-14 w-full max-w-[360px] rounded-full bg-[#00509D] px-6 text-base font-semibold text-white shadow-[0_16px_40px_rgba(0,80,157,0.16)]"
                  >
                    {submitting ? 'Entrando...' : 'Continuar com Google'}
                  </Button>
                ) : null}

                {googleEnabled ? (
                  <Button
                    type="button"
                    fullWidth
                    size="lg"
                    variant="ghost"
                    isDisabled={submitting}
                    onPress={submitGoogleSelectAccount}
                    className="h-12 w-full max-w-[360px] rounded-full border border-[#00509D]/15 bg-white px-6 text-sm font-semibold text-[#00509D] shadow-none hover:bg-[#F2F7FF]"
                  >
                    Trocar conta Google
                  </Button>
                ) : null}

                <div className="flex w-full max-w-[360px] items-center gap-3">
                  <Separator className="flex-1 bg-slate-200" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">
                    OU
                  </span>
                  <Separator className="flex-1 bg-slate-200" />
                </div>

                <Button
                  type="button"
                  fullWidth
                  size="lg"
                  variant="ghost"
                  onPress={() => openPasswordView('signin')}
                  className="h-14 w-full max-w-[360px] rounded-full border border-slate-200 bg-slate-100 px-6 text-sm font-semibold text-slate-400 shadow-none"
                >
                  Entrar com senha
                </Button>

                {passwordAuthView === 'signin' ? (
                  <form
                    className="space-y-3 pt-2"
                    onSubmit={async (event) => {
                      event.preventDefault();

                      const nextErrors: FieldErrors<RegistrationField> = {};

                      if (!passwordSignIn.email.trim()) {
                        nextErrors.email = requiredFieldError('seu email');
                      } else if (!isValidEmail(passwordSignIn.email)) {
                        nextErrors.email = 'Informe um email valido.';
                      }

                      if (passwordEnabled && !passwordSignIn.password.trim()) {
                        nextErrors.password = requiredFieldError('sua senha');
                      }

                      setFieldErrors(nextErrors);

                      if (hasFieldErrors(nextErrors)) {
                        return;
                      }

                      if (passwordEnabled) {
                        await onPasswordLogin?.({
                          email: passwordSignIn.email,
                          password: passwordSignIn.password,
                        });
                        return;
                      }

                      await submitEmailLogin(passwordSignIn.email);
                    }}
                  >
                    <Input
                      type="email"
                      placeholder="Seu email"
                      value={passwordSignIn.email}
                      onChange={(event) =>
                        setPasswordSignIn((current) => ({ ...current, email: event.target.value }))
                      }
                      onInput={() => clearFieldError('email')}
                      aria-invalid={Boolean(fieldErrors.email)}
                      className={inputClass}
                    />
                    <FieldErrorMessage message={fieldErrors.email} />

                    {passwordEnabled ? (
                      <>
                        <Input
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
                          className={inputClass}
                        />
                        <FieldErrorMessage message={fieldErrors.password} />
                      </>
                    ) : null}

                    <Button
                      type="submit"
                      fullWidth
                      size="lg"
                      variant="primary"
                      isDisabled={submitting}
                      className="h-14 rounded-full bg-[#00509D] px-6 text-base font-semibold text-white shadow-[0_16px_40px_rgba(0,80,157,0.16)]"
                    >
                      {submitting ? 'Entrando...' : passwordEnabled ? 'Entrar' : 'Receber link'}
                    </Button>

                    <div className="flex items-center justify-center gap-3 pt-2">
                      {passwordEnabled ? (
                        <Button
                          type="button"
                          variant="ghost"
                          onPress={() => setPasswordAuthView('signup')}
                          className="px-0 text-sm font-semibold text-[#00509D]"
                        >
                          Criar conta
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        onPress={() => setPasswordAuthView('none')}
                        className="px-0 text-sm font-semibold text-slate-500"
                      >
                        Voltar
                      </Button>
                    </div>
                  </form>
                ) : null}

                {passwordAuthView === 'signup' ? (
                  <form
                    className="space-y-3 pt-2"
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
                    <Input
                      type="email"
                      placeholder="Seu email"
                      value={passwordSignUp.email}
                      onChange={(event) =>
                        setPasswordSignUp((current) => ({ ...current, email: event.target.value }))
                      }
                      onInput={() => clearFieldError('email')}
                      aria-invalid={Boolean(fieldErrors.email)}
                      className={inputClass}
                    />
                    <FieldErrorMessage message={fieldErrors.email} />

                    <Input
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
                      className={inputClass}
                    />
                    <FieldErrorMessage message={fieldErrors.password} />

                    <Input
                      type="password"
                      placeholder="Confirmar senha"
                      value={passwordSignUp.confirmPassword}
                      onChange={(event) =>
                        setPasswordSignUp((current) => ({
                          ...current,
                          confirmPassword: event.target.value,
                        }))
                      }
                      onInput={() => clearFieldError('confirmPassword')}
                      aria-invalid={Boolean(fieldErrors.confirmPassword)}
                      className={inputClass}
                    />
                    <FieldErrorMessage message={fieldErrors.confirmPassword} />

                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="flex-1 text-sm font-medium text-slate-700">
                        {loadingCaptcha
                          ? 'Carregando captcha...'
                          : captchaPrompt || 'Captcha temporariamente indisponivel'}
                      </p>
                      <Button
                        type="button"
                        isIconOnly
                        variant="ghost"
                        onPress={() => void loadCaptcha()}
                        aria-label="Gerar novo captcha"
                        className="text-slate-500"
                      >
                        <RefreshCcw size={16} className={loadingCaptcha ? 'animate-spin' : ''} />
                      </Button>
                    </div>

                    <Input
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
                      className={inputClass}
                    />
                    <FieldErrorMessage message={fieldErrors.captchaAnswer} />

                    <Button
                      type="submit"
                      fullWidth
                      size="lg"
                      variant="primary"
                      isDisabled={submitting || loadingCaptcha}
                      className="h-14 rounded-full bg-[#00509D] px-6 text-base font-semibold text-white shadow-[0_16px_40px_rgba(0,80,157,0.16)]"
                    >
                      {submitting ? 'Criando conta...' : 'Criar conta'}
                    </Button>

                    <div className="flex items-center justify-center gap-3 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onPress={() => setPasswordAuthView('signin')}
                        className="px-0 text-sm font-semibold text-[#00509D]"
                      >
                        Entrar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onPress={() => setPasswordAuthView('none')}
                        className="px-0 text-sm font-semibold text-slate-500"
                      >
                        Voltar
                      </Button>
                    </div>
                  </form>
                ) : null}
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                <a href="/termos" className="transition-colors hover:text-slate-600 hover:underline">
                  Termos de uso
                </a>
                <span className="text-slate-300">•</span>
                <a href="/privacidade" className="transition-colors hover:text-slate-600 hover:underline">
                  Privacidade
                </a>
              </div>

              {error ? <p className="mt-6 text-center text-sm text-red-600">{error}</p> : null}
              {notice ? <p className="mt-4 text-center text-sm text-slate-500">{notice}</p> : null}
            </Card.Content>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(11,132,255,0.16),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(0,80,157,0.10),_transparent_28%),linear-gradient(180deg,#f7fbff_0%,#eef6ff_100%)] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="absolute left-[-8rem] top-20 h-64 w-64 rounded-full bg-[#0B84FF]/10 blur-3xl" />
      <div className="absolute bottom-0 right-[-6rem] h-80 w-80 rounded-full bg-[#00509D]/10 blur-3xl" />

      <div className="relative mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        <div className="hidden lg:flex lg:flex-col lg:gap-6 lg:pr-8">
          <div className="inline-flex w-fit items-center gap-3 rounded-full border border-white/80 bg-white/70 px-4 py-2 shadow-sm backdrop-blur">
            <img src="/assets/logo26.png" alt="Gringoou" className="h-7 w-auto" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
              Gringoou
            </span>
          </div>

          <div className="max-w-2xl space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#0B84FF]">
              Comunidade brasileira no exterior
            </p>
            <h1 className="max-w-xl text-5xl font-black leading-[0.96] tracking-tight text-slate-950">
              {isOnboarding
                ? 'Complete seu perfil'
                : 'Entre com um fluxo mais limpo, rápido e confiável'}
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-600">
              {isOnboarding
                ? 'Precisamos da sua região para liberar comunidade, negócios e eventos locais.'
                : showGoogleOnlyAuth
                  ? 'Use o Google para acessar sua conta com menos atrito.'
                  : 'Use Google, email ou senha com uma interface mais clara e menos genérica.'}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ['Confiável', 'Autenticação com callback local pronta para teste.'],
              ['Mais limpa', 'Hierarquia visual forte, menos ruído e foco no essencial.'],
              ['Mais humana', 'A marca aparece com mais presença, sem cara de template.'],
            ].map(([title, text]) => (
              <Card
                key={title}
                variant="secondary"
                className="border border-white/80 bg-white/75 shadow-sm backdrop-blur"
              >
                <Card.Content className="space-y-2 p-4">
                  <p className="text-sm font-bold text-slate-900">{title}</p>
                  <p className="text-sm leading-6 text-slate-600">{text}</p>
                </Card.Content>
              </Card>
            ))}
          </div>
        </div>

        <Card
          variant="default"
          className="relative overflow-hidden border border-white/80 bg-white/90 shadow-[0_40px_120px_rgba(15,23,42,0.16)] backdrop-blur-xl"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#00509D] via-[#0B84FF] to-[#7CC4FF]" />
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#0B84FF]/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-[#00509D]/10 blur-3xl" />

          <Card.Content className="relative space-y-7 p-5 sm:p-8">
            <div className="flex justify-center">
              <img src="/assets/logo26.png" alt="Gringoou" className="h-9 w-auto sm:h-11" />
            </div>

            <div className="space-y-3 text-center">
              <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                {isOnboarding ? 'Complete seu perfil' : 'Entre na sua conta'}
              </h2>
              <p className="mx-auto max-w-md text-sm leading-6 text-slate-600">
                {isOnboarding
                  ? 'Precisamos da sua região para liberar comunidade, negócios e eventos locais.'
                  : showGoogleOnlyAuth
                    ? 'Use o Google para acessar sua conta.'
                    : 'Use e-mail, Google ou senha para acessar sua conta.'}
              </p>
              {referralUsername ? (
                <div className="mx-auto inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700">
                  Você está entrando pelo link de @{normalizeUsernameInput(referralUsername)}
                </div>
              ) : null}
            </div>

            {!isOnboarding ? (
              <div className="space-y-6">
                {googleEnabled ? (
                  <Button
                    type="button"
                    fullWidth
                    size="lg"
                    variant="primary"
                    isDisabled={submitting}
                    onPress={submitGoogleLogin}
                    className="rounded-2xl bg-[#0B84FF] font-semibold shadow-[0_16px_40px_rgba(11,132,255,0.22)]"
                  >
                    {submitting ? 'Entrando...' : 'Continuar com Google'}
                  </Button>
                ) : null}

                <div className="flex items-center gap-3">
                  <Separator className="flex-1 bg-slate-200" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">
                    ou
                  </span>
                  <Separator className="flex-1 bg-slate-200" />
                </div>

                {emailEnabled ? (
                  <form
                    className="space-y-4"
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
                    <div className="space-y-2">
                      <p className={fieldLabel}>Email</p>
                      <Input
                        required
                        type="email"
                        placeholder="Seu melhor e-mail"
                        value={formValues.email}
                        onChange={(event) =>
                          setFormValues((current) => ({ ...current, email: event.target.value }))
                        }
                        onInput={() => clearFieldError('email')}
                        aria-invalid={Boolean(fieldErrors.email)}
                        className={inputClass}
                      />
                      <FieldErrorMessage message={fieldErrors.email} />
                    </div>
                    <Button
                      type="submit"
                      fullWidth
                      size="lg"
                      variant="outline"
                      isDisabled={submitting}
                      className="rounded-2xl border-slate-200 bg-slate-950 font-semibold text-white shadow-none hover:bg-slate-900"
                    >
                      {submitting ? 'Enviando link...' : 'Continuar com email'}
                    </Button>
                  </form>
                ) : null}

                {passwordEnabled ? (
                  <div className="space-y-4">
                    {passwordAuthView === 'none' ? (
                      <div className="grid gap-3">
                        <Button
                          type="button"
                          fullWidth
                          size="lg"
                          variant="outline"
                          onPress={() => openPasswordView('signin')}
                          className="rounded-2xl border-slate-200 bg-white font-semibold text-slate-900 shadow-sm"
                        >
                          Entrar com email e senha
                        </Button>
                        <Button
                          type="button"
                          fullWidth
                          size="lg"
                          variant="secondary"
                          onPress={() => openPasswordView('signup')}
                          className="rounded-2xl border border-slate-200 bg-slate-50 font-semibold text-slate-900 shadow-none"
                        >
                          Criar conta por email e senha
                        </Button>
                        <p className="px-2 text-center text-xs leading-6 text-slate-500">
                          Cadastro sem verificação por email, usado enquanto o magic link não estiver configurado.
                        </p>
                      </div>
                    ) : null}

                    {passwordAuthView === 'signin' ? (
                      <form
                        className="space-y-4"
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
                            <p className="text-sm font-bold text-slate-900">Entrar com senha</p>
                            <p className="text-xs text-slate-500">
                              Use sua conta temporaria de email e senha.
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onPress={() => setPasswordAuthView('none')}
                            className="text-slate-500"
                          >
                            Voltar
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <p className={fieldLabel}>Email</p>
                          <Input
                            type="email"
                            placeholder="Seu e-mail"
                            value={passwordSignIn.email}
                            onChange={(event) =>
                              setPasswordSignIn((current) => ({ ...current, email: event.target.value }))
                            }
                            onInput={() => clearFieldError('email')}
                            aria-invalid={Boolean(fieldErrors.email)}
                            className={inputClass}
                          />
                          <FieldErrorMessage message={fieldErrors.email} />
                        </div>

                        <div className="space-y-2">
                          <p className={fieldLabel}>Senha</p>
                          <Input
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
                            className={inputClass}
                          />
                          <FieldErrorMessage message={fieldErrors.password} />
                        </div>

                        <Button
                          type="submit"
                          fullWidth
                          size="lg"
                          variant="primary"
                          isDisabled={submitting}
                          className="rounded-2xl bg-[#00509D] font-semibold shadow-[0_16px_40px_rgba(0,80,157,0.18)]"
                        >
                          {submitting ? 'Entrando...' : 'Entrar com email e senha'}
                        </Button>
                      </form>
                    ) : null}

                    {passwordAuthView === 'signup' ? (
                      <form
                        className="space-y-4"
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
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-slate-900">Criar sua conta</p>
                            <p className="text-xs text-slate-500">
                              Cadastro por email e senha sem verificacao por email.
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onPress={() => setPasswordAuthView('none')}
                            className="text-slate-500"
                          >
                            Voltar
                          </Button>
                        </div>

                        <Card variant="secondary" className={`${secondaryCardClass} border-amber-100 bg-amber-50`}>
                          <Card.Content className="p-4 text-xs leading-6 text-amber-800">
                            Cadastro sem verificação por email. Use este fluxo enquanto o magic link não estiver configurado.
                          </Card.Content>
                        </Card>

                        <div className="space-y-2">
                          <p className={fieldLabel}>Email</p>
                          <Input
                            type="email"
                            placeholder="Seu e-mail"
                            value={passwordSignUp.email}
                            onChange={(event) =>
                              setPasswordSignUp((current) => ({ ...current, email: event.target.value }))
                            }
                            onInput={() => clearFieldError('email')}
                            aria-invalid={Boolean(fieldErrors.email)}
                            className={inputClass}
                          />
                          <FieldErrorMessage message={fieldErrors.email} />
                        </div>

                        <div className="space-y-2">
                          <p className={fieldLabel}>Senha</p>
                          <Input
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
                            className={inputClass}
                          />
                          <FieldErrorMessage message={fieldErrors.password} />
                        </div>

                        {passwordSignUp.password ? (
                          <Card variant="secondary" className={`${secondaryCardClass} border-slate-200`}>
                            <Card.Content className="p-4 text-xs leading-6 text-slate-600">
                              {passwordIssues.length === 0 ? (
                                <p className="font-semibold text-emerald-700">Senha forte.</p>
                              ) : (
                                <div className="space-y-1">
                                  {passwordIssues.map((issue) => (
                                    <p key={issue}>{issue}</p>
                                  ))}
                                </div>
                              )}
                            </Card.Content>
                          </Card>
                        ) : null}

                        <div className="space-y-2">
                          <p className={fieldLabel}>Confirmar senha</p>
                          <Input
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
                            className={inputClass}
                          />
                          <FieldErrorMessage message={fieldErrors.confirmPassword} />
                        </div>

                        <Card variant="secondary" className={`${secondaryCardClass} border-slate-200`}>
                          <Card.Content className="space-y-4 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-slate-700">
                                {loadingCaptcha
                                  ? 'Carregando captcha...'
                                  : captchaPrompt || 'Captcha temporariamente indisponivel'}
                              </p>
                              <Button
                                type="button"
                                isIconOnly
                                variant="ghost"
                                onPress={() => void loadCaptcha()}
                                aria-label="Gerar novo captcha"
                                className="text-slate-500"
                              >
                                <RefreshCcw size={16} className={loadingCaptcha ? 'animate-spin' : ''} />
                              </Button>
                            </div>
                            <div className="space-y-2">
                              <p className={fieldLabel}>Resultado</p>
                              <Input
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
                                className={inputClass}
                              />
                              <FieldErrorMessage message={fieldErrors.captchaAnswer} />
                            </div>
                          </Card.Content>
                        </Card>

                        <Button
                          type="submit"
                          fullWidth
                          size="lg"
                          variant="primary"
                          isDisabled={submitting || loadingCaptcha}
                          className="rounded-2xl bg-[#00509D] font-semibold shadow-[0_16px_40px_rgba(0,80,157,0.18)]"
                        >
                          {submitting ? 'Criando conta...' : 'Criar conta com email'}
                        </Button>
                      </form>
                    ) : null}
                  </div>
                ) : null}

                <Card variant="secondary" className={`${secondaryCardClass} border-slate-200`}>
                  <Card.Content className="p-4 text-center text-xs leading-6 text-slate-500">
                    {showGoogleOnlyAuth
                      ? 'Google cria ou reutiliza sua conta automaticamente.'
                      : emailEnabled
                        ? 'Email envia um magic link. Google cria ou reutiliza sua conta automaticamente.'
                        : 'Google ou email e senha liberam o acesso, e o perfil é concluído no próximo passo.'}
                  </Card.Content>
                </Card>
              </div>
            ) : (
              <form
                className="space-y-5"
                onSubmit={async (event) => {
                  event.preventDefault();

                  const nextErrors: FieldErrors<RegistrationField> = {};

                  if (!formValues.name.trim()) {
                    nextErrors.name = requiredFieldError('seu nome');
                  }

                  if (!formValues.username.trim()) {
                    nextErrors.username = requiredFieldError('seu nome publico');
                  } else if (usernameAvailable !== true) {
                    nextErrors.username = usernameFeedback || 'Escolha um nome publico disponivel.';
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
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className={fieldLabel}>Nome completo</p>
                    <Input
                      required
                      type="text"
                      placeholder="Nome completo"
                      value={formValues.name}
                      onChange={(event) =>
                        setFormValues((current) => ({ ...current, name: event.target.value }))
                      }
                      onInput={() => clearFieldError('name')}
                      aria-invalid={Boolean(fieldErrors.name)}
                      className={inputClass}
                    />
                    <FieldErrorMessage message={fieldErrors.name} />
                  </div>

                  <div className="space-y-2">
                    <p className={fieldLabel}>Nome público</p>
                    <Input
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
                      className={inputClass}
                    />
                    <p className="px-1 text-[11px] leading-5 text-slate-500">
                      Esse nome vai identificar seu perfil público e futuros links como{' '}
                      <span className="font-semibold text-slate-700">
                        gringoou.com/{normalizedUsername || 'joao'}
                      </span>
                    </p>
                    {usernameFeedback ? (
                      <Card
                        variant="secondary"
                        className={`shadow-none ${
                          usernameAvailable
                            ? 'border-emerald-100 bg-emerald-50'
                            : 'border-amber-100 bg-amber-50'
                        }`}
                      >
                        <Card.Content
                          className={`p-4 text-sm font-medium ${
                            usernameAvailable ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {checkingUsername ? 'Validando nome público...' : usernameFeedback}
                        </Card.Content>
                      </Card>
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
                    <label className="flex min-h-14 items-center rounded-2xl border border-slate-200 bg-white px-3 shadow-sm">
                      <div className="flex w-full items-center gap-2">
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
                          className="min-w-0 flex-1 appearance-none bg-transparent text-sm font-semibold text-slate-700 outline-none"
                        >
                          {COUNTRY_CALLING_CODE_OPTIONS.map((country) => (
                            <option key={country.iso2} value={country.iso2}>
                              {country.country}
                            </option>
                          ))}
                        </select>
                        <span className="text-xs font-semibold text-slate-400">
                          {selectedCountry.dialCode}
                        </span>
                      </div>
                    </label>
                    <div className="space-y-2">
                      <p className={fieldLabel}>WhatsApp</p>
                      <Input
                        type="tel"
                        placeholder="WhatsApp"
                        value={formValues.phone}
                        onChange={(event) =>
                          setFormValues((current) => ({
                            ...current,
                            phone: formatPhoneInputByCountry(event.target.value, selectedCountry.iso2),
                          }))
                        }
                        onInput={() => clearFieldError('phone')}
                        aria-invalid={Boolean(fieldErrors.phone)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <FieldErrorMessage message={fieldErrors.phone} />
                  <p className="px-1 text-[11px] leading-5 text-slate-500">
                    O número será salvo com código internacional: {selectedCountry.dialCode}{' '}
                    99999-9999
                  </p>

                  <div className="space-y-2">
                    <p className={fieldLabel}>Email</p>
                    <Input
                      required
                      type="email"
                      placeholder="Seu melhor e-mail"
                      value={formValues.email}
                      disabled
                      className="h-14 rounded-2xl border border-slate-200 bg-slate-100 px-5 text-sm text-slate-500 shadow-sm placeholder:text-slate-400"
                    />
                  </div>

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
                        ? 'Sua região inicial foi sugerida pela geolocalização, mas você pode trocar.'
                        : 'Selecione uma região existente para receber conteúdo local.'
                    }
                  />
                  <FieldErrorMessage message={fieldErrors.regionKey} />
                </div>

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  variant="primary"
                  isDisabled={submitting || onboardingBlocked}
                  className="rounded-2xl bg-[#00509D] font-semibold shadow-[0_16px_40px_rgba(0,80,157,0.18)]"
                >
                  {submitting
                    ? 'Salvando...'
                    : checkingUsername
                      ? 'Validando nome...'
                      : 'Entrar na comunidade'}
                </Button>
              </form>
            )}

            {error ? (
              <Card variant="secondary" className="border border-red-100 bg-red-50 shadow-none">
                <Card.Content className="p-4 text-sm font-medium text-red-600">{error}</Card.Content>
              </Card>
            ) : null}

            {notice ? (
              <Card variant="secondary" className="border border-blue-100 bg-blue-50 shadow-none">
                <Card.Content className="p-4 text-sm font-medium text-blue-700">{notice}</Card.Content>
              </Card>
            ) : null}

            <Card variant="secondary" className={`${secondaryCardClass} border-slate-200`}>
              <Card.Content className="flex items-center gap-3 p-4">
                <Shield size={18} className="flex-shrink-0 text-[#00509D]" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Ambiente seguro, com autenticação e conteúdo local.
                </p>
              </Card.Content>
            </Card>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
};

export default Registration;

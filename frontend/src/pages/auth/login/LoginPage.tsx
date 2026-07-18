import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { Icon } from '@/components/icons/Icon';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { authApi } from '@/api';
import { useAuthStore } from '@/store/auth.store';
import { useCredentialsStore } from '@/store/credentials.store';
import { useUIStore } from '@/store/ui.store';
import { usePersistHydration } from '@/hooks/usePersistHydration';
import { syncUserSettings } from '@/utils/syncUserSettings';
import { ROUTES } from '@/constants/routes';
import type { User, AuthTokens } from '@machinefit/shared';
import '@/styles/components.css';
import '@/styles/auth.css';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const showToast = useUIStore((s) => s.showToast);

  const savedEmail = useCredentialsStore((s) => s.email);
  const savedPassword = useCredentialsStore((s) => s.password);
  const rememberLogin = useCredentialsStore((s) => s.rememberLogin);
  const saveCredentials = useCredentialsStore((s) => s.saveCredentials);
  const clearCredentials = useCredentialsStore((s) => s.clearCredentials);
  const credentialsHydrated = usePersistHydration(useCredentialsStore.persist);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [autoLoggingIn, setAutoLoggingIn] = useState(false);
  const autoLoginAttempted = useRef(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? ROUTES.HOME;

  const completeLogin = (user: User, tokens: AuthTokens, shouldSave: boolean) => {
    setAuth(user, tokens);
    syncUserSettings(user);
    if (shouldSave) {
      saveCredentials(email, password);
    } else {
      clearCredentials();
    }
    showToast(t('auth.welcomeBack'), 'success');
    navigate(from, { replace: true });
  };

  const mutation = useMutation({
    mutationFn: () => authApi.login(email, password),
    onSuccess: (res) => {
      const { user, tokens } = res.data.data as { user: User; tokens: AuthTokens };
      completeLogin(user, tokens, rememberMe);
    },
    onError: () => {
      setAutoLoggingIn(false);
      showToast(t('auth.invalidCredentials'), 'error');
    },
  });

  useEffect(() => {
    if (!credentialsHydrated || autoLoginAttempted.current) return;

    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(rememberLogin);
    }
    if (savedPassword && rememberLogin) {
      setPassword(savedPassword);
    }

    if (rememberLogin && savedEmail && savedPassword) {
      autoLoginAttempted.current = true;
      setAutoLoggingIn(true);
      authApi
        .login(savedEmail, savedPassword)
        .then((res) => {
          const { user, tokens } = res.data.data as { user: User; tokens: AuthTokens };
          setAuth(user, tokens);
          syncUserSettings(user);
          showToast(t('auth.welcomeBack'), 'success');
          navigate(from, { replace: true });
        })
        .catch(() => {
          setAutoLoggingIn(false);
          showToast(t('auth.autoLoginFailed'), 'error');
        });
    }
  }, [
    credentialsHydrated,
    rememberLogin,
    savedEmail,
    savedPassword,
    from,
    navigate,
    setAuth,
    showToast,
    t,
  ]);

  if (!credentialsHydrated || autoLoggingIn) {
    return (
      <PageShell title={t('nav.login')}>
        <p className="auth-page__loading">{t('auth.autoLoggingIn')}</p>
      </PageShell>
    );
  }

  return (
    <PageShell title={t('nav.login')}>
      <section className="auth-hero card" aria-label={t('auth.loginHeroLabel')}>
        <p className="auth-hero__eyebrow">{t('auth.loginEyebrow')}</p>
        <h2 className="auth-hero__title">{t('auth.loginHeroTitle')}</h2>
        <p className="auth-hero__desc">{t('auth.loginHeroDesc')}</p>
        <ul className="auth-hero__features">
          <li>
            <Icon name="dumbbell" size={18} />
            <span>{t('auth.loginFeature1')}</span>
          </li>
          <li>
            <Icon name="machines" size={18} />
            <span>{t('auth.loginFeature2')}</span>
          </li>
          <li>
            <Icon name="growthAnalysis" size={18} />
            <span>{t('auth.loginFeature3')}</span>
          </li>
        </ul>
      </section>

      <form className="auth-form" onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}>
        <input
          className="input"
          type="email"
          placeholder={t('auth.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <input
          className="input"
          type="password"
          placeholder={t('auth.passwordPlaceholder')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <span>{t('auth.rememberLogin')}</span>
        </label>
        <button type="submit" className="btn btn--primary btn--block" disabled={mutation.isPending}>
          {mutation.isPending ? '...' : t('nav.login')}
        </button>
      </form>

      <p className="auth-page__footer">
        {t('nav.register')}?{' '}
        <Link to={ROUTES.REGISTER}>{t('nav.register')}</Link>
      </p>
    </PageShell>
  );
}

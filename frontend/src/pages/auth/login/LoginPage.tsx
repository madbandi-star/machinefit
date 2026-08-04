import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import type { User, AuthTokens } from '@machinefit/shared';
import { AuthLandingScreen } from '@/components/auth/AuthLandingScreen/AuthLandingScreen';
import { authApi } from '@/api';
import { useAuthStore } from '@/store/auth.store';
import { useCredentialsStore } from '@/store/credentials.store';
import { useUIStore } from '@/store/ui.store';
import { usePersistHydration } from '@/hooks/usePersistHydration';
import { syncUserSettings } from '@/utils/syncUserSettings';
import { syncGymScopeAfterAuth } from '@/utils/syncGymScope';
import { DEMO_LOGIN_EMAIL, DEMO_REGISTER_PASSWORD } from '@/utils/demoRegisterDefaults';
import { isDemoAuthEnabled } from '@/utils/demoAuthMode';
import { ROUTES } from '@/constants/routes';
import '@/styles/auth.css';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const showToast = useUIStore((s) => s.showToast);
  const demoAuth = isDemoAuthEnabled();

  const savedEmail = useCredentialsStore((s) => s.email);
  const rememberLogin = useCredentialsStore((s) => s.rememberLogin);
  const saveCredentials = useCredentialsStore((s) => s.saveCredentials);
  const clearCredentials = useCredentialsStore((s) => s.clearCredentials);
  const credentialsHydrated = usePersistHydration(useCredentialsStore.persist);

  const [email, setEmail] = useState(demoAuth ? DEMO_LOGIN_EMAIL : '');
  const [password] = useState(demoAuth ? DEMO_REGISTER_PASSWORD : '');
  const [rememberMe, setRememberMe] = useState(false);
  const [showDemoForm, setShowDemoForm] = useState(false);
  const [autoLoggingIn, setAutoLoggingIn] = useState(false);
  const autoLoginAttempted = useRef(false);

  const completePasswordLogin = (user: User, tokens: AuthTokens, shouldSave: boolean) => {
    setAuth(user, tokens);
    syncUserSettings(user);
    syncGymScopeAfterAuth(user);
    if (shouldSave) {
      saveCredentials(email);
    } else {
      clearCredentials();
    }
    if (user.needsConsent) {
      navigate(ROUTES.AUTH_TERMS, { replace: true });
      return;
    }
    showToast(t('auth.welcomeBack'), 'success');
    navigate(ROUTES.HOME, { replace: true });
  };

  const mutation = useMutation({
    mutationFn: () => authApi.login(email, password),
    onSuccess: (res) => {
      const { user, tokens } = res.data.data as { user: User; tokens: AuthTokens };
      void import('@/utils/opsTelemetry').then(({ trackFeature }) =>
        trackFeature('login_success')
      );
      completePasswordLogin(user, tokens, rememberMe);
    },
    onError: () => {
      setAutoLoggingIn(false);
      void import('@/utils/opsTelemetry').then(({ trackFeature, trackOpsError }) => {
        trackFeature('login_fail');
        trackOpsError({
          title: 'LoginError',
          message: 'Invalid credentials',
          severity: 'medium',
          source: 'auth',
        });
      });
      showToast(t('auth.invalidCredentials'), 'error');
    },
  });

  useEffect(() => {
    if (!credentialsHydrated || autoLoginAttempted.current) return;

    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(rememberLogin);
    }

    if (demoAuth && rememberLogin && savedEmail) {
      autoLoginAttempted.current = true;
      setAutoLoggingIn(true);
      authApi
        .login(savedEmail, DEMO_REGISTER_PASSWORD)
        .then((res) => {
          const { user, tokens } = res.data.data as { user: User; tokens: AuthTokens };
          completePasswordLogin(user, tokens, true);
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
    demoAuth,
    navigate,
    setAuth,
    showToast,
    t,
  ]);

  if (!credentialsHydrated || autoLoggingIn) {
    return (
      <section className="auth-landing" aria-busy="true">
        <p className="auth-landing__loading">{t('auth.autoLoggingIn')}</p>
      </section>
    );
  }

  const demoSlot = demoAuth ? (
    <div className="auth-demo">
      <button
        type="button"
        className="auth-demo__toggle"
        onClick={() => setShowDemoForm((v) => !v)}
      >
        {showDemoForm ? t('auth.hideDemoLogin') : t('auth.showDemoLogin')}
      </button>
      {showDemoForm && (
        <form
          className="auth-form"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
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
            type="text"
            placeholder={t('auth.passwordDemoFixedPlaceholder')}
            value={password}
            readOnly
            aria-readonly="true"
            autoComplete="off"
            title={t('auth.passwordDemoFixedHint')}
          />
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>{t('auth.rememberLogin')}</span>
          </label>
          <button
            type="submit"
            className="btn btn--primary btn--block"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? '...' : t('nav.login')}
          </button>
        </form>
      )}
    </div>
  ) : null;

  return <AuthLandingScreen demoSlot={demoSlot} />;
}

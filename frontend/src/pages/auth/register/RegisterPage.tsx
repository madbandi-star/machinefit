import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { authApi } from '@/api';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { ROUTES } from '@/constants/routes';
import type { User, AuthTokens } from '@machinefit/shared';
import '@/styles/components.css';

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const showToast = useUIStore((s) => s.showToast);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const mutation = useMutation({
    mutationFn: () => authApi.register({ email, password, displayName }),
    onSuccess: (res) => {
      const { user, tokens } = res.data.data as { user: User; tokens: AuthTokens };
      setAuth(user, tokens);
      showToast(t('auth.accountCreated'), 'success');
      navigate(ROUTES.HOME, { replace: true });
    },
    onError: () => showToast(t('auth.registrationFailed'), 'error'),
  });

  return (
    <PageShell title={t('nav.register')}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        <input
          className="input"
          type="text"
          placeholder="Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          minLength={2}
          required
        />
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="input"
          type="password"
          placeholder="Password (min 8 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        <button type="submit" className="btn btn--primary btn--block" disabled={mutation.isPending}>
          {t('nav.register')}
        </button>
      </form>
      <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
        {t('nav.login')}? <Link to={ROUTES.LOGIN}>{t('nav.login')}</Link>
      </p>
    </PageShell>
  );
}

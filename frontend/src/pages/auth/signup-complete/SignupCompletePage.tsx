import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth.store';
import { ROUTES } from '@/constants/routes';
import '@/styles/auth.css';

/**
 * Post OAuth signup confirmation: show MachineFit-generated username.
 * Social provider names are never shown here.
 */
export function SignupCompletePage() {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const displayName = useAuthStore((s) => s.user?.displayName ?? '');

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return (
    <div className="auth-card signup-complete">
      <h1 className="auth-card__title">{t('auth.signupCompleteTitle')}</h1>
      <p className="auth-card__lead">{t('auth.signupCompleteLead')}</p>

      <div className="signup-complete__id-block">
        <p className="signup-complete__id-label">{t('auth.signupCompleteIdLabel')}</p>
        <p className="signup-complete__id-value">{displayName || '—'}</p>
        <p className="signup-complete__id-hint">{t('auth.signupCompleteIdHint')}</p>
        <p className="signup-complete__id-hint">{t('auth.signupCompleteChangeHint')}</p>
      </div>

      <div className="signup-complete__actions">
        <Link to={ROUTES.MY_PAGE} className="btn btn--primary">
          {t('auth.signupCompleteChangeCta')}
        </Link>
        <Link to={ROUTES.HOME} className="btn btn--secondary">
          {t('auth.signupCompleteHomeCta')}
        </Link>
      </div>
    </div>
  );
}

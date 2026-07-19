import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/constants/routes';
import '@/styles/layout.css';
import '@/styles/auth.css';

export function AuthLayout() {
  const { t } = useTranslation();

  return (
    <div className="layout">
      <main className="layout__main layout__main--auth">
        <div className="layout__content layout__content--auth">
          <Link to={ROUTES.HOME} className="auth-layout__brand">
            🏋️ {t('appName')}
          </Link>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

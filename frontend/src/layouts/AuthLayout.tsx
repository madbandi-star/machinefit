import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/constants/routes';
import '@/styles/layout.css';

export function AuthLayout() {
  const { t } = useTranslation();

  return (
    <div className="layout">
      <main className="layout__main" style={{ paddingTop: 0, paddingBottom: 0 }}>
        <div className="layout__content" style={{ maxWidth: 420, paddingTop: '3rem' }}>
          <Link to={ROUTES.HOME} style={{ display: 'block', textAlign: 'center', marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 800 }}>
            🏋️ {t('appName')}
          </Link>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

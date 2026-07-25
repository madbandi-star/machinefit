import { Link, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/layout/Header/Header';
import { BottomNavigation } from '@/components/layout/BottomNavigation/BottomNavigation';
import { ROUTES } from '@/constants/routes';
import '@/styles/layout.css';
import '@/styles/legal.css';

export function MainLayout() {
  const { t } = useTranslation();
  return (
    <div className="layout">
      <Header />
      <main className="layout__main">
        <div className="layout__content">
          <Outlet />
        </div>
        <footer className="legal-footer">
          <Link to={ROUTES.TERMS}>{t('legal.termsTitle')}</Link>
          <Link to={ROUTES.PRIVACY}>{t('legal.privacyTitle')}</Link>
          <Link to={ROUTES.LEGAL_LOCATION}>{t('legal.locationTitle')}</Link>
          <Link to={ROUTES.LEGAL_COMMERCE}>{t('legal.commerceTitle')}</Link>
          <Link to={ROUTES.LEGAL_AI}>{t('legal.aiTitle')}</Link>
          <Link to={ROUTES.SUPPORT}>{t('support.title')}</Link>
        </footer>
      </main>
      <BottomNavigation />
    </div>
  );
}

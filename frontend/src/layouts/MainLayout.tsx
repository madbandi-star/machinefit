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
          <div className="legal-footer__links">
            <Link to={ROUTES.TERMS}>{t('legal.termsTitle')}</Link>
            <Link to={ROUTES.PRIVACY}>{t('legal.privacyTitle')}</Link>
            <Link to={ROUTES.LEGAL_LOCATION}>{t('legal.locationTitle')}</Link>
            <Link to={ROUTES.LEGAL_COMMERCE}>{t('legal.commerceTitle')}</Link>
            <Link to={ROUTES.LEGAL_AI}>{t('legal.aiTitle')}</Link>
            <Link to={ROUTES.LEGAL_COPYRIGHT}>{t('legal.copyrightTitle')}</Link>
            <Link to={ROUTES.SUPPORT}>{t('support.title')}</Link>
          </div>
          <p className="legal-footer__trademark">{t('compliance.disclaimer.trademark')}</p>
        </footer>
      </main>
      <BottomNavigation />
    </div>
  );
}

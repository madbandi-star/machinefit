import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BUSINESS_OPERATOR } from '@machinefit/shared';
import { Header } from '@/components/layout/Header/Header';
import { BottomNavigation } from '@/components/layout/BottomNavigation/BottomNavigation';
import { ConsentRedirect } from '@/components/auth/ConsentRedirect/ConsentRedirect';
import { GlobalCountSessionHost } from '@/components/recommendation/GlobalCountSessionHost/GlobalCountSessionHost';
import { GlobalRestTimerHost } from '@/components/recommendation/GlobalRestTimerHost/GlobalRestTimerHost';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { useAuthStore } from '@/store/auth.store';
import { ROUTES } from '@/constants/routes';
import { peekPersistedIsAuthenticated } from '@/utils/peekPersistedAuth';
import '@/styles/layout.css';
import '@/styles/legal.css';
import '@/styles/auth.css';

function isHomePath(pathname: string): boolean {
  return pathname === ROUTES.HOME || pathname === `${ROUTES.HOME}/`;
}

function BusinessFooterBlock() {
  const { t } = useTranslation();
  const pending = t('legal.footer.pending');
  const rows: Array<{ label: string; value: string }> = [
    { label: t('legal.footer.tradeName'), value: BUSINESS_OPERATOR.tradeName || pending },
    { label: t('legal.footer.representative'), value: BUSINESS_OPERATOR.representative || pending },
    {
      label: t('legal.footer.registrationNumber'),
      value: BUSINESS_OPERATOR.businessRegistrationNumber || pending,
    },
    {
      label: t('legal.footer.mailOrderNumber'),
      value: BUSINESS_OPERATOR.mailOrderRegistrationNumber || pending,
    },
    { label: t('legal.footer.address'), value: BUSINESS_OPERATOR.address || pending },
    {
      label: t('legal.footer.supportEmail'),
      value: BUSINESS_OPERATOR.supportEmail || pending,
    },
  ];

  return (
    <div className="legal-footer__business">
      <p className="legal-footer__business-title">{t('legal.footer.businessTitle')}</p>
      <ul className="legal-footer__business-list">
        {rows.map((row) => (
          <li key={row.label}>
            <span>{row.label}</span>
            {row.label === t('legal.footer.supportEmail') && BUSINESS_OPERATOR.supportEmail ? (
              <a href={`mailto:${BUSINESS_OPERATOR.supportEmail}`}>{row.value}</a>
            ) : (
              <span>{row.value}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MainLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const authReady = useAuthHydration();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const onHome = isHomePath(location.pathname);
  /** Persist rehydrate is async — peek so logged-in users never flash the marketing shell. */
  const [assumeAuthed] = useState(
    () => isAuthenticated || peekPersistedIsAuthenticated()
  );
  const treatAsAuthed = isAuthenticated || (!authReady && assumeAuthed);

  /**
   * Guests: black landing shell + Outlet (AuthLanding) — no empty boot remount.
   * Returning users: keep app chrome while session restore runs (HomePage skeleton).
   */
  const showGuestLandingShell = onHome && !treatAsAuthed;

  if (showGuestLandingShell) {
    return (
      <div className="layout layout--auth-landing">
        <ConsentRedirect />
        <Outlet />
      </div>
    );
  }

  return (
    <div className="layout">
      <ConsentRedirect />
      <Header />
      <GlobalRestTimerHost />
      <GlobalCountSessionHost />
      <main className="layout__main">
        <div className="layout__content">
          <Outlet />
        </div>
        <footer className="legal-footer">
          <div className="legal-footer__links">
            <Link to={ROUTES.TERMS}>{t('legal.termsTitle')}</Link>
            <Link to={ROUTES.PRIVACY}>{t('legal.privacyTitle')}</Link>
            <Link to={ROUTES.REFUND}>{t('legal.footer.refund')}</Link>
            <Link to={ROUTES.LEGAL_LOCATION}>{t('legal.locationTitle')}</Link>
            <Link to={ROUTES.LEGAL_MARKETING}>{t('legal.marketingTitle')}</Link>
            <Link to={ROUTES.LEGAL_COMMERCE}>{t('legal.commerceTitle')}</Link>
            <Link to={ROUTES.LEGAL_COMMUNITY}>{t('legal.footer.community')}</Link>
            <Link to={ROUTES.LEGAL_COPYRIGHT}>{t('legal.copyrightTitle')}</Link>
            <Link to={ROUTES.LEGAL_SECURITY}>{t('legal.footer.security')}</Link>
            <Link to={ROUTES.LEGAL_AI}>{t('legal.aiTitle')}</Link>
            <Link to={ROUTES.SUPPORT}>{t('support.title')}</Link>
          </div>
          <BusinessFooterBlock />
          <p className="legal-footer__trademark">{t('compliance.disclaimer.trademark')}</p>
        </footer>
      </main>
      <BottomNavigation />
    </div>
  );
}

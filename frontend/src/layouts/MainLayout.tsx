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
  const rows: Array<{ label: string; value: string; href?: string }> = [
    { label: t('legal.footer.tradeName'), value: BUSINESS_OPERATOR.tradeName },
    { label: t('legal.footer.representative'), value: BUSINESS_OPERATOR.representative },
    {
      label: t('legal.footer.registrationNumber'),
      value: BUSINESS_OPERATOR.businessRegistrationNumber,
    },
    {
      label: t('legal.footer.mailOrderNumber'),
      value: BUSINESS_OPERATOR.mailOrderRegistrationNumber,
    },
    { label: t('legal.footer.address'), value: BUSINESS_OPERATOR.address },
  ].filter((row) => Boolean(row.value.trim()));

  const supportEmail = BUSINESS_OPERATOR.supportEmail.trim();
  const hasBusinessFields = rows.length > 0;

  return (
    <div className="legal-footer__business">
      <p className="legal-footer__business-title">{t('legal.footer.businessTitle')}</p>
      {hasBusinessFields ? (
        <dl className="legal-footer__business-list">
          {rows.map((row) => (
            <div key={row.label} className="legal-footer__business-row">
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
          {supportEmail ? (
            <div className="legal-footer__business-row">
              <dt>{t('legal.footer.supportEmail')}</dt>
              <dd>
                <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
              </dd>
            </div>
          ) : null}
        </dl>
      ) : (
        <div className="legal-footer__business-pending">
          <p>{t('legal.footer.pendingNotice')}</p>
          {supportEmail ? (
            <p className="legal-footer__business-contact">
              <span>{t('legal.footer.supportEmail')}</span>
              <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
            </p>
          ) : null}
        </div>
      )}
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

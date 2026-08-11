import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons/SocialLoginButtons';
import { useSocialAuthLogin } from '@/hooks/useSocialAuthLogin';
import { SITE_DOMAIN, SITE_URL } from '@/config/site';
import { ROUTES } from '@/constants/routes';
import '@/styles/auth.css';

const MARK_SRC = `${import.meta.env.BASE_URL}assets/brand/machinefit-mark.svg`;

function FeatureTargetIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
      <path
        d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FeatureShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden>
      <path
        d="M12 3.2 19 6.2v5.3c0 4.4-2.9 7.5-7 8.7-4.1-1.2-7-4.3-7-8.7V6.2L12 3.2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="m9.2 12 1.9 1.9 3.8-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FeatureChartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden>
      <path d="M4 19h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 16V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 16V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17 16V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="m14.5 6.5 2.5-1.5 2 2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Shared marketing + social login landing for `/` (guest) and `/login`. */
export function AuthLandingScreen() {
  const { t } = useTranslation();
  const { oauthPending, handleOAuth, handleOAuthClientError } = useSocialAuthLogin();

  return (
    <section className="auth-landing auth-landing--settled" aria-label={t('auth.landingLabel')}>
      <header className="auth-landing__header">
        <img className="auth-landing__logo" src={MARK_SRC} alt="" width={40} height={40} />
        <p className="auth-landing__brand">
          Machine<span className="auth-landing__brand-fit">Fit</span>
        </p>
        <a className="auth-landing__domain" href={SITE_URL} target="_blank" rel="noreferrer">
          {SITE_DOMAIN}
        </a>
        <p className="auth-landing__slogan">{t('auth.landingSlogan')}</p>
      </header>

      <div className="auth-landing__hero" aria-hidden>
        <div className="auth-landing__hero-glow" />
        <img className="auth-landing__hero-mark" src={MARK_SRC} alt="" width={148} height={148} />
      </div>

      <h1 className="auth-landing__headline">
        <span className="auth-landing__headline-line">{t('auth.landingHeadline1')}</span>
        <span className="auth-landing__headline-line">
          <Trans
            i18nKey="auth.landingHeadline2"
            components={{
              highlight: <span className="auth-landing__highlight" />,
            }}
          />
        </span>
      </h1>

      <ul className="auth-landing__features">
        <li className="auth-landing__feature">
          <span className="auth-landing__feature-icon">
            <FeatureTargetIcon />
          </span>
          <strong>{t('auth.landingFeat1Title')}</strong>
          <span>{t('auth.landingFeat1Desc')}</span>
        </li>
        <li className="auth-landing__feature">
          <span className="auth-landing__feature-icon">
            <FeatureShieldIcon />
          </span>
          <strong>{t('auth.landingFeat2Title')}</strong>
          <span>{t('auth.landingFeat2Desc')}</span>
        </li>
        <li className="auth-landing__feature">
          <span className="auth-landing__feature-icon">
            <FeatureChartIcon />
          </span>
          <strong>{t('auth.landingFeat3Title')}</strong>
          <span>{t('auth.landingFeat3Desc')}</span>
        </li>
      </ul>

      <div className="auth-landing__actions">
        {oauthPending ? (
          <p className="auth-landing__loading">{t('auth.socialConnecting')}</p>
        ) : (
          <SocialLoginButtons
            variant="landing"
            showDivider={false}
            providers={['kakao', 'google', 'apple']}
            comingSoonProviders={['apple']}
            onCredential={handleOAuth}
            onClientError={handleOAuthClientError}
          />
        )}
      </div>

      <p className="auth-landing__legal">
        <Trans
          i18nKey="auth.landingLegal"
          components={{
            terms: <Link to={ROUTES.TERMS} className="auth-landing__legal-link" />,
            privacy: <Link to={ROUTES.PRIVACY} className="auth-landing__legal-link" />,
          }}
        />
      </p>
      <p className="auth-landing__legal auth-landing__legal--notice">
        <Trans
          i18nKey="auth.landingIllegalUseNotice"
          components={{
            doc: <Link to={ROUTES.LEGAL_ILLEGAL_USE} className="auth-landing__legal-link" />,
          }}
        />
      </p>
    </section>
  );
}

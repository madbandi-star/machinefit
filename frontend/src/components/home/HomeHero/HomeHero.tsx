import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/constants/routes';
import '@/styles/home.css';

interface HomeHeroProps {
  isAuthenticated: boolean;
}

export function HomeHero({ isAuthenticated }: HomeHeroProps) {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <section className="home-hero glass-panel">
      <p className="home-hero__eyebrow">{t('pages.home.heroEyebrow')}</p>
      <h1 className="home-hero__title">
        {t('pages.home.heroTitle')}
      </h1>
      <p className="home-hero__desc">{t('pages.home.heroDesc')}</p>

      <ol className="home-hero__steps" aria-label={t('pages.home.heroStepsLabel')}>
        <li className="home-hero__step">
          <span className="home-hero__step-num font-tabular">01</span>
          <span>{t('pages.home.heroStep1')}</span>
        </li>
        <li className="home-hero__step">
          <span className="home-hero__step-num font-tabular">02</span>
          <span>{t('pages.home.heroStep2')}</span>
        </li>
        <li className="home-hero__step">
          <span className="home-hero__step-num font-tabular">03</span>
          <span>{t('pages.home.heroStep3')}</span>
        </li>
      </ol>

      <div className="home-hero__actions">
        {isAuthenticated ? (
          <Link to={ROUTES.SETTINGS} className="btn btn--primary btn--block">
            {t('pages.home.heroCtaProfile')}
          </Link>
        ) : (
          <Link
            to={ROUTES.LOGIN}
            state={{ from: location }}
            className="btn btn--primary btn--block"
          >
            {t('pages.home.heroCtaLogin')}
          </Link>
        )}
        <Link to={ROUTES.MACHINES} className="btn btn--secondary btn--block">
          {t('pages.home.heroCtaBrowse')}
        </Link>
      </div>
    </section>
  );
}

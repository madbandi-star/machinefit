import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/constants/routes';
import '@/styles/phase4.css';

export function ProUpgradeCard() {
  const { t } = useTranslation();

  const features = t('pro.features', { returnObjects: true }) as string[];

  return (
    <section className="pro-card">
      <span className="pro-card__badge">{t('pro.badge')}</span>
      <h3 className="pro-card__title">{t('pro.title')}</h3>
      <p className="pro-card__desc">{t('pro.description')}</p>
      <ul className="pro-card__features">
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
      <button type="button" className="btn btn--primary btn--block" disabled>
        {t('pro.comingSoon')}
      </button>
    </section>
  );
}

interface ProUpsellBannerProps {
  compact?: boolean;
}

export function ProUpsellBanner({ compact }: ProUpsellBannerProps) {
  const { t } = useTranslation();

  return (
    <div className="pro-upsell">
      <p className="pro-upsell__title">{t('pro.upsellTitle')}</p>
      <p className="pro-upsell__desc">{t('pro.upsellDesc')}</p>
      {!compact && (
        <Link to={ROUTES.SETTINGS} className="btn btn--secondary btn--block">
          {t('pro.learnMore')}
        </Link>
      )}
    </div>
  );
}

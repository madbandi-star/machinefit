import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Brand } from '@machinefit/shared';
import { ROUTES } from '@/constants/routes';
import { getLocalizedName } from '@/utils/localizedName';
import '@/styles/components.css';
import '@/styles/machines.css';

interface BrandCardProps {
  brand: Brand;
}

export function BrandCard({ brand }: BrandCardProps) {
  const { i18n } = useTranslation();
  const name = getLocalizedName(brand.name, i18n.language, brand.code);
  const description = brand.description
    ? getLocalizedName(brand.description, i18n.language, '')
    : '';

  return (
    <Link
      to={ROUTES.BRAND_DETAIL.replace(':brandCode', brand.code)}
      className="card card--interactive brand-card"
    >
      <div className="brand-card__media">
        {brand.logoUrl ? (
          <img src={brand.logoUrl} alt="" className="brand-card__logo" loading="lazy" />
        ) : (
          <div className="brand-card__logo-fallback" aria-hidden>
            {name.slice(0, 1)}
          </div>
        )}
      </div>
      <div className="brand-card__body">
        <h3 className="brand-card__title">{name}</h3>
        {description ? <p className="brand-card__desc">{description}</p> : null}
        <p className="brand-card__code">{brand.code}</p>
      </div>
    </Link>
  );
}

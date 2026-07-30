import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Brand } from '@machinefit/shared';
import { BRAND_CODES } from '@machinefit/shared';
import { getLocalizedName } from '@/utils/localizedName';
import { prepareBrandsForMachineSearch } from '@/utils/sortBrandsForSearch';
import { resolveBrandLogoUrl } from '@/utils/catalogAssets';
import '@/styles/machines.css';

interface BrandFilterChipsProps {
  brands: Brand[];
  value: string | null;
  onChange: (brandCode: string | null) => void;
}

function brandChipLabel(
  brand: Brand,
  language: string,
  labels: { bodyweight: string; freeWeight: string }
): string {
  if (brand.code === BRAND_CODES.BODYWEIGHT) return labels.bodyweight;
  if (brand.code === BRAND_CODES.FREE_WEIGHT) return labels.freeWeight;
  return getLocalizedName(brand.name, language, brand.code);
}

/** Prefer English wordmark for OEM pills (matches common brand-chip UIs). */
function brandChipDisplayName(brand: Brand, label: string): string {
  if (brand.code === BRAND_CODES.BODYWEIGHT || brand.code === BRAND_CODES.FREE_WEIGHT) {
    return label;
  }
  return brand.name?.en?.trim() || label;
}

function BrandLogoChip({
  brand,
  label,
  active,
  onSelect,
}: {
  brand: Brand;
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
  const [logoFailed, setLogoFailed] = useState(false);
  const logoUrl = resolveBrandLogoUrl(brand.code, brand.logoUrl);
  const showLogo = Boolean(logoUrl) && !logoFailed;
  const displayName = brandChipDisplayName(brand, label);

  return (
    <button
      type="button"
      className={`filter-chip filter-chip--brand${showLogo ? ' filter-chip--brand-has-logo' : ''}${
        active ? ' filter-chip--active' : ''
      }`}
      onClick={onSelect}
      aria-pressed={active}
      aria-label={label}
      data-brand-code={brand.code}
    >
      {showLogo ? (
        <span className="filter-chip__brand-logo-wrap" aria-hidden>
          <img
            key={`${brand.code}:${logoUrl}`}
            src={logoUrl}
            alt=""
            className="filter-chip__brand-logo"
            loading="lazy"
            decoding="async"
            onError={() => setLogoFailed(true)}
          />
        </span>
      ) : null}
      <span className="filter-chip__label">{displayName}</span>
    </button>
  );
}

export function BrandFilterChips({ brands, value, onChange }: BrandFilterChipsProps) {
  const { t, i18n } = useTranslation('machines');
  const orderedBrands = prepareBrandsForMachineSearch(brands);
  const shortLabels = {
    bodyweight: t('brandBodyweightShort'),
    freeWeight: t('brandFreeWeightShort'),
  };
  const sectionTitle = t('brandSectionTitle');

  if (orderedBrands.length === 0) return null;

  return (
    <section className="filter-section filter-section--brand" aria-labelledby="search-brand-section-title">
      <h2 id="search-brand-section-title" className="filter-section__title">
        {sectionTitle}
      </h2>
      <div className="filter-chips filter-chips--brand" role="group" aria-label={t('filterByBrand')}>
        <button
          type="button"
          className={`filter-chip filter-chip--brand${value === null ? ' filter-chip--active' : ''}`}
          onClick={() => onChange(null)}
          aria-pressed={value === null}
        >
          <span className="filter-chip__label">{t('filterAll')}</span>
        </button>
        {orderedBrands.map((brand) => (
          <BrandLogoChip
            key={brand.code}
            brand={brand}
            label={brandChipLabel(brand, i18n.language, shortLabels)}
            active={value === brand.code}
            onSelect={() => onChange(brand.code)}
          />
        ))}
      </div>
    </section>
  );
}

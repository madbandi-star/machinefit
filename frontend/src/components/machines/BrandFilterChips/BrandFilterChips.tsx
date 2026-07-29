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

  return (
    <button
      type="button"
      className={`filter-chip filter-chip--brand${showLogo ? ' filter-chip--brand-logo' : ''}${
        active ? ' filter-chip--active' : ''
      }`}
      onClick={onSelect}
      aria-pressed={active}
      aria-label={label}
    >
      {showLogo ? (
        <img
          src={logoUrl}
          alt=""
          className="filter-chip__brand-logo"
          loading="lazy"
          onError={() => setLogoFailed(true)}
        />
      ) : (
        label
      )}
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
          className={`filter-chip${value === null ? ' filter-chip--active' : ''}`}
          onClick={() => onChange(null)}
          aria-pressed={value === null}
        >
          {t('filterAll')}
        </button>
        {orderedBrands.map((brand) => (
          <BrandLogoChip
            key={brand.id}
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

import { useTranslation } from 'react-i18next';
import type { Brand } from '@machinefit/shared';
import { BRAND_CODES } from '@machinefit/shared';
import { getLocalizedName } from '@/utils/localizedName';
import { prepareBrandsForMachineSearch } from '@/utils/sortBrandsForSearch';
import '@/styles/machines.css';

interface BrandFilterChipsProps {
  brands: Brand[];
  value: string | null;
  onChange: (brandCode: string | null) => void;
}

function brandChipLabel(brand: Brand, language: string, bodyweightLabel: string): string {
  if (brand.code === BRAND_CODES.BODYWEIGHT) return bodyweightLabel;
  return getLocalizedName(brand.name, language, brand.code);
}

export function BrandFilterChips({ brands, value, onChange }: BrandFilterChipsProps) {
  const { t, i18n } = useTranslation('machines');
  const orderedBrands = prepareBrandsForMachineSearch(brands);
  const bodyweightLabel = t('brandBodyweightShort');

  if (orderedBrands.length === 0) return null;

  return (
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
        <button
          key={brand.id}
          type="button"
          className={`filter-chip${value === brand.code ? ' filter-chip--active' : ''}`}
          onClick={() => onChange(brand.code)}
          aria-pressed={value === brand.code}
        >
          {brandChipLabel(brand, i18n.language, bodyweightLabel)}
        </button>
      ))}
    </div>
  );
}

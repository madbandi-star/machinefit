import { useTranslation } from 'react-i18next';
import type { Brand } from '@machinefit/shared';
import { getLocalizedName } from '@/utils/localizedName';
import { prepareBrandsForMachineSearch } from '@/utils/sortBrandsForSearch';
import '@/styles/machines.css';

interface BrandFilterChipsProps {
  brands: Brand[];
  value: string;
  onChange: (brandCode: string) => void;
}

export function BrandFilterChips({ brands, value, onChange }: BrandFilterChipsProps) {
  const { t, i18n } = useTranslation('machines');
  const orderedBrands = prepareBrandsForMachineSearch(brands);

  if (orderedBrands.length === 0) return null;

  return (
    <div className="filter-chips filter-chips--brand" role="group" aria-label={t('filterByBrand')}>
      {orderedBrands.map((brand) => (
        <button
          key={brand.id}
          type="button"
          className={`filter-chip${value === brand.code ? ' filter-chip--active' : ''}`}
          onClick={() => onChange(brand.code)}
          aria-pressed={value === brand.code}
        >
          {getLocalizedName(brand.name, i18n.language, brand.code)}
        </button>
      ))}
    </div>
  );
}

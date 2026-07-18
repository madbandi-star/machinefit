import { useTranslation } from 'react-i18next';
import type { Brand } from '@machinefit/shared';
import { getLocalizedName } from '@/utils/localizedName';
import { prepareBrandsForMachineSearch } from '@/utils/sortBrandsForSearch';
import type { EquipmentScope } from '@/utils/machineEquipmentScope';
import {
  filterBrandsByEquipmentScope,
  isNonMachineBrandCode,
} from '@/utils/machineEquipmentScope';
import '@/styles/machines.css';

interface BrandFilterChipsProps {
  brands: Brand[];
  value: string | null;
  onChange: (brandCode: string | null) => void;
  equipmentScope: EquipmentScope;
  onEquipmentScopeChange: (scope: EquipmentScope) => void;
}

export function BrandFilterChips({
  brands,
  value,
  onChange,
  equipmentScope,
  onEquipmentScopeChange,
}: BrandFilterChipsProps) {
  const { t, i18n } = useTranslation('machines');
  const orderedBrands = prepareBrandsForMachineSearch(brands);
  const visibleBrands = filterBrandsByEquipmentScope(orderedBrands, equipmentScope);

  if (orderedBrands.length === 0) return null;

  const setScope = (next: EquipmentScope) => {
    if (next === 'machines_only' && value && isNonMachineBrandCode(value)) {
      onChange(null);
    }
    onEquipmentScopeChange(next);
  };

  return (
    <div className="filter-chips filter-chips--brand" role="group" aria-label={t('filterByBrand')}>
      <div
        className="filter-chip-scope"
        role="group"
        aria-label={t('filterEquipmentScope')}
      >
        <button
          type="button"
          className={`filter-chip-scope__option${
            equipmentScope === 'all' ? ' filter-chip-scope__option--active' : ''
          }`}
          onClick={() => setScope('all')}
          aria-pressed={equipmentScope === 'all'}
        >
          {t('filterAll')}
        </button>
        <span className="filter-chip-scope__sep" aria-hidden>
          /
        </span>
        <button
          type="button"
          className={`filter-chip-scope__option${
            equipmentScope === 'machines_only' ? ' filter-chip-scope__option--active' : ''
          }`}
          onClick={() => setScope('machines_only')}
          aria-pressed={equipmentScope === 'machines_only'}
        >
          {t('filterMachinesOnly')}
        </button>
      </div>
      {visibleBrands.map((brand) => (
        <button
          key={brand.id}
          type="button"
          className={`filter-chip${value === brand.code ? ' filter-chip--active' : ''}`}
          onClick={() => onChange(value === brand.code ? null : brand.code)}
        >
          {getLocalizedName(brand.name, i18n.language, brand.code)}
        </button>
      ))}
    </div>
  );
}

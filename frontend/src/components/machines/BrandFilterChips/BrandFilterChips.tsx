import { useTranslation } from 'react-i18next';
import type { Brand } from '@machinefit/shared';
import { getLocalizedName } from '@/utils/localizedName';
import { prepareBrandsForMachineSearch } from '@/utils/sortBrandsForSearch';
import type { EquipmentScope } from '@/utils/machineEquipmentScope';
import { isNonMachineBrandCode } from '@/utils/machineEquipmentScope';
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

  if (orderedBrands.length === 0) return null;

  const toggleScope = () => {
    onEquipmentScopeChange(equipmentScope === 'machines_only' ? 'all' : 'machines_only');
  };

  const handleBrandClick = (brandCode: string) => {
    if (equipmentScope === 'machines_only' && isNonMachineBrandCode(brandCode)) {
      onEquipmentScopeChange('all');
    }
    onChange(value === brandCode ? null : brandCode);
  };

  return (
    <div className="filter-chips filter-chips--brand" role="group" aria-label={t('filterByBrand')}>
      <button
        type="button"
        className="filter-chip filter-chip--active filter-chip--scope"
        onClick={toggleScope}
        aria-pressed={equipmentScope === 'machines_only'}
      >
        {equipmentScope === 'machines_only' ? t('filterMachinesOnly') : t('filterAll')}
      </button>
      {orderedBrands.map((brand) => (
        <button
          key={brand.id}
          type="button"
          className={`filter-chip${value === brand.code ? ' filter-chip--active' : ''}`}
          onClick={() => handleBrandClick(brand.code)}
        >
          {getLocalizedName(brand.name, i18n.language, brand.code)}
        </button>
      ))}
    </div>
  );
}

import { useTranslation } from 'react-i18next';
import type { UnitHeight, UnitWeight } from '@machinefit/shared';
import {
  HEIGHT_UNIT_OPTIONS,
  UnitPicker,
  WEIGHT_UNIT_OPTIONS,
} from '@/components/settings/UnitPicker/UnitPicker';

interface UnitSelectorProps {
  unitHeight: UnitHeight;
  unitWeight: UnitWeight;
  onUnitHeightChange: (unit: UnitHeight) => void;
  onUnitWeightChange: (unit: UnitWeight) => void;
}

export function UnitSelector({
  unitHeight,
  unitWeight,
  onUnitHeightChange,
  onUnitWeightChange,
}: UnitSelectorProps) {
  const { t } = useTranslation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <UnitPicker
        label={t('auth.heightUnit')}
        value={unitHeight}
        options={HEIGHT_UNIT_OPTIONS}
        onChange={onUnitHeightChange}
      />
      <UnitPicker
        label={t('auth.weightUnit')}
        value={unitWeight}
        options={WEIGHT_UNIT_OPTIONS}
        onChange={onUnitWeightChange}
      />
    </div>
  );
}

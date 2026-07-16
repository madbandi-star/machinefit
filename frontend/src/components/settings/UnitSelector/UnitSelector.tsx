import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/store/settings.store';
import {
  HEIGHT_UNIT_OPTIONS,
  UnitPicker,
  WEIGHT_UNIT_OPTIONS,
} from '@/components/settings/UnitPicker/UnitPicker';

export function UnitSelector() {
  const { t } = useTranslation();
  const unitHeight = useSettingsStore((s) => s.unitHeight);
  const unitWeight = useSettingsStore((s) => s.unitWeight);
  const setUnitHeight = useSettingsStore((s) => s.setUnitHeight);
  const setUnitWeight = useSettingsStore((s) => s.setUnitWeight);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <UnitPicker
        label={t('auth.heightUnit')}
        value={unitHeight}
        options={HEIGHT_UNIT_OPTIONS}
        onChange={setUnitHeight}
      />
      <UnitPicker
        label={t('auth.weightUnit')}
        value={unitWeight}
        options={WEIGHT_UNIT_OPTIONS}
        onChange={setUnitWeight}
      />
    </div>
  );
}

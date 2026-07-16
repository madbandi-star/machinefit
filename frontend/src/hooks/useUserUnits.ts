import { formatHeight, formatWeight } from '@machinefit/shared';
import { useSettingsStore } from '@/store/settings.store';

export function useUserUnits() {
  const unitHeight = useSettingsStore((s) => s.unitHeight);
  const unitWeight = useSettingsStore((s) => s.unitWeight);

  return {
    unitHeight,
    unitWeight,
    formatHeight: (cm: number) => formatHeight(cm, unitHeight),
    formatWeight: (kg: number) => formatWeight(kg, unitWeight),
  };
}

import type { User } from '@machinefit/shared';
import { useSettingsStore } from '@/store/settings.store';

export function syncUserSettings(user: User): void {
  const { setUnitHeight, setUnitWeight } = useSettingsStore.getState();
  setUnitHeight(user.unitHeight);
  setUnitWeight(user.unitWeight);
}

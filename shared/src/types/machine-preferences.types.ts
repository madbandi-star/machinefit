import type { RecommendationSettings } from '../types/recommendation.types.js';

/** Which settings source is currently applied for a machine. */
export type SettingsActiveSource = 'recommended' | 'adjusted';

export interface MachineUserPreferences {
  customSettings: Partial<RecommendationSettings>;
  personalTipMemo: string;
  /** When `adjusted`, customSettings override AI recommendations. */
  activeSource: SettingsActiveSource;
}

export function hasMeaningfulCustomSettings(
  preferences?: Partial<RecommendationSettings> | null
): boolean {
  if (!preferences) return false;
  return Object.values(preferences).some((value) => value != null && value !== '');
}

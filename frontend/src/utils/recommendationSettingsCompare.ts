import type { RecommendationSettings } from '@machinefit/shared';
import { roundRecommendWeightKg } from '@machinefit/shared';
import type { FitRating } from '@/api';

export const SETTINGS_COMPARE_KEYS: (keyof RecommendationSettings)[] = [
  'recommendedWeightKg',
  'seatPosition',
  'backPadPosition',
  'handlePosition',
  'romSetting',
];

function normalizeCompareValue(
  key: keyof RecommendationSettings,
  value: unknown
): string | null {
  if (value == null || value === '') return null;
  if (key === 'recommendedWeightKg' && typeof value === 'number') {
    return String(roundRecommendWeightKg(value));
  }
  return String(value).trim();
}

export function settingsValuesDiffer(
  recommended: RecommendationSettings,
  custom: Partial<RecommendationSettings>,
  key: keyof RecommendationSettings
): boolean {
  const left = normalizeCompareValue(key, recommended[key]);
  const right = normalizeCompareValue(key, custom[key]);
  if (left == null && right == null) return false;
  return left !== right;
}

export function hasAdjustedSettings(
  recommended: RecommendationSettings,
  custom?: Partial<RecommendationSettings> | null
): boolean {
  if (!custom) return false;

  return SETTINGS_COMPARE_KEYS.some((key) => {
    if (recommended[key] == null && custom[key] == null) return false;
    return settingsValuesDiffer(recommended, custom, key);
  });
}

export function shouldShowHistorySettingsCompare(
  fitRating: FitRating | null | undefined,
  recommended: RecommendationSettings,
  customSettings?: Partial<RecommendationSettings> | null
): boolean {
  if (fitRating !== 'bad') return false;
  return hasAdjustedSettings(recommended, customSettings);
}
